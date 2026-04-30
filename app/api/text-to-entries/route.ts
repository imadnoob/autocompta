import { NextRequest, NextResponse } from 'next/server';
import { model } from '@/lib/gemini';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(geminiApiKey);
const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

export async function POST(req: NextRequest) {
  try {
    const { text, userId } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Texte vide' }, { status: 400 });
    }

    // ==========================================
    // ETAPE 0 : RÉCUPÉRATION DU PROFIL UTILISATEUR
    // ==========================================
    let userCompanyName = "Unknown Company";
    let userSector = "INCONNU";

    if (userId) {
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (!userError && user) {
            userCompanyName = user.user_metadata?.company_name || "Unknown Company";
            userSector = user.user_metadata?.sector || "INCONNU";
        }
    }

    // ==========================================
    // ETAPE 1 : EXTRACTION STRUCTUREE (Sans comptabilité)
    // ==========================================
    const extractPrompt = `
Tu es un assistant d'extraction de données financières.
Analyse le texte suivant et extrais UNIQUEMENT les valeurs factuelles.
NE FAIS PAS DE COMPTABILITÉ (pas de numéros de comptes, pas de débits/crédits).

TEXTE À ANALYSER :
"""
${text}
"""

Retourne OBLIGATOIREMENT un tableau JSON contenant la ou les opérations extraites.
Même s'il n'y a qu'une seule opération, retourne un tableau avec un seul objet.
Chaque objet doit respecter STRICTEMENT ce format (utilise des nombres pour les montants) :
[
  {
    "nature": "ACHAT", "VENTE", "PAIEMENT_EMIS", "ENCAISSEMENT_RECU" ou "AUTRE",
    "description": "Bref résumé (ex: Facture électricité mars, Paiement facture internet)",
    "date": "YYYY-MM-DD (Date mentionnée, sinon date du jour)",
    "supplier": "Nom du fournisseur ou client, ou vide",
    "amount_ht": 0.00,
    "tva_amount": 0.00,
    "total_amount": 0.00,
    "payment_method": "Virement", "Espèces", "Carte", "Chèque" ou null
  }
]
Règle : amount_ht + tva_amount DOIT être mathématiquement égal à total_amount. 
S'il y a un seul montant fourni dans le texte et que la TVA n'est pas précisée, considère ce montant comme le TTC et déduis automatiquement la TVA marocaine standard de 20% (HT = TTC / 1.2).
    `;

    const extractResult = await model.generateContent(extractPrompt);
    const extractText = (await extractResult.response).text().replace(/```json\n?|```\n?/g, '').trim();
    
    let operations = [];
    try {
        operations = JSON.parse(extractText);
        if (!Array.isArray(operations)) {
            operations = [operations];
        }
    } catch (e) {
        throw new Error("Impossible de comprendre l'opération dans le texte.");
    }

    // ==========================================
    // ETAPE 2 & 3 : CLASSIFICATION (RAG) ET ASSEMBLAGE DÉTERMINISTE (JS)
    // ==========================================
    const finalEntries = [];

    for (const op of operations) {
        // Normalisation
        const ht = Number(op.amount_ht) || 0;
        const tva = Number(op.tva_amount) || 0;
        const ttc = Number(op.total_amount) || 0;
        const date = op.date || new Date().toISOString().split('T')[0];
        const supplier = op.supplier || 'Inconnu';
        const desc = op.description || 'Opération';

        // ------------------------------------------
        // Recherche RAG pour le compte principal
        // ------------------------------------------
        let mainAccountCode = op.nature === 'VENTE' ? '7111' : '6111'; // Par défaut
        let mainAccountName = op.nature === 'VENTE' ? 'Ventes de marchandises' : 'Achats de marchandises';
        
        if (op.nature === 'ACHAT' || op.nature === 'VENTE' || op.nature === 'AUTRE') {
            let pcmContext = "";
            try {
                const searchDesc = `${supplier} : ${desc}`;
                const embedResult = await embedModel.embedContent(searchDesc);
                const { data: matchedAccounts } = await supabaseAdmin.rpc('match_pcm_accounts', {
                    query_embedding: embedResult.embedding.values,
                    match_threshold: 0.1,
                    match_count: 5
                });
                if (matchedAccounts && matchedAccounts.length > 0) {
                    pcmContext = "COMPTES PCM OFFICIELS SUGGÉRÉS:\n" + matchedAccounts.map((a: any) => `- ${a.code} : ${a.name}`).join("\n");
                }
            } catch (e) {}

            let historyContext = "";
            if (userId) {
                try {
                    let queryBuilder = supabaseAdmin.from('journal_entries').select('label, account, account_name').eq('user_id', userId).order('created_at', { ascending: false });
                    if (supplier.length > 3) queryBuilder = queryBuilder.ilike('supplier', `%${supplier}%`).limit(3);
                    else queryBuilder = queryBuilder.limit(3); 
                    const { data: pastEntries } = await queryBuilder;
                    if (pastEntries && pastEntries.length > 0) {
                        historyContext = "HISTORIQUE RÉCENT DE L'UTILISATEUR (PRIORITÉ) :\n" + pastEntries.map((e: any) => `- "${e.label}" => Classé en Compte ${e.account} (${e.account_name})`).join("\n");
                    }
                } catch (e) { }
            }

            const classifPrompt = `
Tu es un Expert Comptable Marocain. 
Trouve LE MEILLEUR compte comptable (Classe 6 ou 7) pour cette opération :
ENTREPRISE: ${userCompanyName} (${userSector})
NATURE: ${op.nature}
DESCRIPTION: ${desc}
TIERS: ${supplier}

${pcmContext}

${historyContext}

Règles Absolues :
- Si la nature est ACHAT, tu DOIS retourner un compte qui commence par 6 ou 2.
- Si la nature est VENTE, tu DOIS retourner un compte qui commence par 7.
- Précision maximum requise (privilégie les comptes à 4 ou 5 chiffres).
- En cas d'hésitation entre des comptes similaires (ex: 61211 Matières premières A vs 61212 Matières B), choisis TOUJOURS le premier (terminant par 1) par défaut.

Retourne UNIQUEMENT un JSON structuré (pas de texte avant ou après) :
{
  "code": "6141",
  "name": "Eau et électricité"
}
            `;
            
            try {
                const classifRes = await model.generateContent(classifPrompt);
                const classifText = (await classifRes.response).text().replace(/```json\n?|```\n?/g, '').trim();
                const classifData = JSON.parse(classifText);
                if (classifData.code) {
                    mainAccountCode = classifData.code;
                    mainAccountName = classifData.name;
                }
            } catch(e) {
                console.error("Erreur de classification IA, utilisation des valeurs par défaut.", e);
            }
            
            // ------------------------------------------
            // Sécurité JS Override (Forçage de la classe)
            // ------------------------------------------
            if (op.nature === 'ACHAT' && mainAccountCode.startsWith('7')) mainAccountCode = '6' + mainAccountCode.substring(1);
            if (op.nature === 'VENTE' && mainAccountCode.startsWith('6')) mainAccountCode = '7' + mainAccountCode.substring(1);
            // Cas particulier : hébergement
            if (mainAccountCode === '71243' || mainAccountCode === '71244') mainAccountCode = '71241';
        }

        // ------------------------------------------
        // ASSEMBLEUR MATHÉMATIQUE (Débit = Crédit)
        // ------------------------------------------
        const lines = [];
        let journal = 'OD';

        const trAccount = (op.payment_method?.toLowerCase().includes('espèce') || op.payment_method?.toLowerCase().includes('caisse')) ? '5161' : '5141';
        const trName = trAccount === '5161' ? 'Caisse' : 'Banques';
        const trJournal = trAccount === '5161' ? 'CA' : 'BQ';

        // Recherche ou Création du compte auxiliaire Tiers
        let existingFournisseurAccount = '4411';
        let existingClientAccount = '3421';
        
        if (userId && supplier !== 'Inconnu' && supplier.trim() !== '') {
            try {
                const sName = supplier.trim();
                const { data: tierData } = await supabaseAdmin.from('tiers')
                    .select('account_code_aux, type')
                    .eq('user_id', userId)
                    .ilike('name', sName)
                    .maybeSingle();
                
                if (tierData) {
                    if (tierData.type === 'fournisseur') existingFournisseurAccount = tierData.account_code_aux;
                    if (tierData.type === 'client') existingClientAccount = tierData.account_code_aux;
                } else {
                    // Création du Tier à la volée
                    const tierType = op.nature === 'VENTE' || op.nature === 'ENCAISSEMENT_RECU' ? 'client' : 'fournisseur';
                    const baseCode = tierType === 'fournisseur' ? '4411000' : '3421000';
                    
                    const { data: maxTiers } = await supabaseAdmin.from('tiers')
                        .select('account_code_aux')
                        .eq('user_id', userId)
                        .like('account_code_aux', `${baseCode}%`)
                        .order('account_code_aux', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                        
                    let nextNum = 1;
                    if (maxTiers && maxTiers.account_code_aux) {
                        nextNum = parseInt(maxTiers.account_code_aux.replace(baseCode, '')) + 1;
                    }
                    const newAuxAccount = `${baseCode}${nextNum}`;
                    
                    await supabaseAdmin.from('tiers').insert({
                        user_id: userId,
                        type: tierType,
                        name: sName,
                        account_code_aux: newAuxAccount
                    });
                    
                    if (tierType === 'fournisseur') existingFournisseurAccount = newAuxAccount;
                    if (tierType === 'client') existingClientAccount = newAuxAccount;
                }
            } catch (e) {
                console.error("Erreur gestion tier:", e);
            }
        }

        if (op.nature === 'ACHAT') {
            // Si une méthode de paiement est détectée lors de l'achat, c'est un achat au comptant (Caisse/Banque direct)
            journal = op.payment_method ? trJournal : 'HA';
            const creditAccount = op.payment_method ? trAccount : existingFournisseurAccount;
            const creditName = op.payment_method ? trName : supplier;

            if (ht > 0) lines.push({ account: mainAccountCode, account_name: mainAccountName, label: desc, debit: ht, credit: 0 });
            if (tva > 0) lines.push({ account: '34552', account_name: 'TVA Récupérable', label: `TVA sur ${desc}`, debit: tva, credit: 0 });
            if (ttc > 0) lines.push({ account: creditAccount, account_name: creditName, label: desc, debit: 0, credit: ttc });
        } 
        else if (op.nature === 'VENTE') {
            journal = op.payment_method ? trJournal : 'VT';
            const debitAccount = op.payment_method ? trAccount : existingClientAccount;
            const debitName = op.payment_method ? trName : supplier;

            if (ttc > 0) lines.push({ account: debitAccount, account_name: debitName, label: desc, debit: ttc, credit: 0 });
            if (ht > 0) lines.push({ account: mainAccountCode, account_name: mainAccountName, label: desc, debit: 0, credit: ht });
            if (tva > 0) lines.push({ account: '4455', account_name: 'TVA Facturée', label: `TVA sur ${desc}`, debit: 0, credit: tva });
        }
        else if (op.nature === 'PAIEMENT_EMIS') {
            journal = trJournal;
            if (ttc > 0) {
                lines.push({ account: existingFournisseurAccount, account_name: supplier, label: desc, debit: ttc, credit: 0 });
                lines.push({ account: trAccount, account_name: trName, label: desc, debit: 0, credit: ttc });
            }
        }
        else if (op.nature === 'ENCAISSEMENT_RECU') {
            journal = trJournal;
            if (ttc > 0) {
                lines.push({ account: trAccount, account_name: trName, label: desc, debit: ttc, credit: 0 });
                lines.push({ account: existingClientAccount, account_name: supplier, label: desc, debit: 0, credit: ttc });
            }
        }
        else {
            // AUTRE (Fallback simple)
            journal = 'OD';
            if (ht > 0) {
                lines.push({ account: mainAccountCode, account_name: mainAccountName, label: desc, debit: ht, credit: 0 });
                lines.push({ account: '4481', account_name: 'Dettes diverses', label: desc, debit: 0, credit: ht });
            }
        }

        finalEntries.push({
            description: desc,
            date: date,
            supplier: supplier,
            journal: journal,
            entries: lines
        });
    }

    // Le frontend de AutoCompta s'attend à recevoir UN objet (si 1 opération) ou un ARRAY (si multiples).
    const dataToSend = finalEntries.length === 1 ? finalEntries[0] : finalEntries;

    return NextResponse.json({ success: true, data: dataToSend });

  } catch (error: any) {
    console.error('Text-to-entries error:', error);
    return NextResponse.json({ error: error.message || 'Erreur de traitement' }, { status: 500 });
  }
}
