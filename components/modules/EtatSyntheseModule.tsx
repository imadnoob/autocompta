'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Scale, BarChart3, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, CalendarDays, Plus, X, Save } from 'lucide-react';
import {
    JournalEntry, getAccountName, fmt, buildBilan, buildCPC,
} from './comptaHelpers';

type SyntheseTab = 'bilan' | 'cpc';

export default function EtatSyntheseModule({ toolbarContent }: { toolbarContent?: React.ReactNode }) {
    const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
    const [adjustments, setAdjustments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<SyntheseTab>('bilan');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    const fetchEntries = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const [entriesRes, adjustRes] = await Promise.all([
            supabase.from('journal_entries').select('*').eq('user_id', user.id).order('entry_date', { ascending: true }),
            supabase.from('bilan_adjustments').select('*').eq('user_id', user.id).order('year', { ascending: true }),
        ]);

        setAllEntries((entriesRes.data || []).map((e: any) => ({
            id: e.id, doc_id: e.doc_id, entry_date: e.entry_date, ref: e.ref || '',
            account: e.account, account_name: e.account_name, label: e.label,
            debit: Number(e.debit) || 0, credit: Number(e.credit) || 0,
            supplier: e.supplier || '', journal: e.journal,
            lettre_code: e.lettre_code, is_contrepassation: e.is_contrepassation || false,
            piece_num: e.piece_num,
        })));
        setAdjustments(adjustRes.data || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchEntries(); }, [fetchEntries]);

    // Derive available years from journal entries AND adjustments
    const availableYears = useMemo(() => {
        const years = new Set<number>([new Date().getFullYear()]);
        for (const e of allEntries) {
            if (e.entry_date) years.add(new Date(e.entry_date).getFullYear());
        }
        for (const a of adjustments) {
            if (a.year) years.add(a.year);
        }
        return Array.from(years).sort((a, b) => b - a);
    }, [allEntries, adjustments]);

    // Bilan: cumulative journal entries up to Dec 31 + adjustments for selected year and prior
    const bilanAccountsList = useMemo(() => {
        const endDate = new Date(selectedYear, 11, 31, 23, 59, 59);
        const filtered = allEntries.filter(e => new Date(e.entry_date) <= endDate);
        const map = new Map<string, { account: string; name: string; debit: number; credit: number }>();
        for (const e of filtered) {
            const existing = map.get(e.account) || { account: e.account, name: e.account_name, debit: 0, credit: 0 };
            existing.debit += e.debit;
            existing.credit += e.credit;
            map.set(e.account, existing);
        }
        // Merge adjustments (cumulative: all adjustments for year <= selectedYear)
        for (const adj of adjustments) {
            if (adj.year <= selectedYear) {
                const accountClass = parseInt(adj.account[0]);
                const isPassif = accountClass === 1 || accountClass === 4;
                const existing = map.get(adj.account) || { account: adj.account, name: adj.account_name, debit: 0, credit: 0 };
                if (isPassif) {
                    existing.credit += Number(adj.amount) || 0;
                } else {
                    existing.debit += Number(adj.amount) || 0;
                }
                map.set(adj.account, existing);
            }
        }
        return Array.from(map.values()).sort((a, b) => a.account.localeCompare(b.account));
    }, [allEntries, adjustments, selectedYear]);

    // CPC: only entries from the selected year
    const cpcAccountsList = useMemo(() => {
        const startDate = new Date(selectedYear, 0, 1);
        const endDate = new Date(selectedYear, 11, 31, 23, 59, 59);
        const filtered = allEntries.filter(e => {
            const d = new Date(e.entry_date);
            return d >= startDate && d <= endDate;
        });
        const map = new Map<string, { account: string; name: string; debit: number; credit: number }>();
        for (const e of filtered) {
            const existing = map.get(e.account) || { account: e.account, name: e.account_name, debit: 0, credit: 0 };
            existing.debit += e.debit;
            existing.credit += e.credit;
            map.set(e.account, existing);
        }
        return Array.from(map.values()).sort((a, b) => a.account.localeCompare(b.account));
    }, [allEntries, selectedYear]);

    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [adjustSaving, setAdjustSaving] = useState(false);
    const [adjustForm, setAdjustForm] = useState({ account: '1111', label: '', amount: '' });

    // Predefined structural accounts (PCM marocain complet)
    const STRUCTURAL_ACCOUNTS = [
        // ── Classe 1 : Financement permanent ──
        { code: '1111', name: 'Capital social' },
        { code: '1117', name: 'Capital personnel' },
        { code: '1140', name: 'Réserves légales' },
        { code: '1151', name: 'Réserves statutaires' },
        { code: '1152', name: 'Réserves facultatives' },
        { code: '1161', name: 'Report à nouveau (solde créditeur)' },
        { code: '1169', name: 'Report à nouveau (solde débiteur)' },
        { code: '1181', name: 'Résultats nets en instance d\'affectation' },
        { code: '1311', name: 'Subventions d\'investissement reçues' },
        { code: '1410', name: 'Emprunts obligataires' },
        { code: '1481', name: 'Emprunts auprès des établissements de crédit' },
        { code: '1482', name: 'Avances de l\'État' },
        { code: '1484', name: 'Billets de fonds' },
        { code: '1486', name: 'Fournisseurs d\'immobilisations' },
        { code: '1511', name: 'Provisions pour litiges' },
        { code: '1512', name: 'Provisions pour garanties données aux clients' },
        { code: '1555', name: 'Provisions pour charges à répartir' },
        // ── Classe 2 : Actif immobilisé ──
        { code: '2111', name: 'Frais de constitution' },
        { code: '2112', name: 'Frais préalables au démarrage' },
        { code: '2113', name: 'Frais d\'augmentation du capital' },
        { code: '2114', name: 'Frais sur opérations de fusions, scissions...' },
        { code: '2121', name: 'Frais de recherche' },
        { code: '2210', name: 'Brevets, marques, droits' },
        { code: '2220', name: 'Fonds commercial' },
        { code: '2230', name: 'Logiciels informatiques' },
        { code: '2311', name: 'Terrains nus' },
        { code: '2312', name: 'Terrains aménagés' },
        { code: '2313', name: 'Terrains bâtis' },
        { code: '2321', name: 'Bâtiments' },
        { code: '2325', name: 'Constructions sur terrains d\'autrui' },
        { code: '2327', name: 'Agencements et aménagements des constructions' },
        { code: '2331', name: 'Installations techniques' },
        { code: '2332', name: 'Matériel et outillage' },
        { code: '2340', name: 'Matériel de transport' },
        { code: '2351', name: 'Mobilier de bureau' },
        { code: '2352', name: 'Matériel de bureau' },
        { code: '2355', name: 'Matériel informatique' },
        { code: '2356', name: 'Agencements, installations et aménagements' },
        { code: '2380', name: 'Autres immobilisations corporelles' },
        { code: '2392', name: 'Immobilisations corporelles en cours' },
        { code: '2411', name: 'Prêts au personnel' },
        { code: '2486', name: 'Dépôts et cautionnements versés' },
        // ── Classe 3 : Actif circulant ──
        { code: '3111', name: 'Marchandises' },
        { code: '3121', name: 'Matières premières' },
        { code: '3421', name: 'Clients' },
        { code: '3424', name: 'Clients douteux ou litigieux' },
        { code: '3425', name: 'Clients - effets à recevoir' },
        { code: '34271', name: 'Clients - factures à établir' },
        { code: '3431', name: 'Avances et acomptes au personnel' },
        { code: '3451', name: 'Subventions à recevoir' },
        { code: '3455', name: 'État - TVA récupérable' },
        { code: '3458', name: 'État - Autres comptes débiteurs' },
        { code: '3461', name: 'Associés - comptes d\'apport' },
        { code: '3462', name: 'Associés - comptes courants débiteurs' },
        { code: '3481', name: 'Créances sur cessions d\'immobilisations' },
        { code: '3493', name: 'Charges constatées d\'avance' },
        // ── Classe 4 : Passif circulant ──
        { code: '4411', name: 'Fournisseurs' },
        { code: '4415', name: 'Fournisseurs - effets à payer' },
        { code: '44171', name: 'Fournisseurs - factures non parvenues' },
        { code: '4431', name: 'Avances reçues du personnel' },
        { code: '4441', name: 'CNSS' },
        { code: '4443', name: 'Caisses de retraite' },
        { code: '4447', name: 'Mutuelles' },
        { code: '4452', name: 'État - Impôts, taxes et assimilés' },
        { code: '4455', name: 'État - TVA facturée' },
        { code: '4456', name: 'État - TVA due' },
        { code: '4457', name: 'État - Impôts et taxes à payer' },
        { code: '4462', name: 'Associés - comptes courants créditeurs' },
        { code: '4465', name: 'Associés - dividendes à payer' },
        { code: '4481', name: 'Dettes sur acquisitions d\'immobilisations' },
        { code: '4493', name: 'Produits constatés d\'avance' },
        { code: '4497', name: 'Comptes de régularisation - Passif' },
        // ── Classe 5 : Trésorerie ──
        { code: '5141', name: 'Banques' },
        { code: '5143', name: 'Trésorerie Générale' },
        { code: '5146', name: 'Chèques et valeurs à encaisser' },
        { code: '5148', name: 'Autres comptes de trésorerie' },
        { code: '5161', name: 'Caisse centrale' },
        { code: '5165', name: 'Caisse - Régie d\'avances' },
        { code: '5520', name: 'Crédits de trésorerie' },
        { code: '5541', name: 'Banques (soldes créditeurs)' },
    ];

    const cpcData = useMemo(() => buildCPC(cpcAccountsList), [cpcAccountsList]);
    const bilanData = useMemo(() => buildBilan(bilanAccountsList, cpcData.net), [bilanAccountsList, cpcData.net]);

    const resultat = cpcData.net;

    const saveAdjustment = async () => {
        const amount = parseFloat(adjustForm.amount);
        if (!amount || amount <= 0) return;
        setAdjustSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const selectedAccount = STRUCTURAL_ACCOUNTS.find(a => a.code === adjustForm.account);
            const accountName = selectedAccount?.name || 'Ajustement';
            const label = adjustForm.label || accountName;

            const { error } = await supabase.from('bilan_adjustments').insert({
                user_id: user.id,
                year: selectedYear,
                account: adjustForm.account,
                account_name: accountName,
                label,
                amount,
            });

            if (error) throw error;
            setShowAdjustModal(false);
            setAdjustForm({ account: '1111', label: '', amount: '' });
            fetchEntries(); // Refresh
        } catch (err) {
            console.error('Error saving adjustment:', err);
        } finally {
            setAdjustSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl p-8 text-center">
                <div className="w-12 h-12 bg-neo-pink border border-slate-200 rounded-xl mx-auto mb-4 flex items-center justify-center animate-pulse">
                    <Scale className="w-6 h-6" />
                </div>
                <p className="font-semibold">Chargement…</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pt-4">
            {/* Header: Sub-tabs + Year selector */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    {([
                        { key: 'bilan' as SyntheseTab, label: 'Bilan', icon: Scale },
                        { key: 'cpc' as SyntheseTab, label: 'CPC', icon: BarChart3 },
                    ]).map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2 font-bold text-sm border border-slate-200 rounded-xl transition-all ${activeTab === tab.key
                                    ? 'bg-neo-pink text-slate-800 shadow-md -translate-x-0.5 -translate-y-0.5'
                                    : 'bg-white text-gray-600 hover:bg-neo-pink/20'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
                {/* Year Selector + Ajustements */}
                <div className="flex items-end gap-3">
                    {toolbarContent}
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1 shadow-md h-[42px]">
                        <CalendarDays className="w-4 h-4 text-gray-500" />
                        <button
                            onClick={() => {
                                const idx = availableYears.indexOf(selectedYear);
                                if (idx < availableYears.length - 1) setSelectedYear(availableYears[idx + 1]);
                            }}
                            className="w-7 h-7 border border-slate-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-teal-50 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-semibold font-black text-lg min-w-[50px] text-center">{selectedYear}</span>
                        <button
                            onClick={() => {
                                const idx = availableYears.indexOf(selectedYear);
                                if (idx > 0) setSelectedYear(availableYears[idx - 1]);
                            }}
                            className="w-7 h-7 border border-slate-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-teal-50 transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowAdjustModal(true)}
                        className="flex items-center gap-2 px-3 h-[42px] bg-green-300 border border-slate-200 rounded-xl font-bold text-sm shadow-md hover:-translate-y-0.5 hover:shadow-md-lg transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Ajustements
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl p-5">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Total Actif</p>
                    <p className="text-2xl font-semibold font-black">{fmt(bilanData.actif.total)} <span className="text-sm text-gray-400">MAD</span></p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl p-5">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Total Passif</p>
                    <p className="text-2xl font-semibold font-black">{fmt(bilanData.passif.total)} <span className="text-sm text-gray-400">MAD</span></p>
                </div>
                <div className={`border border-slate-200 rounded-xl shadow-md p-5 ${resultat >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Résultat Net</p>
                    <p className={`text-2xl font-semibold font-black ${resultat >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {fmt(Math.abs(resultat))} <span className="text-sm">{resultat >= 0 ? 'Bénéfice' : 'Perte'}</span>
                    </p>
                </div>
            </div>

            {/* ─── BILAN ──────────────────────────────────── */}
            {activeTab === 'bilan' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* ── ACTIF ── */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-slate-200 bg-indigo-50/10 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            <h3 className="font-bold text-sm uppercase tracking-wider">ACTIF</h3>
                        </div>
                        <table className="w-full text-sm flex-1">
                            <thead>
                                <tr className="bg-gray-50 border-b border-slate-200 font-semibold text-xs uppercase tracking-wider text-gray-500">
                                    <th className="text-left px-4 py-3 w-24">Compte</th>
                                    <th className="text-left px-4 py-3">Libellé</th>
                                    <th className="text-right px-4 py-3 w-36">Montant</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Actif immobilisé */}
                                <tr className="bg-indigo-50/5">
                                    <td colSpan={3} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-indigo-600 border-b border-neo-blue/20">
                                        Actif Immobilisé
                                    </td>
                                </tr>
                                {bilanData.actif.immobilise.lines.length === 0 ? (
                                    <tr><td colSpan={3} className="px-4 py-2 text-xs text-gray-400 border-b border-gray-100">—</td></tr>
                                ) : bilanData.actif.immobilise.lines.map(l => (
                                    <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                        <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-gray-800">{fmt(l.solde)}</td>
                                    </tr>
                                ))}
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <td colSpan={2} className="px-4 py-2 text-right text-xs font-bold text-gray-600">Sous-total</td>
                                    <td className="px-4 py-2 text-right font-mono font-bold text-gray-800">{fmt(bilanData.actif.immobilise.total)}</td>
                                </tr>

                                {/* Actif circulant */}
                                <tr className="bg-indigo-50/5">
                                    <td colSpan={3} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-indigo-600 border-b border-neo-blue/20">
                                        Actif Circulant (H.T)
                                    </td>
                                </tr>
                                {bilanData.actif.circulant.lines.length === 0 ? (
                                    <tr><td colSpan={3} className="px-4 py-2 text-xs text-gray-400 border-b border-gray-100">—</td></tr>
                                ) : bilanData.actif.circulant.lines.map(l => (
                                    <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                        <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-gray-800">{fmt(l.solde)}</td>
                                    </tr>
                                ))}
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <td colSpan={2} className="px-4 py-2 text-right text-xs font-bold text-gray-600">Sous-total</td>
                                    <td className="px-4 py-2 text-right font-mono font-bold text-gray-800">{fmt(bilanData.actif.circulant.total)}</td>
                                </tr>

                                {/* Trésorerie actif */}
                                <tr className="bg-indigo-50/5">
                                    <td colSpan={3} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-indigo-600 border-b border-neo-blue/20">
                                        Trésorerie - Actif
                                    </td>
                                </tr>
                                {bilanData.actif.tresorerie.lines.length === 0 ? (
                                    <tr><td colSpan={3} className="px-4 py-2 text-xs text-gray-400 border-b border-gray-100">—</td></tr>
                                ) : bilanData.actif.tresorerie.lines.map(l => (
                                    <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                        <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-gray-800">{fmt(l.solde)}</td>
                                    </tr>
                                ))}
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <td colSpan={2} className="px-4 py-2 text-right text-xs font-bold text-gray-600">Sous-total</td>
                                    <td className="px-4 py-2 text-right font-mono font-bold text-gray-800">{fmt(bilanData.actif.tresorerie.total)}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-900 text-white">
                                    <td colSpan={2} className="px-4 py-4 font-bold text-sm uppercase tracking-wider">TOTAL ACTIF</td>
                                    <td className="px-4 py-4 text-right font-mono font-bold text-lg">{fmt(bilanData.actif.total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* ── PASSIF ── */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-slate-200 bg-teal-50/20 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" />
                            <h3 className="font-bold text-sm uppercase tracking-wider">PASSIF</h3>
                        </div>
                        <table className="w-full text-sm flex-1">
                            <thead>
                                <tr className="bg-gray-50 border-b border-slate-200 font-semibold text-xs uppercase tracking-wider text-gray-500">
                                    <th className="text-left px-4 py-3 w-24">Compte</th>
                                    <th className="text-left px-4 py-3">Libellé</th>
                                    <th className="text-right px-4 py-3 w-36">Montant</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Financement permanent */}
                                <tr className="bg-teal-50/10">
                                    <td colSpan={3} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-yellow-700 border-b border-yellow-200">
                                        Financement Permanent
                                    </td>
                                </tr>
                                {bilanData.passif.permanent.lines.length === 0 ? (
                                    <tr><td colSpan={3} className="px-4 py-2 text-xs text-gray-400 border-b border-gray-100">—</td></tr>
                                ) : bilanData.passif.permanent.lines.map(l => (
                                    <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                        <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-gray-800">{fmt(l.solde)}</td>
                                    </tr>
                                ))}
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <td colSpan={2} className="px-4 py-2 text-right text-xs font-bold text-gray-600">Sous-total</td>
                                    <td className="px-4 py-2 text-right font-mono font-bold text-gray-800">{fmt(bilanData.passif.permanent.total)}</td>
                                </tr>

                                {/* Passif circulant */}
                                <tr className="bg-teal-50/10">
                                    <td colSpan={3} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-yellow-700 border-b border-yellow-200">
                                        Passif Circulant (H.T)
                                    </td>
                                </tr>
                                {bilanData.passif.circulant.lines.length === 0 ? (
                                    <tr><td colSpan={3} className="px-4 py-2 text-xs text-gray-400 border-b border-gray-100">—</td></tr>
                                ) : bilanData.passif.circulant.lines.map(l => (
                                    <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                        <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-gray-800">{fmt(l.solde)}</td>
                                    </tr>
                                ))}
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <td colSpan={2} className="px-4 py-2 text-right text-xs font-bold text-gray-600">Sous-total</td>
                                    <td className="px-4 py-2 text-right font-mono font-bold text-gray-800">{fmt(bilanData.passif.circulant.total)}</td>
                                </tr>

                                {/* Trésorerie passif */}
                                <tr className="bg-teal-50/10">
                                    <td colSpan={3} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-yellow-700 border-b border-yellow-200">
                                        Trésorerie - Passif
                                    </td>
                                </tr>
                                {bilanData.passif.tresorerie.lines.length === 0 ? (
                                    <tr><td colSpan={3} className="px-4 py-2 text-xs text-gray-400 border-b border-gray-100">—</td></tr>
                                ) : bilanData.passif.tresorerie.lines.map(l => (
                                    <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                        <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-gray-800">{fmt(l.solde)}</td>
                                    </tr>
                                ))}
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <td colSpan={2} className="px-4 py-2 text-right text-xs font-bold text-gray-600">Sous-total</td>
                                    <td className="px-4 py-2 text-right font-mono font-bold text-gray-800">{fmt(bilanData.passif.tresorerie.total)}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-900 text-white">
                                    <td colSpan={2} className="px-4 py-4 font-bold text-sm uppercase tracking-wider">TOTAL PASSIF</td>
                                    <td className="px-4 py-4 text-right font-mono font-bold text-lg">{fmt(bilanData.passif.total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* ─── CPC ───────────────────────────────────── */}
            {activeTab === 'cpc' && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-200 bg-indigo-50/10 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        <h3 className="font-bold text-sm uppercase tracking-wider">
                            Compte de Produits et Charges
                        </h3>
                    </div>
                    <table className="w-full text-sm flex-1">
                        <thead>
                            <tr className="bg-gray-50 border-b border-slate-200 font-semibold text-xs uppercase tracking-wider text-gray-500">
                                <th className="text-left px-4 py-3 w-24">Compte</th>
                                <th className="text-left px-4 py-3">Libellé</th>
                                <th className="text-right px-4 py-3 w-36">Montant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* ── I. Exploitation ── */}
                            <tr className="bg-indigo-50/5">
                                <td colSpan={3} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-indigo-600 border-b border-neo-blue/20">
                                    I. Exploitation
                                </td>
                            </tr>
                            {cpcData.exploitation.charges.map(l => (
                                <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                    <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-red-600">{fmt(l.solde)}</td>
                                </tr>
                            ))}
                            {cpcData.exploitation.produits.map(l => (
                                <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                    <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-green-700">{fmt(l.solde)}</td>
                                </tr>
                            ))}
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <td colSpan={2} className="px-4 py-2 text-left text-xs font-bold text-gray-600">Résultat Exploitation</td>
                                <td className={`px-4 py-2 text-right font-mono font-bold ${cpcData.exploitation.resultat < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                    {fmt(cpcData.exploitation.resultat)}
                                </td>
                            </tr>

                            {/* ── II. Financier ── */}
                            <tr className="bg-indigo-50/5">
                                <td colSpan={3} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-indigo-600 border-b border-neo-blue/20">
                                    II. Financier
                                </td>
                            </tr>
                            {cpcData.financier.charges.map(l => (
                                <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                    <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-red-600">{fmt(l.solde)}</td>
                                </tr>
                            ))}
                            {cpcData.financier.produits.map(l => (
                                <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                    <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-green-700">{fmt(l.solde)}</td>
                                </tr>
                            ))}
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <td colSpan={2} className="px-4 py-2 text-left text-xs font-bold text-gray-600">Résultat Financier</td>
                                <td className={`px-4 py-2 text-right font-mono font-bold ${cpcData.financier.resultat < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                    {fmt(cpcData.financier.resultat)}
                                </td>
                            </tr>

                            {/* ── III. Résultat Courant ── */}
                            <tr className="bg-teal-50/20 border-t border-b border-slate-200">
                                <td colSpan={2} className="px-4 py-3 font-bold text-sm uppercase tracking-wider">
                                    III. Résultat Courant
                                </td>
                                <td className={`px-4 py-3 text-right font-mono font-bold text-base ${cpcData.courant < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                    {fmt(cpcData.courant)}
                                </td>
                            </tr>

                            {/* ── IV. Non Courant ── */}
                            <tr className="bg-indigo-50/5">
                                <td colSpan={3} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-indigo-600 border-b border-neo-blue/20">
                                    IV. Non Courant
                                </td>
                            </tr>
                            {cpcData.nonCourant.charges.map(l => (
                                <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                    <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-red-600">{fmt(l.solde)}</td>
                                </tr>
                            ))}
                            {cpcData.nonCourant.produits.map(l => (
                                <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                    <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-green-700">{fmt(l.solde)}</td>
                                </tr>
                            ))}
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <td colSpan={2} className="px-4 py-2 text-left text-xs font-bold text-gray-600">Résultat Non Courant</td>
                                <td className={`px-4 py-2 text-right font-mono font-bold ${cpcData.nonCourant.resultat < 0 ? 'text-red-600' : 'text-green-700'}`}>
                                    {fmt(cpcData.nonCourant.resultat)}
                                </td>
                            </tr>

                            {/* ── V. Impôts ── */}
                            <tr className="bg-indigo-50/5">
                                <td colSpan={3} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-indigo-600 border-b border-neo-blue/20">
                                    V. Impôts sur les Résultats
                                </td>
                            </tr>
                            {cpcData.impot.charges.length === 0 ? (
                                <tr><td colSpan={3} className="px-4 py-2 text-xs text-gray-400 border-b border-gray-100">—</td></tr>
                            ) : cpcData.impot.charges.map(l => (
                                <tr key={l.account} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.account}</td>
                                    <td className="px-4 py-2.5 text-gray-700">{l.name}</td>
                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-red-600">{fmt(l.solde)}</td>
                                </tr>
                            ))}
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <td colSpan={2} className="px-4 py-2 text-left text-xs font-bold text-gray-600">Sous-total</td>
                                <td className="px-4 py-2 text-right font-mono font-bold text-gray-800">{fmt(cpcData.impot.totalCharges)}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-900 text-white">
                                <td colSpan={2} className="px-4 py-4 font-bold text-sm uppercase tracking-wider">RÉSULTAT NET</td>
                                <td className="px-4 py-4 text-right font-mono font-bold text-lg">{fmt(cpcData.net)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {/* Ajustements Modal */}
            {showAdjustModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
                            <h3 className="font-semibold text-xl font-bold">Ajustement — {selectedYear}</h3>
                            <button
                                onClick={() => setShowAdjustModal(false)}
                                className="w-8 h-8 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-neo-pink transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Account Selector */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Compte</label>
                                <select
                                    value={adjustForm.account}
                                    onChange={(e) => setAdjustForm(f => ({ ...f, account: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 font-semibold text-sm bg-white"
                                >
                                    {STRUCTURAL_ACCOUNTS.map(acc => (
                                        <option key={acc.code} value={acc.code}>{acc.code} — {acc.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Label */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Libellé (optionnel)</label>
                                <input
                                    type="text"
                                    value={adjustForm.label}
                                    onChange={(e) => setAdjustForm(f => ({ ...f, label: e.target.value }))}
                                    placeholder="Ex: Apport initial"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 font-semibold text-sm"
                                />
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Montant (MAD)</label>
                                <input
                                    type="number"
                                    value={adjustForm.amount}
                                    onChange={(e) => setAdjustForm(f => ({ ...f, amount: e.target.value }))}
                                    placeholder="100000"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 font-semibold text-sm font-bold"
                                    min="0"
                                    step="0.01"
                                />
                            </div>


                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAdjustModal(false)}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl font-bold text-sm bg-white hover:bg-gray-100 transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={saveAdjustment}
                                disabled={adjustSaving || !adjustForm.amount}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-xl font-bold text-sm bg-green-300 shadow-md hover:-translate-y-0.5 hover:shadow-md-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                {adjustSaving ? 'Enregistrement…' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
