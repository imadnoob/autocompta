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
      Tu es un expert comptable marocain spécialisé dans la classification automatique de documents. Ton rôle est d'analyser ce document avec une précision absolue.
      
      INFOS DE VOTRE CLIENT (L'UTILISATEUR) :
      - Nom de l'entreprise : "${userCompanyName}"
      - ICE : ${userIce}
      - Secteur d'activité : ${userSector}
      
      RÈGLES DE CLASSIFICATION (Vente vs Achat) :
      1. ANALYSE DE L'ÉMETTEUR (Le vendeur) :
         - Regarde le nom et l'ICE en haut du document (souvent près du logo).
         - Si l'émetteur est "${userCompanyName}" ou s'il y a une ressemblance forte (ignore les suffixes SARL, SA, etc.), c'est une VENTE.
         - TOLÉRANCE OCR : Si l'ICE émetteur ressemble à ${userIce} (ex: un '1' lu comme 'I', un '0' comme 'O'), considère que c'est une correspondance.
         
      2. ANALYSE DU DESTINATAIRE (Le client) :
         - Cherche les mentions "Client", "Facturé à", "Destinataire", "Bon de livraison pour".
         - Si "${userCompanyName}" ou ${userIce} apparaît dans cette zone, c'est obligatoirement un ACHAT.
         
      3. LOGIQUE GLOBALE :
         - S'il n'est pas possible de prouver que l'émetteur est "${userCompanyName}", alors considère par défaut que c'est un ACHAT.
         - Une VENTE doit impérativement utiliser un compte de Classe 7.
         - Un ACHAT doit impérativement utiliser un compte de Classe 6 (ou 2 pour immo).
      
      VÉRIFICATION DES COMPTES SPÉCIFIQUES :
      - Si le secteur est "HOTELLERIE_RESTAURATION", utilise les comptes 71241, 71242, 445262, 3111 si besoin.
      
      Extract in strict JSON format:
      {
        "date": "YYYY-MM-DD",
        "supplier": "string (Nom de l'émetteur/vendeur)",
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
        "reasoning": "string (Explique ton choix en citant les éléments trouvés, ex: 'L'émetteur a l'ICE ${userIce} qui correspond au client, donc Vente.')",
        "tier_ice": "string or null (ICE de l'autre partie)"
      }
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
