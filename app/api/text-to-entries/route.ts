import { NextRequest, NextResponse } from 'next/server';
import { model } from '@/lib/gemini';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize embedding model
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(geminiApiKey);
const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

export async function POST(req: NextRequest) {
  try {
    const { text, userId } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Texte vide' }, { status: 400 });
    }

    let userCompanyName = "Unknown Company";
    let userSector = "INCONNU";
    let historyContext = "";

    if (userId) {
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (!userError && user) {
            userCompanyName = user.user_metadata?.company_name || "Unknown Company";
            userSector = user.user_metadata?.sector || "INCONNU";
        }

        try {
            const { data: pastEntries } = await supabaseAdmin
                .from('accounting_entries')
                .select('description, main_account_code, main_account_name')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (pastEntries && pastEntries.length > 0) {
                historyContext = "MÉMOIRE HISTORIQUE - Voici des exemples tirés de TA PROPRE comptabilité récente (imite ce style si similaire) :\n";
                pastEntries.forEach((e: any) => {
                    historyContext += `- "${e.description}" => Classée en ${e.main_account_code} (${e.main_account_name})\n`;
                });
            }
        } catch(e) {}
    }

    // 1. Generate an embedding for the user's input text to find relevant PCM accounts
    let pcmContext = "";
    try {
      const embedResult = await embedModel.embedContent(text);
      const queryEmbedding = embedResult.embedding.values;

      // 2. Query Supabase vector database for matches
      const { data: matchedAccounts, error: matchError } = await supabaseAdmin.rpc('match_pcm_accounts', {
        query_embedding: queryEmbedding,
        match_threshold: 0.1, // very low threshold to ensure we get some results
        match_count: 5 // Get top 5 most relevant accounts
      });

      if (!matchError && matchedAccounts && matchedAccounts.length > 0) {
        pcmContext = "COMPTES PCM PERTINENTS SUGGÉRÉS (Utilise-les si approprié, cela provient de notre base officielle) :\n";
        matchedAccounts.forEach((acc: any) => {
          pcmContext += `- Compte ${acc.code} : ${acc.name}\n`;
        });
      }
    } catch (embError) {
      console.error("RAG Embedding/Matching error (ignoring and proceeding with generic PCM):", embError);
      // We will just proceed without RAG context if it fails
    }

    const prompt = `
Tu es un Expert Comptable Marocain (expert en PCM) travaillant sur le logiciel AutoCompta. 
Ton rôle est d'analyser le texte soumis (factures, reçus, listes d'opérations) et d'appliquer une méthodologie comptable stricte pour générer les écritures au format JSON.

CONTEXTE DE L'ENTREPRISE :
- Nom de l'entreprise : ${userCompanyName}
- Secteur d'activité : ${userSector}

MÉTHODOLOGIE À APPLIQUER OBLIGATOIREMENT :
1. ANALYSE : Identifie la (ou les) transaction(s) isolée(s) dans le texte (Achats, Ventes, Paiements, Salaires, Dépôts/Retraits).
2. CATÉGORISATION (Choix structuré du Journal) :
   - Achats fournisseurs -> "HA"
   - Ventes clients -> "VT"
   - Opérations bancaires (Chèque, Virement) -> "BQ"
   - Espèces (Caisse) -> "CA"
   - Paie, TVA, ou si regroupement complexe -> "OD"
3. IMPUTATION (Plan Comptable Marocain - PCM) :
   - Achats : Choisis le compte de Classe 6 ou 2 le plus précis selon le contexte (ex: 6141 Eau/Electricité, 6133 Entretien, 6121 MP).
   - Ventes : Choisis le compte de Classe 7 le plus précis (ex: 7111, 7124).
   - TVA : 34552 (TVA récupérable), 4455 (TVA facturée).
   - Tiers : 4411 (Fournisseurs), 3421 (Clients).
   - Trésorerie : 5141 (Banque), 5161 (Caisse).
   - Salaires : 6171 (Rémunérations), 4432 (Rém. dues) ou paiement direct par tréso.
4. ÉQUILIBRE (Partie Double) : Chaque transaction isolée DOIT avoir un Total Débit strictement égal au Total Crédit.

${pcmContext ? `\n--- CONTEXTE RAG ---\n${pcmContext}\n--------------------\n` : ''}

${historyContext ? `\n--- ${historyContext}\n--------------------\n` : ''}

TEXTE À ANALYSER :
"""
${text}
"""

INSTRUCTIONS FORMAT DE SORTIE :
Tu dois renvoyer l'opération (ou la liste des opérations s'il y en a plusieurs de par leurs dates ou natures) en JSON.
Si le texte contient clairement plusieurs opérations séparées (ex: une liste datée), retourne un TABLEAU JSON (Array) contenant plusieurs objets.
Si c'est une seule opération, retourne UN SEUL objet JSON.

Format de base de CHAQUE objet opération :
{
  "description": "Description claire de l'opération (ex: Paiement facture Eau, Salaire octobre...)",
  "date": "YYYY-MM-DD (Date de l'opération, très important de l'extraire du texte si présente. Sinon date du jour)",
  "supplier": "Nom du tiers (Client, Fournisseur, Employé) ou vide",
  "journal": "HA" ou "VT" ou "BQ" ou "CA" ou "OD",
  "entries": [
    {
      "account": "Code PCM valide (ex: 6141)",
      "account_name": "Nom officiel du compte PCM",
      "label": "Libellé de la ligne précise",
      "debit": montant_numerique (ou 0),
      "credit": montant_numerique (ou 0)
    }
    // L'addition de tous les "debit" DOIT ETRE EGALE à l'addition des "credit" de cet array !
  ]
}

RÈGLES VITALES :
- Les montants doivent être de type Number (pas de strings). N'utilise jamais de virgule (,) ni d'espaces. Ex: 120000 ou 120000.50
- Privilégie FORCEMENT les comptes suggérés dans le "CONTEXTE RAG" s'ils correspondent à l'opération.
- Règle métier : Pour toute réservation, nuitée ou hébergement, utilise OBLIGATOIREMENT le compte 71241. N'utilise pas 71244.
- Utilise le compte PCM le plus précis. Si un sous-compte détaillé du RAG correspond parfaitement (ex: 61251 plutôt que 6125), utilise-le. Sinon, garde le compte PCM standard.
- Ton JSON doit être parfait et ne contenir que les données.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Clean up markdown code blocks if present
    const cleanText = responseText.replace(/```json\n?|```\n?/g, '').trim();
    let parsed = JSON.parse(cleanText);

    // Normalize if Gemini returned an array of operations
    if (Array.isArray(parsed)) {
      const allEntries = parsed.flatMap((p: any) => Array.isArray(p.entries) ? p.entries : []);
      const description = parsed.length > 1 ? 'Opérations multiples' : (parsed[0]?.description || '');
      parsed = {
        description: description,
        date: parsed[0]?.date || new Date().toISOString().split('T')[0],
        supplier: parsed[0]?.supplier || '',
        journal: parsed[0]?.journal || 'OD',
        entries: allEntries
      };
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Text-to-entries error:', error);
    return NextResponse.json({ error: error.message || 'Erreur de traitement' }, { status: 500 });
  }
}
