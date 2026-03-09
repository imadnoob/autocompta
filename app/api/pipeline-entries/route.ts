import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { model } from '@/lib/gemini';
import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(geminiApiKey);
const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

export async function POST(req: NextRequest) {
    try {
        const { documentId, filePath, fileType, text, userId: requestUserId } = await req.json();

        let sourceText = text;
        let fileBytes = '';
        let mimeType = fileType || 'application/pdf';

        if (!sourceText && filePath) {
            // Document Mode
            const { data: fileData, error: downloadError } = await supabaseAdmin.storage
                .from('documents')
                .download(filePath);

            if (downloadError || !fileData) {
                return NextResponse.json({ error: 'Failed to download document' }, { status: 500 });
            }
            const fileArrayBuffer = await fileData.arrayBuffer();
            fileBytes = Buffer.from(fileArrayBuffer).toString('base64');
        } else if (!sourceText && !filePath) {
            return NextResponse.json({ error: 'Missing document or text' }, { status: 400 });
        }

        // ==========================================
        // ETAPE 1 : EXTRACTION A FROID (Données brutes)
        // ==========================================
        const prompt1 = `
Tu es un agent d'extraction de données pur. Analyse ce document ou texte.
Extrais uniquement les valeurs monétaires, la date et le nom du tiers, SANS FAIRE DE COMPTABILITÉ.
Il s'agit de documents marocains, cherche bien les montants HT, TVA (souvent 20% ou 14%) et TTC.
Retourne UNIQUEMENT un JSON structuré exactement comme ceci, avec des nombres (pas de strings pour les montants) :
{
  "date": "YYYY-MM-DD",
  "supplier": "Nom du fournisseur, client, ou vide",
  "amount_ht": 0.00,
  "tva_amount": 0.00,
  "total_amount": 0.00,
  "tva_rate": 20,
  "currency": "MAD",
  "invoice_number": "Numéro de facture ou ref externe ou null",
  "payment_method": "Virement", "Carte", "Espèces", "Chèque" ou null,
  "description": "Bref résumé commercial (ex: Facture électricité mars)",
  "tier_address": "Adresse complète du tiers ou null",
  "tier_ice": "Identifiant Commun de l'Entreprise (ICE) - 15 chiffres ou null",
  "tier_if": "Identifiant Fiscal (IF) ou null",
  "tier_rc": "Registre de Commerce (RC) ou null",
  "tier_telephone": "Numéro de téléphone ou null",
  "tier_email": "Adresse email ou null"
}
L'addition amount_ht + tva_amount DOIT être mathématiquement égale à total_amount.
Si seul le TTC est visible, et qu'il y a clairement de la TVA, déduis le HT et la TVA, sinon mets la TVA à 0.
        `;

        const contents1 = fileBytes
            ? [prompt1, { inlineData: { data: fileBytes, mimeType: mimeType } }]
            : [prompt1, sourceText];

        const res1 = await model.generateContent(contents1 as any);
        const text1 = (await res1.response).text().replace(/```json\n?|```\n?/g, '').trim();
        const extractedData = JSON.parse(text1);

        // Fetch user_id: from request body or from documentId lookup
        let userId = requestUserId || null;
        if (!userId && documentId) {
            const { data: docData } = await supabaseAdmin.from('documents').select('user_id').eq('id', documentId).single();
            if (docData) userId = docData.user_id;
        }

        // ==========================================
        // ETAPE 2 : CLASSIFICATION (PCM & RAG)
        // ==========================================

        // RAG 1 : Plan Comptable Officiel
        let pcmContext = "";
        try {
            const desc = `${extractedData.supplier} : ${extractedData.description}`;
            const embedResult = await embedModel.embedContent(desc);
            const { data: matchedAccounts } = await supabaseAdmin.rpc('match_pcm_accounts', {
                query_embedding: embedResult.embedding.values,
                match_threshold: 0.1,
                match_count: 5
            });
            if (matchedAccounts && matchedAccounts.length > 0) {
                pcmContext = "COMPTES PCM OFFICIELS SUGGÉRÉS:\n" + matchedAccounts.map((a: any) => `- ${a.code} : ${a.name}`).join("\n");
            }
        } catch (e) { }

        // RAG 2 : Base de Connaissance (Livre Comptable Infaillible)
        let textbookContext = "";
        if (userId) {
            try {
                const desc = `${extractedData.supplier} : ${extractedData.description}`;
                const embedResult = await embedModel.embedContent(desc);
                const { data: textbookMatches } = await supabaseAdmin.rpc('match_textbook_accounting', {
                    query_embedding: embedResult.embedding.values,
                    match_threshold: 0.15,
                    match_count: 2,
                    p_user_id: userId
                });
                if (textbookMatches && textbookMatches.length > 0) {
                    textbookContext = "EXEMPLES INFALLIBLES TIRÉS DE LIVRES COMPTABLES (PRIORITÉ ABSOLUE):\n" + textbookMatches.map((a: any) =>
                        `- Situation : ${a.situation_description}\n  -> Journal : ${a.expected_journal}\n  -> Compte Principal : ${a.expected_main_account}\n  -> Compte Tiers : ${a.expected_tier_account}\n  -> Compte TVA : ${a.expected_tva_account || 'null'}`
                    ).join("\n\n");
                }
            } catch (e) { }
        }

        const prompt2 = `
Tu es un Expert Comptable Marocain. Voici les données d'une transaction :
Fournisseur/Client : ${extractedData.supplier}
Description : ${extractedData.description}
HT : ${extractedData.amount_ht} | TVA : ${extractedData.tva_amount} | TTC : ${extractedData.total_amount}

${pcmContext}

${textbookContext}

Détermine les codes comptables (Plan Comptable Marocain) appropriés pour cette transaction.
Retourne UNIQUEMENT un JSON structuré comme ceci :
{
  "journal_code": "HA" (Achat), "VT" (Vente), "BQ" (Banque), "CA" (Caisse),
  "main_account_code": "Code à 4 chiffres (ex: 6142 pour achat, 7111 pour vente)",
  "main_account_name": "Nom officiel du compte",
  "tier_account_code": "4411 pour Fournisseurs, 3421 pour Clients",
  "tva_account_code": "34552 pour TVA récupérable sur les charges, 4455 pour TVA facturée, ou null si la TVA = 0"
}
Si un exemple infaillible tiré des "LIVRES COMPTABLES" correspond à la situation actuelle, TU DOIS OBLIGATOIREMENT recopier exactement son Journal, son Compte Principal, son Compte Tiers et son Compte de TVA. C'est la priorité numéro 1.
Sinon, si un compte est suggéré dans la section 'COMPTES PCM OFFICIELS SUGGÉRÉS' ci-dessus, et qu'il correspond à la dépense, tu dois l'utiliser en priorité 2.
        `;

        const res2 = await model.generateContent(prompt2);
        const text2 = (await res2.response).text().replace(/```json\n?|```\n?/g, '').trim();
        let classification = JSON.parse(text2);


        // ==========================================
        // ETAPE 3 : VERIFICATION (SENSE CHECK)
        // ==========================================
        const prompt3 = `
Tu es un Réviseur Comptable strict. Vérifie la cohérence comptable entre l'extraction et la classification :
Extraction : ${JSON.stringify(extractedData)}
Classification : ${JSON.stringify(classification)}

Règles impératives :
1. Si c'est un Achat (journal HA), le compte principal doit commencer par 6 ou 2. (Et Tiers = 4).
2. Si c'est une Vente (journal VT), le compte principal doit commencer par 7. (Et Tiers = 3).
3. S'il y a de la TVA (tva_amount > 0) dans l'Extraction, un 'tva_account_code' DOIT être présent dans la Classification.
4. Les montants doivent être positifs.

Retourne un JSON strict :
{
  "status": "VALID" ou "ERROR",
  "fixed_classification": { le même objet classification mais corrigé si 'status' est 'ERROR' }
}
        `;

        const res3 = await model.generateContent(prompt3);
        const text3 = (await res3.response).text().replace(/```json\n?|```\n?/g, '').trim();
        const verification = JSON.parse(text3);

        const finalClassif = verification.status === "VALID" ? classification : verification.fixed_classification;

        // ==========================================
        // ETAPE 4 : ASSEMBLEUR MATHEMATIQUE (CODE NATIF)
        // ==========================================
        // Génère le brouillard équilibré sans utiliser l'IA pour les maths.
        const lines = [];
        const isAchat = finalClassif.journal_code === 'HA';
        const isVente = finalClassif.journal_code === 'VT';
        const isTresorerie = finalClassif.journal_code === 'BQ' || finalClassif.journal_code === 'CA';

        // Ligne de Charge / Produit (HT)
        if (extractedData.amount_ht > 0) {
            lines.push({
                account: finalClassif.main_account_code,
                account_name: finalClassif.main_account_name, // Ex: "Achats de fournitures..."
                label: extractedData.description,             // Ex: "Achat de 4 boissons"
                debit: isAchat ? extractedData.amount_ht : 0,
                credit: isVente ? extractedData.amount_ht : (isTresorerie ? 0 : 0) // Simplify for Tresorerie later if needed
            });
        }

        // Ligne de TVA
        if (extractedData.tva_amount > 0 && finalClassif.tva_account_code) {
            lines.push({
                account: finalClassif.tva_account_code,
                account_name: 'TVA',
                label: `TVA sur ${extractedData.description}`,
                debit: isAchat ? extractedData.tva_amount : 0,
                credit: isVente ? extractedData.tva_amount : 0
            });
        }

        // Ligne de Tiers ou Trésorerie (TTC)
        if (extractedData.total_amount > 0) {
            const defaultTierCode = isTresorerie ? '5141' : (isVente ? '3421' : '4411');
            lines.push({
                account: finalClassif.tier_account_code || defaultTierCode,
                account_name: extractedData.supplier || (isVente ? 'Client' : 'Fournisseur'),
                label: extractedData.description,
                debit: isVente || isTresorerie ? extractedData.total_amount : 0,  // Vente: Client Debit.
                credit: isAchat ? extractedData.total_amount : 0  // Achat: Fournisseur Credit.
            });
        }

        const accountingEntry = {
            description: extractedData.description,
            date: extractedData.date || new Date().toISOString().split('T')[0],
            supplier: extractedData.supplier,
            journal: finalClassif.journal_code,
            entries: lines
        };

        // Si Document Mode, on update la base
        if (documentId) {
            await supabaseAdmin.from('documents').update({
                extracted_data: extractedData,
                accounting_category: finalClassif.main_account_code,
                status: 'completed'
            }).eq('id', documentId);
        }

        // Retourne la pièce prête à être stockée dans accounting_moves (Brouillard)
        return NextResponse.json({ success: true, data: accountingEntry });

    } catch (error: any) {
        console.error('Pipeline error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
