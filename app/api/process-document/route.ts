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
        const userIce = user?.user_metadata?.ice || '';
        const userCompanyName = user?.user_metadata?.company_name || '';

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
            const { data: matchedAccounts, error: matchError } = await supabaseAdmin.rpc('match_pcm_accounts', {
                query_embedding: queryEmbedding,
                match_threshold: 0.1,
                match_count: 5
            });

            if (!matchError && matchedAccounts && matchedAccounts.length > 0) {
                pcmContext = "COMPTES PCM PERTINENTS SUGGÉRÉS (Utilisez un de ces comptes si cela correspond à la nature du document) :\n";
                matchedAccounts.forEach((acc: any) => {
                    pcmContext += `- Compte ${acc.code} : ${acc.name}\n`;
                });
            }
        } catch (ragError) {
            console.error("RAG steps failed, proceeding without context:", ragError);
        }

        // 5. Final Prompt for Gemini (Direct Semantic Classification V3)
        const prompt = `
      Tu es un expert comptable marocain. Analyse ce document.
      
      CONTEXTE CRITIQUE :
      - Pour l'entreprise : "${userCompanyName}" (ICE : ${userIce}).
      - Question : Est-ce que cette facture est un ACHAT ou une VENTE pour cette entreprise ?
      
      RÈGLES DE DÉCISION :
      1. Si "${userCompanyName}" ou ICE "${userIce}" est l'ÉMETTEUR (En-tête, Logo, RIB en bas), alors document_nature = "VENTE".
         DANS CE CAS, category_code DOIT obligatoirement commencer par 7 (ex: 7111).
      2. Si "${userCompanyName}" ou ICE "${userIce}" est le CLIENT (near 'Client', 'Facturé à', 'Doit'), alors document_nature = "ACHAT".
         DANS CE CAS, category_code DOIT commencer par 6 (charges), 2 (immobilisations) ou 3 (stocks).
      
      Extract in strict JSON format:
      {
        "date": "YYYY-MM-DD",
        "supplier": "string",
        "total_amount": number,
        "amount_ht": number,
        "tva_amount": number,
        "tva_rate": number,
        "currency": "MAD",
        "invoice_number": "string",
        "type": "invoice",
        "category_code": "string",
        "category_name": "string",
        "document_nature": "ACHAT" | "VENTE" | "INCONNU",
        "reasoning": "string" (Explain why in French, e.g. 'ICE trouvé dans l'en-tête'),
        "tier_ice": "string or null (ICE of the other party)"
      }
      Strictly conform to the Plan Comptable Marocain.
      
      ${pcmContext ? `--- CONTEXTE RAG ---\n${pcmContext}\n--------------------\nPrivilégiez l'un des "category_code" suggérés.` : ''}
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
