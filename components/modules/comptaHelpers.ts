// ─── Types ───────────────────────────────────────────────────
export interface Document {
    id: string;
    original_name: string;
    created_at: string;
    status: string;
    accounting_status: string | null;
    internal_ref: string | null;
    extracted_data: any;
}

export interface JournalEntry {
    id: string;
    doc_id: string | null;
    entry_date: string;
    ref: string;
    account: string;
    account_name: string;
    label: string;
    debit: number;
    credit: number;
    supplier: string;
    journal: 'HA' | 'VT' | 'BQ' | 'CA' | 'OD';
    lettre_code: string | null;
    is_contrepassation: boolean;
    piece_num: string | null;
    entry_status?: 'brouillard' | 'valide' | 'cloture';
    echeance_date?: string | null;
    exercice_id?: string | null;
}

export interface ExerciceComptable {
    id: string;
    user_id: string;
    label: string;
    date_debut: string;
    date_fin: string;
    is_current: boolean;
    is_closed: boolean;
    created_at: string;
}

export interface TiersEnriched {
    id: string;
    user_id: string;
    type: 'fournisseur' | 'client' | 'salarie' | 'autre';
    name: string;
    account_code_aux: string;
    adresse?: string;
    ville?: string;
    code_postal?: string;
    rc?: string;
    identifiant_fiscal?: string;
    ice?: string;
    telephone?: string;
    email?: string;
    delai_reglement_jours: number;
    mode_reglement: 'virement' | 'cheque' | 'especes' | 'effet' | 'prelevement';
    jour_tombee?: number;
    condition_reglement: 'net' | 'fin_mois' | 'fin_mois_le';
    compte_collectif?: string;
    created_at: string;
    updated_at: string;
}

export type ContrepartieMode = 'ligne_a_ligne' | 'centralisation_fin_mois';

export interface JournalConfig {
    id: string;
    user_id: string;
    code: 'HA' | 'VT' | 'BQ' | 'CA' | 'OD';
    intitule: string;
    type_journal: 'achat' | 'vente' | 'tresorerie' | 'od' | 'situation';
    compte_contrepartie?: string;
    mode_contrepartie: ContrepartieMode;
}

export interface AccountMeta {
    name: string;
    type: 'detail' | 'total';
    nature: 'debit' | 'credit';
    lettrable: boolean;
    code_taxe?: string;
}

export interface SIGModel {
    margeBrute: number;
    valeurAjoutee: number;
    ebe: number;  // Excédent Brut d'Exploitation
    resultatExploitation: number;
    resultatFinancier: number;
    resultatCourant: number;
    resultatNonCourant: number;
    resultatAvantImpot: number;
    resultatNet: number;
}

export type SubTab = 'asaisir' | 'journal' | 'grandlivre' | 'balance' | 'lettrage' | 'tiers' | 'tva' | 'sig';
export type JournalFilter = 'tous' | 'HA' | 'VT' | 'BQ' | 'CA' | 'OD';

// ─── PCM Helpers ─────────────────────────────────────────────
export const PCM_ACCOUNTS: Record<string, string> = {
    '1111': 'Capital social',
    '1481': 'Emprunts',
    '2311': 'Terrains',
    '2321': 'Bâtiments',
    '2340': 'Matériel de transport',
    '2355': 'Matériel informatique',
    '3111': 'Marchandises',
    '3421': 'Clients',
    '4411': 'Fournisseurs',
    '4452': 'État — Impôts et taxes',
    '3455': 'État — TVA récupérable',
    '4455': 'État — TVA facturée',
    '34551': 'TVA récupérable sur immobilisations',
    '34552': 'TVA récupérable sur charges',
    '5141': 'Banque',
    '5161': 'Caisse',
    '6111': 'Achats de marchandises',
    '6121': 'Achats de matières premières',
    '6122': 'Achats de matières et fournitures consommables',
    '6125': 'Achats non stockés de mat. et fournitures',
    '6131': 'Locations et charges locatives',
    '6134': 'Primes d\'assurance',
    '6141': 'Études, recherches et documentation',
    '6142': 'Transports',
    '6144': 'Publicité et relations publiques',
    '6145': 'Frais postaux et de télécommunications',
    '6147': 'Services bancaires',
    '6161': 'Impôts et taxes directs',
    '6167': 'Impôts et taxes indirects',
    '6171': 'Rémunérations du personnel',
    '6174': 'Charges sociales',
    '7111': 'Ventes de marchandises',
    '7124': 'Ventes de services',
    '7127': 'Ventes et produits accessoires',
};

export const JOURNAL_LABELS: Record<string, string> = {
    'HA': 'Achats', 'VT': 'Ventes', 'BQ': 'Banque', 'CA': 'Caisse', 'OD': 'OD',
};

export function getAccountName(code: string): string {
    if (PCM_ACCOUNTS[code]) return PCM_ACCOUNTS[code];
    const prefixes: [string, string][] = [
        ['1', 'Financement permanent'], ['2', 'Actif immobilisé'],
        ['3', 'Actif circulant'], ['4', 'Passif circulant'],
        ['5', 'Trésorerie'], ['61', 'Charges d\'exploitation'],
        ['62', 'Autres charges externes'], ['63', 'Impôts et taxes'],
        ['64', 'Charges de personnel'], ['65', 'Autres charges courantes'],
        ['66', 'Charges financières'], ['67', 'Charges non courantes'],
        ['71', 'Produits d\'exploitation'], ['73', 'Produits financiers'],
        ['75', 'Produits non courants'],
    ];
    for (const [p, n] of prefixes) {
        if (code.startsWith(p)) return n;
    }
    return `Compte ${code}`;
}

export function fmt(n: number): string {
    return n ? n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
}

/** Normalise une date quelconque (DD/MM/YYYY, YYYY-MM-DD, etc.) en YYYY-MM-DD pour PostgreSQL */
export function normalizeDate(raw: string): string {
    if (!raw) return new Date().toISOString().split('T')[0];

    // Already YYYY-MM-DD?
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (dmyMatch) {
        const [, d, m, y] = dmyMatch;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    // Try JS Date parsing as fallback
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
    }

    // Absolute fallback: today
    return new Date().toISOString().split('T')[0];
}

export function buildEntriesFromDoc(
    doc: Document,
    // Note: These parameters are kept for compatibility, but we will override them smartly
    // based on whether it's a purchase (HA) or sale (VT)
    fallbackSupplierAccount: string = '4411',
    fallbackSupplierName: string = 'Fournisseurs'
): Omit<JournalEntry, 'id' | 'piece_num'>[] {
    const data = doc.extracted_data;
    if (!data) return [];

    // Base data
    const date = normalizeDate(data.date || doc.created_at.split('T')[0]);
    const ref = doc.internal_ref || 'N/A';
    const originalSupplierOrClient = data.supplier || 'Inconnu';
    const categoryCode = data.category_code || '6111';
    const categoryName = data.category_name || getAccountName(categoryCode);
    const totalTTC = Number(data.total_amount) || 0;
    const amountHT = Number(data.amount_ht) || totalTTC;
    const tvaAmount = Number(data.tva_amount) || 0;
    const isAvoir = data.type === 'credit_note';
    const label = `${originalSupplierOrClient} — ${data.invoice_number || ref}`;

    if (totalTTC === 0) return [];

    const entries: Omit<JournalEntry, 'id' | 'piece_num'>[] = [];

    // Determine if it's a Sale (Ventes - Classe 7)
    const isSale = categoryCode.startsWith('7');

    if (isSale) {
        // --- VENTES (SALES) ---
        const journal = 'VT';
        const clientAcc = '3421';
        const clientName = 'Clients';

        // Produit (Class 7) -> Normalement Crédit
        entries.push({
            doc_id: doc.id, entry_date: date, ref, journal,
            account: categoryCode, account_name: categoryName, label,
            debit: isAvoir ? amountHT : 0, credit: isAvoir ? 0 : amountHT,
            supplier: originalSupplierOrClient, lettre_code: null, is_contrepassation: false,
        });

        // TVA Facturée (4455) -> Normalement Crédit
        if (tvaAmount > 0) {
            entries.push({
                doc_id: doc.id, entry_date: date, ref, journal,
                account: '4455', account_name: 'État, TVA facturée', label,
                debit: isAvoir ? tvaAmount : 0, credit: isAvoir ? 0 : tvaAmount,
                supplier: originalSupplierOrClient, lettre_code: null, is_contrepassation: false,
            });
        }

        // Client (3421) -> Normalement Débit
        entries.push({
            doc_id: doc.id, entry_date: date, ref, journal,
            account: clientAcc, account_name: clientName, label,
            debit: isAvoir ? 0 : totalTTC, credit: isAvoir ? totalTTC : 0,
            supplier: originalSupplierOrClient, lettre_code: null, is_contrepassation: false,
        });

    } else {
        // --- ACHATS (PURCHASES) ---
        const journal = 'HA';
        const fourAcc = fallbackSupplierAccount || '4411';
        const fourName = fallbackSupplierName || 'Fournisseurs';
        const tvaAcc = categoryCode.startsWith('2') ? '34551' : '34552'; // Immo vs Charges
        const tvaName = categoryCode.startsWith('2') ? 'TVA récupérable sur immobilisations' : 'TVA récupérable sur charges';

        // Charge / Immo (Class 6/2/3) -> Normalement Débit
        entries.push({
            doc_id: doc.id, entry_date: date, ref, journal,
            account: categoryCode, account_name: categoryName, label,
            debit: isAvoir ? 0 : amountHT, credit: isAvoir ? amountHT : 0,
            supplier: originalSupplierOrClient, lettre_code: null, is_contrepassation: false,
        });

        // TVA Récupérable (34551/34552) -> Normalement Débit
        if (tvaAmount > 0) {
            entries.push({
                doc_id: doc.id, entry_date: date, ref, journal,
                account: tvaAcc, account_name: tvaName, label,
                debit: isAvoir ? 0 : tvaAmount, credit: isAvoir ? tvaAmount : 0,
                supplier: originalSupplierOrClient, lettre_code: null, is_contrepassation: false,
            });
        }

        // Fournisseur (4411/4481) -> Normalement Crédit
        entries.push({
            doc_id: doc.id, entry_date: date, ref, journal,
            account: fourAcc, account_name: fourName, label,
            debit: isAvoir ? totalTTC : 0, credit: isAvoir ? 0 : totalTTC,
            supplier: originalSupplierOrClient, lettre_code: null, is_contrepassation: false,
        });
    }

    return entries;
}

export function buildPaymentEntries(
    doc: Document,
    fallbackAccount: string = '4411',
    fallbackAccName: string = 'Fournisseurs'
): Omit<JournalEntry, 'id' | 'piece_num'>[] {
    const data = doc.extracted_data;
    if (!data) return [];

    const date = data.payment_date || data.date || doc.created_at.split('T')[0];
    const ref = doc.internal_ref || 'N/A';
    const originalSupplierOrClient = data.supplier || 'Inconnu';
    const totalTTC = Number(data.total_amount) || 0;
    const isAvoir = data.type === 'credit_note';
    const isCash = data.payment_method === 'especes';
    const categoryCode = data.category_code || '6111';

    // Determine Trezo details
    const payJournal: 'BQ' | 'CA' = isCash ? 'CA' : 'BQ';
    const payAccount = isCash ? '5161' : '5141';
    const payAccountName = isCash ? 'Caisse' : 'Banque';
    const label = `Règlement ${originalSupplierOrClient} — ${data.invoice_number || ref}`;

    if (totalTTC === 0) return [];

    // Check if it's related to a Sale (Encaissement Client) or Purchase (Paiement Fournisseur)
    const isSale = categoryCode.startsWith('7');

    if (isSale) {
        // ENCAISSEMENT CLIENT (Client paie)
        // Normal: Banque est DEBITEE, Client est CREDITE
        return [
            {
                doc_id: doc.id, entry_date: date, ref, journal: payJournal,
                account: payAccount, account_name: payAccountName, label, // Banque
                debit: isAvoir ? 0 : totalTTC, credit: isAvoir ? totalTTC : 0,
                supplier: originalSupplierOrClient, lettre_code: null, is_contrepassation: false,
            },
            {
                doc_id: doc.id, entry_date: date, ref, journal: payJournal,
                account: '3421', account_name: 'Clients', label, // Client
                debit: isAvoir ? totalTTC : 0, credit: isAvoir ? 0 : totalTTC,
                supplier: originalSupplierOrClient, lettre_code: null, is_contrepassation: false,
            },
        ];
    } else {
        // PAIEMENT FOURNISSEUR (On paie le fournisseur)
        // Normal: Fournisseur est DEBITE, Banque est CREDITEE
        const fourAcc = fallbackAccount || '4411';
        const fourName = fallbackAccName || 'Fournisseurs';
        return [
            {
                doc_id: doc.id, entry_date: date, ref, journal: payJournal,
                account: fourAcc, account_name: fourName, label, // Fournisseur
                debit: isAvoir ? 0 : totalTTC, credit: isAvoir ? totalTTC : 0,
                supplier: originalSupplierOrClient, lettre_code: null, is_contrepassation: false,
            },
            {
                doc_id: doc.id, entry_date: date, ref, journal: payJournal,
                account: payAccount, account_name: payAccountName, label, // Banque
                debit: isAvoir ? totalTTC : 0, credit: isAvoir ? 0 : totalTTC,
                supplier: originalSupplierOrClient, lettre_code: null, is_contrepassation: false,
            },
        ];
    }
}

// Bilan/CPC classification helpers
export function getAccountClass(account: string): number {
    return parseInt(account.charAt(0), 10) || 0;
}

export function getAccountRubrique(account: string): number {
    return parseInt(account.substring(0, 2), 10) || 0;
}

export interface BilanLine { account: string; name: string; solde: number; }

export interface BilanSection {
    total: number;
    lines: BilanLine[];
}

export interface BilanModel {
    actif: {
        immobilise: BilanSection;
        circulant: BilanSection;
        tresorerie: BilanSection;
        total: number;
    };
    passif: {
        permanent: BilanSection;
        circulant: BilanSection;
        tresorerie: BilanSection;
        total: number;
    };
}

export interface CPCSection {
    charges: BilanLine[];
    produits: BilanLine[];
    totalCharges: number;
    totalProduits: number;
    resultat: number;
}

export interface CPCModel {
    exploitation: CPCSection;
    financier: CPCSection;
    courant: number;
    nonCourant: CPCSection;
    impot: { charges: BilanLine[]; totalCharges: number; };
    net: number;
}

export function buildBilan(accounts: { account: string; name: string; debit: number; credit: number }[], resultatNet?: number): BilanModel {
    const bilan: BilanModel = {
        actif: {
            immobilise: { total: 0, lines: [] },
            circulant: { total: 0, lines: [] },
            tresorerie: { total: 0, lines: [] },
            total: 0
        },
        passif: {
            permanent: { total: 0, lines: [] },
            circulant: { total: 0, lines: [] },
            tresorerie: { total: 0, lines: [] },
            total: 0
        }
    };

    // Agrégation des comptes auxiliaires (Tiers)
    const aggregated = new Map<string, { account: string; name: string; debit: number; credit: number }>();
    for (const acc of accounts) {
        let code = acc.account;
        let name = acc.name;

        // Fallback: if the stored name is too vague (e.g. just "TVA"), use PCM lookup
        if (!name || name.length <= 4 || name.toUpperCase() === 'TVA') {
            name = getAccountName(code);
        }

        // Regroupement Fournisseurs et Clients
        if (code.startsWith('4411') && code.length > 4) {
            code = '4411';
            name = 'Fournisseurs';
        } else if (code.startsWith('3421') && code.length > 4) {
            code = '3421';
            name = 'Clients';
        }

        if (!aggregated.has(code)) {
            aggregated.set(code, { account: code, name: name, debit: 0, credit: 0 });
        }
        const existing = aggregated.get(code)!;
        existing.debit += acc.debit;
        existing.credit += acc.credit;
    }

    for (const acc of Array.from(aggregated.values())) {
        const cls = getAccountClass(acc.account);
        const rub = getAccountRubrique(acc.account);
        const solde = acc.debit - acc.credit;
        if (solde === 0) continue;

        const line = { account: acc.account, name: acc.name, solde: Math.abs(solde) };

        // Skip CPC accounts (charges & produits)
        if (cls === 6 || cls === 7) continue;

        // Classification by account nature (PCM marocain)
        if (cls === 1) {
            // Classe 1 — Financement permanent → always Passif
            if (solde < 0) { bilan.passif.permanent.lines.push(line); bilan.passif.permanent.total += line.solde; }
            else { bilan.actif.circulant.lines.push(line); bilan.actif.circulant.total += line.solde; } // rare: debit balance on equity
        } else if (cls === 2) {
            // Classe 2 — Immobilisations → always Actif immobilisé
            if (solde > 0) { bilan.actif.immobilise.lines.push(line); bilan.actif.immobilise.total += line.solde; }
            else { bilan.passif.permanent.lines.push(line); bilan.passif.permanent.total += line.solde; } // amortissements/provisions
        } else if (cls === 3) {
            // Classe 3 — Actif circulant
            if (solde > 0) { bilan.actif.circulant.lines.push(line); bilan.actif.circulant.total += line.solde; }
            else { bilan.passif.circulant.lines.push(line); bilan.passif.circulant.total += line.solde; } // provisions
        } else if (cls === 4) {
            // Classe 4 — Passif circulant (fournisseurs, dettes)
            if (solde < 0) { bilan.passif.circulant.lines.push(line); bilan.passif.circulant.total += line.solde; }
            else { bilan.actif.circulant.lines.push(line); bilan.actif.circulant.total += line.solde; } // avances fournisseurs
        } else if (cls === 5) {
            // Classe 5 — Trésorerie (banque, caisse)
            if (solde > 0) {
                bilan.actif.tresorerie.lines.push(line); bilan.actif.tresorerie.total += line.solde;
            } else {
                // PCM Marocain: Si la banque a un solde créditeur, on la reclasse en 5541
                if (line.account === '5141') {
                    line.account = '5541';
                    line.name = 'Banques (soldes créditeurs)';
                }
                bilan.passif.tresorerie.lines.push(line); bilan.passif.tresorerie.total += line.solde;
            }
        }
    }

    // --- LOGIQUE D'INVENTAIRE / STOCK ---
    // Calcul automatique du Stock Final = Stock Initial + Entrées - Sorties
    // Stock initial = solde des comptes 31xx (avant inventaire de clôture)
    // Entrées = Achats (611x, 612x)
    // Sorties = (Approximation via Ventes 711x ou coût des ventes estimé)
    // Dans beaucoup de cas, le logiciel calcule directement le stock final à l'aide des achats et ventes de l'exercice pour générer la "Variation de stock".
    let stockInitial = 0;
    let achats = 0;
    let ventes = 0;

    for (const acc of Array.from(aggregated.values())) {
        if (acc.account.startsWith('311')) stockInitial += acc.debit - acc.credit;
        if (acc.account.startsWith('611') || acc.account.startsWith('612')) achats += acc.debit - acc.credit;
        if (acc.account.startsWith('711') || acc.account.startsWith('712')) ventes += acc.credit - acc.debit;
    }

    // C'est une approximation comptable si le coût d'achat des marchandises vendues n'est pas connu au réel.
    // Stock Final = Stock Initial + Achats - Coût d'achat des marchandises vendues (Sorties)
    // Pour simplifier et répondre à la formule de l'utilisateur "Entrées - Sorties" (en valeurs)
    // On estime la sortie par les ventes (bien que la vente inclut la marge, c'est la seule donnée "Sortie" directe sans compta analytique).
    // Une meilleure approche est d'estimer un coût moyen ou de laisser l'utilisateur ajuster, mais on applique strictement la formule :
    // Sorties = Ventes (valeur de sortie approximative). 
    // Attention: Ventes(Prix de vente) > Sorties(Cout d'achat). On applique un taux de marge standard ou la valeur brute.
    // Pour éviter un stock négatif, on le borne à 0.
    const sorties = ventes; // Approximation. Normalement: Sorties au coût d'achat.
    let stockFinal = stockInitial + achats - sorties;
    if (stockFinal < 0) stockFinal = 0; // Le stock ne peut être négatif

    // Mettre à jour la ligne de Bilan concernant les stocks de marchandises (3111)
    const stockLineIndex = bilan.actif.circulant.lines.findIndex(l => l.account.startsWith('311'));
    if (stockLineIndex !== -1) {
        // Remplacer la valeur
        bilan.actif.circulant.total -= bilan.actif.circulant.lines[stockLineIndex].solde;
        bilan.actif.circulant.lines[stockLineIndex].solde = stockFinal;
        bilan.actif.circulant.total += stockFinal;
    } else if (stockFinal > 0) {
        // Ajouter la ligne si elle n'existe pas et qu'il y a du stock
        bilan.actif.circulant.lines.push({ account: '3111', name: 'Marchandises (Stock Final calculé)', solde: stockFinal });
        bilan.actif.circulant.total += stockFinal;
    }
    // --- FIN LOGIQUE D'INVENTAIRE ---

    // Injection du résultat net CPC dans le Passif Permanent
    if (resultatNet !== undefined && resultatNet !== 0) {
        const resultLine = {
            account: resultatNet >= 0 ? '1191' : '1199',
            name: resultatNet >= 0 ? 'Résultat net de l\'exercice (bénéfice)' : 'Résultat net de l\'exercice (perte)',
            solde: Math.abs(resultatNet)
        };
        if (resultatNet >= 0) {
            // Bénéfice → augmente le Passif
            bilan.passif.permanent.lines.push(resultLine);
            bilan.passif.permanent.total += resultLine.solde;
        } else {
            // Perte → diminue le Passif (ou augmente l'Actif en négatif)
            bilan.passif.permanent.lines.push(resultLine);
            bilan.passif.permanent.total -= resultLine.solde;
        }
    }

    // Sort lines within each section by account number
    const sortLines = (lines: BilanLine[]) => lines.sort((a, b) => a.account.localeCompare(b.account));
    bilan.actif.immobilise.lines = sortLines(bilan.actif.immobilise.lines);
    bilan.actif.circulant.lines = sortLines(bilan.actif.circulant.lines);
    bilan.actif.tresorerie.lines = sortLines(bilan.actif.tresorerie.lines);
    bilan.passif.permanent.lines = sortLines(bilan.passif.permanent.lines);
    bilan.passif.circulant.lines = sortLines(bilan.passif.circulant.lines);
    bilan.passif.tresorerie.lines = sortLines(bilan.passif.tresorerie.lines);

    bilan.actif.total = bilan.actif.immobilise.total + bilan.actif.circulant.total + bilan.actif.tresorerie.total;
    bilan.passif.total = bilan.passif.permanent.total + bilan.passif.circulant.total + bilan.passif.tresorerie.total;

    return bilan;
}

export function buildCPC(accounts: { account: string; name: string; debit: number; credit: number }[]): CPCModel {
    const cpc: CPCModel = {
        exploitation: { charges: [], produits: [], totalCharges: 0, totalProduits: 0, resultat: 0 },
        financier: { charges: [], produits: [], totalCharges: 0, totalProduits: 0, resultat: 0 },
        courant: 0,
        nonCourant: { charges: [], produits: [], totalCharges: 0, totalProduits: 0, resultat: 0 },
        impot: { charges: [], totalCharges: 0 },
        net: 0
    };

    for (const acc of accounts) {
        const rub = getAccountRubrique(acc.account);
        const solde = acc.debit - acc.credit;
        if (solde === 0) continue;
        const line = { account: acc.account, name: acc.name, solde: Math.abs(solde) };

        // Charges (Débit)
        if (solde > 0) {
            if (rub === 61) { cpc.exploitation.charges.push(line); cpc.exploitation.totalCharges += line.solde; }
            else if (rub === 63) { cpc.financier.charges.push(line); cpc.financier.totalCharges += line.solde; }
            else if (rub === 65) { cpc.nonCourant.charges.push(line); cpc.nonCourant.totalCharges += line.solde; }
            else if (rub === 67) { cpc.impot.charges.push(line); cpc.impot.totalCharges += line.solde; }
        }
        // Produits (Crédit)
        else {
            if (rub === 71) { cpc.exploitation.produits.push(line); cpc.exploitation.totalProduits += line.solde; }
            else if (rub === 73) { cpc.financier.produits.push(line); cpc.financier.totalProduits += line.solde; }
            else if (rub === 75) { cpc.nonCourant.produits.push(line); cpc.nonCourant.totalProduits += line.solde; }
        }
    }

    cpc.exploitation.resultat = cpc.exploitation.totalProduits - cpc.exploitation.totalCharges;
    cpc.financier.resultat = cpc.financier.totalProduits - cpc.financier.totalCharges;
    cpc.courant = cpc.exploitation.resultat + cpc.financier.resultat;

    cpc.nonCourant.resultat = cpc.nonCourant.totalProduits - cpc.nonCourant.totalCharges;

    // --- LOGIQUE VARIATION DE STOCK EN CPC ---
    // Variation de stock Marchandises (6114) = Stock Initial - Stock Final
    // Si Variation > 0 (Stock diminue) = Charge (Déstockage)
    // Si Variation < 0 (Stock augmente) = Vient en déduction des charges (ou produit) (Stockage)
    let stockInitial = 0;
    let achats = 0;
    let ventes = 0;
    for (const acc of accounts) {
        if (acc.account.startsWith('311')) stockInitial += acc.debit - acc.credit;
        if (acc.account.startsWith('611') || acc.account.startsWith('612')) achats += acc.debit - acc.credit;
        if (acc.account.startsWith('711') || acc.account.startsWith('712')) ventes += acc.credit - acc.debit;
    }

    let stockFinal = stockInitial + achats - ventes;
    if (stockFinal < 0) stockFinal = 0;

    const variationStock = stockInitial - stockFinal; // Marchandises

    if (variationStock !== 0) {
        if (variationStock > 0) {
            // Charge (Déstockage)
            cpc.exploitation.charges.push({ account: '6114', name: 'Variation de stocks de marchandises (Déstockage)', solde: variationStock });
            cpc.exploitation.totalCharges += variationStock;
        } else {
            // Déduction de charge (Stockage) => solde négatif en charges équivaut à un crédit (les charges baissent)
            cpc.exploitation.charges.push({ account: '6114', name: 'Variation de stocks de marchandises (Stockage)', solde: Math.abs(variationStock) });
            cpc.exploitation.totalCharges -= Math.abs(variationStock); // will subtract
        }
        // Recalculer le résultat d'exploitation
        cpc.exploitation.resultat = cpc.exploitation.totalProduits - cpc.exploitation.totalCharges;
        cpc.courant = cpc.exploitation.resultat + cpc.financier.resultat;
    }
    // --- FIN VARIATION DE STOCK ---

    // Total
    cpc.net = cpc.courant + cpc.nonCourant.resultat - cpc.impot.totalCharges;

    return cpc;
}

// ─── Comptes Collectifs ──────────────────────────────────────
export const COMPTES_COLLECTIFS: Record<string, string> = {
    '4411': 'Fournisseurs',
    '3421': 'Clients',
    '4441': 'Organismes sociaux',
    '4452': 'État — Impôts et taxes',
};

export function isCompteCollectif(account: string): boolean {
    return Object.keys(COMPTES_COLLECTIFS).some(cc => account.startsWith(cc) && account.length > cc.length);
}

export function getCompteCollectifParent(account: string): string | null {
    for (const cc of Object.keys(COMPTES_COLLECTIFS)) {
        if (account.startsWith(cc) && account.length > cc.length) return cc;
    }
    return null;
}

// ─── Enriched PCM Account Metadata ──────────────────────────
export const PCM_META: Record<string, AccountMeta> = {
    '1111': { name: 'Capital social', type: 'detail', nature: 'credit', lettrable: false },
    '1481': { name: 'Emprunts', type: 'detail', nature: 'credit', lettrable: false },
    '2311': { name: 'Terrains', type: 'detail', nature: 'debit', lettrable: false },
    '2321': { name: 'Bâtiments', type: 'detail', nature: 'debit', lettrable: false },
    '2340': { name: 'Matériel de transport', type: 'detail', nature: 'debit', lettrable: false },
    '2355': { name: 'Matériel informatique', type: 'detail', nature: 'debit', lettrable: false },
    '3111': { name: 'Marchandises', type: 'detail', nature: 'debit', lettrable: false },
    '3421': { name: 'Clients', type: 'total', nature: 'debit', lettrable: true },
    '4411': { name: 'Fournisseurs', type: 'total', nature: 'credit', lettrable: true },
    '4452': { name: 'État — Impôts et taxes', type: 'detail', nature: 'credit', lettrable: false },
    '4455': { name: 'État, TVA facturée', type: 'detail', nature: 'credit', lettrable: false },
    '34552': { name: 'TVA récupérable sur charges', type: 'detail', nature: 'debit', lettrable: false },
    '5141': { name: 'Banque', type: 'detail', nature: 'debit', lettrable: false },
    '5161': { name: 'Caisse', type: 'detail', nature: 'debit', lettrable: false },
    '6111': { name: 'Achats de marchandises', type: 'detail', nature: 'debit', lettrable: false, code_taxe: 'D20' },
    '6121': { name: 'Achats de matières premières', type: 'detail', nature: 'debit', lettrable: false, code_taxe: 'D20' },
    '6122': { name: 'Achats de mat. et fourn. consommables', type: 'detail', nature: 'debit', lettrable: false, code_taxe: 'D20' },
    '6125': { name: 'Achats non stockés', type: 'detail', nature: 'debit', lettrable: false, code_taxe: 'D20' },
    '6131': { name: 'Locations et charges locatives', type: 'detail', nature: 'debit', lettrable: false, code_taxe: 'D20' },
    '6134': { name: 'Primes d\'assurance', type: 'detail', nature: 'debit', lettrable: false },
    '6141': { name: 'Études, recherches et documentation', type: 'detail', nature: 'debit', lettrable: false, code_taxe: 'D20' },
    '6142': { name: 'Transports', type: 'detail', nature: 'debit', lettrable: false, code_taxe: 'D14' },
    '6144': { name: 'Publicité et relations publiques', type: 'detail', nature: 'debit', lettrable: false, code_taxe: 'D20' },
    '6145': { name: 'Frais postaux et télécom', type: 'detail', nature: 'debit', lettrable: false, code_taxe: 'D20' },
    '6147': { name: 'Services bancaires', type: 'detail', nature: 'debit', lettrable: false },
    '6161': { name: 'Impôts et taxes directs', type: 'detail', nature: 'debit', lettrable: false },
    '6167': { name: 'Impôts et taxes indirects', type: 'detail', nature: 'debit', lettrable: false },
    '6171': { name: 'Rémunérations du personnel', type: 'detail', nature: 'debit', lettrable: false },
    '6174': { name: 'Charges sociales', type: 'detail', nature: 'debit', lettrable: false },
    '7111': { name: 'Ventes de marchandises', type: 'detail', nature: 'credit', lettrable: false, code_taxe: 'C20' },
    '7124': { name: 'Ventes de services', type: 'detail', nature: 'credit', lettrable: false, code_taxe: 'C20' },
    '7127': { name: 'Ventes et produits accessoires', type: 'detail', nature: 'credit', lettrable: false, code_taxe: 'C20' },
};

// ─── SIG (Soldes Intermédiaires de Gestion) ──────────────────
export function buildSIG(cpc: CPCModel): SIGModel {
    // Ventes de marchandises = total des comptes 711x
    const ventesMarch = cpc.exploitation.produits
        .filter(p => p.account.startsWith('711'))
        .reduce((s, p) => s + p.solde, 0);
    // Achats revendus de marchandises = total des comptes 611x
    const achatsMarch = cpc.exploitation.charges
        .filter(c => c.account.startsWith('611'))
        .reduce((s, c) => s + c.solde, 0);

    const margeBrute = ventesMarch - achatsMarch;

    // Production de l'exercice = produits d'exploitation hors ventes march.
    const production = cpc.exploitation.produits
        .filter(p => !p.account.startsWith('711'))
        .reduce((s, p) => s + p.solde, 0);
    // Consommation de l'exercice = charges d'exploitation hors achats march. et personnel et impôts
    const consommation = cpc.exploitation.charges
        .filter(c => !c.account.startsWith('611') && !c.account.startsWith('617') && !c.account.startsWith('616'))
        .reduce((s, c) => s + c.solde, 0);

    const valeurAjoutee = margeBrute + production - consommation;

    // Charges de personnel (617x)
    const chargesPersonnel = cpc.exploitation.charges
        .filter(c => c.account.startsWith('617'))
        .reduce((s, c) => s + c.solde, 0);
    // Impôts et taxes (616x)
    const impotsExpl = cpc.exploitation.charges
        .filter(c => c.account.startsWith('616'))
        .reduce((s, c) => s + c.solde, 0);

    const ebe = valeurAjoutee - chargesPersonnel - impotsExpl;

    const resultatExploitation = cpc.exploitation.resultat;
    const resultatFinancier = cpc.financier.resultat;
    const resultatCourant = cpc.courant;
    const resultatNonCourant = cpc.nonCourant.resultat;
    const resultatAvantImpot = resultatCourant + resultatNonCourant;
    const resultatNet = cpc.net;

    return {
        margeBrute,
        valeurAjoutee,
        ebe,
        resultatExploitation,
        resultatFinancier,
        resultatCourant,
        resultatNonCourant,
        resultatAvantImpot,
        resultatNet,
    };
}

// ─── Auto-Échéance ───────────────────────────────────────────
export function calcEcheance(
    dateFacture: string,
    delaiJours: number = 30,
    condition: 'net' | 'fin_mois' | 'fin_mois_le' = 'net',
    jourTombee?: number
): string {
    const d = new Date(dateFacture);
    if (isNaN(d.getTime())) return dateFacture;

    if (condition === 'net') {
        // Simple: date + délai
        d.setDate(d.getDate() + delaiJours);
    } else if (condition === 'fin_mois') {
        // Date + délai → fin du mois résultant
        d.setDate(d.getDate() + delaiJours);
        d.setMonth(d.getMonth() + 1, 0); // last day of month
    } else if (condition === 'fin_mois_le') {
        // Date + délai → fin du mois → le X du mois suivant
        d.setDate(d.getDate() + delaiJours);
        d.setMonth(d.getMonth() + 1, 0); // fin du mois
        if (jourTombee && jourTombee > 0) {
            d.setMonth(d.getMonth() + 1, 1); // next month
            d.setDate(Math.min(jourTombee, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
        }
    }

    return d.toISOString().split('T')[0];
}

// ─── Lettrage Automatique ────────────────────────────────────
export type LettrageMode = 'montant' | 'piece' | 'facture';

/**
 * Regroupe les écritures qui se rapprochent par critère, 
 * retourne les groupes { lettre, ids[] } à lettrer.
 */
export function autoLettrage(
    entries: JournalEntry[],
    mode: LettrageMode,
    existingLetters: string[] = []
): { lettre: string; ids: string[] }[] {
    const results: { lettre: string; ids: string[] }[] = [];

    // Start letters from the next available uppercase letter
    let letterIndex = 0;
    const usedLetters = new Set(existingLetters.map(l => l.toUpperCase()));
    function nextLetter(): string {
        const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        while (letterIndex < 676) { // AA, AB, ...
            let l: string;
            if (letterIndex < 26) {
                l = alpha[letterIndex];
            } else {
                l = alpha[Math.floor(letterIndex / 26) - 1] + alpha[letterIndex % 26];
            }
            letterIndex++;
            if (!usedLetters.has(l)) {
                usedLetters.add(l);
                return l;
            }
        }
        return 'ZZ';
    }

    // Only consider non-lettered entries
    const unlettered = entries.filter(e => !e.lettre_code);

    if (mode === 'montant') {
        // Group by account, then find debit/credit pairs that balance
        const byAccount = new Map<string, JournalEntry[]>();
        for (const e of unlettered) {
            const acc = e.account;
            if (!byAccount.has(acc)) byAccount.set(acc, []);
            byAccount.get(acc)!.push(e);
        }

        for (const [, acEntries] of byAccount) {
            const debits = acEntries.filter(e => e.debit > 0);
            const credits = acEntries.filter(e => e.credit > 0);
            const usedD = new Set<string>();
            const usedC = new Set<string>();

            for (const d of debits) {
                if (usedD.has(d.id)) continue;
                for (const c of credits) {
                    if (usedC.has(c.id)) continue;
                    if (Math.abs(d.debit - c.credit) < 0.01) {
                        results.push({ lettre: nextLetter(), ids: [d.id, c.id] });
                        usedD.add(d.id);
                        usedC.add(c.id);
                        break;
                    }
                }
            }
        }
    } else if (mode === 'piece') {
        // Group by piece_num, lettrage if balanced
        const byPiece = new Map<string, JournalEntry[]>();
        for (const e of unlettered) {
            const key = e.piece_num || '';
            if (!key) continue;
            if (!byPiece.has(key)) byPiece.set(key, []);
            byPiece.get(key)!.push(e);
        }

        for (const [, pieceEntries] of byPiece) {
            const totalDebit = pieceEntries.reduce((s, e) => s + e.debit, 0);
            const totalCredit = pieceEntries.reduce((s, e) => s + e.credit, 0);
            if (Math.abs(totalDebit - totalCredit) < 0.01 && pieceEntries.length >= 2) {
                results.push({ lettre: nextLetter(), ids: pieceEntries.map(e => e.id) });
            }
        }
    } else if (mode === 'facture') {
        // Group by ref (invoice reference), lettrage if balanced
        const byRef = new Map<string, JournalEntry[]>();
        for (const e of unlettered) {
            const key = e.ref || '';
            if (!key || key === 'N/A') continue;
            if (!byRef.has(key)) byRef.set(key, []);
            byRef.get(key)!.push(e);
        }

        for (const [, refEntries] of byRef) {
            const totalDebit = refEntries.reduce((s, e) => s + e.debit, 0);
            const totalCredit = refEntries.reduce((s, e) => s + e.credit, 0);
            if (Math.abs(totalDebit - totalCredit) < 0.01 && refEntries.length >= 2) {
                results.push({ lettre: nextLetter(), ids: refEntries.map(e => e.id) });
            }
        }
    }

    return results;
}

/**
 * Pré-lettrage: affecte une lettre minuscule pour des écritures 
 * dont les montants ne s'équilibrent pas (règlements partiels)
 */
export function preLettrage(
    selectedIds: string[],
    entries: JournalEntry[],
    existingLetters: string[] = []
): string {
    const alpha = 'abcdefghijklmnopqrstuvwxyz';
    const usedLetters = new Set(existingLetters.map(l => l.toLowerCase()));
    for (let i = 0; i < 676; i++) {
        let l: string;
        if (i < 26) l = alpha[i];
        else l = alpha[Math.floor(i / 26) - 1] + alpha[i % 26];
        if (!usedLetters.has(l)) return l;
    }
    return 'zz';
}

// ─── Default Journal Configs ─────────────────────────────────
export const DEFAULT_JOURNAL_CONFIGS: Omit<JournalConfig, 'id' | 'user_id'>[] = [
    { code: 'HA', intitule: 'Journal des Achats', type_journal: 'achat', mode_contrepartie: 'ligne_a_ligne' },
    { code: 'VT', intitule: 'Journal des Ventes', type_journal: 'vente', mode_contrepartie: 'ligne_a_ligne' },
    { code: 'BQ', intitule: 'Journal de Banque', type_journal: 'tresorerie', compte_contrepartie: '5141', mode_contrepartie: 'ligne_a_ligne' },
    { code: 'CA', intitule: 'Journal de Caisse', type_journal: 'tresorerie', compte_contrepartie: '5161', mode_contrepartie: 'ligne_a_ligne' },
    { code: 'OD', intitule: 'Journal des OD', type_journal: 'od', mode_contrepartie: 'ligne_a_ligne' },
];

