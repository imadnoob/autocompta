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
        let userSector = "INCONNU";
        if (userId) {
            const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
            if (!userError && user) {
                userCompanyName = user.user_metadata?.company_name || "Unknown Company";
                userIce = user.user_metadata?.ice || "Unknown ICE";
                userSector = user.user_metadata?.sector || "INCONNU";
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

        // RAG 3 : Historique Récent de l'Utilisateur (Mémoire Few-Shot)
        let historyContext = "";
        if (userId) {
            try {
                let supplierOrClient = extractedData.supplier ? extractedData.supplier.trim() : "";
                let queryBuilder = supabaseAdmin
                    .from('accounting_entries')
                    .select('description, main_account_code, main_account_name')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (supplierOrClient.length > 3) {
                    queryBuilder = queryBuilder.ilike('supplier', `%${supplierOrClient}%`).limit(3);
                } else {
                    queryBuilder = queryBuilder.limit(3); 
                }

                const { data: pastEntries } = await queryBuilder;
                
                if (pastEntries && pastEntries.length > 0) {
                    if (supplierOrClient.length > 3) {
                        historyContext = "MÉMOIRE HISTORIQUE (IMPORTANT) - Voici comment TU as classé les factures de ce même tiers récemment :\n";
                    } else {
                        historyContext = "MÉMOIRE HISTORIQUE - Quelques exemples récents de ta propre comptabilité :\n";
                    }
                    pastEntries.forEach((e: any) => {
                        historyContext += `- "${e.description}" => Compte ${e.main_account_code} (${e.main_account_name})\n`;
                    });
                }
            } catch (e) { }
        }

        const prompt2 = `
Tu es un Expert Comptable Marocain. Voici les données d'une transaction identifiée comme une **${forcedNature}**.

CONTEXTE ENTREPRISE : 
- Nom de notre entreprise : ${userCompanyName}
- Secteur d'activité : ${userSector}

FOURNISSEUR/CLIENT : ${extractedData.supplier}
DESCRIPTION : ${extractedData.description}
LOG IA (RAISONNEMENT) : ${reasoning}

HT : ${extractedData.amount_ht} | TVA : ${extractedData.tva_amount} | TTC : ${extractedData.total_amount}

${pcmContext}

${historyContext}

${textbookContext}

DÉTERMINE LES CODES COMPTABLES (Plan Comptable Marocain) appropriés.
RÈGLES STRICTES :
1. Si c'est une VENTE, utilise obligatoirement un compte de CLASSE 7. Journal = VT. Tiers = 3421.
2. Si c'est un ACHAT, utilise obligatoirement un compte de CLASSE 6 ou 2. Journal = HA. Tiers = 4411.
3. Règle métier : Pour toute réservation, nuitée ou hébergement, utilise OBLIGATOIREMENT le compte 71241 (Ventes hébergement). N'utilise pas 71244.
4. Utilise le compte PCM le plus précis possible. Si un sous-compte détaillé du RAG correspond parfaitement (ex: 61251, 71241), utilise-le plutôt que le compte général (ex: 6125, 7124).

Retourne UNIQUEMENT un JSON avec ce format :
{
  "journal_code": "${forcedNature === 'VENTE' ? 'VT' : 'HA'}",
  "main_account_code": "Code compte",
  "main_account_name": "Nom officiel du compte",
  "tier_account_code": "${forcedNature === 'VENTE' ? '3421' : '4411'}",
  "tva_account_code": "34552 (Achat), 4455 (Vente) ou null"
}
        `;

        const res2 = await model.generateContent(prompt2);
        const text2 = (await res2.response).text().replace(/```json\n?|```\n?/g, '').trim();
        let classification = JSON.parse(text2);

        // ==========================================
        // ETAPE 2.5 : SÉCURITÉ DÉTERMINISTE (OVERRIDE)
        // ==========================================
        // On ne fait plus confiance à l'IA pour les choix critiques de nature
        if (forcedNature === 'VENTE') {
            classification.journal_code = 'VT';
            classification.tier_account_code = '3421';
            classification.tva_account_code = extractedData.tva_amount > 0 ? '4455' : null;
            // Si l'IA a mis une charge (6), on force un produit (7)
            if (classification.main_account_code.startsWith('6')) {
                classification.main_account_code = '7' + classification.main_account_code.substring(1);
            } else if (!classification.main_account_code.startsWith('7')) {
                classification.main_account_code = '7111'; // Par défaut : Ventes de marchandises
            }
            // Sécurité additionnelle : on remplace le 71243 par 71241
            if (classification.main_account_code === '71243') {
                classification.main_account_code = '71241';
            }
        } else {
            classification.journal_code = 'HA';
            classification.tier_account_code = '4411';
            classification.tva_account_code = extractedData.tva_amount > 0 ? '34552' : null;
            // Si l'IA a mis un produit (7) pour un achat, on force une charge (6)
            if (classification.main_account_code.startsWith('7')) {
                classification.main_account_code = '6' + classification.main_account_code.substring(1);
            } else if (!classification.main_account_code.startsWith('6') && !classification.main_account_code.startsWith('2')) {
                classification.main_account_code = '6111'; // Par défaut : Achats de marchandises
            }
        }

        // ==========================================
        // ETAPE 3 : VERIFICATION (SENSE CHECK IA)
        // ==========================================
        // On simplifie la vérification IA car on a forcé la logique JS
        const finalClassif = classification;

        // ==========================================
        // ETAPE 4 : ASSEMBLEUR MATHÉMATIQUE (FORÇAGE STRICT)
        // ==========================================
        const lines = [];
        const isVente = forcedNature === 'VENTE';
        const isAchat = forcedNature === 'ACHAT';

        // 1. Ligne de Charge (6) ou Produit (7) -> HT
        if (extractedData.amount_ht > 0) {
            lines.push({
                account: finalClassif.main_account_code,
                account_name: finalClassif.main_account_name,
                label: extractedData.description,
                debit: isAchat ? extractedData.amount_ht : 0,  // ACHAT : Charge au Débit
                credit: isVente ? extractedData.amount_ht : 0  // VENTE : Produit au Crédit
            });
        }

        // 2. Ligne de TVA
        if (extractedData.tva_amount > 0 && finalClassif.tva_account_code) {
            lines.push({
                account: finalClassif.tva_account_code,
                account_name: isVente ? 'TVA Facturée' : 'TVA Récupérable',
                label: `TVA sur ${extractedData.description}`,
                debit: isAchat ? extractedData.tva_amount : 0,  // ACHAT : TVA Débit
                credit: isVente ? extractedData.tva_amount : 0  // VENTE : TVA Crédit
            });
        }

        // 3. Ligne de Tiers (Client/Fournisseur) -> TTC
        if (extractedData.total_amount > 0) {
            lines.push({
                account: finalClassif.tier_account_code,
                account_name: isVente ? (extractedData.supplier || 'Client') : (extractedData.supplier || 'Fournisseur'),
                label: extractedData.description,
                debit: isVente ? extractedData.total_amount : 0,  // VENTE : Client au Débit
                credit: isAchat ? extractedData.total_amount : 0  // ACHAT : Fournisseur au Crédit
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
        // IMPORTANT : On injecte les données corrigées dans extracted_data
        // pour que comptaHelpers.ts puisse lire le bon category_code
        extractedData.category_code = finalClassif.main_account_code;
        extractedData.category_name = finalClassif.main_account_name;
        extractedData.document_nature = forcedNature;
        extractedData.journal_code = finalClassif.journal_code;

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
