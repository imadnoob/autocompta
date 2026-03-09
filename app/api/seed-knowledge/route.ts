import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(geminiApiKey);
const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

// ══════════════════════════════════════════════════════════════
// BASE DE CONNAISSANCE INFAILLIBLE — ÉCRITURES COMPTABLES
// Plan Comptable Marocain (PCM) — Référence Textbook
// ══════════════════════════════════════════════════════════════

const TEXTBOOK_ENTRIES = [
    // ─── ACHATS DE MARCHANDISES ──────────────────────────────
    { situation: "Achat de marchandises à crédit", journal: "HA", main: "6111", tier: "4411", tva: "34552" },
    { situation: "Achat de marchandises au comptant par chèque", journal: "HA", main: "6111", tier: "5141", tva: "34552" },
    { situation: "Achat de marchandises au comptant en espèces", journal: "HA", main: "6111", tier: "5161", tva: "34552" },
    { situation: "Achat de marchandises avec un avoir reçu du fournisseur", journal: "HA", main: "6119", tier: "4411", tva: "34552" },

    // ─── ACHATS DE MATIÈRES PREMIÈRES ────────────────────────
    { situation: "Achat de matières premières à crédit", journal: "HA", main: "6121", tier: "4411", tva: "34552" },
    { situation: "Achat de matières et fournitures consommables à crédit", journal: "HA", main: "6122", tier: "4411", tva: "34552" },
    { situation: "Achat d'emballages", journal: "HA", main: "6123", tier: "4411", tva: "34552" },

    // ─── AUTRES CHARGES EXTERNES ─────────────────────────────
    { situation: "Location et charges locatives (loyer bureau, local, entrepôt)", journal: "HA", main: "6131", tier: "4411", tva: "34552" },
    { situation: "Redevances de crédit-bail (leasing)", journal: "HA", main: "6132", tier: "4411", tva: "34552" },
    { situation: "Entretien et réparations (maintenance, dépannage)", journal: "HA", main: "6133", tier: "4411", tva: "34552" },
    { situation: "Primes d'assurances (assurance véhicule, local, RC)", journal: "HA", main: "6134", tier: "4411", tva: null },
    { situation: "Rémunérations du personnel extérieur (intérimaires, sous-traitance)", journal: "HA", main: "6135", tier: "4411", tva: "34552" },
    { situation: "Rémunérations d'intermédiaires et honoraires (avocat, comptable, notaire)", journal: "HA", main: "6136", tier: "4411", tva: "34552" },
    { situation: "Redevances pour brevets, licences et logiciels", journal: "HA", main: "6137", tier: "4411", tva: "34552" },

    // ─── TRANSPORTS & DÉPLACEMENTS ───────────────────────────
    { situation: "Voyages et déplacements professionnels (billet avion, train, hôtel)", journal: "HA", main: "6141", tier: "4411", tva: "34552" },
    { situation: "Frais de transport sur achats (livraison fournisseur)", journal: "HA", main: "6142", tier: "4411", tva: "34552" },
    { situation: "Frais de transport sur ventes (expédition client)", journal: "HA", main: "6143", tier: "4411", tva: "34552" },
    { situation: "Frais de port et envois postaux", journal: "HA", main: "6145", tier: "4411", tva: "34552" },

    // ─── SERVICES BANCAIRES & SIMILAIRES ─────────────────────
    { situation: "Frais postaux et frais de télécommunications (téléphone, internet, Maroc Telecom, Inwi, Orange)", journal: "HA", main: "6145", tier: "4411", tva: "34552" },
    { situation: "Services bancaires (frais de tenue de compte, commissions bancaires)", journal: "HA", main: "6147", tier: "4411", tva: null },
    { situation: "Cotisations et dons (adhésion chambre de commerce, syndicat)", journal: "HA", main: "6148", tier: "4411", tva: null },

    // ─── IMPÔTS ET TAXES ─────────────────────────────────────
    { situation: "Taxe professionnelle (ex patente)", journal: "OD", main: "6161", tier: "4457", tva: null },
    { situation: "Taxe de services communaux (ex taxe d'édilité)", journal: "OD", main: "6162", tier: "4457", tva: null },
    { situation: "Droits d'enregistrement et de timbre", journal: "OD", main: "6165", tier: "4457", tva: null },

    // ─── CHARGES DE PERSONNEL ────────────────────────────────
    { situation: "Salaires et traitements bruts du personnel", journal: "OD", main: "6171", tier: "4432", tva: null },
    { situation: "Charges sociales patronales (CNSS, AMO, CIMR)", journal: "OD", main: "6174", tier: "4441", tva: null },
    { situation: "Rémunération de l'exploitant individuel", journal: "OD", main: "6175", tier: "1174", tva: null },

    // ─── AUTRES CHARGES D'EXPLOITATION ───────────────────────
    { situation: "Jetons de présence (rémunération administrateurs)", journal: "OD", main: "6181", tier: "4463", tva: null },
    { situation: "Pertes sur créances irrécouvrables (client défaillant)", journal: "OD", main: "6182", tier: "3421", tva: null },

    // ─── CHARGES FINANCIÈRES ─────────────────────────────────
    { situation: "Charges d'intérêts sur emprunts bancaires", journal: "OD", main: "6311", tier: "4491", tva: null },
    { situation: "Intérêts des comptes courants et dépôts", journal: "OD", main: "6312", tier: "4463", tva: null },
    { situation: "Pertes de change (écart négatif sur devises)", journal: "OD", main: "6331", tier: "4488", tva: null },
    { situation: "Escomptes accordés aux clients", journal: "OD", main: "6386", tier: "3421", tva: null },

    // ─── CHARGES NON COURANTES ───────────────────────────────
    { situation: "Pénalités et amendes fiscales, douanières ou pénales", journal: "OD", main: "6581", tier: "4457", tva: null },
    { situation: "Dons et libéralités (subventions accordées)", journal: "OD", main: "6582", tier: "4488", tva: null },
    { situation: "Rappels d'impôts (régularisation IS, IR)", journal: "OD", main: "6585", tier: "4457", tva: null },

    // ─── DOTATIONS AUX AMORTISSEMENTS ────────────────────────
    { situation: "Dotation aux amortissements des immobilisations incorporelles", journal: "OD", main: "6191", tier: null, tva: null },
    { situation: "Dotation aux amortissements des immobilisations corporelles (matériel, véhicules, mobilier)", journal: "OD", main: "6193", tier: null, tva: null },
    { situation: "Dotation aux provisions pour dépréciation des créances clients", journal: "OD", main: "6196", tier: null, tva: null },

    // ═══════════════════════════════════════════════════════════
    // VENTES DE PRODUITS ET SERVICES
    // ═══════════════════════════════════════════════════════════
    { situation: "Vente de marchandises à crédit", journal: "VT", main: "7111", tier: "3421", tva: "4455" },
    { situation: "Vente de marchandises au comptant par chèque", journal: "VT", main: "7111", tier: "5141", tva: "4455" },
    { situation: "Vente de marchandises au comptant en espèces", journal: "VT", main: "7111", tier: "5161", tva: "4455" },
    { situation: "Vente de produits finis", journal: "VT", main: "7121", tier: "3421", tva: "4455" },
    { situation: "Vente de services (prestations de services, consulting)", journal: "VT", main: "7124", tier: "3421", tva: "4455" },
    { situation: "Avoir accordé à un client (retour, remise)", journal: "VT", main: "7119", tier: "3421", tva: "4455" },

    // ─── PRODUITS FINANCIERS ─────────────────────────────────
    { situation: "Revenus des titres de participation (dividendes reçus)", journal: "OD", main: "7311", tier: "5141", tva: null },
    { situation: "Gains de change (écart positif sur devises)", journal: "OD", main: "7331", tier: "5141", tva: null },
    { situation: "Intérêts et produits assimilés (intérêts reçus sur placements)", journal: "OD", main: "7381", tier: "5141", tva: null },
    { situation: "Escomptes obtenus des fournisseurs", journal: "OD", main: "7386", tier: "4411", tva: null },

    // ─── PRODUITS NON COURANTS ────────────────────────────────
    { situation: "Produits de cession d'immobilisations (vente d'un véhicule, machine d'occasion)", journal: "OD", main: "7513", tier: "3421", tva: null },
    { situation: "Subventions d'exploitation reçues", journal: "OD", main: "7161", tier: "4451", tva: null },
    { situation: "Subventions d'investissement reçues", journal: "OD", main: "7561", tier: "1311", tva: null },

    // ═══════════════════════════════════════════════════════════
    // IMMOBILISATIONS (INVESTISSEMENTS)
    // ═══════════════════════════════════════════════════════════
    { situation: "Achat de fonds commercial (goodwill)", journal: "HA", main: "2230", tier: "4411", tva: null },
    { situation: "Achat de brevet, licence ou logiciel", journal: "HA", main: "2220", tier: "4411", tva: "34551" },
    { situation: "Achat de terrain", journal: "HA", main: "2310", tier: "4411", tva: null },
    { situation: "Achat ou construction de bâtiment (immeuble)", journal: "HA", main: "2321", tier: "4411", tva: "34551" },
    { situation: "Achat de matériel et outillage", journal: "HA", main: "2332", tier: "4411", tva: "34551" },
    { situation: "Achat de matériel de transport (véhicule utilitaire, camion)", journal: "HA", main: "2340", tier: "4411", tva: "34551" },
    { situation: "Achat de mobilier de bureau et matériel de bureau", journal: "HA", main: "2351", tier: "4411", tva: "34551" },
    { situation: "Achat de matériel informatique (ordinateur, imprimante, serveur)", journal: "HA", main: "2355", tier: "4411", tva: "34551" },
    { situation: "Achat d'agencements et installations (travaux d'aménagement)", journal: "HA", main: "2327", tier: "4411", tva: "34551" },

    // ═══════════════════════════════════════════════════════════
    // TRÉSORERIE (BANQUE / CAISSE)
    // ═══════════════════════════════════════════════════════════
    { situation: "Règlement fournisseur par chèque bancaire", journal: "BQ", main: "4411", tier: "5141", tva: null },
    { situation: "Règlement fournisseur par virement bancaire", journal: "BQ", main: "4411", tier: "5141", tva: null },
    { situation: "Règlement fournisseur en espèces", journal: "CA", main: "4411", tier: "5161", tva: null },
    { situation: "Encaissement client par chèque", journal: "BQ", main: "5141", tier: "3421", tva: null },
    { situation: "Encaissement client par virement", journal: "BQ", main: "5141", tier: "3421", tva: null },
    { situation: "Encaissement client en espèces", journal: "CA", main: "5161", tier: "3421", tva: null },
    { situation: "Retrait de la banque vers la caisse", journal: "BQ", main: "5161", tier: "5141", tva: null },
    { situation: "Dépôt d'espèces de la caisse vers la banque", journal: "CA", main: "5141", tier: "5161", tva: null },
    { situation: "Versement d'apport en capital par l'associé", journal: "BQ", main: "5141", tier: "1111", tva: null },
    { situation: "Emprunt bancaire reçu (crédit long terme)", journal: "BQ", main: "5141", tier: "1481", tva: null },
    { situation: "Remboursement d'emprunt bancaire (principal)", journal: "BQ", main: "1481", tier: "5141", tva: null },

    // ═══════════════════════════════════════════════════════════
    // TVA — DÉCLARATION ET RÈGLEMENT
    // ═══════════════════════════════════════════════════════════
    { situation: "Déclaration TVA à payer (TVA collectée sur ventes - TVA déductible)", journal: "OD", main: "4455", tier: "4456", tva: null },
    { situation: "Règlement de la TVA due à l'État", journal: "BQ", main: "4456", tier: "5141", tva: null },
    { situation: "Crédit de TVA (TVA déductible > TVA collectée)", journal: "OD", main: "34551", tier: "4455", tva: null },

    // ═══════════════════════════════════════════════════════════
    // IS — IMPÔT SUR LES SOCIÉTÉS
    // ═══════════════════════════════════════════════════════════
    { situation: "Constatation de l'IS à payer", journal: "OD", main: "6701", tier: "4453", tva: null },
    { situation: "Paiement d'un acompte IS", journal: "BQ", main: "3453", tier: "5141", tva: null },
    { situation: "Paiement du reliquat IS", journal: "BQ", main: "4453", tier: "5141", tva: null },

    // ═══════════════════════════════════════════════════════════
    // EFFETS DE COMMERCE
    // ═══════════════════════════════════════════════════════════
    { situation: "Création d'un effet à payer (lettre de change acceptée fournisseur)", journal: "OD", main: "4411", tier: "4415", tva: null },
    { situation: "Paiement d'un effet à payer à l'échéance", journal: "BQ", main: "4415", tier: "5141", tva: null },
    { situation: "Réception d'un effet à recevoir (traite client)", journal: "OD", main: "3425", tier: "3421", tva: null },
    { situation: "Encaissement d'un effet à recevoir à l'échéance", journal: "BQ", main: "5141", tier: "3425", tva: null },
    { situation: "Escompte d'un effet à recevoir (remise à l'escompte bancaire)", journal: "BQ", main: "5141", tier: "5520", tva: null },

    // ═══════════════════════════════════════════════════════════
    // FOURNITURES CONSOMMABLES COURANTES
    // ═══════════════════════════════════════════════════════════
    { situation: "Achat de fournitures de bureau (papier, stylos, toner)", journal: "HA", main: "61225", tier: "4411", tva: "34552" },
    { situation: "Achat de fournitures non stockables (eau, électricité ONEE/LYDEC)", journal: "HA", main: "61251", tier: "4411", tva: "34552" },
    { situation: "Achat de petit outillage et petit équipement", journal: "HA", main: "61252", tier: "4411", tva: "34552" },
    { situation: "Achat de carburant (essence, gasoil)", journal: "HA", main: "61241", tier: "4411", tva: "34552" },
    { situation: "Achat de fournitures d'entretien (produits de nettoyage)", journal: "HA", main: "61253", tier: "4411", tva: "34552" },

    // ─── PUBLICITÉ ET COMMUNICATION ──────────────────────────
    { situation: "Frais de publicité et de communication (affichage, flyers, pub en ligne)", journal: "HA", main: "6144", tier: "4411", tva: "34552" },
    { situation: "Frais de réception et d'hospitalité (repas d'affaires)", journal: "HA", main: "6143", tier: "4411", tva: "34552" },

    // ═══════════════════════════════════════════════════════════
    // ★★★ SECTEUR HÔTELIER — TVA 10% ★★★
    // ═══════════════════════════════════════════════════════════
    { situation: "Vente de nuitées d'hôtel (hébergement, chambre d'hôtel) TVA 10%", journal: "VT", main: "7111", tier: "3421", tva: "4455" },
    { situation: "Vente de prestations de restauration dans un hôtel (restaurant hôtelier) TVA 10%", journal: "VT", main: "7115", tier: "3421", tva: "4455" },
    { situation: "Vente de services hôteliers (spa, piscine, salle de conférence) TVA 10%", journal: "VT", main: "7124", tier: "3421", tva: "4455" },
    { situation: "Vente de petit-déjeuner hôtel TVA 10%", journal: "VT", main: "7115", tier: "3421", tva: "4455" },
    { situation: "Achat de linge de maison pour hôtel (draps, serviettes, oreillers)", journal: "HA", main: "6122", tier: "4411", tva: "34552" },
    { situation: "Achat de produits d'accueil pour hôtel (savon, shampoing, gel douche)", journal: "HA", main: "6122", tier: "4411", tva: "34552" },
    { situation: "Achat de produits alimentaires pour restaurant d'hôtel (denrées périssables)", journal: "HA", main: "6111", tier: "4411", tva: "34552" },
    { situation: "Achat de boissons pour restaurant d'hôtel ou bar", journal: "HA", main: "6111", tier: "4411", tva: "34552" },
    { situation: "Charges de blanchisserie et pressing (lavage linge hôtel)", journal: "HA", main: "6136", tier: "4411", tva: "34552" },
    { situation: "Frais de maintenance et entretien hôtelier (climatisation, ascenseur, plomberie)", journal: "HA", main: "6133", tier: "4411", tva: "34552" },
    { situation: "Commission versée à Booking.com, Expedia ou agence de voyage", journal: "HA", main: "6136", tier: "4411", tva: "34552" },
    { situation: "Taxe de séjour (taxe de promotion touristique)", journal: "OD", main: "6168", tier: "4457", tva: null },
    { situation: "Achat de mobilier d'hôtel (lits, tables, chaises de restaurant)", journal: "HA", main: "2351", tier: "4411", tva: "34551" },
    { situation: "Travaux d'aménagement et décoration de chambres d'hôtel", journal: "HA", main: "2327", tier: "4411", tva: "34551" },

    // ─── SALAIRES HÔTELIER ───────────────────────────────────
    { situation: "Salaires du personnel hôtelier (réceptionnistes, femmes de chambre, cuisiniers)", journal: "OD", main: "6171", tier: "4432", tva: null },

    // ═══════════════════════════════════════════════════════════
    // OPÉRATIONS DIVERSES UTILES
    // ═══════════════════════════════════════════════════════════
    { situation: "Mise au rebut d'une immobilisation (sortie d'actif pour matériel hors d'usage)", journal: "OD", main: "6513", tier: "2332", tva: null },
    { situation: "Cession d'immobilisation (vente voiture de société)", journal: "OD", main: "7513", tier: "3421", tva: null },
    { situation: "Provision pour risques et charges (litige en cours)", journal: "OD", main: "6195", tier: "1511", tva: null },
    { situation: "Reprise sur provisions devenues sans objet", journal: "OD", main: "7195", tier: "1511", tva: null },
    { situation: "Constatation d'une charge constatée d'avance (loyer payé d'avance)", journal: "OD", main: "3491", tier: "6131", tva: null },
    { situation: "Constatation d'un produit constaté d'avance (revenu perçu d'avance)", journal: "OD", main: "7111", tier: "4491", tva: null },
];

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        // Check if already seeded for this user
        const { count } = await supabaseAdmin
            .from('accounting_knowledge_base')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (count && count > 0) {
            return NextResponse.json({
                success: true,
                message: `Knowledge base already seeded with ${count} entries. Skipping.`,
                count
            });
        }

        let insertedCount = 0;
        const errors: string[] = [];

        // Process in batches of 5 to avoid rate limiting
        for (let i = 0; i < TEXTBOOK_ENTRIES.length; i += 5) {
            const batch = TEXTBOOK_ENTRIES.slice(i, i + 5);

            const rows = await Promise.all(batch.map(async (entry) => {
                try {
                    const embedResult = await embedModel.embedContent(entry.situation);
                    return {
                        user_id: userId,
                        situation_description: entry.situation,
                        expected_journal: entry.journal,
                        expected_main_account: entry.main,
                        expected_tier_account: entry.tier,
                        expected_tva_account: entry.tva,
                        embedding: embedResult.embedding.values.slice(0, 768)
                    };
                } catch (e: any) {
                    errors.push(`Failed to embed: ${entry.situation} — ${e.message}`);
                    return null;
                }
            }));

            const validRows = rows.filter(r => r !== null);
            if (validRows.length > 0) {
                const { error: insertError } = await supabaseAdmin
                    .from('accounting_knowledge_base')
                    .insert(validRows);

                if (insertError) {
                    errors.push(`Insert batch ${i}: ${insertError.message}`);
                } else {
                    insertedCount += validRows.length;
                }
            }

            // Small delay between batches to avoid rate limiting
            if (i + 5 < TEXTBOOK_ENTRIES.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return NextResponse.json({
            success: true,
            message: `Successfully seeded ${insertedCount} / ${TEXTBOOK_ENTRIES.length} textbook entries.`,
            inserted: insertedCount,
            total: TEXTBOOK_ENTRIES.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error('Seed knowledge error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
