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

        // Fetch user_id: from request body or from documentId lookup
        let userId = requestUserId || null;
        if (!userId && documentId) {
            const { data: docData } = await supabaseAdmin.from('documents').select('user_id').eq('id', documentId).single();
            if (docData) userId = docData.user_id;
        }

        // ==========================================
        // ETAPE 0 : RÉCUPÉRATION DU PROFIL UTILISATEUR
        // ==========================================
        let userCompanyName = "Unknown Company";
        let userIce = "Unknown ICE";
        if (userId) {
            const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
            if (!userError && user) {
                userCompanyName = user.user_metadata?.company_name || "Unknown Company";
                userIce = user.user_metadata?.ice || "Unknown ICE";
            }
        }

        // ==========================================
        // ETAPE 1 : IDENTIFICATION (Pass 1)
        // ==========================================
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

        const idContents = fileBytes
            ? [identificationPrompt, { inlineData: { data: fileBytes, mimeType: mimeType } }]
            : [identificationPrompt, sourceText];

        const idResult = await model.generateContent(idContents as any);
        const idText = (await idResult.response).text().replace(/```json\n?|```\n?/g, '').trim();
        const actors = JSON.parse(idText);

        // ==========================================
        // ETAPE 2 : LOGIQUE DE DÉCISION DÉTERMINISTE (JS)
        // ==========================================
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

        // Comparaison ICE ou Nom (fuzzy)
        const isSenderUser = (cleanSenderIce !== '' && cleanSenderIce === cleanUserIce) || 
                            (cleanSenderName.length > 3 && (cleanSenderName.includes(cleanUserName) || cleanUserName.includes(cleanSenderName)));

        if (isSenderUser) {
            forcedNature = 'VENTE';
            reasoning = `L'émetteur détecté (${actors.sender_name}) correspond à votre profil. C'est une VENTE.`;
        } else {
            const isReceiverUser = (cleanReceiverIce !== '' && cleanReceiverIce === cleanUserIce) || 
                                (cleanReceiverName.length > 3 && (cleanReceiverName.includes(cleanUserName) || cleanUserName.includes(cleanReceiverName)));
            if (isReceiverUser) {
                forcedNature = 'ACHAT';
                reasoning = `Vous êtes listé comme récepteur/client (${actors.receiver_name}). C'est un ACHAT.`;
            } else {
                forcedNature = 'ACHAT';
                reasoning = `L'émetteur est externe et votre identité n'est pas clairement détectée comme récepteur. Par défaut : ACHAT.`;
            }
        }

        // ==========================================
        // ETAPE 3 : EXTRACTION DÉTAILLÉE (Respectant la Nature)
        // ==========================================
        const prompt1 = `
Tu es un agent d'extraction de données expert. Ce document est IDENTIFIÉ comme une **${forcedNature}**.
Analyse ce document ou texte.
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
  "document_nature": "${forcedNature}",
  "reasoning": "${reasoning.replace(/"/g, "'")}"
}
L'addition amount_ht + tva_amount DOIT être mathématiquement égale à total_amount.
        `;

        const contents1 = fileBytes
            ? [prompt1, { inlineData: { data: fileBytes, mimeType: mimeType } }]
            : [prompt1, sourceText];

        const res1 = await model.generateContent(contents1 as any);
        const text1 = (await res1.response).text().replace(/```json\n?|```\n?/g, '').trim();
        const extractedData = JSON.parse(text1);

        // ==========================================
        // ETAPE 4 : CLASSIFICATION (PCM & RAG)
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
Tu es un Expert Comptable Marocain. Voici les données d'une transaction identifiée comme une **${forcedNature}**.

FOURNISSEUR/CLIENT : ${extractedData.supplier}
DESCRIPTION : ${extractedData.description}
LOG IA (RAISONNEMENT) : ${reasoning}

HT : ${extractedData.amount_ht} | TVA : ${extractedData.tva_amount} | TTC : ${extractedData.total_amount}

${pcmContext}

${textbookContext}

DÉTERMINE LES CODES COMPTABLES (Plan Comptable Marocain) appropriés.
RÈGLES STRICTES :
1. Si c'est une VENTE, utilise obligatoirement un compte de CLASSE 7. Journal = VT. Tiers = 3421.
2. Si c'est un ACHAT, utilise obligatoirement un compte de CLASSE 6 ou 2. Journal = HA. Tiers = 4411.

Retourne UNIQUEMENT un JSON :
{
  "journal_code": "${forcedNature === 'VENTE' ? 'VT' : 'HA'}",
  "main_account_code": "Code à 4 chiffres",
  "main_account_name": "Nom du compte",
  "tier_account_code": "${forcedNature === 'VENTE' ? '3421' : '4411'}",
  "tva_account_code": "34552 (Achat) ou 4455 (Vente) ou null"
}
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
