import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { model } from '@/lib/gemini';

export async function POST(req: NextRequest) {
    try {
        const { documentId, filePath, fileType } = await req.json();

        if (!documentId || !filePath) {
            return NextResponse.json({ error: 'Missing documentId or filePath' }, { status: 400 });
        }

        // 1. Get the file from Supabase Storage
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from('documents')
            .download(filePath);

        if (downloadError || !fileData) {
            console.error('Download error:', downloadError);
            return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
        }

        // 2. Convert to compatible format for Gemini
        const fileArrayBuffer = await fileData.arrayBuffer();
        const fileBytes = Buffer.from(fileArrayBuffer).toString('base64');

        const mimeType = fileType || 'application/pdf'; // Default or from request

        // 3. Get user metadata for personalized extraction
        const { data: docInfo, error: docError } = await supabaseAdmin
            .from('documents')
            .select('user_id')
            .eq('id', documentId)
            .single();

        if (docError || !docInfo) throw new Error('Document non trouvé');

        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(docInfo.user_id);
        const userCompanyName = user?.user_metadata?.company_name || "Unknown Company";
        const userIce = user?.user_metadata?.ice || "Unknown ICE";
        const userSector = user?.user_metadata?.sector || "COMMERCE";

        console.log(`[DEBUG] Extraction pour l'entreprise: "${userCompanyName}" (ICE: ${userIce}, Secteur: ${userSector})`);

        // 4. Step A: Get a brief description to search in vector DB
        const descriptionPrompt = "Analyse brièvement ce document et donne moi une seule phrase décrivant la nature de la transaction (ex: 'Achat de matériel informatique', 'Facture d'électricité', 'Vente de services de conseil').";
        let pcmContext = "";

        try {
            const descResult = await model.generateContent([
                descriptionPrompt,
                { inlineData: { data: fileBytes, mimeType: mimeType } }
            ]);
            const description = (await descResult.response).text();

            // Step B: Embed the description
            const genAI = new (require('@google/generative-ai').GoogleGenerativeAI)(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY);
            const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
            const embedResult = await embedModel.embedContent(description);
            const queryEmbedding = embedResult.embedding.values;

            // Step C: Match in Supabase
            // Note: We'll filter by sector in the final prompt if needed, 
            // but the vector DB matches may include hotel entries. 
            // We'll import PCM_META to filter them out here if the sector isn't hotel.
            const { PCM_META } = require('@/components/modules/comptaHelpers');
            const { data: matchedAccounts, error: matchError } = await supabaseAdmin.rpc('match_pcm_accounts', {
                query_embedding: queryEmbedding,
                match_threshold: 0.1,
                match_count: 5
            });

            if (!matchError && matchedAccounts && matchedAccounts.length > 0) {
                pcmContext = "COMPTES PCM PERTINENTS SUGGÉRÉS (Utilisez un de ces comptes si cela correspond à la nature du document) :\n";
                matchedAccounts.forEach((acc: any) => {
                    const meta = PCM_META[acc.code];
                    // Skip hotel-only accounts if the user is not in hospitality
                    if (meta?.sector && meta.sector !== userSector) return;
                    
                    pcmContext += `- Compte ${acc.code} : ${acc.name}\n`;
                });
            }
        } catch (ragError) {
            console.error("RAG steps failed, proceeding without context:", ragError);
        }

        // 5. Final Prompt for Gemini (Robust Semantic V4)
        const prompt = `
      Tu es un expert comptable marocain. Analyse ce document.
      
      CONTEXTE DE L'UTILISATEUR :
      - Votre client actuel est l'entreprise : "${userCompanyName}"
      - Son ICE est : ${userIce}
      - Son secteur d'activité est : ${userSector}
      
      IMPORTANT (Règle Métier) :
      - Si le secteur est "HOTELLERIE_RESTAURATION", utilisez les comptes spécialisés comme 71241 (Nuitées), 71242 (Restauration), 445262 (Taxe de séjour), 3111 (Stocks alimentaires), etc.
      - Pour TOUS les autres secteurs, utilisez UNIQUEMENT les comptes généraux du Plan Comptable Marocain standard (ex: 7111 pour ventes marchandises, 7124 pour services généraux, 6111 pour achats).
      
      OBJECTIF : Déterminer si ce document est une VENTE (émise par "${userCompanyName}") ou un ACHAT (reçue par "${userCompanyName}").
      
      LOGIQUE DE DÉCISION (Sois intelligent face aux erreurs d'OCR) :
      1. Identifie l'ÉMETTEUR (le vendeur/fournisseur) du document (souvent en haut, avec le logo et les coordonnées bancaires).
      2. Compare l'émetteur avec "${userCompanyName}" et l'ICE ${userIce} :
         - Si l'émetteur est "${userCompanyName}" (ou un nom très proche) OU si l'ICE émetteur est ${userIce} -> C'est une VENTE.
         - Si l'émetteur est une AUTRE entreprise -> C'est un ACHAT.
      3. Vérifie le destinataire (Client) :
         - Si "${userCompanyName}" est listé comme client/destinataire -> C'est un ACHAT.
      
      Extract in strict JSON format:
      {
        "date": "YYYY-MM-DD",
        "supplier": "string (Nom de l'émetteur trouvé sur le document)",
        "total_amount": number,
        "amount_ht": number,
        "tva_amount": number,
        "tva_rate": number,
        "currency": "MAD",
        "invoice_number": "string",
        "type": "invoice",
        "category_code": "string",
        "category_name": "string",
        "document_nature": "ACHAT" | "VENTE",
        "reasoning": "string (Exemple: 'L'émetteur est différent de ${userCompanyName}, donc c'est un achat')",
        "tier_ice": "string or null (ICE de l'autre partie)"
      }
      Strictly conform to the Plan Comptable Marocain. (Classe 7 pour Vente, Classe 6 pour Achat).
    `;

        // 6. Call Gemini for extraction
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: fileBytes, mimeType: mimeType } },
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const cleanText = text.replace(/```json\n?|```\n?/g, '').trim();
        const extractedData = JSON.parse(cleanText);

        console.log(`[DEBUG] Réponse Gemini - Nature détectée: ${extractedData.document_nature}`);
        console.log(`[DEBUG] Réponse Gemini - Raisonnement: ${extractedData.reasoning}`);

        // 5. Update Database (internal_ref is managed by DB trigger, not in extracted_data)
        const { error: updateError } = await supabaseAdmin
            .from('documents')
            .update({
                extracted_data: extractedData,
                accounting_category: extractedData.category_code,
                status: 'completed'
            })
            .eq('id', documentId);

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: extractedData });

    } catch (error: any) {
        console.error('Processing error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
