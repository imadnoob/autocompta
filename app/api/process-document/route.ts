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
        // 4. STEP 1: IDENTIFICATION (Pass 1)
        const identificationPrompt = `
      Analyse ce document et identifie UNIQUEMENT les acteurs de la transaction (Émetteur et Récepteur).
      
      Réponds UNIQUEMENT au format JSON strict :
      {
        "sender_name": "string (Nom de l'entreprise qui vend)",
        "sender_ice": "string (ICE de l'émetteur)",
        "receiver_name": "string (Nom de l'entreprise qui achète/client)",
        "receiver_ice": "string (ICE du récepteur)"
      }
    `;

        const idResult = await model.generateContent([
            identificationPrompt,
            { inlineData: { data: fileBytes, mimeType: mimeType } },
        ]);
        const idText = (await idResult.response).text().replace(/```json\n?|```\n?/g, '').trim();
        const actors = JSON.parse(idText);

        console.log(`[DEBUG] Acteurs identifiés par Pass 1:`, actors);

        // 5. LOGIQUE DE DÉCISION DÉTERMINISTE (JS)
        function normalize(s: string | null) {
            return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        }

        const cleanUserIce = normalize(userIce);
        const cleanUserName = normalize(userCompanyName);
        const cleanSenderIce = normalize(actors.sender_ice);
        const cleanSenderName = normalize(actors.sender_name);
        const cleanReceiverIce = normalize(actors.receiver_ice);
        const cleanReceiverName = normalize(actors.receiver_name);

        let forcedNature: 'VENTE' | 'ACHAT' = 'ACHAT';
        let reasoning = "";

        // Comparison logic: fuzzy ice or name match
        const isSenderUser = (cleanSenderIce !== '' && cleanSenderIce === cleanUserIce) || 
                            (cleanSenderName.includes(cleanUserName) || cleanUserName.includes(cleanSenderName)) && cleanSenderName.length > 3;

        if (isSenderUser) {
            forcedNature = 'VENTE';
            reasoning = `L'émetteur détecté (${actors.sender_name}) correspond à votre profil. C'est une VENTE.`;
        } else {
            const isReceiverUser = (cleanReceiverIce !== '' && cleanReceiverIce === cleanUserIce) || 
                                (cleanReceiverName.includes(cleanUserName) || cleanUserName.includes(cleanReceiverName)) && cleanReceiverName.length > 3;
            if (isReceiverUser) {
                forcedNature = 'ACHAT';
                reasoning = `Vous êtes listé comme récepteur/client. C'est un ACHAT.`;
            } else {
                forcedNature = 'ACHAT';
                reasoning = `L'émetteur est externe et vous n'êtes pas clairement identifié comme récepteur. Par défaut : ACHAT.`;
            }
        }

        console.log(`[DEBUG] Nature décidée par logique JS: ${forcedNature} (${reasoning})`);

        // 6. STEP 2: ACCOUNTING EXTRACTION (Pass 2)
        // Now we get PCM context for RAG
        let pcmContext = "";
        try {
            const descriptionPrompt = "Analyse brièvement ce document et donne moi une seule phrase décrivant la nature de la transaction.";
            const descResult = await model.generateContent([descriptionPrompt, { inlineData: { data: fileBytes, mimeType: mimeType } }]);
            const description = (await descResult.response).text();

            const genAI = new (require('@google/generative-ai').GoogleGenerativeAI)(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY);
            const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
            const embedResult = await embedModel.embedContent(description);
            const queryEmbedding = embedResult.embedding.values;

            const { PCM_META } = require('@/components/modules/comptaHelpers');
            const { data: matchedAccounts, error: matchError } = await supabaseAdmin.rpc('match_pcm_accounts', {
                query_embedding: queryEmbedding,
                match_threshold: 0.1,
                match_count: 5
            });

            if (!matchError && matchedAccounts && matchedAccounts.length > 0) {
                pcmContext = "COMPTES PCM PERTINENTS SUGGÉRÉS :\n";
                matchedAccounts.forEach((acc: any) => {
                    const meta = PCM_META[acc.code];
                    if (meta?.sector && meta.sector !== userSector) return;
                    pcmContext += `- Compte ${acc.code} : ${acc.name}\n`;
                });
            }
        } catch (ragErr) { console.error("RAG error:", ragErr); }

        const finalPrompt = `
      Tu es un expert comptable marocain. Ce document a été identifié comme une **${forcedNature}**.
      Utilise cette nature imposée pour ton analyse.
      
      INFOS UTILISATEUR :
      - Société : "${userCompanyName}"
      - Secteur : ${userSector}
      
      IMPORTANTE :
      ${forcedNature === 'VENTE' 
        ? "- Pour une VENTE, utilise obligatoirement un compte de CLASSE 7." 
        : "- Pour un ACHAT, utilise obligatoirement un compte de CLASSE 6 (Charges) ou CLASSE 2 (Immobilisations)."}
      
      ${pcmContext}

      Extraire en JSON :
      {
        "date": "YYYY-MM-DD",
        "supplier": "string (Nom du tiers)",
        "total_amount": number,
        "amount_ht": number,
        "tva_amount": number,
        "tva_rate": number,
        "currency": "MAD",
        "invoice_number": "string",
        "type": "invoice",
        "category_code": "string",
        "category_name": "string",
        "document_nature": "${forcedNature}",
        "reasoning": "${reasoning.replace(/"/g, "'")}",
        "tier_ice": "string or null"
      }
    `;

        const finalResult = await model.generateContent([
            finalPrompt,
            { inlineData: { data: fileBytes, mimeType: mimeType } },
        ]);

        const text = (await finalResult.response).text();
        const cleanText = text.replace(/```json\n?|```\n?/g, '').trim();
        const extractedData = JSON.parse(cleanText);

        // 7. Update Database
        const { error: updateError } = await supabaseAdmin
            .from('documents')
            .update({
                extracted_data: extractedData,
                accounting_category: extractedData.category_code,
                status: 'completed'
            })
            .eq('id', documentId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, data: extractedData });

    } catch (error: any) {
        console.error('Processing error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
