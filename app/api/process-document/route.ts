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

        // 3. Step A: Get a brief description to search in vector DB
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

        // 4. Final Prompt for Gemini containing the RAG context
        const prompt = `
      You are an expert Moroccan accountant. Analyze this document (likely an invoice or receipt).
      Extract the following information in strict JSON format:
      {
        "date": "YYYY-MM-DD",
        "supplier": "string",
        "total_amount": number (TTC, total including all taxes),
        "amount_ht": number (amount before tax / hors taxe),
        "tva_amount": number (TVA amount),
        "tva_rate": number (percentage, e.g. 20 for 20%),
        "currency": "MAD" or "EUR" or "USD",
        "invoice_number": "string",
        "type": "invoice" or "receipt" or "credit_note" or "delivery_note" or "bank_statement" or "other",
        "category_code": "string" (Plan Comptable Marocain 4-digit code, e.g., 6111 for achats de marchandises),
        "category_name": "string",
        "payment_method": "especes" or "virement" or "cheque" or "carte" or "effet" or "prelevement" or null,
        "payment_date": "YYYY-MM-DD" or null,
        "tier_address": "string or null",
        "tier_ice": "string or null (15 chiffres)",
        "tier_if": "string or null",
        "tier_rc": "string or null",
        "tier_telephone": "string or null",
        "tier_email": "string or null"
      }
      If a field is missing, use null. Conform strictly to the Plan Comptable Marocain for categorization.
      
      ${pcmContext ? `--- CONTEXTE RAG ---\n${pcmContext}\n--------------------\nPrivilégiez ABSOLUMENT l'un des "category_code" proposés dans le contexte RAG s'il est pertinent.` : ''}
    `;

        // 5. Call Gemini for extraction
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
