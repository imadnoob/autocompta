import { NextRequest, NextResponse } from 'next/server';
import { model } from '@/lib/gemini';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(geminiApiKey);

// ─── Helper: Robust JSON Extraction ───────────────────────────
function extractJSON(text: string): any | null {
    // Strip markdown fences
    const cleaned = text.replace(/```json\s*|```\s*/g, '').trim();
    // Try full parse first
    try { return JSON.parse(cleaned); } catch { }
    // Try to find the first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
        try { return JSON.parse(match[0]); } catch { }
    }
    return null;
}

function getDisplayName(doc: any): string {
    const ext = doc.extracted_data;
    const ref = doc.internal_ref;
    if (!ext || doc.status !== 'completed') {
        return ref ? `[${ref}] ${doc.original_name}` : doc.original_name;
    }
    const typePrefix: Record<string, string> = {
        invoice: 'FAC', receipt: 'REC', credit_note: 'AVO',
        delivery_note: 'BL', bank_statement: 'REL', other: 'DOC',
    };
    const parts: string[] = [];
    parts.push(typePrefix[ext.type || ext.document_type || ''] || 'DOC');
    if (ext.supplier) parts.push(ext.supplier.toUpperCase().substring(0, 25));
    if (ext.date) parts.push(ext.date);
    if (ext.total_amount != null) parts.push(`${Number(ext.total_amount).toLocaleString('fr-FR')} ${ext.currency || 'MAD'}`);
    const name = parts.length > 1 ? parts.join(' — ') : doc.original_name;
    return ref ? `[${ref}] ${name}` : name;
}

// ─── Helper: Build accounts summary ───────────────────────────
async function buildAccountsSummary(userId: string, dateFrom?: string, dateTo?: string) {
    let q = supabaseAdmin.from('journal_entries').select('account, account_name, debit, credit, entry_date').eq('user_id', userId);
    if (dateFrom) q = q.gte('entry_date', dateFrom);
    if (dateTo) q = q.lte('entry_date', dateTo);
    const { data: entries } = await q;
    if (!entries) return [];
    const summary: Record<string, { code: string; name: string; debit: number; credit: number }> = {};
    entries.forEach((e: any) => {
        if (!summary[e.account]) summary[e.account] = { code: e.account, name: e.account_name, debit: 0, credit: 0 };
        summary[e.account].debit += Number(e.debit) || 0;
        summary[e.account].credit += Number(e.credit) || 0;
    });
    return Object.values(summary);
}

// ─── buildBilan (server-side) ───────────────────────────────── 
function buildBilanFromAccounts(accounts: { code: string; name: string; debit: number; credit: number }[]) {
    const sections = {
        actif_immobilise: [] as any[], actif_circulant: [] as any[], actif_tresorerie: [] as any[],
        passif_permanent: [] as any[], passif_circulant: [] as any[], passif_tresorerie: [] as any[],
    };
    for (const acc of accounts) {
        const cls = parseInt(acc.code.charAt(0), 10);
        const solde = acc.debit - acc.credit;
        if (solde === 0) continue;
        if (cls === 6 || cls === 7) continue;
        const line = { account: acc.code, name: acc.name, solde: Math.abs(solde) };
        if (cls === 1) { if (solde < 0) sections.passif_permanent.push(line); else sections.actif_circulant.push(line); }
        else if (cls === 2) { if (solde > 0) sections.actif_immobilise.push(line); else sections.passif_permanent.push(line); }
        else if (cls === 3) { if (solde > 0) sections.actif_circulant.push(line); else sections.passif_circulant.push(line); }
        else if (cls === 4) { if (solde < 0) sections.passif_circulant.push(line); else sections.actif_circulant.push(line); }
        else if (cls === 5) { if (solde > 0) sections.actif_tresorerie.push(line); else sections.passif_tresorerie.push(line); }
    }
    const sum = (arr: any[]) => arr.reduce((s, l) => s + l.solde, 0);
    return {
        actif: {
            immobilise: { lines: sections.actif_immobilise, total: sum(sections.actif_immobilise) },
            circulant: { lines: sections.actif_circulant, total: sum(sections.actif_circulant) },
            tresorerie: { lines: sections.actif_tresorerie, total: sum(sections.actif_tresorerie) },
            total: sum(sections.actif_immobilise) + sum(sections.actif_circulant) + sum(sections.actif_tresorerie),
        },
        passif: {
            permanent: { lines: sections.passif_permanent, total: sum(sections.passif_permanent) },
            circulant: { lines: sections.passif_circulant, total: sum(sections.passif_circulant) },
            tresorerie: { lines: sections.passif_tresorerie, total: sum(sections.passif_tresorerie) },
            total: sum(sections.passif_permanent) + sum(sections.passif_circulant) + sum(sections.passif_tresorerie),
        },
    };
}

// ─── buildCPC (server-side) ────────────────────────────────────
function buildCPCFromAccounts(accounts: { code: string; name: string; debit: number; credit: number }[]) {
    const exploit = { charges: [] as any[], produits: [] as any[], totalC: 0, totalP: 0 };
    const financier = { charges: [] as any[], produits: [] as any[], totalC: 0, totalP: 0 };
    const nonCourant = { charges: [] as any[], produits: [] as any[], totalC: 0, totalP: 0 };
    let impot = 0;
    for (const acc of accounts) {
        const rub = parseInt(acc.code.substring(0, 2), 10);
        const solde = acc.debit - acc.credit;
        if (solde === 0) continue;
        const line = { account: acc.code, name: acc.name, solde: Math.abs(solde) };
        if (solde > 0) {
            if (rub >= 61 && rub <= 62) { exploit.charges.push(line); exploit.totalC += line.solde; }
            else if (rub === 63) { financier.charges.push(line); financier.totalC += line.solde; }
            else if (rub === 65) { nonCourant.charges.push(line); nonCourant.totalC += line.solde; }
            else if (rub === 67) { impot += line.solde; }
        } else {
            if (rub === 71) { exploit.produits.push(line); exploit.totalP += line.solde; }
            else if (rub === 73) { financier.produits.push(line); financier.totalP += line.solde; }
            else if (rub === 75) { nonCourant.produits.push(line); nonCourant.totalP += line.solde; }
        }
    }
    const resExploit = exploit.totalP - exploit.totalC;
    const resFinancier = financier.totalP - financier.totalC;
    const resCourant = resExploit + resFinancier;
    const resNonCourant = nonCourant.totalP - nonCourant.totalC;
    const resNet = resCourant + resNonCourant - impot;
    return { exploitation: { ...exploit, resultat: resExploit }, financier: { ...financier, resultat: resFinancier }, courant: resCourant, nonCourant: { ...nonCourant, resultat: resNonCourant }, impot, net: resNet };
}

// ─── Helper: Auto-create Tiers and get specific Aux Account ───────────
async function resolveAuxAccount(userId: string, accountCode: string, name: string): Promise<string> {
    if (!name || (name === 'Fournisseur' || name === 'Client')) return accountCode;

    // Check if it's a collective account (4411 or 3421)
    const isFournisseur = accountCode.startsWith('4411');
    const isClient = accountCode.startsWith('3421');
    if (!isFournisseur && !isClient) return accountCode;
    if (accountCode.length > 4) return accountCode; // Already an auxiliary account?

    const tiersType = isFournisseur ? 'fournisseur' : 'client';
    const prefix = isFournisseur ? '4411' : '3421';

    // 1. Check if tiers already exists by name
    const { data: existing } = await supabaseAdmin
        .from('tiers')
        .select('account_code_aux')
        .eq('user_id', userId)
        .ilike('name', name)
        .maybeSingle();

    if (existing) return existing.account_code_aux;

    // 2. Not found, create it. Get next available number
    const { data: maxTiers } = await supabaseAdmin
        .from('tiers')
        .select('account_code_aux')
        .eq('user_id', userId)
        .eq('type', tiersType)
        .order('account_code_aux', { descending: true })
        .limit(1)
        .maybeSingle();

    let nextNum = 1;
    if (maxTiers && maxTiers.account_code_aux) {
        // Handle codes like 44110001, 44110010 (8 digits total)
        const lastPart = maxTiers.account_code_aux.slice(4);
        nextNum = (parseInt(lastPart) || 0) + 1;
    }

    const auxCode = `${prefix}${String(nextNum).padStart(4, '0')}`;

    await supabaseAdmin.from('tiers').insert({
        user_id: userId,
        name: name,
        type: tiersType,
        account_code_aux: auxCode,
        delai_reglement_jours: 30,
        mode_reglement: 'virement',
        condition_reglement: 'net',
    });

    return auxCode;
}

// ─── Tool Definitions (system prompt) ─────────────────────────
const TOOL_DEFINITIONS = `
Tu es AutoCompta Agent, un assistant comptable expert en Plan Comptable Marocain (PCM).
Tu as accès aux outils suivants. Réponds TOUJOURS en JSON strict si tu dois appeler un outil.

OUTILS DISPONIBLES:
1.  search_documents(keyword?: string, status?: "pending"|"completed"|"archived") — Cherche des documents
2.  get_document(id: string) — Détails complets d'un document par ID
3.  get_pending_documents() — Liste tous les documents avec accounting_status='a_saisir' (factures à comptabiliser). C'est le sens de "documents en attente" pour l'utilisateur.
4.  analyze_document(id: string) — Analyse le contenu d'un document avec IA (vision)
5.  process_document(id: string, auto_insert?: boolean) — Analyse et comptabilise un document. Mets TOUJOURS auto_insert=true si l'utilisateur demande de "comptabiliser".
5b. process_documents(ids: string[], auto_insert?: boolean) — Analyse et comptabilise un tableau de documents.
5c. process_all_pending_documents(auto_insert?: boolean) — Analyse et comptabilise TOUS les documents actuellement en attente (à saisir).
6.  archive_document(id: string) — Archive un document
7.  text_to_entries(text: string) — Convertit du texte libre en écritures comptables PCM
8.  create_journal_entries(entries: Array<{account,account_name,label,debit,credit,journal,entry_date,supplier?}>, description?: string) — Sauvegarde des écritures
9.  get_journal(journal_code?: string, limit?: number, date_from?: string, date_to?: string) — Écritures du journal
10. get_accounts_summary(date_from?: string, date_to?: string) — Balance des comptes
11. get_bilan(date_from?: string, date_to?: string) — Bilan comptable (Actif / Passif)
12. get_cpc(date_from?: string, date_to?: string) — Compte de Produits et Charges
13. get_tva_report(date_from?: string, date_to?: string) — Rapport TVA
14. get_tiers(type?: "fournisseur"|"client"|"salarie", search?: string) — Liste des tiers
15. create_tiers(name: string, type: "fournisseur"|"client"|"salarie"|"autre", account_code_aux?: string, email?: string, telephone?: string, ice?: string, adresse?: string) — Crée un nouveau tiers
16. delete_journal_entry(id: string) — Supprime une écriture comptable par ID
17. get_grand_livre(account: string, date_from?: string, date_to?: string) — Grand livre d'un compte précis
19. get_supplier_balance(name: string) — Cherche un fournisseur/client par nom et retourne son solde. UTILISE CET OUTIL quand l'utilisateur demande le solde d'un fournisseur ou client par son NOM (ex: "solde de BELATHERM").
18. get_exercices() — Liste les exercices comptables (années fiscales)

FORMAT DE RÉPONSE - RÈGLE ABSOLUE:
- Si tu dois appeler UN outil: {"tool": "nom_outil", "args": {...}}
- Si tu as assez d'info pour répondre DIRECTEMENT: réponds en Markdown français SANS JSON.
- NE JAMAIS inventer d'IDs ou de données. S'il n'y a pas de données, dis-le clairement.
- Utilise des tableaux Markdown pour les données tabulaires.
- Pour les graphiques: \`\`\`chart {"type":"bar","labels":[...],"datasets":[{"label":"...","data":[...]}]} \`\`\`

CONTEXTE COMPTABLE PCM:
- Achats → Journal HA, comptes 6xxx ou 2xxx + 4411 (Fournisseur) + 34552 (TVA récupérable)
- Ventes → Journal VT, comptes 7xxx + 3421 (Client) + 4455 (TVA facturée)
- Banque → Journal BQ, compte 5141 | Caisse → Journal CA, compte 5161
- TVA à payer = TVA facturée (4455) - TVA récupérable (34552)
`;

// ─── Main Route (POST) ────────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const { query, userId, history = [] } = await req.json();
        if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

        // Build conversation history context
        const historyContext = history.length > 0
            ? `\n\nHISTORIQUE DE LA CONVERSATION:\n${history.map((m: { role: string; content: string }) =>
                `${m.role === 'user' ? 'Utilisateur' : 'Agent'}: ${m.content.slice(0, 400)}`
            ).join('\n')}\n\n`
            : '';

        // Fetch user metadata for sector
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        const userSector = user?.user_metadata?.sector || "COMMERCE";
        const sectorContext = `\nSECTEUR D'ACTIVITÉ DE L'UTILISATEUR: ${userSector}\n(Si le secteur est HOTELLERIE_RESTAURATION, tu peux utiliser les comptes hôteliers spécifiques comme 71241, 71242, 445262, 3111, etc. Sinon, reste sur le plan comptable général.)\n`;

        // Step 1: Ask Gemini to select a tool or answer directly
        const step1Prompt = `${TOOL_DEFINITIONS}${historyContext}${sectorContext}Requête utilisateur: "${query}"`;
        const step1Result = await model.generateContent(step1Prompt);
        const step1Text = step1Result.response.text().trim();

        const toolCall = extractJSON(step1Text);

        // If no tool call, answer directly (already had enough context)
        if (!toolCall || !toolCall.tool) {
            return NextResponse.json({ response: step1Text });
        }

        // Step 2: Execute the tool
        const toolResult = await executeTool(toolCall.tool, toolCall.args || {}, userId, req);

        // Step 3: Feed tool result back to Gemini for a rich final response
        const step3Prompt = `Historique: ${historyContext}
Requête utilisateur: "${query}"

L'outil "${toolCall.tool}" a retourné ce résultat :
${JSON.stringify(toolResult, null, 2)}

Tu es AutoCompta Agent.
L'utilisateur veut des réponses EXTRÊMEMENT COURTES. 
Si l'action a réussi (ex: facture comptabilisée), dis simplement que c'est fait (1 phrase max).
NE DONNE AUCUN DÉTAIL TECHNIQUE OU TABLEAU DE CHIFFRES sauf si explicitement demandé.
OBLIGATOIRE : Si c'est lié à un document, ajoute le lien vers le document sous la forme: [display_name](id) (Utilise la propriété display_name du document).
INTERDIT: N'utilise JAMAIS de listes à puces (- ou *) pour lister les documents. Mets les simplement à la ligne.
NE GÉNÈRE AUCUN JSON. Pas de blabla.`;

        const step3Result = await model.generateContent(step3Prompt);
        const finalResponse = step3Result.response.text();

        return NextResponse.json({ response: finalResponse });

    } catch (error: any) {
        console.error('Agent error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ─── Alerts Route (GET) ─────────────────────────────────────────
// Called on chat startup to show proactive alerts
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        if (!userId) return NextResponse.json({ alerts: [] });

        const alerts: string[] = [];
        const today = new Date();
        const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 7);

        // Alert 1: Pending documents older than 7 days
        const { data: pending } = await supabaseAdmin
            .from('documents')
            .select('id, original_name, created_at')
            .eq('user_id', userId)
            .eq('status', 'pending')
            .lte('created_at', sevenDaysAgo.toISOString());
        
        if (pending && pending.length > 0) {
            alerts.push(`📋 **${pending.length} justificatif(s)** en attente de traitement depuis plus de 7 jours.`);
        }

        // Alert 2: Payment delays based on Plan Tier conditions
        // Fetch tiers for payment conditions
        const { data: tiers } = await supabaseAdmin
            .from('tiers')
            .select('account_code_aux, name, delai_reglement_jours')
            .eq('user_id', userId);

        // Fetch unpaid (not matched/lettrées) invoice entries
        const { data: unpaid } = await supabaseAdmin
            .from('journal_entries')
            .select('account, entry_date, debit, credit, label')
            .eq('user_id', userId)
            .is('lettre_code', null)
            .or('account.ilike.4411%,account.ilike.3421%');

        if (tiers && unpaid && unpaid.length > 0) {
            let delayCount = 0;
            
            unpaid.forEach(entry => {
                const tier = tiers.find(t => t.account_code_aux === entry.account);
                const delayLimit = tier?.delai_reglement_jours || 30; // Default 30 days if not set
                
                const entryDate = new Date(entry.entry_date);
                const diffTime = today.getTime() - entryDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays > delayLimit) {
                    delayCount++;
                }
            });

            if (delayCount > 0) {
                alerts.push(`⚠️ **Retard de règlement** : ${delayCount} facture(s) fournisseur ou client dépasse(nt) le délai de règlement autorisé.`);
            }
        }

        // Alert 3: Activity Summary
        const { data: recentEntries } = await supabaseAdmin
            .from('journal_entries')
            .select('id')
            .eq('user_id', userId)
            .gte('created_at', sevenDaysAgo.toISOString());
        
        if (recentEntries && recentEntries.length > 0) {
            alerts.push(`📈 **Résumé hebdo** : ${recentEntries.length} écritures intégrées au système cette semaine.`);
        }

        return NextResponse.json({ alerts });
    } catch (error) {
        console.error("Alerts error:", error);
        return NextResponse.json({ alerts: [] });
    }
}

// ─── Tool Executor ─────────────────────────────────────────────
async function executeTool(toolName: string, args: any, userId: string | undefined, req: NextRequest): Promise<any> {
    if (!userId) return { error: 'Utilisateur non identifié.' };

    try {
        switch (toolName) {

            // ── 1. search_documents ──
            case 'search_documents': {
                const { keyword = '', status } = args;
                let q = supabaseAdmin.from('documents').select('id, original_name, file_path, file_type, status, accounting_status, extracted_data, created_at, internal_ref, user_id').eq('user_id', userId);
                if (keyword) q = q.or(`original_name.ilike.%${keyword}%,extracted_data->>supplier.ilike.%${keyword}%,extracted_data->>description.ilike.%${keyword}%,extracted_data->>invoice_number.ilike.%${keyword}%`);
                // status filter: 'pending' / 'a_saisir' = documents to process; 'completed'/'saisi'; 'archived'
                if (status === 'pending' || status === 'a_saisir') {
                    q = q.eq('accounting_status', 'a_saisir');
                } else if (status === 'completed' || status === 'saisi') {
                    q = q.eq('accounting_status', 'saisi');
                } else if (status === 'archived') {
                    q = q.eq('status', 'archived');
                }
                q = q.neq('status', 'archived').order('created_at', { ascending: false }).limit(20);
                const { data, error } = await q;
                if (error) return { error: error.message };
                const formattedDocs = (data || []).map((d: any) => ({ ...d, display_name: getDisplayName(d) }));
                return { documents: formattedDocs, count: formattedDocs.length };
            }

            // ── 2. get_document ──
            case 'get_document': {
                const { id } = args;
                const { data, error } = await supabaseAdmin.from('documents').select('*').eq('id', id).eq('user_id', userId).single();
                if (error) return { error: 'Document introuvable.' };
                return { document: { ...data, display_name: getDisplayName(data) } };
            }

            // ── 3. get_pending_documents ──
            case 'get_pending_documents': {
                // "En attente" for the user = accounting_status = 'a_saisir' (not yet journalized)
                // Exclude archived docs
                const { data, error } = await supabaseAdmin
                    .from('documents')
                    .select('id, original_name, created_at, extracted_data, status, accounting_status, internal_ref')
                    .eq('user_id', userId)
                    .eq('accounting_status', 'a_saisir')
                    .neq('status', 'archived')
                    .order('created_at', { ascending: false });
                if (error) return { error: error.message };
                const formattedDocs = (data || []).map((d: any) => ({ ...d, display_name: getDisplayName(d) }));
                return { documents: formattedDocs, count: formattedDocs.length };
            }

            // ── 4. analyze_document ──
            case 'analyze_document': {
                const { id } = args;
                const { data: doc } = await supabaseAdmin.from('documents').select('*').eq('id', id).eq('user_id', userId).single();
                if (!doc) return { error: 'Document introuvable.' };
                const { data: fileData } = await supabaseAdmin.storage.from('documents').download(doc.file_path);
                if (!fileData) return { error: 'Impossible de télécharger le fichier.' };
                const fileBytes = Buffer.from(await fileData.arrayBuffer()).toString('base64');
                const analysisPrompt = `Analyse ce document en détail. Extrais: type de document, fournisseur/client, montants (HT, TVA, TTC), date, numéro de référence, et résumé de l'objet. Sois précis et structuré. Réponds en français.`;
                const res = await model.generateContent([analysisPrompt, { inlineData: { data: fileBytes, mimeType: doc.file_type || 'application/pdf' } }] as any);
                return { document_name: doc.original_name, display_name: getDisplayName(doc), document_id: doc.id, analysis: res.response.text(), status: doc.status };
            }

            // ── 5. process_document ──
            case 'process_document': {
                const { id, auto_insert } = args;
                const { data: doc } = await supabaseAdmin.from('documents').select('*').eq('id', id).eq('user_id', userId).single();
                if (!doc) return { error: 'Document introuvable.' };
                const origin = req.nextUrl.origin || 'http://localhost:3000';
                const res = await fetch(`${origin}/api/pipeline-entries`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ documentId: doc.id, filePath: doc.file_path, fileType: doc.file_type })
                });
                const pipelineResult = await res.json();
                if (!res.ok || pipelineResult.error) return { error: pipelineResult.error || 'Pipeline échoué.' };

                // If auto_insert is true, we directly insert the entries without waiting for user confirmation
                if (auto_insert && pipelineResult.data && pipelineResult.data.entries) {
                    const entries = pipelineResult.data.entries.map((e: any) => ({
                        ...e,
                        doc_id: doc.id,
                        entry_date: pipelineResult.data.date,
                        journal: pipelineResult.data.journal,
                        supplier: pipelineResult.data.supplier
                    }));

                    const rowsToInsert = await Promise.all(entries.map(async (e: any) => {
                        let finalAccount = e.account;
                        // If it's a collective account, resolve to specific auxiliary account
                        if (e.account === '4411' || e.account === '3421') {
                            finalAccount = await resolveAuxAccount(userId, e.account, e.account_name || e.supplier);
                        }

                        return {
                            user_id: userId,
                            doc_id: e.doc_id || null,
                            journal: e.journal || 'OD',
                            entry_date: e.entry_date || new Date().toISOString().split('T')[0],
                            account: finalAccount,
                            account_name: e.account_name,
                            label: e.label || doc.original_name,
                            debit: Number(e.debit) || 0,
                            credit: Number(e.credit) || 0,
                            ref: doc.internal_ref || null,
                            supplier: e.supplier || null,
                        };
                    }));

                    const { error: insertError } = await supabaseAdmin.from('journal_entries').insert(rowsToInsert);
                    if (insertError) return { error: `Analysé, mais erreur lors de la sauvegarde: ${insertError.message}` };

                    await supabaseAdmin.from('documents').update({ accounting_status: 'saisi' }).eq('id', doc.id);
                    return { success: true, display_name: getDisplayName(doc), document_name: doc.original_name, message: "Écritures comptabilisées et sauvegardées avec succès." };
                }

                return { success: true, display_name: getDisplayName(doc), document_name: doc.original_name, accounting_data: pipelineResult.data };
            }

            // ── 5b & 5c. process_documents & process_all_pending_documents ──
            case 'process_documents':
            case 'process_all_pending_documents': {
                let docsToProcess: any[] = [];
                if (toolName === 'process_all_pending_documents') {
                    const { data } = await supabaseAdmin.from('documents').select('*').eq('user_id', userId).eq('accounting_status', 'a_saisir').neq('status', 'archived');
                    if (data) docsToProcess = data;
                } else {
                    const { ids } = args;
                    if (ids && Array.isArray(ids) && ids.length > 0) {
                        const { data } = await supabaseAdmin.from('documents').select('*').eq('user_id', userId).in('id', ids);
                        if (data) docsToProcess = data;
                    }
                }

                if (docsToProcess.length === 0) return { error: "Aucun document trouvé à comptabiliser." };

                const origin = req.nextUrl.origin || 'http://localhost:3000';
                const results = [];
                for (const doc of docsToProcess) {
                    const res = await fetch(`${origin}/api/pipeline-entries`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ documentId: doc.id, filePath: doc.file_path, fileType: doc.file_type })
                    });
                    const pipelineResult = await res.json();
                    if (!res.ok || pipelineResult.error) {
                        results.push({ id: doc.id, document_name: doc.original_name, error: pipelineResult.error || 'Pipeline échoué.' });
                        continue;
                    }

                    if (args.auto_insert !== false && pipelineResult.data && pipelineResult.data.entries) {
                        const entries = pipelineResult.data.entries.map((e: any) => ({
                            ...e, doc_id: doc.id, entry_date: pipelineResult.data.date, journal: pipelineResult.data.journal, supplier: pipelineResult.data.supplier
                        }));

                        const rowsToInsert = await Promise.all(entries.map(async (e: any) => {
                            let finalAccount = e.account;
                            if (e.account === '4411' || e.account === '3421') {
                                finalAccount = await resolveAuxAccount(userId, e.account, e.account_name || e.supplier);
                            }
                            return {
                                user_id: userId, doc_id: e.doc_id || null, journal: e.journal || 'OD', entry_date: e.entry_date || new Date().toISOString().split('T')[0], account: finalAccount, account_name: e.account_name, label: e.label || doc.original_name, debit: Number(e.debit) || 0, credit: Number(e.credit) || 0, ref: doc.internal_ref || null, supplier: e.supplier || null,
                            };
                        }));

                        const { error: insertError } = await supabaseAdmin.from('journal_entries').insert(rowsToInsert);
                        if (insertError) {
                            results.push({ id: doc.id, document_name: doc.original_name, error: insertError.message });
                        } else {
                            await supabaseAdmin.from('documents').update({ accounting_status: 'saisi' }).eq('id', doc.id);
                            results.push({ id: doc.id, display_name: getDisplayName(doc), document_name: doc.original_name, success: true });
                        }
                    } else {
                        results.push({ id: doc.id, display_name: getDisplayName(doc), document_name: doc.original_name, success: true, accounting_data: pipelineResult.data });
                    }
                }
                return { success: true, processed_count: results.length, details: results };
            }

            // ── 6. archive_document ──
            case 'archive_document': {
                const { id } = args;
                const { error } = await supabaseAdmin.from('documents').update({ status: 'archived' }).eq('id', id).eq('user_id', userId);
                if (error) return { error: error.message };
                return { success: true, message: 'Document archivé avec succès.' };
            }

            // ── 7. text_to_entries ──
            case 'text_to_entries': {
                const { text } = args;
                if (!text) return { error: 'Texte manquant.' };
                const origin = req.nextUrl.origin;
                const res = await fetch(`${origin}/api/text-to-entries`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, userId })
                });
                const result = await res.json();
                if (!res.ok || result.error) return { error: result.error || 'Conversion échouée.' };
                return { success: true, accounting_data: result.data };
            }

            // ── 8. create_journal_entries ──
            case 'create_journal_entries': {
                const { entries, description } = args;
                if (!entries || !Array.isArray(entries) || entries.length === 0) return { error: 'Aucune écriture fournie.' };
                if (!userId) return { error: 'Utilisateur non identifié. Impossible de sauvegarder.' };

                // Validate double-entry
                const totalDebit = entries.reduce((s: number, e: any) => s + (Number(e.debit) || 0), 0);
                const totalCredit = entries.reduce((s: number, e: any) => s + (Number(e.credit) || 0), 0);
                if (Math.abs(totalDebit - totalCredit) > 0.01) {
                    return { error: `Déséquilibre: Débit (${totalDebit.toFixed(2)}) ≠ Crédit (${totalCredit.toFixed(2)}). Impossible de sauvegarder.` };
                }

                const today = new Date().toISOString().split('T')[0];
                const rowsToInsert = await Promise.all(entries.map(async (e: any) => {
                    let finalAccount = e.account;
                    if (e.account === '4411' || e.account === '3421') {
                        finalAccount = await resolveAuxAccount(userId, e.account, e.account_name || e.supplier);
                    }
                    return {
                        user_id: userId,
                        doc_id: e.doc_id || null,
                        journal: e.journal || 'OD',
                        entry_date: e.entry_date || today,
                        account: finalAccount,
                        account_name: e.account_name,
                        label: e.label || description || 'Écriture via Agent IA',
                        debit: Number(e.debit) || 0,
                        credit: Number(e.credit) || 0,
                        ref: e.ref || null,
                        supplier: e.supplier || null,
                    };
                }));

                const { data, error } = await supabaseAdmin.from('journal_entries').insert(rowsToInsert).select();
                if (error) return { error: error.message };
                return { success: true, inserted_count: data.length, entries: data };
            }

            // ── 9. get_journal ──
            case 'get_journal': {
                const { journal_code, limit = 50, date_from, date_to } = args;
                let q = supabaseAdmin.from('journal_entries').select('*').eq('user_id', userId).order('entry_date', { ascending: false }).limit(limit);
                if (journal_code) q = q.eq('journal', journal_code);
                if (date_from) q = q.gte('entry_date', date_from);
                if (date_to) q = q.lte('entry_date', date_to);
                const { data, error } = await q;
                if (error) return { error: error.message };
                return { entries: data || [], count: (data || []).length };
            }

            // ── 10. get_accounts_summary ──
            case 'get_accounts_summary': {
                const { date_from, date_to } = args;
                const summary = await buildAccountsSummary(userId, date_from, date_to);
                return { accounts: summary };
            }

            // ── 11. get_bilan ──
            case 'get_bilan': {
                const { date_from, date_to } = args;
                const accounts = await buildAccountsSummary(userId, date_from, date_to);
                const bilan = buildBilanFromAccounts(accounts);
                return { bilan };
            }

            // ── 12. get_cpc ──
            case 'get_cpc': {
                const { date_from, date_to } = args;
                const accounts = await buildAccountsSummary(userId, date_from, date_to);
                const cpc = buildCPCFromAccounts(accounts);
                return { cpc };
            }

            // ── 13. get_tva_report ──
            case 'get_tva_report': {
                const { date_from, date_to } = args;
                let q = supabaseAdmin.from('journal_entries').select('account, account_name, debit, credit').eq('user_id', userId);
                if (date_from) q = q.gte('entry_date', date_from);
                if (date_to) q = q.lte('entry_date', date_to);
                const { data: entries, error } = await q;
                if (error) return { error: error.message };

                let tvaCollectee = 0;    // 4455 — TVA sur ventes (crédit)
                let tvaDeductible = 0;   // 34551, 34552 — TVA récupérable (débit)

                entries?.forEach((e: any) => {
                    if (e.account === '4455') tvaCollectee += (Number(e.credit) || 0) - (Number(e.debit) || 0);
                    if (e.account.startsWith('3455')) tvaDeductible += (Number(e.debit) || 0) - (Number(e.credit) || 0);
                });

                const tvaAPayer = tvaCollectee - tvaDeductible;
                return {
                    tva_collectee: Math.max(0, tvaCollectee),
                    tva_deductible: Math.max(0, tvaDeductible),
                    tva_a_payer: tvaAPayer,
                    credit_de_tva: tvaAPayer < 0 ? Math.abs(tvaAPayer) : 0,
                    periode: { date_from: date_from || 'début', date_to: date_to || 'aujourd\'hui' }
                };
            }

            // ── 14. get_tiers ──
            case 'get_tiers': {
                const { type, search } = args;
                let q = supabaseAdmin.from('tiers').select('*').eq('user_id', userId).order('name');
                if (type) q = q.eq('type', type);
                if (search) q = q.ilike('name', `%${search}%`);
                const { data, error } = await q;
                if (error) return { error: error.message };
                return { tiers: data || [], count: (data || []).length };
            }


            // ── 15. create_tiers ──
            case 'create_tiers': {
                const { name, type, account_code_aux, email, telephone, ice, adresse } = args;
                if (!name || !type) return { error: 'Nom et type du tiers sont obligatoires.' };
                if (!userId) return { error: 'Utilisateur non identifié.' };

                // Auto-generate account_code_aux based on type and count
                let auxCode = account_code_aux;
                if (!auxCode) {
                    const prefix = type === 'client' ? '3421' : type === 'salarie' ? '4441' : '4411';
                    const { count } = await supabaseAdmin.from('tiers').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('type', type);
                    auxCode = `${prefix}${String((count || 0) + 1).padStart(3, '0')}`;
                }

                const { data, error } = await supabaseAdmin.from('tiers').insert({
                    user_id: userId,
                    name,
                    type,
                    account_code_aux: auxCode,
                    email: email || null,
                    telephone: telephone || null,
                    ice: ice || null,
                    adresse: adresse || null,
                    delai_reglement_jours: 30,
                    mode_reglement: 'virement',
                    condition_reglement: 'net',
                }).select().single();
                if (error) return { error: error.message };
                return { success: true, tiers: data, message: `Tiers "${name}" créé avec le code auxiliaire ${auxCode}.` };
            }

            // ── 16. delete_journal_entry ──
            case 'delete_journal_entry': {
                const { id } = args;
                if (!id) return { error: 'ID de l\'écriture manquant.' };
                const { error } = await supabaseAdmin.from('journal_entries').delete().eq('id', id).eq('user_id', userId);
                if (error) return { error: error.message };
                return { success: true, message: `Écriture ${id} supprimée avec succès.` };
            }

            // ── 17. get_grand_livre ──
            case 'get_grand_livre': {
                const { account, date_from, date_to } = args;
                if (!account) return { error: 'Numéro de compte manquant.' };
                let q = supabaseAdmin.from('journal_entries')
                    .select('id, entry_date, journal, label, supplier, debit, credit, lettre_code, piece_num, ref')
                    .eq('user_id', userId)
                    .ilike('account', `${account}%`)
                    .order('entry_date', { ascending: true });
                if (date_from) q = q.gte('entry_date', date_from);
                if (date_to) q = q.lte('entry_date', date_to);
                const { data, error } = await q;
                if (error) return { error: error.message };
                const totalDebit = (data || []).reduce((s: number, e: any) => s + Number(e.debit), 0);
                const totalCredit = (data || []).reduce((s: number, e: any) => s + Number(e.credit), 0);
                return {
                    account,
                    entries: data || [],
                    count: (data || []).length,
                    totals: { debit: totalDebit, credit: totalCredit, solde: totalDebit - totalCredit }
                };
            }

            // ── 18. get_exercices ──
            case 'get_exercices': {
                const { data, error } = await supabaseAdmin
                    .from('exercices_comptables')
                    .select('*')
                    .eq('user_id', userId)
                    .order('date_debut', { ascending: false });
                if (error) return { error: error.message };
                return { exercices: data || [], count: (data || []).length };
            }

            // ── 19. get_supplier_balance ──
            case 'get_supplier_balance': {
                const { name } = args;
                if (!name) return { error: 'Nom du fournisseur/client manquant.' };

                // Step 1: Find the tiers by name
                const { data: tiersResults } = await supabaseAdmin
                    .from('tiers')
                    .select('*')
                    .eq('user_id', userId)
                    .ilike('name', `%${name}%`);

                if (!tiersResults || tiersResults.length === 0) {
                    // Fallback: search in journal_entries by supplier field
                    const { data: journalBySupplier } = await supabaseAdmin
                        .from('journal_entries')
                        .select('account, account_name, debit, credit, entry_date, supplier')
                        .eq('user_id', userId)
                        .ilike('supplier', `%${name}%`);

                    if (!journalBySupplier || journalBySupplier.length === 0) {
                        // Last resort: search in account_name
                        const { data: journalByAccName } = await supabaseAdmin
                            .from('journal_entries')
                            .select('account, account_name, debit, credit, entry_date, supplier')
                            .eq('user_id', userId)
                            .ilike('account_name', `%${name}%`);

                        if (!journalByAccName || journalByAccName.length === 0) {
                            return { error: `Aucun tiers ou écriture trouvé pour "${name}".` };
                        }

                        const totalDebit = journalByAccName.reduce((s: number, e: any) => s + (Number(e.debit) || 0), 0);
                        const totalCredit = journalByAccName.reduce((s: number, e: any) => s + (Number(e.credit) || 0), 0);
                        const solde = totalDebit - totalCredit;
                        return {
                            name,
                            found_via: 'journal_entries (account_name)',
                            entries_count: journalByAccName.length,
                            total_debit: totalDebit,
                            total_credit: totalCredit,
                            solde,
                            solde_type: solde > 0 ? 'débiteur' : solde < 0 ? 'créditeur' : 'nul',
                        };
                    }

                    const totalDebit = journalBySupplier.reduce((s: number, e: any) => s + (Number(e.debit) || 0), 0);
                    const totalCredit = journalBySupplier.reduce((s: number, e: any) => s + (Number(e.credit) || 0), 0);
                    const solde = totalDebit - totalCredit;
                    return {
                        name,
                        found_via: 'journal_entries (supplier)',
                        entries_count: journalBySupplier.length,
                        total_debit: totalDebit,
                        total_credit: totalCredit,
                        solde,
                        solde_type: solde > 0 ? 'débiteur' : solde < 0 ? 'créditeur' : 'nul',
                    };
                }

                // Found in tiers table — get their account code and query journal
                const tiers = tiersResults[0];
                const { data: journalEntries } = await supabaseAdmin
                    .from('journal_entries')
                    .select('id, entry_date, journal, label, debit, credit, lettre_code')
                    .eq('user_id', userId)
                    .eq('account', tiers.account_code_aux)
                    .order('entry_date', { ascending: true });

                const entries = journalEntries || [];
                const totalDebit = entries.reduce((s: number, e: any) => s + (Number(e.debit) || 0), 0);
                const totalCredit = entries.reduce((s: number, e: any) => s + (Number(e.credit) || 0), 0);
                const solde = totalDebit - totalCredit;

                return {
                    tiers: {
                        name: tiers.name,
                        type: tiers.type,
                        account_code_aux: tiers.account_code_aux,
                        email: tiers.email,
                        telephone: tiers.telephone,
                        ice: tiers.ice,
                    },
                    entries_count: entries.length,
                    total_debit: totalDebit,
                    total_credit: totalCredit,
                    solde: Math.abs(solde),
                    solde_type: solde > 0 ? 'débiteur' : solde < 0 ? 'créditeur' : 'nul',
                };
            }

            default:
                return { error: `Outil inconnu: ${toolName}` };
        }
    } catch (err: any) {
        console.error(`Tool ${toolName} error:`, err);
        return { error: err.message || 'Erreur interne de l\'outil.' };
    }
}

