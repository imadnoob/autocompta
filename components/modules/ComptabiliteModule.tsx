'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
    BookOpen, List, BarChart3, Search,
    ChevronRight, Hash, TrendingUp, TrendingDown, Minus,
    FileCheck, CheckCircle2, Loader2, FileText,
    SlidersHorizontal, RotateCcw, CalendarDays, X, ArrowUp, ArrowDown,
    Undo2, Banknote, Receipt, Calculator, Scale, Link2, PlusCircle,
    Pencil, Trash2, Save, Sparkles, Send, AlertCircle, Check, Users,
    FileSpreadsheet, Download
} from 'lucide-react';
import {
    Document, JournalEntry, SubTab, JournalFilter, TiersEnriched, LettrageMode,
    getAccountName, fmt, normalizeDate, buildEntriesFromDoc, buildPaymentEntries,
    autoLettrage, preLettrage, calcEcheance,
    PCM_ACCOUNTS, JOURNAL_LABELS, DEFAULT_JOURNAL_CONFIGS,
    COMPTES_COLLECTIFS, getCompteCollectifParent,
} from './comptaHelpers';
import EtatSyntheseModule from './EtatSyntheseModule';

// ─── Component ───────────────────────────────────────────────
export default function ComptabiliteModule() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<SubTab>('asaisir');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [dateFilter, setDateFilter] = useState('');
    const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
    const [comptabilising, setComptabilising] = useState(false);
    const [journalFilter, setJournalFilter] = useState<JournalFilter>('tous');
    const [tvaPeriod, setTvaPeriod] = useState('');
    // Filters for À saisir tab
    const [pendingSearch, setPendingSearch] = useState('');
    const [pendingType, setPendingType] = useState('all');
    const [pendingDateFrom, setPendingDateFrom] = useState('');
    const [pendingDateTo, setPendingDateTo] = useState('');
    const [pendingMinAmount, setPendingMinAmount] = useState('');
    const [pendingMaxAmount, setPendingMaxAmount] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [pendingSortBy, setPendingSortBy] = useState<'date' | 'supplier' | 'amount' | 'ref'>('date');
    const [pendingSortOrder, setPendingSortOrder] = useState<'asc' | 'desc'>('desc');
    // Edit entry state
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
    const [editForm, setEditForm] = useState<{ account: string; account_name: string; label: string; debit: string; credit: string }>({ account: '', account_name: '', label: '', debit: '', credit: '' });
    const [syncOtherLines, setSyncOtherLines] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    // Text-to-entries state
    const [texteInput, setTexteInput] = useState('');
    const [texteLoading, setTexteLoading] = useState(false);
    const [texteResult, setTexteResult] = useState<any>(null);
    const [texteError, setTexteError] = useState('');
    const [texteSaving, setTexteSaving] = useState(false);

    // Tiers State
    const [tiers, setTiers] = useState<any[]>([]);
    const [editingTier, setEditingTier] = useState<any>(null);
    const [tierEditForm, setTierEditForm] = useState<{
        name: string; account_code_aux: string;
        telephone: string; email: string; adresse: string;
        rc: string; identifiant_fiscal: string; ice: string;
        delai_reglement_jours: number; mode_reglement: string;
        condition_reglement: string; jour_tombee: number;
    }>({ name: '', account_code_aux: '', telephone: '', email: '', adresse: '', rc: '', identifiant_fiscal: '', ice: '', delai_reglement_jours: 30, mode_reglement: 'virement', condition_reglement: 'net', jour_tombee: 0 });

    // Reports Date State
    const [reportDateFrom, setReportDateFrom] = useState('');
    const [reportDateTo, setReportDateTo] = useState('');
    const [showSubAccountsGrandLivre, setShowSubAccountsGrandLivre] = useState(false);
    const [showAllSubAccountsBalance, setShowAllSubAccountsBalance] = useState(false);
    const [expandedBalanceAccounts, setExpandedBalanceAccounts] = useState<Set<string>>(new Set());
    const [expandedGrandLivreAccounts, setExpandedGrandLivreAccounts] = useState<Set<string>>(new Set());
    const [showSagePopup, setShowSagePopup] = useState(false);

    const toggleBalanceAccount = (acc: string) => {
        setExpandedBalanceAccounts(prev => {
            const next = new Set(prev);
            if (next.has(acc)) next.delete(acc);
            else next.add(acc);
            return next;
        });
    };

    const toggleGrandLivreAccount = (acc: string) => {
        setExpandedGrandLivreAccounts(prev => {
            const next = new Set(prev);
            if (next.has(acc)) next.delete(acc);
            else next.add(acc);
            return next;
        });
    };

    const fetchTiers = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('tiers').select('*').eq('user_id', user.id).order('account_code_aux', { ascending: true });
        setTiers(data || []);
    }, []);

    const fetchDocs = useCallback(async () => {
        const { data } = await supabase
            .from('documents')
            .select('*')
            .eq('status', 'completed')
            .order('created_at', { ascending: true });
        setDocuments(data || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchDocs(); }, [fetchDocs]);

    // Documents waiting to be comptabilized (not yet saisi or regle)
    const pendingDocs = useMemo(() =>
        documents.filter(d => (d.accounting_status === 'a_saisir' || !d.accounting_status) && d.extracted_data),
        [documents]
    );

    // Filtered + sorted pending docs
    const filteredPendingDocs = useMemo(() => {
        const filtered = pendingDocs.filter(doc => {
            const d = doc.extracted_data;
            if (pendingSearch) {
                const q = pendingSearch.toLowerCase();
                const match = (doc.internal_ref || '').toLowerCase().includes(q)
                    || (d?.supplier || '').toLowerCase().includes(q)
                    || (doc.original_name || '').toLowerCase().includes(q)
                    || (d?.invoice_number || '').toLowerCase().includes(q)
                    || (d?.category_code || '').includes(q)
                    || (d?.category_name || '').toLowerCase().includes(q);
                if (!match) return false;
            }
            if (pendingType !== 'all' && d?.type !== pendingType) return false;
            const docDate = d?.date || '';
            if (pendingDateFrom && docDate < pendingDateFrom) return false;
            if (pendingDateTo && docDate > pendingDateTo) return false;
            const amount = Number(d?.total_amount) || 0;
            if (pendingMinAmount && amount < Number(pendingMinAmount)) return false;
            if (pendingMaxAmount && amount > Number(pendingMaxAmount)) return false;
            return true;
        });

        // Sort
        const dir = pendingSortOrder === 'asc' ? 1 : -1;
        filtered.sort((a, b) => {
            const da = a.extracted_data;
            const db = b.extracted_data;
            switch (pendingSortBy) {
                case 'date': return dir * ((da?.date || '').localeCompare(db?.date || ''));
                case 'supplier': return dir * ((da?.supplier || '').localeCompare(db?.supplier || ''));
                case 'amount': return dir * ((Number(da?.total_amount) || 0) - (Number(db?.total_amount) || 0));
                case 'ref': return dir * ((a.internal_ref || '').localeCompare(b.internal_ref || ''));
                default: return 0;
            }
        });

        return filtered;
    }, [pendingDocs, pendingSearch, pendingType, pendingDateFrom, pendingDateTo, pendingMinAmount, pendingMaxAmount, pendingSortBy, pendingSortOrder]);

    const resetPendingFilters = () => {
        setPendingSearch('');
        setPendingType('all');
        setPendingDateFrom('');
        setPendingDateTo('');
        setPendingMinAmount('');
        setPendingMaxAmount('');
    };

    const hasActiveFilters = pendingSearch || pendingType !== 'all' || pendingDateFrom || pendingDateTo || pendingMinAmount || pendingMaxAmount;

    // ─── Fetch journal entries from DB ───────────────────────
    const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);

    const fetchEntries = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('entry_date', { ascending: false })
            .order('created_at', { ascending: false })
            .order('id', { ascending: true });
        setAllEntries((data || []).map((e: any) => ({
            id: e.id, doc_id: e.doc_id, entry_date: e.entry_date, ref: e.ref || '',
            account: e.account, account_name: e.account_name, label: e.label,
            debit: Number(e.debit) || 0, credit: Number(e.credit) || 0,
            supplier: e.supplier || '', journal: e.journal,
            lettre_code: e.lettre_code, is_contrepassation: e.is_contrepassation || false,
            piece_num: e.piece_num,
        })));
    }, []);

    useEffect(() => { fetchEntries(); fetchTiers(); }, [fetchEntries, fetchTiers]);

    const filteredEntries = useMemo(() => {
        // Tri stable : entry_date DESC, created_at DESC, id ASC
        return allEntries.filter((e: JournalEntry) => {
            if (journalFilter !== 'tous' && e.journal !== journalFilter) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!e.label.toLowerCase().includes(q) && !e.account.includes(q) && !(e.ref || '').toLowerCase().includes(q)) return false;
            }
            if (dateFilter && !e.entry_date.startsWith(dateFilter)) return false;
            return true;
        });
    }, [allEntries, searchQuery, dateFilter, journalFilter]);

    const accountsList = useMemo(() => {
        const map = new Map<string, { account: string; name: string; debit: number; credit: number }>();
        for (const e of filteredEntries) {
            // Group sub-accounts under their collective parent (e.g. 34210001 → 3421 Clients)
            const parent = getCompteCollectifParent(e.account);
            const code = parent || e.account;
            const name = parent ? (COMPTES_COLLECTIFS[parent] || getAccountName(parent)) : e.account_name;
            const existing = map.get(code) || { account: code, name, debit: 0, credit: 0 };
            existing.debit += e.debit;
            existing.credit += e.credit;
            map.set(code, existing);
        }
        return Array.from(map.values()).sort((a, b) => a.account.localeCompare(b.account));
    }, [filteredEntries]);

    const totalDebit = filteredEntries.reduce((s: number, e: JournalEntry) => s + e.debit, 0);
    const totalCredit = filteredEntries.reduce((s: number, e: JournalEntry) => s + e.credit, 0);

    // ─── Comptabiliser: persist entries to DB ────────────────
    const handleComptabiliser = async () => {
        if (selectedDocs.size === 0) return;
        setComptabilising(true);
        const ids = Array.from(selectedDocs);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setComptabilising(false); return; }

        const docsToProcess = documents.filter(d => ids.includes(d.id));
        const rows: any[] = [];

        let loopIndex = 0;
        for (const doc of docsToProcess) {
            loopIndex++;
            // 1. Détermination du Fournisseur / Client (Plan Tiers)
            let supplierCode = '4411';
            let supplierAccName = 'Fournisseurs';

            const supplierName = doc.extracted_data?.merchant_name || doc.extracted_data?.supplier || null;
            if (supplierName && supplierName.trim() !== '') {
                const sName = supplierName.trim();
                const { data: tiersData } = await supabase.from('tiers').select('*').eq('name', sName).eq('user_id', user.id).single();

                if (tiersData) {
                    supplierCode = tiersData.account_code_aux;
                    supplierAccName = tiersData.name;
                } else {
                    // Création automatique du tiers (Fournisseur par défaut pour l'instant)
                    const { data: maxTiers } = await supabase.from('tiers')
                        .select('account_code_aux')
                        .eq('user_id', user.id)
                        .like('account_code_aux', '4411000%')
                        .order('account_code_aux', { ascending: false })
                        .limit(1)
                        .single();

                    let nextNum = 1;
                    if (maxTiers && maxTiers.account_code_aux) {
                        nextNum = parseInt(maxTiers.account_code_aux.replace('4411000', '')) + 1;
                    }
                    supplierCode = `4411000${nextNum}`;
                    supplierAccName = sName;

                    await supabase.from('tiers').insert({
                        user_id: user.id,
                        type: 'fournisseur',
                        name: supplierAccName,
                        account_code_aux: supplierCode,
                        adresse: doc.extracted_data?.tier_address || null,
                        telephone: doc.extracted_data?.tier_telephone || null,
                        email: doc.extracted_data?.tier_email || null,
                        rc: doc.extracted_data?.tier_rc || null,
                        identifiant_fiscal: doc.extracted_data?.tier_if || null,
                        ice: doc.extracted_data?.tier_ice || null
                    });
                }
            }

            // 2. Génération du Numéro de Pièce (Pièce Comptable)
            const { count } = await supabase
                .from('journal_entries')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('journal', 'HA');

            const pieceNum = `ACH-${String((count || 0) + loopIndex).padStart(4, '0')}`;

            // 3. Construction des écritures
            const entries = buildEntriesFromDoc(doc, supplierCode, supplierAccName);
            for (const e of entries) {
                rows.push({ ...e, user_id: user.id, piece_num: pieceNum });
            }
        }

        // Try to insert journal entries (non-blocking for status update)
        if (rows.length > 0) {
            const { error: insertErr } = await supabase.from('journal_entries').insert(rows);
            if (insertErr) {
                console.warn('Erreur insertion écritures (table manquante?):', insertErr.message);
            }
        }

        // Always update the document status
        const { data: updateData, error } = await supabase
            .from('documents')
            .update({ accounting_status: 'saisi' })
            .in('id', ids)
            .select();

        console.log('[Comptabiliser] Update result:', { ids, updateData, error });

        if (error) {
            alert(`Erreur mise à jour statut: ${error.message}\n\nCode: ${error.code}\nDetails: ${error.details}\nHint: ${error.hint}`);
        }

        setSelectedDocs(new Set());
        await fetchDocs();
        await fetchEntries();
        setActiveTab('journal');
        setComptabilising(false);
    };

    // ─── Delete entry ─────────────────────────────────────────
    const cleanupOrphanTiers = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Get all user tiers
        const { data: userTiers } = await supabase.from('tiers').select('id, account_code_aux').eq('user_id', user.id);
        if (!userTiers || userTiers.length === 0) return;

        // 2. Get all unique accounts currently used in journal entries by this user
        const { data: usedAccountsData } = await supabase.from('journal_entries').select('account').eq('user_id', user.id);
        const usedAccounts = new Set((usedAccountsData || []).map((e: { account: string }) => e.account));

        // 3. Identify and delete orphan tiers
        const orphans = userTiers.filter((t: { id: string, account_code_aux: string }) => !usedAccounts.has(t.account_code_aux));
        if (orphans.length > 0) {
            const orphanIds = orphans.map((o: { id: string }) => o.id);
            await supabase.from('tiers').delete().in('id', orphanIds);
            await fetchTiers(); // refresh Plan Tiers UI
        }
    };

    const handleDeleteEntry = async (entryId: string) => {
        if (confirmDeleteId !== entryId) {
            setConfirmDeleteId(entryId);
            return;
        }
        setConfirmDeleteId(null);
        // Find the entry to get its doc_id before deleting
        const entryToDelete = allEntries.find(e => e.id === entryId);
        const docId = entryToDelete?.doc_id;

        const { error } = await supabase.from('journal_entries').delete().eq('id', entryId);
        if (error) {
            alert(`Erreur suppression: ${error.message}`);
            return;
        }

        // If all entries for this doc are now deleted, reset doc status to a_saisir
        if (docId) {
            const remainingForDoc = allEntries.filter(e => e.doc_id === docId && e.id !== entryId);
            if (remainingForDoc.length === 0) {
                await supabase.from('documents').update({ accounting_status: 'a_saisir' }).eq('id', docId);
                await fetchDocs();
            }
        }
        await fetchEntries();
        await cleanupOrphanTiers();
    };

    // ─── Edit entry ───────────────────────────────────────────
    const startEditEntry = (entry: JournalEntry) => {
        setEditingEntry(entry);
        setEditForm({
            account: entry.account,
            account_name: entry.account_name,
            label: entry.label,
            debit: String(entry.debit),
            credit: String(entry.credit),
        });
    };

    const handleSaveEdit = async () => {
        if (!editingEntry) return;

        if (syncOtherLines && editingEntry.doc_id) {
            const oldAmount = editingEntry.debit > 0 ? editingEntry.debit : editingEntry.credit;
            const newAmount = Number(editForm.debit) || Number(editForm.credit) || 0;

            if (oldAmount > 0 && newAmount !== oldAmount) {
                const ratio = newAmount / oldAmount;
                const { data: siblingEntries } = await supabase.from('journal_entries').select('*').eq('doc_id', editingEntry.doc_id);

                if (siblingEntries && siblingEntries.length > 0) {
                    const siblingsToUpdate = siblingEntries.filter((e: any) => e.id !== editingEntry.id && !e.is_contrepassation);
                    for (const s of siblingsToUpdate) {
                        const newDebit = s.debit > 0 ? Number((s.debit * ratio).toFixed(2)) : 0;
                        const newCredit = s.debit === 0 && s.credit > 0 ? Number((s.credit * ratio).toFixed(2)) : 0;
                        await supabase.from('journal_entries').update({ debit: newDebit, credit: newCredit }).eq('id', s.id);
                    }
                }
            }
        }

        const { error } = await supabase.from('journal_entries').update({
            account: editForm.account,
            account_name: editForm.account_name || getAccountName(editForm.account),
            label: editForm.label,
            debit: Number(editForm.debit) || 0,
            credit: Number(editForm.credit) || 0,
        }).eq('id', editingEntry.id);

        if (error) {
            alert(`Erreur modification: ${error.message}`);
        } else {
            setEditingEntry(null);
            setSyncOtherLines(true);
            await fetchEntries();
            await cleanupOrphanTiers();
        }
    };

    // ─── Annuler: contrepassation (reverse entries) ──────────
    const handleAnnuler = async (docId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        // Get existing entries for this doc
        const docEntries = allEntries.filter(e => e.doc_id === docId && !e.is_contrepassation);
        if (docEntries.length > 0) {
            const reverseRows = docEntries.map(e => ({
                user_id: user.id, doc_id: docId, journal: e.journal,
                entry_date: normalizeDate(new Date().toISOString().split('T')[0]),
                account: e.account, account_name: e.account_name,
                label: `Contrepassation — ${e.label}`,
                debit: e.credit, credit: e.debit, // reversed
                ref: e.ref, supplier: e.supplier, is_contrepassation: true,
            }));
            const { error: insertErr } = await supabase.from('journal_entries').insert(reverseRows);
            if (insertErr) {
                alert(`Erreur contrepassation: ${insertErr.message}`);
                return;
            }
        }
        const { error } = await supabase.from('documents').update({ accounting_status: 'annule' }).eq('id', docId);
        if (error) {
            alert(`Erreur: ${error.message}`);
        } else {
            await fetchDocs();
            await fetchEntries();
        }
    };

    const [reglementInProgress, setReglementInProgress] = useState<Set<string>>(new Set());

    // ─── Règlement: persist payment entries & auto-lettrage ────
    const handleReglement = async (docId: string, method: string) => {
        if (reglementInProgress.has(docId)) return;
        setReglementInProgress(prev => new Set(prev).add(docId));

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const doc = documents.find(d => d.id === docId);
            if (!doc) return;

            // 1. Fetch exact journal entries for this document from DB
            const { data: dbEntries } = await supabase.from('journal_entries').select('*').eq('doc_id', docId).eq('user_id', user.id);
            if (!dbEntries || dbEntries.length === 0) {
                alert("Aucune écriture trouvée pour ce document.");
                return;
            }

            // 2. Identify the third-party account (Supplier or Client) to settle
            // We must strictly avoid tax accounts (3455, 4455) and target collective accounts (4411, 3421, etc.)
            const thirdPartyEntry = dbEntries.find((e: any) => 
                e.account.startsWith('4411') || // Fournisseurs
                e.account.startsWith('3421') || // Clients
                e.account.startsWith('4441') || // Organismes sociaux
                e.account.startsWith('4452')    // État - Impôts et taxes (non-TVA)
            );
            if (!thirdPartyEntry) {
                alert("Impossible d'identifier le compte tiers (fournisseur/client) à régler.");
                return;
            }

            // Determine if we need to Debit or Credit the third party
            // If the original entry Credited the supplier, we must Debit them to settle.
            const amountToSettle = thirdPartyEntry.credit > 0 ? thirdPartyEntry.credit : thirdPartyEntry.debit;
            const isSettlingCredit = thirdPartyEntry.credit > 0;

            // 3. Determine Bank/Cash Journal, Account and Piece Number
            const isCash = method === 'especes';
            const payJournal = isCash ? 'CA' : 'BQ';
            const payAccount = isCash ? '5161' : '5141';
            const payAccountName = isCash ? 'Caisse' : 'Banque';

            const { count } = await supabase.from('journal_entries').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('journal', payJournal);
            const pieceNum = `REG-${String((count || 0) + 1).padStart(4, '0')}`;
            const payDate = normalizeDate(new Date().toISOString().split('T')[0]);
            const label = `Règlement — ${doc.internal_ref || doc.extracted_data?.invoice_number || 'Facture'}`;

            // 4. Build the two payment lines
            const rows = [
                // Third Party Line (reversing original balance)
                {
                    user_id: user.id, doc_id: docId, journal: payJournal, piece_num: pieceNum,
                    entry_date: payDate, account: thirdPartyEntry.account, account_name: thirdPartyEntry.account_name,
                    label, ref: thirdPartyEntry.ref,
                    debit: isSettlingCredit ? amountToSettle : 0,
                    credit: isSettlingCredit ? 0 : amountToSettle,
                    supplier: thirdPartyEntry.supplier, is_contrepassation: false, lettre_code: null,
                },
                // Bank/Cash Line
                {
                    user_id: user.id, doc_id: docId, journal: payJournal, piece_num: pieceNum,
                    entry_date: payDate, account: payAccount, account_name: payAccountName,
                    label, ref: thirdPartyEntry.ref,
                    debit: isSettlingCredit ? 0 : amountToSettle,
                    credit: isSettlingCredit ? amountToSettle : 0,
                    supplier: thirdPartyEntry.supplier, is_contrepassation: false, lettre_code: null,
                }
            ];

            const { error: insertErr, data: insertedPayEntries } = await supabase.from('journal_entries').insert(rows).select();
            if (insertErr) {
                alert(`Erreur écritures règlement: ${insertErr.message}`);
                return;
            }

            // 5. Auto Lettrage
            // Find existing lettrage codes to generate next one
            const { data: entriesForLettrage } = await supabase.from('journal_entries').select('lettre_code').eq('user_id', user.id).not('lettre_code', 'is', null);
            const existingCodes = (entriesForLettrage || []).map((e: { lettre_code: string | null }) => e.lettre_code!);
            let code = 'AA';
            while (existingCodes.includes(code)) {
                const c1 = code.charCodeAt(1);
                if (c1 < 90) code = code[0] + String.fromCharCode(c1 + 1);
                else code = String.fromCharCode(code.charCodeAt(0) + 1) + 'A';
            }

            const idsToLetter = [];
            if (!thirdPartyEntry.lettre_code) idsToLetter.push(thirdPartyEntry.id);

            if (insertedPayEntries) {
                const payEntry = insertedPayEntries.find((e: any) => e.account === thirdPartyEntry.account);
                if (payEntry) idsToLetter.push(payEntry.id);
            }

            if (idsToLetter.length === 2) {
                await supabase.from('journal_entries').update({ lettre_code: code }).in('id', idsToLetter);
            }

            // 6. Update document status
            const { error: updateErr } = await supabase.from('documents').update({ accounting_status: 'lettre' }).eq('id', docId);
            if (updateErr) {
                alert(`Erreur mise à jour statut: ${updateErr.message}`);
            } else {
                setEditingEntry(null);
                await fetchDocs();
                await fetchEntries();
            }
        } finally {
            setReglementInProgress(prev => {
                const next = new Set(prev);
                next.delete(docId);
                return next;
            });
        }
    };
    const handleDeleteTier = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!editingTier) return;
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer le tiers ${editingTier.name} ?`)) {
            const { error } = await supabase.from('tiers').delete().eq('id', editingTier.id);
            if (error) {
                if (error.code === '23503') {
                    alert("Impossible de supprimer ce tiers car des écritures y font référence. Vous devez d'abord supprimer ou modifier ces écritures.");
                } else {
                    alert(`Erreur suppression: ${error.message}`);
                }
            } else {
                setEditingTier(null);
                await fetchTiers();
                alert("Tiers supprimé avec succès.");
            }
        }
    };

    const handleSaveTier = async () => {
        if (!editingTier) return;
        const { error } = await supabase.from('tiers').update({
            name: tierEditForm.name,
            account_code_aux: tierEditForm.account_code_aux,
            telephone: tierEditForm.telephone || null,
            email: tierEditForm.email || null,
            adresse: tierEditForm.adresse || null,
            rc: tierEditForm.rc || null,
            identifiant_fiscal: tierEditForm.identifiant_fiscal || null,
            ice: tierEditForm.ice || null,
            delai_reglement_jours: tierEditForm.delai_reglement_jours,
            mode_reglement: tierEditForm.mode_reglement,
            condition_reglement: tierEditForm.condition_reglement,
            jour_tombee: tierEditForm.jour_tombee || null,
        }).eq('id', editingTier.id);

        if (error) {
            alert(`Erreur: ${error.message}`);
            return;
        }
        setEditingTier(null);
        await fetchTiers();
    };

    // ─── Document Status & Undo ────────────────────────────────────────────
    const [lettrageAccount, setLettrageAccount] = useState<string | null>(null);
    const [lettrageSelection, setLettrageSelection] = useState<Set<string>>(new Set());

    const handleLettrage = async () => {
        if (lettrageSelection.size < 2) return;
        const selected = allEntries.filter(e => lettrageSelection.has(e.id));
        const totalD = selected.reduce((s, e) => s + e.debit, 0);
        const totalC = selected.reduce((s, e) => s + e.credit, 0);
        if (Math.abs(totalD - totalC) > 0.01) {
            alert(`Lettrage impossible: écart de ${fmt(Math.abs(totalD - totalC))} MAD`);
            return;
        }
        // Generate lettre code: AA, AB, AC...
        const existingCodes = allEntries.filter(e => e.lettre_code).map(e => e.lettre_code!);
        let code = 'AA';
        while (existingCodes.includes(code)) {
            const c1 = code.charCodeAt(1);
            if (c1 < 90) code = code[0] + String.fromCharCode(c1 + 1);
            else code = String.fromCharCode(code.charCodeAt(0) + 1) + 'A';
        }
        const ids = Array.from(lettrageSelection);
        const { error } = await supabase.from('journal_entries').update({ lettre_code: code }).in('id', ids);
        if (error) {
            alert(`Erreur lettrage: ${error.message}`);
        } else {
            // Met à jour le statut comptable des documents liés pour qu'ils soient reconnus comme lettrés
            const docIdsToUpdate = selected.map(e => e.doc_id).filter(Boolean) as string[];
            if (docIdsToUpdate.length > 0) {
                await supabase.from('documents')
                    .update({ accounting_status: 'lettre' })
                    .in('id', docIdsToUpdate);
            }

            setLettrageSelection(new Set());
            await fetchEntries();
        }
    };

    // ─── OD Manual Entry ─────────────────────────────────────
    const [odDate, setOdDate] = useState(new Date().toISOString().split('T')[0]);
    const [odLabel, setOdLabel] = useState('');
    const [odLines, setOdLines] = useState<{ account: string; label: string; debit: string; credit: string }[]>([
        { account: '', label: '', debit: '', credit: '' },
        { account: '', label: '', debit: '', credit: '' },
    ]);

    const handleOdSubmit = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const rows = odLines.filter(l => l.account).map(l => ({
            user_id: user.id, doc_id: null, journal: 'OD' as const,
            entry_date: odDate, account: l.account,
            account_name: getAccountName(l.account),
            label: l.label || odLabel, ref: 'OD',
            debit: Number(l.debit) || 0, credit: Number(l.credit) || 0,
            supplier: '', is_contrepassation: false, lettre_code: null,
        }));
        const totalD = rows.reduce((s, r) => s + r.debit, 0);
        const totalC = rows.reduce((s, r) => s + r.credit, 0);
        if (Math.abs(totalD - totalC) > 0.01) {
            alert(`Écriture déséquilibrée: Débit=${fmt(totalD)} ≠ Crédit=${fmt(totalC)}`);
            return;
        }
        if (rows.length < 2) { alert('Minimum 2 lignes requises'); return; }
        const { error } = await supabase.from('journal_entries').insert(rows);
        if (error) {
            alert(`Erreur: ${error.message}`);
        } else {
            setOdLabel('');
            setOdLines([{ account: '', label: '', debit: '', credit: '' }, { account: '', label: '', debit: '', credit: '' }]);
            await fetchEntries();
        }
    };

    const toggleDoc = (id: string) => {
        setSelectedDocs(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedDocs.size === filteredPendingDocs.length) {
            setSelectedDocs(new Set());
        } else {
            setSelectedDocs(new Set(filteredPendingDocs.map(d => d.id)));
        }
    };

    // ─── Sage CSV Export Helper ────────────────────────────────
    const downloadSageCsv = () => {
        // CSV avec point-virgule, compatible format paramétrable Sage
        const header = 'Code journal;Date de pièce;N° de pièce;N° Compte général;N° Compte tiers;Libellé écriture;Sens;Montant;Lettrage';
        const csvLines: string[] = [header];

        filteredEntries.forEach((e: any) => {
            const dateParts = e.entry_date.split('-');
            const sageDate = dateParts.length === 3 ? `${dateParts[2]}${dateParts[1]}${dateParts[0].substring(2)}` : '';

            const isClientTier = e.account.startsWith('3421');
            const isFournTier = e.account.startsWith('4411');
            let compteGen = e.account;
            let tiers = '';
            if (isClientTier && e.account !== '3421') { compteGen = '3421000'; tiers = e.account; }
            else if (isFournTier && e.account !== '4411') { compteGen = '4411000'; tiers = e.account; }

            const sens = e.debit > 0 ? 'D' : 'C';
            const montant = e.debit > 0 ? e.debit : e.credit;
            const montantStr = montant.toFixed(2).replace('.', ',');

            let sageJournal = e.journal_code || e.journal || 'ACH';
            if (sageJournal.toUpperCase() === 'HA') sageJournal = 'ACH';
            if (sageJournal.toUpperCase() === 'VT') sageJournal = 'VTE';
            if (sageJournal.toUpperCase() === 'BQ') sageJournal = 'BQE';

            const lettrage = e.lettre_code || '';

            csvLines.push([sageJournal, sageDate, e.piece_num || '', compteGen, tiers, `"${(e.label || '').replace(/"/g, '""')}"`, sens, montantStr, lettrage].join(';'));
        });

        // Encode ANSI (Windows-1252)
        const contentStr = csvLines.join('\r\n');
        const encodeToWindows1252 = (str: string) => {
            const win1252 = new Uint8Array(str.length);
            for (let i = 0; i < str.length; i++) {
                let code = str.charCodeAt(i);
                if (code === 8212) code = 151;
                if (code > 255) {
                    if (code === 8217) code = 39;
                    else if (code === 8220 || code === 8221) code = 34;
                    else code = 63;
                }
                win1252[i] = code;
            }
            return win1252;
        };
        const ansiBytes = encodeToWindows1252(contentStr);
        const blob = new Blob([ansiBytes], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Export_Sage_${new Date().toISOString().split('T')[0]}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const saisiCount = documents.filter(d => d.accounting_status === 'saisi').length;

    const topTabs: { key: SubTab; label: string; icon: any; badge?: number }[] = [
        { key: 'asaisir', label: 'À saisir', icon: FileText, badge: pendingDocs.length },
        { key: 'journal', label: 'Journal', icon: BookOpen, badge: allEntries.length || undefined },
        { key: 'grandlivre', label: 'Grand Livre', icon: List },
        { key: 'balance', label: 'Balance', icon: BarChart3 },
        { key: 'tiers', label: 'Plan Tiers', icon: Users },
        { key: 'sig', label: 'Bilan & CPC', icon: Scale },
        { key: 'tva', label: 'Décl. TVA', icon: Calculator },
    ];

    const bottomTabs: { key: SubTab; label: string; icon: any; badge?: number }[] = [
    ];

    if (loading) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl p-8 text-center">
                <div className="w-12 h-12 bg-indigo-50 border border-slate-200 rounded-xl mx-auto mb-4 flex items-center justify-center animate-pulse">
                    <BookOpen className="w-6 h-6" />
                </div>
                <p className="font-semibold">Chargement…</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {/* Header Toolbar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Sub-tabs */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            {topTabs.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => { setActiveTab(tab.key); setSelectedAccount(null); }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold border transition-all rounded-lg ${activeTab === tab.key
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {tab.label}
                                        {tab.badge !== undefined && tab.badge > 0 && (
                                            <span className={`ml-1 px-1.5 py-0.5 text-[10px] items-center justify-center flex rounded-md font-bold ${activeTab === tab.key ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {bottomTabs.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                {bottomTabs.map(tab => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.key}
                                            onClick={() => { setActiveTab(tab.key); setSelectedAccount(null); }}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold border border-black transition-all ${activeTab === tab.key
                                                ? 'bg-[#99ccff] text-[#1a2f4c] shadow-[3px_3px_0px_#000] -translate-x-0.5 -translate-y-0.5'
                                                : 'bg-white text-[#4a6482] hover:bg-gray-50'
                                                }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Export Buttons */}
                    {activeTab === 'journal' && (
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={async () => {
                                    const XLSX = await import('xlsx');
                                    const dataToExport = filteredEntries.map(e => ({
                                        'Journal': e.journal,
                                        'Date': e.entry_date,
                                        'Pièce': e.piece_num || '',
                                        'Compte': e.account,
                                        'Nom du compte': e.account_name,
                                        'Libellé': e.label,
                                        'Débit': e.debit,
                                        'Crédit': e.credit,
                                        'Lettrage': e.lettre_code || ''
                                    }));
                                    const ws = XLSX.utils.json_to_sheet(dataToExport);
                                    const wb = XLSX.utils.book_new();
                                    XLSX.utils.book_append_sheet(wb, ws, "Journal");
                                    XLSX.writeFile(wb, `Export_Journal_${new Date().toISOString().split('T')[0]}.xlsx`);
                                }}
                                className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 font-bold text-sm shadow-sm hover:bg-emerald-100 rounded-xl transition-all"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Excel
                            </button>

                            <button
                                onClick={() => {
                                    // Check localStorage to see if the user dismissed the popup
                                    const dismissed = localStorage.getItem('sage_popup_dismissed');
                                    if (dismissed === 'true') {
                                        // Download CSV directly
                                        downloadSageCsv();
                                    } else {
                                        // Show popup with instructions
                                        setShowSagePopup(true);
                                    }
                                }}
                                className="flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2 font-bold text-sm shadow-sm hover:bg-rose-100 rounded-xl transition-all"
                            >
                                <Download className="w-4 h-4" />
                                Sage (TXT)
                            </button>

                            <button
                                onClick={async () => {
                                    const jsPDF = (await import('jspdf')).default;
                                    const autoTable = (await import('jspdf-autotable')).default;

                                    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                                    const pageWidth = doc.internal.pageSize.getWidth();
                                    const pageHeight = doc.internal.pageSize.getHeight();
                                    const now = new Date();
                                    const printDate = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                    const printTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                                    // Sage-style journal title mapping
                                    const journalNames: Record<string, string> = {
                                        'tous': 'Journal Général', 'HA': 'Journal des Achats', 'VT': 'Journal des Ventes',
                                        'BQ': 'Journal de Banque', 'CA': 'Journal de Caisse', 'OD': "Journal des Opérations Diverses",
                                    };
                                    const journalTitle = journalNames[journalFilter] || 'Journal Général';

                                    // Format number like Sage: 1 234,56 (Custom to avoid jsPDF unicode space issues)
                                    const fmtN = (n: number) => {
                                        if (n <= 0) return '';
                                        const parts = n.toFixed(2).split('.');
                                        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                                        return parts.join(',');
                                    };

                                    // Sort entries: by journal, then date, then piece
                                    const sorted = [...filteredEntries].sort((a, b) => {
                                        if (a.journal !== b.journal) return a.journal.localeCompare(b.journal);
                                        if (a.entry_date !== b.entry_date) return a.entry_date.localeCompare(b.entry_date);
                                        return (a.piece_num || '').localeCompare(b.piece_num || '');
                                    });

                                    // Group by journal code
                                    const journalGroups = new Map<string, typeof sorted>();
                                    for (const e of sorted) {
                                        const j = e.journal;
                                        if (!journalGroups.has(j)) journalGroups.set(j, []);
                                        journalGroups.get(j)!.push(e);
                                    }

                                    // If filtered to a single journal, only show that
                                    const groupsToRender = journalFilter !== 'tous'
                                        ? [[journalFilter, journalGroups.get(journalFilter) || []] as [string, typeof sorted]]
                                        : Array.from(journalGroups.entries()).sort((a, b) => a[0].localeCompare(b[0]));

                                    // Build all table rows (Sage-style)
                                    const tableRows: any[][] = [];
                                    let grandDebit = 0;
                                    let grandCredit = 0;

                                    for (const [journalCode, entries] of groupsToRender) {
                                        const jName = journalNames[journalCode] || `Journal ${journalCode}`;

                                        // ── SECTION HEADER (Sage-style: Bold text, no background, underline) ──
                                        tableRows.push([
                                            { content: `${journalCode} — ${jName}`, colSpan: 7, styles: { fontStyle: 'bold', fontSize: 8, halign: 'left', cellPadding: { top: 3, bottom: 2, left: 2, right: 2 } } },
                                        ]);

                                        let journalDebit = 0;
                                        let journalCredit = 0;
                                        let prevDate = '';
                                        let prevPiece = '';

                                        for (const e of entries) {
                                            const dateStr = e.entry_date || '';
                                            const dateFr = dateStr ? new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
                                            const showDate = dateStr !== prevDate;
                                            const showPiece = (e.piece_num || '') !== prevPiece || showDate;
                                            prevDate = dateStr;
                                            prevPiece = e.piece_num || '';

                                            journalDebit += e.debit;
                                            journalCredit += e.credit;

                                            tableRows.push([
                                                { content: showDate ? dateFr : '', styles: { fontSize: 7 } },
                                                { content: showPiece ? (e.piece_num || '') : '', styles: { fontSize: 7 } },
                                                { content: e.account, styles: { fontSize: 7 } },
                                                { content: e.account_name || '', styles: { fontSize: 7 } },
                                                { content: e.label || '', styles: { fontSize: 7 } },
                                                { content: fmtN(e.debit), styles: { halign: 'right', fontSize: 7 } },
                                                { content: fmtN(e.credit), styles: { halign: 'right', fontSize: 7 } },
                                            ]);
                                        }

                                        // ── JOURNAL SUBTOTAL (Sage-style: simple top border) ──
                                        tableRows.push([
                                            { content: '', styles: { cellPadding: { top: 1, bottom: 1 } } },
                                            { content: '', styles: {} },
                                            { content: '', styles: {} },
                                            { content: '', styles: {} },
                                            { content: `Total ${journalCode}`, styles: { fontStyle: 'bold', halign: 'right', fontSize: 7.5 } },
                                            { content: fmtN(journalDebit), styles: { fontStyle: 'bold', halign: 'right', fontSize: 7.5 } },
                                            { content: fmtN(journalCredit), styles: { fontStyle: 'bold', halign: 'right', fontSize: 7.5 } },
                                        ]);

                                        // Blank separator row
                                        tableRows.push([
                                            { content: '', colSpan: 7, styles: { cellPadding: 2 } },
                                        ]);

                                        grandDebit += journalDebit;
                                        grandCredit += journalCredit;
                                    }

                                    // ── GRAND TOTAL ──
                                    tableRows.push([
                                        { content: '', styles: {} },
                                        { content: '', styles: {} },
                                        { content: '', styles: {} },
                                        { content: '', styles: {} },
                                        { content: 'TOTAL GÉNÉRAL', styles: { fontStyle: 'bold', halign: 'right', fontSize: 8 } },
                                        { content: fmtN(grandDebit), styles: { fontStyle: 'bold', halign: 'right', fontSize: 8 } },
                                        { content: fmtN(grandCredit), styles: { fontStyle: 'bold', halign: 'right', fontSize: 8 } },
                                    ]);

                                    // ── DRAW HEADER ON FIRST PAGE ──
                                    const drawHeader = (startY: number) => {
                                        // Company name (top-left, Sage-style)
                                        doc.setFontSize(11);
                                        doc.setFont('helvetica', 'bold');
                                        doc.text('AutoCompta', 10, 10);
                                        doc.setFontSize(7);
                                        doc.setFont('helvetica', 'normal');
                                        doc.text('Comptabilité Générale', 10, 14);

                                        // Title (center)
                                        doc.setFontSize(14);
                                        doc.setFont('helvetica', 'bold');
                                        doc.text(journalTitle, pageWidth / 2, 10, { align: 'center' });

                                        // Edition date & period (top-right, Sage-style)
                                        doc.setFontSize(7);
                                        doc.setFont('helvetica', 'normal');
                                        doc.text(`Édition du ${printDate} à ${printTime}`, pageWidth - 10, 10, { align: 'right' });
                                        if (dateFilter) {
                                            const [y, m] = dateFilter.split('-');
                                            const mNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
                                            doc.text(`Période : ${mNames[parseInt(m) - 1] || m} ${y}`, pageWidth - 10, 14, { align: 'right' });
                                        }

                                        // Thin line under header
                                        doc.setDrawColor(0);
                                        doc.setLineWidth(0.3);
                                        doc.line(10, 16, pageWidth - 10, 16);
                                    };

                                    drawHeader(0);

                                    // ── RENDER TABLE ──
                                    autoTable(doc, {
                                        startY: 19,
                                        head: [[
                                            'Date', 'N° Pièce', 'N° Compte', 'Intitulé du compte', 'Libellé',
                                            { content: 'Débit', styles: { halign: 'right' } },
                                            { content: 'Crédit', styles: { halign: 'right' } }
                                        ]],
                                        body: tableRows,
                                        theme: 'plain',
                                        styles: {
                                            fontSize: 7,
                                            cellPadding: { top: 1, bottom: 1, left: 1.5, right: 1.5 },
                                            textColor: [0, 0, 0],
                                            lineColor: [0, 0, 0],
                                            lineWidth: 0,
                                            overflow: 'linebreak',
                                        },
                                        headStyles: {
                                            fontStyle: 'bold',
                                            fontSize: 7.5,
                                            halign: 'left',
                                            textColor: [0, 0, 0],
                                            lineWidth: { top: 0.3, bottom: 0.3 }, // Top and bottom lines for table header like Sage
                                            lineColor: [0, 0, 0],
                                            cellPadding: { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 },
                                        },
                                        columnStyles: {
                                            0: { cellWidth: 18 },                 // Date
                                            1: { cellWidth: 20 },                 // N° Pièce
                                            2: { cellWidth: 20 },                 // N° Compte
                                            3: { cellWidth: 45 },                 // Intitulé du compte
                                            4: { cellWidth: 'auto' },             // Libellé
                                            5: { cellWidth: 26, halign: 'right' }, // Débit
                                            6: { cellWidth: 26, halign: 'right' }, // Crédit
                                        },
                                        didParseCell: (data: any) => {
                                            // Draw top separator for specific rows: Group headers and Subtotals
                                            if (data.section === 'body') {
                                                const content = String(data.cell.raw.content || '');
                                                // Bold Group header -> underline it
                                                if (content.match(/^[A-Z]{2,}\s—\s/)) {
                                                    data.cell.styles.lineWidth = { bottom: 0.1 };
                                                    data.cell.styles.lineColor = [100, 100, 100];
                                                }
                                                // Total HA, Total VT... -> topline
                                                if (content.startsWith('Total ') && !content.includes('GÉNÉRAL')) {
                                                    data.cell.styles.lineWidth = { top: 0.1 };
                                                    data.cell.styles.lineColor = [100, 100, 100];
                                                    // apply top line to the rest of the row as well to maintain visual cohesion
                                                    if (data.column.index >= 4) {
                                                        data.cell.styles.lineWidth = { top: 0.1 };
                                                    }
                                                }
                                                // TOTAL GÉNÉRAL -> thick top & bottom lines
                                                if (content === 'TOTAL GÉNÉRAL') {
                                                    if (data.column.index >= 4) {
                                                        data.cell.styles.lineWidth = { top: 0.5, bottom: 0.5 };
                                                        data.cell.styles.lineColor = [0, 0, 0];
                                                    }
                                                }
                                            }
                                        },
                                        didDrawPage: (data: any) => {
                                            // Re-draw header on subsequent pages
                                            if (data.pageNumber > 1) {
                                                drawHeader(0);
                                            }
                                            // Footer
                                            doc.setFontSize(6.5);
                                            doc.setFont('helvetica', 'normal');
                                            doc.setTextColor(100, 100, 100);
                                            doc.text(`AutoCompta — ${printDate}`, 10, pageHeight - 6);
                                            doc.text(`Page ${data.pageNumber}`, pageWidth - 10, pageHeight - 6, { align: 'right' });
                                            doc.setTextColor(0, 0, 0);
                                        },
                                        margin: { top: 19, left: 10, right: 10, bottom: 12 },
                                    });

                                    doc.save(`Journal_${journalFilter}_${now.toISOString().split('T')[0]}.pdf`);
                                }}
                                className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 font-bold text-sm shadow-sm hover:bg-amber-100 rounded-xl transition-all"
                            >
                                <Download className="w-4 h-4" />
                                PDF
                            </button>
                        </div>
                    )}
                </div>

                {/* Content areas */}
                {activeTab !== 'asaisir' && activeTab !== 'sig' && activeTab !== 'tva' && (
                    <div className="ml-auto flex justify-end items-center gap-2 mb-4">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher…"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl font-mono w-48 focus:outline-none focus:ring-2 focus:ring-neo-blue"
                            />
                        </div>
                        <input
                            type="month"
                            value={dateFilter}
                            onChange={e => setDateFilter(e.target.value)}
                            className="px-3 py-2 text-sm border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-neo-blue"
                        />
                    </div>
                )}

                {/* ─── À SAISIR ───────────────────────────────── */}
                {activeTab === 'asaisir' && (<>
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 bg-teal-50/30 flex items-center justify-between">
                            <h2 className="font-bold text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Documents à comptabiliser
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-gray-500">{filteredPendingDocs.length}/{pendingDocs.length} en attente</span>
                                {selectedDocs.size > 0 && (
                                    <button
                                        onClick={handleComptabiliser}
                                        disabled={comptabilising}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-bold text-sm border border-slate-200 rounded-xl shadow-md hover:shadow-md-lg hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                                    >
                                        {comptabilising ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4" />
                                        )}
                                        Comptabiliser ({selectedDocs.size})
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter bar */}
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50">
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Search */}
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher fournisseur, réf, n° facture…"
                                        value={pendingSearch}
                                        onChange={e => setPendingSearch(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white"
                                    />
                                    {pendingSearch && (
                                        <button onClick={() => setPendingSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                                            <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                                        </button>
                                    )}
                                </div>
                                {/* Type */}
                                <select
                                    value={pendingType}
                                    onChange={e => setPendingType(e.target.value)}
                                    className="px-3 py-2 text-sm border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white cursor-pointer"
                                >
                                    <option value="all">Tous types</option>
                                    <option value="invoice">Facture</option>
                                    <option value="receipt">Reçu</option>
                                    <option value="credit_note">Avoir</option>
                                </select>
                                {/* Sort */}
                                <select
                                    value={pendingSortBy}
                                    onChange={e => setPendingSortBy(e.target.value as any)}
                                    className="px-3 py-2 text-sm border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white cursor-pointer"
                                >
                                    <option value="date">Trier par date</option>
                                    <option value="supplier">Trier par fournisseur</option>
                                    <option value="amount">Trier par montant</option>
                                    <option value="ref">Trier par réf.</option>
                                </select>
                                <button
                                    onClick={() => setPendingSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    className="flex items-center gap-1 px-2.5 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
                                    title={pendingSortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
                                >
                                    {pendingSortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                </button>
                                {/* Toggle advanced */}
                                <button
                                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                    className={`flex items-center gap-1 px-3 py-2 text-sm rounded-xl font-bold transition-all border ${showAdvancedFilters
                                        ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                                        : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                                        }`}
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    Filtres
                                </button>
                                {/* Reset */}
                                {hasActiveFilters && (
                                    <button
                                        onClick={resetPendingFilters}
                                        className="flex items-center gap-1 px-3 py-2 text-sm border border-red-200 rounded-xl text-red-500 hover:bg-red-50 font-bold transition-all"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Réinitialiser
                                    </button>
                                )}
                            </div>

                            {/* Advanced filters row */}
                            {showAdvancedFilters && (
                                <div className="flex items-center gap-3 mt-3 flex-wrap">
                                    <div className="flex items-center gap-1">
                                        <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-xs text-gray-500 font-semibold">Date:</span>
                                        <input
                                            type="date"
                                            value={pendingDateFrom}
                                            onChange={e => setPendingDateFrom(e.target.value)}
                                            className="px-2 py-1 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        />
                                        <span className="text-xs text-gray-400">→</span>
                                        <input
                                            type="date"
                                            value={pendingDateTo}
                                            onChange={e => setPendingDateTo(e.target.value)}
                                            className="px-2 py-1 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-gray-500 font-semibold">Montant TTC:</span>
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={pendingMinAmount}
                                            onChange={e => setPendingMinAmount(e.target.value)}
                                            className="w-24 px-2 py-1 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        />
                                        <span className="text-xs text-gray-400">→</span>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={pendingMaxAmount}
                                            onChange={e => setPendingMaxAmount(e.target.value)}
                                            className="w-24 px-2 py-1 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {pendingDocs.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-green-50 border border-green-200 mx-auto mb-4 flex items-center justify-center">
                                    <FileCheck className="w-8 h-8 text-green-500" />
                                </div>
                                <p className="text-gray-500 font-semibold">Tous les documents sont comptabilisés ✓</p>
                                <p className="text-xs text-gray-400 mt-1">Consultez le Journal pour voir les écritures</p>
                            </div>
                        ) : filteredPendingDocs.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-400 font-semibold">Aucun document ne correspond aux filtres</p>
                                <button onClick={resetPendingFilters} className="text-xs text-indigo-600 hover:underline mt-1">Réinitialiser les filtres</button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-slate-200 font-semibold text-xs uppercase tracking-wider text-gray-600">
                                            <th className="px-4 py-3 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDocs.size === filteredPendingDocs.length && filteredPendingDocs.length > 0}
                                                    onChange={toggleAll}
                                                    className="w-4 h-4 accent-neo-blue cursor-pointer"
                                                />
                                            </th>
                                            <th className="text-left px-4 py-3">Réf.</th>
                                            <th className="text-left px-4 py-3">Date</th>
                                            <th className="text-left px-4 py-3">Fournisseur</th>
                                            <th className="text-right px-4 py-3">HT</th>
                                            <th className="text-right px-4 py-3">TVA</th>
                                            <th className="text-right px-4 py-3">TTC</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPendingDocs.map(doc => {
                                            const d = doc.extracted_data;
                                            const isSelected = selectedDocs.has(doc.id);
                                            return (
                                                <tr
                                                    key={doc.id}
                                                    onClick={() => toggleDoc(doc.id)}
                                                    className={`border-b border-gray-100 cursor-pointer transition-all ${isSelected
                                                        ? 'bg-indigo-50/10 border-l-4 border-l-neo-blue'
                                                        : 'hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleDoc(doc.id)}
                                                            onClick={e => e.stopPropagation()}
                                                            className="w-4 h-4 accent-neo-blue cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-mono border border-slate-200">
                                                            {doc.internal_ref || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{d?.date || '—'}</td>
                                                    <td className="px-4 py-3 font-medium text-gray-700">{d?.supplier || doc.original_name}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-gray-700">{d?.amount_ht ? fmt(Number(d.amount_ht)) : '—'}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-gray-700">{d?.tva_amount ? fmt(Number(d.tva_amount)) : '—'}</td>
                                                    <td className="px-4 py-3 text-right font-mono font-bold">{d?.total_amount ? fmt(Number(d.total_amount)) : '—'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* ─── TEXTE → ÉCRITURES (inside À saisir) ─── */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl mt-4">
                        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-blue-50 flex items-center justify-between">
                            <h2 className="font-bold text-lg flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-600" />
                                Texte → Écritures comptables
                            </h2>

                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block font-semibold text-sm mb-2">Collez ou saisissez le texte du document</label>
                                <textarea
                                    value={texteInput}
                                    onChange={e => setTexteInput(e.target.value)}
                                    placeholder="Collez ici le texte de votre facture, reçu ou opération comptable…"
                                    rows={6}
                                    className="w-full p-4 border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-y bg-slate-50"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={async () => {
                                        if (!texteInput.trim()) return;
                                        setTexteLoading(true);
                                        setTexteError('');
                                        setTexteResult(null);
                                        try {
                                            const { data: { user } } = await supabase.auth.getUser();
                                            const res = await fetch('/api/pipeline-entries', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ text: texteInput, userId: user?.id }),
                                            });
                                            const json = await res.json();
                                            if (json.success) {
                                                setTexteResult(json.data);
                                            } else {
                                                setTexteError(json.error || 'Erreur inconnue');
                                            }
                                        } catch (err: any) {
                                            setTexteError(err.message || 'Erreur réseau');
                                        }
                                        setTexteLoading(false);
                                    }}
                                    disabled={texteLoading || !texteInput.trim()}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-bold border border-slate-200 rounded-xl shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                                >
                                    {texteLoading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours…</>
                                    ) : (
                                        <><Sparkles className="w-4 h-4" /> Générer les écritures</>
                                    )}
                                </button>
                                {texteResult && (
                                    <button
                                        onClick={() => { setTexteResult(null); setTexteInput(''); }}
                                        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-red-600 border border-gray-300 hover:border-red-300 transition-all"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" /> Recommencer
                                    </button>
                                )}
                            </div>

                            {texteError && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-300 text-red-700 text-sm">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {texteError}
                                </div>
                            )}

                            {texteResult && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="bg-purple-100 text-purple-800 px-3 py-1 text-xs font-bold border border-purple-300">
                                            {texteResult.journal || 'OD'}
                                        </span>
                                        <span className="font-semibold text-sm">{texteResult.description}</span>
                                        {texteResult.supplier && (
                                            <span className="text-xs text-gray-500">• {texteResult.supplier}</span>
                                        )}
                                        {texteResult.date && (
                                            <span className="text-xs text-gray-500 font-mono">• {texteResult.date}</span>
                                        )}
                                    </div>

                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider">
                                                    <th className="text-left px-4 py-2.5">Compte</th>
                                                    <th className="text-left px-4 py-2.5">Libellé</th>
                                                    <th className="text-right px-4 py-2.5">Débit</th>
                                                    <th className="text-right px-4 py-2.5">Crédit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(Array.isArray(texteResult.entries) ? texteResult.entries : []).map((e: any, i: number) => (
                                                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                                                        <td className="px-4 py-2.5 font-mono">
                                                            <span className="font-bold">{e.account}</span>
                                                            <span className="text-gray-500 ml-2 text-xs">{e.account_name}</span>
                                                        </td>
                                                        <td className="px-4 py-2.5">{e.label}</td>
                                                        <td className="px-4 py-2.5 text-right font-mono font-semibold">
                                                            {e.debit > 0 ? fmt(e.debit) : ''}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right font-mono font-semibold">
                                                            {e.credit > 0 ? fmt(e.credit) : ''}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t border-slate-200 bg-gray-100 font-bold">
                                                    <td colSpan={2} className="px-4 py-2.5 text-right uppercase text-xs tracking-wider">Total</td>
                                                    <td className="px-4 py-2.5 text-right font-mono">
                                                        {fmt((Array.isArray(texteResult.entries) ? texteResult.entries : []).reduce((s: number, e: any) => s + (e.debit || 0), 0) || 0)}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-mono">
                                                        {fmt((Array.isArray(texteResult.entries) ? texteResult.entries : []).reduce((s: number, e: any) => s + (e.credit || 0), 0) || 0)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={async () => {
                                                setTexteSaving(true);
                                                try {
                                                    const { data: { user } } = await supabase.auth.getUser();
                                                    if (!user) { alert('Non connecté'); setTexteSaving(false); return; }
                                                    const date = normalizeDate(texteResult.date || new Date().toISOString().split('T')[0]);
                                                    const ref = null;

                                                    const journal = texteResult.journal || 'OD';
                                                    const safeEntries = Array.isArray(texteResult.entries) ? texteResult.entries : [];

                                                    // No piece_num for manual entries generated via AI text
                                                    const pieceNum = null;

                                                    // 2. Discover and assign Tiers
                                                    const finalRows = [];
                                                    for (const e of safeEntries) {
                                                        let finalAccount = e.account;
                                                        let finalAccName = e.account_name;

                                                        // Auto Tiers logic for 4411 (Fournisseurs) or 3421 (Clients)
                                                        if (e.account === '4411' || e.account === '3421') {
                                                            const sName = e.account_name.replace(/fournisseurs?|clients?/i, '').replace(/[-:]/g, '').trim() || 'Inconnu';
                                                            const tierType = e.account === '4411' ? 'fournisseur' : 'client';
                                                            const baseCode = e.account === '4411' ? '4411000' : '3421000';

                                                            const { data: tiersData } = await supabase.from('tiers').select('*').eq('name', sName).eq('user_id', user.id).single();

                                                            if (tiersData) {
                                                                finalAccount = tiersData.account_code_aux;
                                                                finalAccName = tiersData.name;
                                                            } else {
                                                                const { data: maxTiers } = await supabase.from('tiers')
                                                                    .select('account_code_aux')
                                                                    .eq('user_id', user.id)
                                                                    .like('account_code_aux', `${baseCode}%`)
                                                                    .order('account_code_aux', { ascending: false })
                                                                    .limit(1)
                                                                    .single();

                                                                let nextNum = 1;
                                                                if (maxTiers && maxTiers.account_code_aux) {
                                                                    nextNum = parseInt(maxTiers.account_code_aux.replace(baseCode, '')) + 1;
                                                                }
                                                                finalAccount = `${baseCode}${nextNum}`;
                                                                finalAccName = sName;

                                                                await supabase.from('tiers').insert({
                                                                    user_id: user.id,
                                                                    type: tierType,
                                                                    name: finalAccName,
                                                                    account_code_aux: finalAccount
                                                                });
                                                            }
                                                        }

                                                        finalRows.push({
                                                            user_id: user.id,
                                                            entry_date: date,
                                                            journal,
                                                            ref,
                                                            piece_num: pieceNum,
                                                            account: finalAccount,
                                                            account_name: finalAccName,
                                                            label: e.label,
                                                            debit: e.debit || 0,
                                                            credit: e.credit || 0,
                                                        });
                                                    }

                                                    const { error } = await supabase.from('journal_entries').insert(finalRows);
                                                    if (error) {
                                                        alert(`Erreur: ${error.message}`);
                                                    } else {
                                                        setTexteResult(null);
                                                        setTexteInput('');
                                                        await fetchEntries();
                                                        await fetchTiers();
                                                        setActiveTab('journal');
                                                    }
                                                } catch (err: any) {
                                                    alert(`Erreur: ${err.message}`);
                                                }
                                                setTexteSaving(false);
                                            }}
                                            disabled={texteSaving}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-sky-50 text-slate-800 font-bold border border-slate-200 rounded-xl shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50"
                                        >
                                            {texteSaving ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</>
                                            ) : (
                                                <><Check className="w-4 h-4" /> Valider et enregistrer dans le Journal</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>)
                }

                {/* ─── JOURNAL ─────────────────────────────────── */}
                {
                    activeTab === 'journal' && (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                                <h2 className="font-bold text-lg flex items-center gap-2">
                                    <BookOpen className="w-5 h-5" />
                                    Journal des écritures
                                </h2>
                                <span className="text-xs font-mono text-gray-500">{filteredEntries.length} écritures</span>
                            </div>

                            {/* Multi-journal filter tabs */}
                            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50/50 flex items-center gap-1 flex-wrap">
                                {(['tous', 'HA', 'BQ', 'CA', 'OD'] as JournalFilter[]).map(jf => (
                                    <button
                                        key={jf}
                                        onClick={() => setJournalFilter(jf)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${journalFilter === jf
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                            }`}
                                    >
                                        {jf === 'tous' ? 'Tous' : jf === 'HA' ? '📦 Achats' : jf === 'BQ' ? '🏦 Banque' : jf === 'CA' ? '💵 Caisse' : '📝 OD'}
                                    </button>
                                ))}
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-slate-200 font-semibold text-xs uppercase tracking-wider text-gray-600">
                                            <th className="text-left px-3 py-3 w-16">Jour.</th>
                                            <th className="text-left px-3 py-3 w-28">N° Pièce</th>
                                            <th className="text-left px-3 py-3 w-24">Date</th>
                                            <th className="text-left px-3 py-3 w-32">Réf.</th>
                                            <th className="text-left px-3 py-3 w-24">N° Compte</th>
                                            <th className="text-left px-3 py-3">Libellé</th>
                                            <th className="text-center px-3 py-3 w-20">Lettrage</th>
                                            <th className="text-right px-3 py-3 w-24">Débit</th>
                                            <th className="text-right px-3 py-3 w-24">Crédit</th>
                                            <th className="text-center px-3 py-3 w-40">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEntries.length === 0 ? (
                                            <tr>
                                                <td colSpan={10} className="text-center py-12 text-gray-400 font-semibold">
                                                    Aucune écriture — comptabilisez des documents depuis l&apos;onglet &quot;À saisir&quot;
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredEntries.map((entry, idx) => {
                                                const currentKey = entry.doc_id || entry.piece_num || entry.id;
                                                const prevKey = idx > 0 ? (filteredEntries[idx - 1].doc_id || filteredEntries[idx - 1].piece_num || filteredEntries[idx - 1].id) : null;
                                                const nextKey = idx < filteredEntries.length - 1 ? (filteredEntries[idx + 1].doc_id || filteredEntries[idx + 1].piece_num || filteredEntries[idx + 1].id) : null;

                                                const isFirstOfGroup = idx === 0 || currentKey !== prevKey;
                                                const isLastOfGroup = idx === filteredEntries.length - 1 || currentKey !== nextKey;
                                                const doc = entry.doc_id ? documents.find(d => d.id === entry.doc_id) : null;
                                                const groupSize = filteredEntries.filter(e => (e.doc_id || e.piece_num) === currentKey).length;
                                                return (
                                                    <tr
                                                        key={entry.id}
                                                        className={`border-b border-gray-100 hover:bg-teal-50/10 transition-colors ${isFirstOfGroup ? 'border-t border-t-gray-200' : ''}`}
                                                    >
                                                        <td className="px-3 py-2.5">
                                                            <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 border uppercase ${entry.journal === 'HA' ? 'bg-blue-50 text-blue-700 border-blue-200' : entry.journal === 'BQ' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : entry.journal === 'CA' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                                {entry.journal}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 font-mono text-xs font-bold text-gray-700">
                                                            {isFirstOfGroup && entry.piece_num ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono font-bold border border-slate-200">
                                                                    {entry.piece_num}
                                                                </span>
                                                            ) : ''}
                                                        </td>
                                                        <td className="px-3 py-2.5 font-mono text-xs text-gray-600">
                                                            {isFirstOfGroup && entry.entry_date ? new Date(entry.entry_date).toLocaleDateString('fr-FR') : ''}
                                                        </td>
                                                        <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap">
                                                            {isFirstOfGroup ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-mono border border-slate-200">{entry.ref}</span>
                                                            ) : ''}
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-mono font-bold border border-indigo-200">
                                                                {entry.account}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-gray-700 truncate max-w-xs" title={entry.label}>
                                                            <span className="text-xs text-gray-400 mr-1">{entry.account_name}</span>
                                                            <br />
                                                            <span className="font-medium text-xs">{entry.label}</span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            {entry.lettre_code && (
                                                                <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full border border-blue-200 shadow-sm" title={`Lettré: ${entry.lettre_code}`}>
                                                                    {entry.lettre_code}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-green-700">
                                                            {fmt(entry.debit)}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-red-600">
                                                            {fmt(entry.credit)}
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <div className="flex items-center gap-1.5 justify-center">
                                                                {isFirstOfGroup && doc && entry.journal === 'HA' && (
                                                                    <>
                                                                        {doc.accounting_status === 'saisi' && (
                                                                            <button
                                                                                disabled={reglementInProgress.has(doc.id)}
                                                                                onClick={() => handleReglement(doc.id, doc.extracted_data?.payment_method || 'virement')}
                                                                                className={`group relative flex items-center justify-center p-1.5 transition-colors rounded ${reglementInProgress.has(doc.id) ? 'text-gray-400 cursor-not-allowed' : 'text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200'}`}
                                                                            >
                                                                                <Banknote className="w-4 h-4" />
                                                                                <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] font-bold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10 pointer-events-none shadow-sm">
                                                                                    {reglementInProgress.has(doc.id) ? 'Règlement en cours...' : 'Régler'}
                                                                                </span>
                                                                            </button>
                                                                        )}
                                                                        {/* (Réglé status fully removed as payment auto-lettres -> Lettre) */}
                                                                        {doc.accounting_status === 'annule' && (
                                                                            <span className="flex items-center gap-1 whitespace-nowrap text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-500 border border-gray-300 rounded">
                                                                                <span>×</span>
                                                                                <span>Annulé</span>
                                                                            </span>
                                                                        )}
                                                                        {doc.accounting_status !== 'annule' && (
                                                                            <button
                                                                                onClick={() => handleAnnuler(doc.id)}
                                                                                className="group relative flex items-center justify-center p-1.5 text-orange-500 hover:bg-orange-50 border border-transparent hover:border-orange-200 transition-colors rounded"
                                                                            >
                                                                                <Undo2 className="w-4 h-4" />
                                                                                <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] font-bold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10 pointer-events-none shadow-sm">
                                                                                    Annuler saisie
                                                                                </span>
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}
                                                                <button
                                                                    onClick={() => startEditEntry(entry)}
                                                                    className="group relative flex items-center justify-center p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/10 border border-transparent hover:border-neo-blue/30 transition-colors rounded"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                    <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] font-bold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10 pointer-events-none shadow-sm">
                                                                        Modifier
                                                                    </span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteEntry(entry.id)}
                                                                    onBlur={() => { if (confirmDeleteId === entry.id) setConfirmDeleteId(null); }}
                                                                    className={`group relative flex items-center justify-center p-1.5 border transition-colors rounded ${confirmDeleteId === entry.id
                                                                        ? 'text-white bg-red-600 border-red-700'
                                                                        : 'text-gray-500 hover:text-red-600 hover:bg-red-50 border-transparent hover:border-red-200'
                                                                        }`}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] font-bold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10 pointer-events-none shadow-sm">
                                                                        {confirmDeleteId === entry.id ? 'Confirmer ?' : 'Supprimer'}
                                                                    </span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                    {filteredEntries.length > 0 && (
                                        <tfoot>
                                            <tr className="bg-slate-900 text-white font-bold">
                                                <td colSpan={7} className="px-4 py-3 text-right uppercase text-xs tracking-wider">Totaux</td>
                                                <td className="px-4 py-3 text-right font-mono">{fmt(totalDebit)}</td>
                                                <td className="px-4 py-3 text-right font-mono">{fmt(totalCredit)}</td>
                                                <td colSpan={1}></td>
                                            </tr>
                                            <tr className={`font-semibold text-xs ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                <td colSpan={10} className="px-4 py-2 text-center font-bold">
                                                    {Math.abs(totalDebit - totalCredit) < 0.01
                                                        ? '✓ Équilibre vérifié — Débit = Crédit'
                                                        : `⚠ Écart de ${fmt(Math.abs(totalDebit - totalCredit))} MAD`
                                                    }
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    )
                }

                {/* ─── Edit Entry Modal ──────────────────────────── */}
                {
                    editingEntry && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingEntry(null)}>
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                                <div className="px-6 py-3 border-b border-slate-200 bg-indigo-50/20 flex items-center justify-between">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <Pencil className="w-4 h-4" /> Modifier l&apos;écriture
                                    </h3>
                                    <button onClick={() => setEditingEntry(null)} className="p-1 hover:bg-red-100 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Compte</label>
                                            <input
                                                value={editForm.account}
                                                onChange={e => setEditForm(f => ({ ...f, account: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neo-blue"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nom du compte</label>
                                            <input
                                                value={editForm.account_name}
                                                onChange={e => setEditForm(f => ({ ...f, account_name: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neo-blue"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Libellé</label>
                                        <input
                                            value={editForm.label}
                                            onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neo-blue"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Débit</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editForm.debit}
                                                onChange={e => setEditForm(f => ({ ...f, debit: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm text-green-700 focus:outline-none focus:ring-2 focus:ring-neo-blue"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Crédit</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editForm.credit}
                                                onChange={e => setEditForm(f => ({ ...f, credit: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm text-red-600 focus:outline-none focus:ring-2 focus:ring-neo-blue"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 pt-3 pb-1 border-t border-gray-100 mt-2">
                                        <input
                                            type="checkbox"
                                            id="syncOtherLines"
                                            checked={syncOtherLines}
                                            onChange={(e) => setSyncOtherLines(e.target.checked)}
                                            className="w-4 h-4 mt-0.5 cursor-pointer accent-neo-blue"
                                        />
                                        <label htmlFor="syncOtherLines" className="text-[11px] font-bold uppercase text-gray-500 cursor-pointer select-none leading-tight">
                                            Synchroniser les autres comptes de la pièce proportionnellement<br />
                                            <span className="font-normal text-[10px] normal-case text-gray-400">Garde l'équilibre de la facture (TVA et TTC s'ajustent automatiquement)</span>
                                        </label>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            onClick={() => setEditingEntry(null)}
                                            className="px-4 py-2 font-bold text-sm border border-slate-200 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleSaveEdit}
                                            className="px-4 py-2 font-bold text-sm border border-slate-200 rounded-xl bg-indigo-50 text-white hover:bg-indigo-50/80 transition-colors flex items-center gap-1"
                                        >
                                            <Save className="w-4 h-4" /> Enregistrer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* ─── GRAND LIVRE ─────────────────────────────── */}
                {
                    activeTab === 'grandlivre' && (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                                    <h3 className="font-bold text-sm flex items-center justify-between">
                                        <span className="flex items-center gap-2"><Hash className="w-4 h-4" /> Comptes</span>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" checked={showSubAccountsGrandLivre} onChange={e => setShowSubAccountsGrandLivre(e.target.checked)} className="w-3 h-3 accent-neo-blue" />
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">Détail</span>
                                        </label>
                                    </h3>
                                </div>
                                <div className="max-h-[500px] overflow-y-auto">
                                    {(() => {
                                        const parentMap = new Map<string, { account: string, name: string, debit: number, credit: number }>();
                                        const subMap = new Map<string, Map<string, { account: string, name: string, debit: number, credit: number }>>();

                                        for (const e of allEntries) {
                                            const parentCode = getCompteCollectifParent(e.account) || e.account;
                                            const isSub = parentCode !== e.account;

                                            if (!parentMap.has(parentCode)) {
                                                parentMap.set(parentCode, { account: parentCode, name: COMPTES_COLLECTIFS[parentCode] || getCompteCollectifParent(parentCode) ? COMPTES_COLLECTIFS[parentCode] : getAccountName(parentCode), debit: 0, credit: 0 });
                                            }
                                            const p = parentMap.get(parentCode)!;

                                            if (isSub) {
                                                if (!subMap.has(parentCode)) subMap.set(parentCode, new Map());
                                                const subs = subMap.get(parentCode)!;
                                                if (!subs.has(e.account)) {
                                                    subs.set(e.account, { account: e.account, name: e.account_name || getAccountName(e.account), debit: 0, credit: 0 });
                                                }
                                                const s = subs.get(e.account)!;

                                                p.debit += e.debit;
                                                p.credit += e.credit;
                                                s.debit += e.debit;
                                                s.credit += e.credit;
                                            } else {
                                                p.debit += e.debit;
                                                p.credit += e.credit;
                                            }
                                        }

                                        const parents = Array.from(parentMap.values()).sort((a, b) => a.account.localeCompare(b.account));
                                        const renderRows: React.ReactNode[] = [];

                                        for (const acc of parents) {
                                            const hasSubs = subMap.has(acc.account) && subMap.get(acc.account)!.size > 0;
                                            const isExpanded = showSubAccountsGrandLivre || expandedGrandLivreAccounts.has(acc.account);
                                            const solde = acc.debit - acc.credit;

                                            renderRows.push(
                                                <button
                                                    key={acc.account}
                                                    onClick={() => setSelectedAccount(selectedAccount === acc.account ? null : acc.account)}
                                                    className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-all flex items-center justify-between ${selectedAccount === acc.account
                                                        ? 'bg-indigo-50/20 border-l-4 border-l-neo-blue'
                                                        : 'hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-1">
                                                            {hasSubs && (
                                                                <div onClick={(e) => { e.stopPropagation(); toggleGrandLivreAccount(acc.account); }} className="text-gray-400 p-1 hover:bg-gray-200 transition-colors flex items-center justify-center -ml-1 rounded">
                                                                    {isExpanded ? <ChevronRight className="w-3 h-3 rotate-90 transition-transform" /> : <ChevronRight className="w-3 h-3 transition-transform" />}
                                                                </div>
                                                            )}
                                                            <span className="font-mono text-xs font-bold">{acc.account}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{acc.name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`text-xs font-mono font-bold ${solde >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                                            {fmt(Math.abs(solde))}
                                                        </span>
                                                        <div className="flex items-center justify-end mt-1">
                                                            {solde > 0 ? <TrendingUp className="w-3 h-3 text-green-500" /> :
                                                                solde < 0 ? <TrendingDown className="w-3 h-3 text-red-500" /> :
                                                                    <Minus className="w-3 h-3 text-gray-400" />}
                                                        </div>
                                                    </div>
                                                </button>
                                            );

                                            if (hasSubs && isExpanded) {
                                                const subs = Array.from(subMap.get(acc.account)!.values()).sort((a, b) => a.account.localeCompare(b.account));
                                                for (const s of subs) {
                                                    const sSolde = s.debit - s.credit;
                                                    renderRows.push(
                                                        <button
                                                            key={s.account}
                                                            onClick={() => setSelectedAccount(selectedAccount === s.account ? null : s.account)}
                                                            className={`w-full text-left px-4 py-2 pl-8 border-b border-gray-50 bg-gray-50/50 transition-all flex items-center justify-between ${selectedAccount === s.account
                                                                ? 'bg-indigo-50/10 border-l-4 border-l-neo-blue'
                                                                : 'hover:bg-teal-50/5'
                                                                }`}
                                                        >
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 border-l border-b border-gray-300"></div>
                                                                    <span className="font-mono text-[11px] text-gray-500">{s.account}</span>
                                                                </div>
                                                                <p className="text-[11px] text-gray-400 truncate max-w-[150px] ml-4">{s.name}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className={`text-[11px] font-mono font-bold ${sSolde >= 0 ? 'text-green-700/80' : 'text-red-600/80'}`}>
                                                                    {fmt(Math.abs(sSolde))}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    );
                                                }
                                            }
                                        }
                                        return renderRows.length > 0 ? renderRows : <p className="text-center py-8 text-gray-400 text-sm">Aucun compte</p>;
                                    })()}
                                </div>
                            </div>

                            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl overflow-hidden">
                                {selectedAccount ? (
                                    <>
                                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                                            <h3 className="font-bold text-lg">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-mono font-bold border border-indigo-200 mr-2">{selectedAccount}</span>
                                                {getAccountName(selectedAccount)}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase">Du</label>
                                                <input type="date" value={reportDateFrom} onChange={e => setReportDateFrom(e.target.value)} className="px-2 py-1 text-sm border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-neo-blue" />
                                                <label className="text-xs font-bold text-gray-500 uppercase ml-2">Au</label>
                                                <input type="date" value={reportDateTo} onChange={e => setReportDateTo(e.target.value)} className="px-2 py-1 text-sm border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-neo-blue" />
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-slate-200 font-semibold text-xs uppercase tracking-wider text-gray-600">
                                                        <th className="text-left px-4 py-3">Date</th>
                                                        <th className="text-left px-4 py-3">Réf.</th>
                                                        <th className="text-left px-4 py-3">Libellé</th>
                                                        <th className="text-right px-4 py-3">Débit</th>
                                                        <th className="text-right px-4 py-3">Crédit</th>
                                                        <th className="text-right px-4 py-3">Solde</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(() => {
                                                        const accountEntries = filteredEntries.filter(e => {
                                                            if (e.account === selectedAccount) return true;
                                                            // Include sub-accounts of a collective parent
                                                            const parent = getCompteCollectifParent(e.account);
                                                            return parent === selectedAccount;
                                                        });

                                                        let ranDebit = 0;
                                                        let ranCredit = 0;
                                                        const periodEntries = [];

                                                        for (const e of accountEntries) {
                                                            if (reportDateFrom && e.entry_date < reportDateFrom) {
                                                                ranDebit += e.debit;
                                                                ranCredit += e.credit;
                                                            } else if (!reportDateTo || e.entry_date <= reportDateTo) {
                                                                periodEntries.push(e);
                                                            }
                                                        }

                                                        let runningBalance = ranDebit - ranCredit;

                                                        return (
                                                            <>
                                                                {(reportDateFrom && (ranDebit > 0 || ranCredit > 0)) && (
                                                                    <tr className="bg-gray-200 border-b border-slate-200">
                                                                        <td colSpan={3} className="px-4 py-2.5 text-right font-bold text-xs uppercase tracking-wider text-gray-700">Report à Nouveau au {reportDateFrom}</td>
                                                                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-green-700">{fmt(ranDebit)}</td>
                                                                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-red-600">{fmt(ranCredit)}</td>
                                                                        <td className={`px-4 py-2.5 text-right font-mono font-bold ${runningBalance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                                                                            {fmt(Math.abs(runningBalance))} {runningBalance >= 0 ? 'D' : 'C'}
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                                {periodEntries.map(entry => {
                                                                    runningBalance += entry.debit - entry.credit;
                                                                    return (
                                                                        <tr key={entry.id} className="border-b border-gray-100 hover:bg-teal-50/10">
                                                                            <td className="px-4 py-2.5 font-mono text-xs">{entry.entry_date}</td>
                                                                            <td className="px-4 py-2.5 font-mono text-xs">
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-mono border border-slate-200 max-w-[max-content]">{entry.ref}</span>
                                                                            </td>
                                                                            <td className="px-4 py-2.5 text-gray-700">
                                                                                {entry.lettre_code && (
                                                                                    <span className="mr-2 inline-flex items-center justify-center w-4 h-4 bg-blue-100 text-blue-800 text-[9px] font-bold rounded-full border border-blue-200 shadow-sm" title={`Lettré: ${entry.lettre_code}`}>
                                                                                        {entry.lettre_code}
                                                                                    </span>
                                                                                )}
                                                                                {entry.label}
                                                                            </td>
                                                                            <td className="px-4 py-2.5 text-right font-mono font-semibold text-green-700">{fmt(entry.debit)}</td>
                                                                            <td className="px-4 py-2.5 text-right font-mono font-semibold text-red-600">{fmt(entry.credit)}</td>
                                                                            <td className={`px-4 py-2.5 text-right font-mono font-bold ${runningBalance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                                                                                {fmt(Math.abs(runningBalance))} {runningBalance >= 0 ? 'D' : 'C'}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                                <tr className="bg-indigo-50/5 border-t border-slate-200 font-semibold text-xs">
                                                                    <td colSpan={3} className="px-4 py-3 text-right font-bold uppercase tracking-wider">Total Période</td>
                                                                    <td className="px-4 py-3 text-right font-mono font-bold">{fmt(periodEntries.reduce((s, e) => s + e.debit, 0))}</td>
                                                                    <td className="px-4 py-3 text-right font-mono font-bold">{fmt(periodEntries.reduce((s, e) => s + e.credit, 0))}</td>
                                                                    <td className="px-4 py-3 bg-slate-900 text-white text-right font-mono font-bold">
                                                                        Soldé: {fmt(Math.abs(runningBalance))} {runningBalance >= 0 ? 'D' : 'C'}
                                                                    </td>
                                                                </tr>
                                                            </>
                                                        );
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-12 text-center">
                                        <div className="w-16 h-16 bg-gray-100 border border-gray-200 mx-auto mb-4 flex items-center justify-center">
                                            <ChevronRight className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <p className="text-gray-400 font-semibold">Sélectionnez un compte à gauche</p>
                                        <p className="text-xs text-gray-300 mt-1">pour voir le détail des écritures</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* ─── BALANCE ─────────────────────────────────── */}
                {
                    activeTab === 'balance' && (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                                <h2 className="font-bold text-lg flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5" /> Balance Générale
                                </h2>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-mono text-gray-500">{accountsList.length} comptes</span>

                                    <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Du</label>
                                        <input type="date" value={reportDateFrom} onChange={e => setReportDateFrom(e.target.value)} className="px-2 py-1 text-sm border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-neo-blue" />
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-2">Au</label>
                                        <input type="date" value={reportDateTo} onChange={e => setReportDateTo(e.target.value)} className="px-2 py-1 text-sm border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-neo-blue" />
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-slate-200 font-semibold text-xs uppercase tracking-wider text-gray-600">
                                            <th className="text-left px-4 py-3 w-20">N° Compte</th>
                                            <th className="text-left px-4 py-3">Libellé</th>
                                            <th className="text-right px-4 py-3 w-28" title="Solde Débiteur Début">RAN Débit</th>
                                            <th className="text-right px-4 py-3 w-28" title="Solde Créditeur Début">RAN Crédit</th>
                                            <th className="text-right px-4 py-3 w-28">Mvt Débit</th>
                                            <th className="text-right px-4 py-3 w-28">Mvt Crédit</th>
                                            <th className="text-right px-4 py-3 w-28" title="Solde Débiteur Fin">Solde Fin D.</th>
                                            <th className="text-right px-4 py-3 w-28" title="Solde Créditeur Fin">Solde Fin C.</th>
                                        </tr>
                                    </thead>
                                    {(() => {
                                        const parentMap = new Map<string, { account: string, name: string, ranD: number, ranC: number, mvtD: number, mvtC: number }>();
                                        const subMap = new Map<string, Map<string, { account: string, name: string, ranD: number, ranC: number, mvtD: number, mvtC: number }>>();

                                        for (const e of filteredEntries) {
                                            const parentCode = getCompteCollectifParent(e.account) || e.account;
                                            const isSub = parentCode !== e.account;

                                            if (!parentMap.has(parentCode)) {
                                                parentMap.set(parentCode, { account: parentCode, name: COMPTES_COLLECTIFS[parentCode] || getCompteCollectifParent(parentCode) ? COMPTES_COLLECTIFS[parentCode] : getAccountName(parentCode), ranD: 0, ranC: 0, mvtD: 0, mvtC: 0 });
                                            }
                                            const p = parentMap.get(parentCode)!;

                                            if (isSub) {
                                                if (!subMap.has(parentCode)) subMap.set(parentCode, new Map());
                                                const subs = subMap.get(parentCode)!;
                                                if (!subs.has(e.account)) {
                                                    subs.set(e.account, { account: e.account, name: e.account_name || getAccountName(e.account), ranD: 0, ranC: 0, mvtD: 0, mvtC: 0 });
                                                }
                                                const s = subs.get(e.account)!;

                                                if (reportDateFrom && e.entry_date < reportDateFrom) {
                                                    if (e.debit > 0) { p.ranD += e.debit; s.ranD += e.debit; }
                                                    if (e.credit > 0) { p.ranC += e.credit; s.ranC += e.credit; }
                                                } else if (!reportDateTo || e.entry_date <= reportDateTo) {
                                                    if (e.debit > 0) { p.mvtD += e.debit; s.mvtD += e.debit; }
                                                    if (e.credit > 0) { p.mvtC += e.credit; s.mvtC += e.credit; }
                                                }
                                            } else {
                                                if (reportDateFrom && e.entry_date < reportDateFrom) {
                                                    if (e.debit > 0) p.ranD += e.debit;
                                                    if (e.credit > 0) p.ranC += e.credit;
                                                } else if (!reportDateTo || e.entry_date <= reportDateTo) {
                                                    if (e.debit > 0) p.mvtD += e.debit;
                                                    if (e.credit > 0) p.mvtC += e.credit;
                                                }
                                            }
                                        }

                                        let totalRanD = 0, totalRanC = 0, totalMvtD = 0, totalMvtC = 0, totalSoldeD = 0, totalSoldeC = 0;
                                        const renderRows: React.ReactNode[] = [];

                                        const parents = Array.from(parentMap.values()).sort((a, b) => a.account.localeCompare(b.account));

                                        for (const p of parents) {
                                            const netRan = p.ranD - p.ranC;
                                            const finalRanD = netRan > 0 ? netRan : 0;
                                            const finalRanC = netRan < 0 ? Math.abs(netRan) : 0;

                                            const netSolde = (finalRanD + p.mvtD) - (finalRanC + p.mvtC);
                                            const finalSoldeD = netSolde > 0 ? netSolde : 0;
                                            const finalSoldeC = netSolde < 0 ? Math.abs(netSolde) : 0;

                                            if (finalRanD === 0 && finalRanC === 0 && p.mvtD === 0 && p.mvtC === 0 && finalSoldeD === 0 && finalSoldeC === 0) continue;

                                            totalRanD += finalRanD;
                                            totalRanC += finalRanC;
                                            totalMvtD += p.mvtD;
                                            totalMvtC += p.mvtC;
                                            totalSoldeD += finalSoldeD;
                                            totalSoldeC += finalSoldeC;

                                            const hasSubs = subMap.has(p.account) && subMap.get(p.account)!.size > 0;
                                            const isExpanded = showAllSubAccountsBalance || expandedBalanceAccounts.has(p.account);

                                            renderRows.push(
                                                <tr key={p.account} className={`border-b border-gray-100 hover:bg-teal-50/10 ${hasSubs ? 'cursor-pointer' : ''}`} onClick={() => { if (hasSubs) toggleBalanceAccount(p.account); }}>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1">
                                                            {hasSubs && (
                                                                <div className="text-gray-400">
                                                                    {isExpanded ? <ChevronRight className="w-3 h-3 rotate-90 transition-transform" /> : <ChevronRight className="w-3 h-3 transition-transform" />}
                                                                </div>
                                                            )}
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-mono font-bold border border-indigo-200">{p.account}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-gray-700 truncate max-w-[200px]" title={p.name}>{p.name}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-xs">{finalRanD > 0 ? fmt(finalRanD) : ''}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-xs">{finalRanC > 0 ? fmt(finalRanC) : ''}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-xs text-green-700">{p.mvtD > 0 ? fmt(p.mvtD) : ''}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-xs text-red-600">{p.mvtC > 0 ? fmt(p.mvtC) : ''}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-xs font-bold text-green-700">{finalSoldeD > 0 ? fmt(finalSoldeD) : ''}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-xs font-bold text-red-600">{finalSoldeC > 0 ? fmt(finalSoldeC) : ''}</td>
                                                </tr>
                                            );

                                            if (hasSubs && isExpanded) {
                                                const subs = Array.from(subMap.get(p.account)!.values()).sort((a, b) => a.account.localeCompare(b.account));
                                                for (const s of subs) {
                                                    const sNetRan = s.ranD - s.ranC;
                                                    const sFinalRanD = sNetRan > 0 ? sNetRan : 0;
                                                    const sFinalRanC = sNetRan < 0 ? Math.abs(sNetRan) : 0;

                                                    const sNetSolde = (sFinalRanD + s.mvtD) - (sFinalRanC + s.mvtC);
                                                    const sFinalSoldeD = sNetSolde > 0 ? sNetSolde : 0;
                                                    const sFinalSoldeC = sNetSolde < 0 ? Math.abs(sNetSolde) : 0;

                                                    if (sFinalRanD === 0 && sFinalRanC === 0 && s.mvtD === 0 && s.mvtC === 0 && sFinalSoldeD === 0 && sFinalSoldeC === 0) continue;

                                                    renderRows.push(
                                                        <tr key={s.account} className="border-b border-gray-50 bg-gray-50/50 hover:bg-teal-50/5">
                                                            <td className="px-4 py-2 pl-8">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 border-l border-b border-gray-300"></div>
                                                                    <span className="font-mono text-[11px] text-gray-500">{s.account}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2 text-xs text-gray-500 truncate max-w-[200px]" title={s.name}>{s.name}</td>
                                                            <td className="px-4 py-2 text-right font-mono text-[11px] text-gray-400">{sFinalRanD > 0 ? fmt(sFinalRanD) : ''}</td>
                                                            <td className="px-4 py-2 text-right font-mono text-[11px] text-gray-400">{sFinalRanC > 0 ? fmt(sFinalRanC) : ''}</td>
                                                            <td className="px-4 py-2 text-right font-mono text-[11px] text-green-700/70">{s.mvtD > 0 ? fmt(s.mvtD) : ''}</td>
                                                            <td className="px-4 py-2 text-right font-mono text-[11px] text-red-600/70">{s.mvtC > 0 ? fmt(s.mvtC) : ''}</td>
                                                            <td className="px-4 py-2 text-right font-mono text-[11px] text-green-700/80">{sFinalSoldeD > 0 ? fmt(sFinalSoldeD) : ''}</td>
                                                            <td className="px-4 py-2 text-right font-mono text-[11px] text-red-600/80">{sFinalSoldeC > 0 ? fmt(sFinalSoldeC) : ''}</td>
                                                        </tr>
                                                    );
                                                }
                                            }
                                        }

                                        return (
                                            <>
                                                <tbody>
                                                    {renderRows.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={8} className="text-center py-12 text-gray-400 font-semibold">Aucune écriture comptable pour cette période</td>
                                                        </tr>
                                                    ) : renderRows}
                                                </tbody>
                                                {renderRows.length > 0 && (
                                                    <tfoot>
                                                        <tr className="bg-slate-900 text-white font-bold">
                                                            <td colSpan={2} className="px-4 py-3 text-right uppercase text-xs tracking-wider">Totaux</td>
                                                            <td className="px-4 py-3 text-right font-mono text-xs">{fmt(totalRanD)}</td>
                                                            <td className="px-4 py-3 text-right font-mono text-xs">{fmt(totalRanC)}</td>
                                                            <td className="px-4 py-3 text-right font-mono text-xs">{fmt(totalMvtD)}</td>
                                                            <td className="px-4 py-3 text-right font-mono text-xs">{fmt(totalMvtC)}</td>
                                                            <td className="px-4 py-3 text-right font-mono text-xs">{fmt(totalSoldeD)}</td>
                                                            <td className="px-4 py-3 text-right font-mono text-xs">{fmt(totalSoldeC)}</td>
                                                        </tr>
                                                        <tr className={`font-semibold text-xs ${Math.abs(totalMvtD - totalMvtC) < 0.01 && Math.abs(totalRanD - totalRanC) < 0.01 && Math.abs(totalSoldeD - totalSoldeC) < 0.01 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                            <td colSpan={8} className="px-4 py-2 text-center font-bold">
                                                                {Math.abs(totalMvtD - totalMvtC) < 0.01 && Math.abs(totalRanD - totalRanC) < 0.01 && Math.abs(totalSoldeD - totalSoldeC) < 0.01
                                                                    ? '✓ Balance équilibrée' : '⚠ Balance déséquilibrée (Vérifiez les totaux Débit/Crédit)'}
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                )}
                                            </>
                                        );
                                    })()}
                                </table>
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === 'lettrage' && (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                                    <h3 className="font-bold text-sm flex items-center gap-2"><Link2 className="w-4 h-4" /> Comptes</h3>
                                </div>
                                <div className="max-h-[500px] overflow-y-auto">
                                    {accountsList.filter(a => a.account.startsWith('4') || a.account.startsWith('34')).map(acc => (
                                        <button key={acc.account} onClick={() => { setLettrageAccount(lettrageAccount === acc.account ? null : acc.account); setLettrageSelection(new Set()); }}
                                            className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-all flex items-center justify-between ${lettrageAccount === acc.account ? 'bg-indigo-50/20 border-l-4 border-l-neo-blue' : 'hover:bg-gray-50'}`}>
                                            <div><span className="font-mono text-xs font-bold">{acc.account}</span><p className="text-xs text-gray-500 truncate max-w-[150px]">{acc.name}</p></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl overflow-hidden">
                                {lettrageAccount ? (
                                    <>
                                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
                                            <h3 className="font-bold">Lettrage — <span className="font-mono">{lettrageAccount}</span> {getAccountName(lettrageAccount)}</h3>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {/* Lettrage Auto buttons */}
                                                {(['montant', 'piece', 'facture'] as LettrageMode[]).map(mode => (
                                                    <button key={mode} onClick={async () => {
                                                        const accountEntries = allEntries.filter(e => e.account === lettrageAccount);
                                                        const existingLetters = accountEntries.filter(e => e.lettre_code).map(e => e.lettre_code!);
                                                        const groups = autoLettrage(accountEntries, mode, existingLetters);
                                                        if (groups.length === 0) { alert(`Aucun rapprochement trouvé par ${mode}`); return; }
                                                        for (const g of groups) {
                                                            await supabase.from('journal_entries').update({ lettre_code: g.lettre }).in('id', g.ids);
                                                        }
                                                        alert(`${groups.length} groupe(s) lettré(s) par ${mode}`);
                                                        await fetchEntries();
                                                    }} className="px-3 py-1.5 bg-purple-600 text-white font-bold text-xs border border-purple-900 shadow-md hover:bg-purple-700 transition-all">
                                                        <Sparkles className="w-3 h-3 inline mr-1" />Auto: {mode === 'montant' ? 'Montant' : mode === 'piece' ? 'N° Pièce' : 'N° Facture'}
                                                    </button>
                                                ))}
                                                {/* Pré-lettrage */}
                                                {lettrageSelection.size >= 2 && (
                                                    <button onClick={async () => {
                                                        const accountEntries = allEntries.filter(e => e.account === lettrageAccount);
                                                        const existingLetters = accountEntries.filter(e => e.lettre_code).map(e => e.lettre_code!);
                                                        const letter = preLettrage(Array.from(lettrageSelection), accountEntries, existingLetters);
                                                        const ids = Array.from(lettrageSelection);
                                                        const { error } = await supabase.from('journal_entries').update({ lettre_code: letter }).in('id', ids);
                                                        if (error) alert(`Erreur: ${error.message}`);
                                                        else { setLettrageSelection(new Set()); await fetchEntries(); }
                                                    }} className="px-3 py-1.5 bg-amber-500 text-white font-bold text-xs border border-amber-700 shadow-md hover:bg-amber-600 transition-all">
                                                        <Hash className="w-3 h-3 inline mr-1" />Pré-lettrer ({lettrageSelection.size})
                                                    </button>
                                                )}
                                                {/* Lettrage manuel */}
                                                {lettrageSelection.size >= 2 && (
                                                    <button onClick={handleLettrage} className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs border border-slate-200 rounded-xl shadow-md hover:shadow-md-lg transition-all">
                                                        <CheckCircle2 className="w-3 h-3 inline mr-1" />Lettrer ({lettrageSelection.size})
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <table className="w-full text-sm"><thead>
                                            <tr className="bg-gray-50 border-b border-slate-200 font-semibold text-xs uppercase tracking-wider text-gray-600">
                                                <th className="px-3 py-3 w-10"></th><th className="text-left px-3 py-3">Date</th><th className="text-left px-3 py-3">Libellé</th>
                                                <th className="text-right px-3 py-3">Débit</th><th className="text-right px-3 py-3">Crédit</th><th className="text-center px-3 py-3">Lettre</th><th className="text-center px-3 py-3 w-16">Act.</th>
                                            </tr>
                                        </thead><tbody>
                                                {allEntries.filter(e => e.account === lettrageAccount).map(entry => (
                                                    <tr key={entry.id} className={`border-b border-gray-100 cursor-pointer transition-all ${lettrageSelection.has(entry.id) ? 'bg-indigo-50/10' : entry.lettre_code ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                                                        onClick={() => { if (entry.lettre_code) return; setLettrageSelection(prev => { const n = new Set(prev); n.has(entry.id) ? n.delete(entry.id) : n.add(entry.id); return n; }); }}>
                                                        <td className="px-3 py-2"><input type="checkbox" checked={lettrageSelection.has(entry.id)} disabled={!!entry.lettre_code} readOnly className="w-4 h-4 accent-neo-blue" /></td>
                                                        <td className="px-3 py-2 font-mono text-xs">{entry.entry_date}</td>
                                                        <td className="px-3 py-2 text-gray-700 text-xs">{entry.label}</td>
                                                        <td className="px-3 py-2 text-right font-mono text-green-700">{fmt(entry.debit)}</td>
                                                        <td className="px-3 py-2 text-right font-mono text-red-600">{fmt(entry.credit)}</td>
                                                        <td className="px-3 py-2 text-center">{entry.lettre_code ? <span className={`font-mono text-xs font-bold px-2 py-0.5 border ${entry.lettre_code === entry.lettre_code.toLowerCase() ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-green-100 text-green-700 border-green-300'}`}>{entry.lettre_code}</span> : <span className="text-xs text-gray-300">—</span>}</td>
                                                        <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                                                            {entry.lettre_code && (
                                                                <button onClick={async () => {
                                                                    const code = entry.lettre_code!;
                                                                    const idsToDelettrer = allEntries.filter(e => e.lettre_code === code).map(e => e.id);
                                                                    const { error } = await supabase.from('journal_entries').update({ lettre_code: null }).in('id', idsToDelettrer);
                                                                    if (error) alert(`Erreur: ${error.message}`);
                                                                    else await fetchEntries();
                                                                }} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title={`Délettrer code ${entry.lettre_code}`}>
                                                                    <Undo2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody></table>
                                    </>
                                ) : (
                                    <div className="p-12 text-center"><div className="w-16 h-16 bg-gray-100 border border-gray-200 mx-auto mb-4 flex items-center justify-center"><Link2 className="w-8 h-8 text-gray-300" /></div>
                                        <p className="text-gray-400 font-semibold">Sélectionnez un compte pour le lettrage</p></div>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* ─── PLAN TIERS ─────────────────────────────── */}
                {
                    activeTab === 'tiers' && (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                                <h2 className="font-bold text-lg flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Plan Tiers
                                </h2>
                                <span className="text-xs font-mono text-gray-500">{tiers.length} Tiers</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-slate-200 font-semibold text-xs uppercase tracking-wider text-gray-600">
                                            <th className="text-left px-4 py-3">Compte Aux.</th>
                                            <th className="text-left px-4 py-3">Type</th>
                                            <th className="text-left px-4 py-3">Nom du Tiers</th>
                                            <th className="text-left px-4 py-3">Tél.</th>
                                            <th className="text-left px-4 py-3">Email</th>
                                            <th className="text-center px-4 py-3">Délai Paiement</th>
                                            <th className="text-center px-4 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tiers.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-12 text-gray-400 font-semibold">
                                                    Votre base Tiers est vide. Elle s&apos;alimentera automatiquement lors de vos saisies comptables.
                                                </td>
                                            </tr>
                                        ) : (
                                            tiers.map(t => (
                                                <tr key={t.id} className="border-b border-gray-100 hover:bg-indigo-50/5 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold border border-indigo-200 text-xs">
                                                            {t.account_code_aux}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${t.type === 'fournisseur' ? 'bg-orange-50 text-orange-700 border-orange-200' : t.type === 'client' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                                            {t.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-gray-800">
                                                        {t.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{t.telephone || '—'}</td>
                                                    <td className="px-4 py-3 text-xs text-gray-500">{t.email || '—'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="text-xs font-mono">{t.delai_reglement_jours || 30}j {t.condition_reglement === 'fin_mois' ? 'FM' : t.condition_reglement === 'fin_mois_le' ? `FM le ${t.jour_tombee || '?'}` : 'Net'}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => { setEditingTier(t); setTierEditForm({ name: t.name, account_code_aux: t.account_code_aux, telephone: t.telephone || '', email: t.email || '', adresse: t.adresse || '', rc: t.rc || '', identifiant_fiscal: t.identifiant_fiscal || '', ice: t.ice || '', delai_reglement_jours: t.delai_reglement_jours || 30, mode_reglement: t.mode_reglement || 'virement', condition_reglement: t.condition_reglement || 'net', jour_tombee: t.jour_tombee || 0 }); }}
                                                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/10 rounded transition-colors"
                                                            title="Modifier"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }

                {/* Modal Modification Tiers */}
                {
                    editingTier && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingTier(null)}>
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                                <div className="px-6 py-3 border-b border-slate-200 bg-indigo-50/20 flex items-center justify-between sticky top-0 z-10">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <Users className="w-4 h-4" /> Fiche Tiers — {editingTier.name}
                                    </h3>
                                    <button onClick={() => setEditingTier(null)} className="p-1 hover:bg-red-100 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    {/* Identification */}
                                    <p className="text-[10px] font-semibold font-black uppercase tracking-widest text-gray-400 border-b pb-1">Identification</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Compte Aux.</label>
                                            <input value={tierEditForm.account_code_aux} onChange={e => setTierEditForm(f => ({ ...f, account_code_aux: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neo-blue" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nom du Tiers</label>
                                            <input value={tierEditForm.name} onChange={e => setTierEditForm(f => ({ ...f, name: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neo-blue" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Adresse</label>
                                        <input value={tierEditForm.adresse} onChange={e => setTierEditForm(f => ({ ...f, adresse: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neo-blue" placeholder="Adresse complète" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Téléphone</label>
                                            <input value={tierEditForm.telephone} onChange={e => setTierEditForm(f => ({ ...f, telephone: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neo-blue" placeholder="+212..." />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email</label>
                                            <input value={tierEditForm.email} onChange={e => setTierEditForm(f => ({ ...f, email: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neo-blue" type="email" />
                                        </div>
                                    </div>

                                    {/* Identifiants fiscaux */}
                                    <p className="text-[10px] font-semibold font-black uppercase tracking-widest text-gray-400 border-b pb-1 mt-4">Identifiants Fiscaux</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">RC</label>
                                            <input value={tierEditForm.rc} onChange={e => setTierEditForm(f => ({ ...f, rc: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neo-blue" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">IF</label>
                                            <input value={tierEditForm.identifiant_fiscal} onChange={e => setTierEditForm(f => ({ ...f, identifiant_fiscal: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neo-blue" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">ICE</label>
                                            <input value={tierEditForm.ice} onChange={e => setTierEditForm(f => ({ ...f, ice: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neo-blue" />
                                        </div>
                                    </div>

                                    {/* Conditions de règlement */}
                                    <p className="text-[10px] font-semibold font-black uppercase tracking-widest text-gray-400 border-b pb-1 mt-4">Conditions de Règlement</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Délai (jours)</label>
                                            <input type="number" value={tierEditForm.delai_reglement_jours} onChange={e => setTierEditForm(f => ({ ...f, delai_reglement_jours: Number(e.target.value) }))}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neo-blue" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Mode</label>
                                            <select value={tierEditForm.mode_reglement} onChange={e => setTierEditForm(f => ({ ...f, mode_reglement: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neo-blue">
                                                <option value="virement">Virement</option><option value="cheque">Chèque</option><option value="especes">Espèces</option>
                                                <option value="effet">Effet</option><option value="prelevement">Prélèvement</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Condition</label>
                                            <select value={tierEditForm.condition_reglement} onChange={e => setTierEditForm(f => ({ ...f, condition_reglement: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neo-blue">
                                                <option value="net">Net (Date + Délai)</option><option value="fin_mois">Fin de mois</option><option value="fin_mois_le">Fin de mois le...</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Jour tombée</label>
                                            <input type="number" value={tierEditForm.jour_tombee} onChange={e => setTierEditForm(f => ({ ...f, jour_tombee: Number(e.target.value) }))}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neo-blue" placeholder="Ex: 10" min={0} max={31} />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-4">
                                        <button type="button" onClick={handleDeleteTier}
                                            className="w-1/3 px-4 py-3 font-bold text-sm border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 shadow-md hover:shadow-md-lg transition-all flex items-center justify-center">
                                            <Trash2 className="w-4 h-4 mr-2" />Supprimer
                                        </button>
                                        <button type="button" onClick={handleSaveTier}
                                            className="w-2/3 px-4 py-3 font-bold text-sm border border-slate-200 rounded-xl bg-indigo-50 text-white hover:bg-indigo-50/80 shadow-md hover:shadow-md-lg transition-all flex items-center justify-center">
                                            <Save className="w-4 h-4 mr-2" />Enregistrer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* ─── BILAN & CPC (Etat Synthese) ──── */}
                {
                    activeTab === 'sig' && (
                        <div className="-mx-2 -mt-4">
                            <EtatSyntheseModule
                                toolbarContent={
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Rechercher…"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                className="pl-9 pr-3 h-[42px] text-sm border border-slate-200 rounded-xl font-mono w-48 focus:outline-none focus:ring-2 focus:ring-neo-blue"
                                            />
                                        </div>
                                        <input
                                            type="month"
                                            value={dateFilter}
                                            onChange={e => setDateFilter(e.target.value)}
                                            className="px-3 h-[42px] text-sm border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-neo-blue"
                                        />
                                    </div>
                                }
                            />
                        </div>
                    )
                }

                {/* ─── DÉCLARATION TVA ────────────────────────── */}
                {
                    activeTab === 'tva' && (() => {
                        // Build TVA data directly from the accounting ledger (allEntries)
                        const tvaByMonth = new Map<string, { baseHTAchats: number; tvaAchats: number; baseHTVentes: number; tvaVentes: number; }>();

                        for (const entry of allEntries) {
                            const month = entry.entry_date.substring(0, 7); // YYYY-MM
                            if (!tvaByMonth.has(month)) {
                                tvaByMonth.set(month, { baseHTAchats: 0, tvaAchats: 0, baseHTVentes: 0, tvaVentes: 0 });
                            }
                            const data = tvaByMonth.get(month)!;

                            // Achats: Comptes de charges (6) et d'immobilisations (2), et TVA récupérable (3455)
                            if (entry.account.startsWith('6') || entry.account.startsWith('2')) {
                                data.baseHTAchats += entry.debit - entry.credit; // Net amount
                            } else if (entry.account.startsWith('3455')) {
                                data.tvaAchats += entry.debit - entry.credit;
                            }

                            // Ventes: Comptes de produits (7) et TVA facturée (4455)
                            if (entry.account.startsWith('7')) {
                                data.baseHTVentes += entry.credit - entry.debit;
                            } else if (entry.account.startsWith('4455')) {
                                data.tvaVentes += entry.credit - entry.debit;
                            }
                        }

                        // Filter out zero-activity months
                        const tvaRows = Array.from(tvaByMonth.entries())
                            .filter(([, v]) => Math.abs(v.baseHTAchats) > 0.01 || Math.abs(v.tvaAchats) > 0.01 || Math.abs(v.baseHTVentes) > 0.01 || Math.abs(v.tvaVentes) > 0.01)
                            .sort((a, b) => a[0].localeCompare(b[0]))
                            .filter(([m]) => {
                                if (!tvaPeriod) return true;
                                if (tvaPeriod.includes(',')) return tvaPeriod.split(',').includes(m);
                                return m.startsWith(tvaPeriod);
                            });

                        const totalTvaFacturee = tvaRows.reduce((s, [, v]) => s + v.tvaVentes, 0);
                        const totalTvaRecuperable = tvaRows.reduce((s, [, v]) => s + v.tvaAchats, 0);
                        const totalTvaDue = totalTvaFacturee - totalTvaRecuperable;

                        const monthLabel = (m: string) => {
                            const [y, mo] = m.split('-');
                            const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
                            return `${months[Number(mo) - 1]} ${y}`;
                        };

                        const years = Array.from(new Set(Array.from(tvaByMonth.keys()).map(m => m.substring(0, 4)))).sort();

                        return (
                            <div className="space-y-4">
                                {/* Period selector for TVA */}
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-slate-800">Déclaration TVA</h2>
                                    <select
                                        value={tvaPeriod}
                                        onChange={e => setTvaPeriod(e.target.value)}
                                        className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-xl bg-white cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
                                    >
                                        <option value="">Toutes les périodes</option>
                                        <option value={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}>📅 Mois en cours</option>
                                        {(() => {
                                            const now = new Date();
                                            const q = Math.floor(now.getMonth() / 3);
                                            const qMonths = [q * 3, q * 3 + 1, q * 3 + 2].map(m => `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}`);
                                            return <option value={qMonths.join(',')}>📊 Trimestre en cours (T{q + 1})</option>;
                                        })()}
                                        {years.map(y => <option key={y} value={y}>📆 Année {y}</option>)}
                                    </select>
                                </div>

                                {/* Summary cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl p-5 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-bl-full -mr-8 -mt-8"></div>
                                        <p className="text-xs font-semibold text-gray-500 mb-1">TVA Facturée (Sur Ventes)</p>
                                        <p className="text-2xl font-semibold font-black text-indigo-600">{fmt(totalTvaFacturee)} <span className="text-sm text-gray-400">MAD</span></p>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl p-5 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 rounded-bl-full -mr-8 -mt-8"></div>
                                        <p className="text-xs font-semibold text-gray-500 mb-1">TVA Récupérable (Sur Achats)</p>
                                        <p className="text-2xl font-semibold font-black text-green-600">{fmt(totalTvaRecuperable)} <span className="text-sm text-gray-400">MAD</span></p>
                                    </div>
                                    <div className={`rounded-2xl shadow-sm p-5 relative overflow-hidden ${totalTvaDue > 0 ? 'bg-white border border-red-200' : 'bg-white border border-emerald-200'}`}>
                                        <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full -mr-8 -mt-8 ${totalTvaDue > 0 ? 'bg-red-100' : 'bg-emerald-100'}`}></div>
                                        <p className={`text-xs font-bold mb-1 uppercase tracking-wider ${totalTvaDue > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                                            {totalTvaDue > 0 ? 'TVA DUE (À PAYER)' : 'CRÉDIT DE TVA (À REPORTER)'}
                                        </p>
                                        <p className={`text-2xl font-semibold font-black ${totalTvaDue > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                                            {fmt(Math.abs(totalTvaDue))} <span className="text-sm text-gray-400">MAD</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                                        <h2 className="font-bold text-lg flex items-center gap-2">
                                            <Calculator className="w-5 h-5" />
                                            État de la TVA par Période
                                        </h2>
                                        <select
                                            value={tvaPeriod}
                                            onChange={e => setTvaPeriod(e.target.value)}
                                            className="px-3 py-1.5 text-sm border border-slate-200 rounded-xl font-mono bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                                        >
                                            <option value="">Toutes les périodes</option>
                                            <option value={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}>📅 Mois en cours</option>
                                            {(() => {
                                                const now = new Date();
                                                const q = Math.floor(now.getMonth() / 3);
                                                const qMonths = [q * 3, q * 3 + 1, q * 3 + 2].map(m => `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}`);
                                                return <option value={qMonths.join(',')}>📊 Trimestre en cours (T{q + 1})</option>;
                                            })()}
                                            {years.map(y => <option key={y} value={y}>📆 Année {y}</option>)}
                                        </select>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-slate-200 font-semibold text-xs uppercase tracking-wider text-gray-600">
                                                    <th className="text-left px-4 py-3 border-r border-gray-200">Période</th>
                                                    <th className="text-right px-4 py-3 bg-blue-50/50 w-36">Base HT Ventes</th>
                                                    <th className="text-right px-4 py-3 bg-blue-50/50 font-bold border-r border-gray-200 w-32">TVA Facturée</th>
                                                    <th className="text-right px-4 py-3 bg-green-50/50 w-36">Base HT Achats</th>
                                                    <th className="text-right px-4 py-3 bg-green-50/50 font-bold border-r border-gray-200 w-32">TVA Récup.</th>
                                                    <th className="text-right px-4 py-3 w-40">TVA Nette (Due)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tvaRows.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="text-center py-12 text-gray-400 font-semibold">
                                                            Aucune écriture comptable contenant de la TVA n'a été trouvée.
                                                        </td>
                                                    </tr>
                                                ) : tvaRows.map(([month, data]) => {
                                                    const tvaDue = data.tvaVentes - data.tvaAchats;
                                                    return (
                                                        <tr key={month} className="border-b border-gray-100 hover:bg-teal-50/10">
                                                            <td className="px-4 py-3 font-semibold border-r border-gray-100 whitespace-nowrap">{monthLabel(month)}</td>
                                                            <td className="px-4 py-3 text-right font-mono text-gray-700">{fmt(data.baseHTVentes) || '—'}</td>
                                                            <td className="px-4 py-3 text-right font-mono text-indigo-600 border-r border-gray-100 font-medium">{fmt(data.tvaVentes) || '—'}</td>
                                                            <td className="px-4 py-3 text-right font-mono text-gray-700">{fmt(data.baseHTAchats) || '—'}</td>
                                                            <td className="px-4 py-3 text-right font-mono text-green-600 border-r border-gray-100 font-medium">{fmt(data.tvaAchats) || '—'}</td>
                                                            <td className={`px-4 py-3 text-right font-mono font-bold whitespace-nowrap ${tvaDue > 0 ? 'text-red-600' : 'text-green-700'}`}>
                                                                {tvaDue === 0 ? '—' : fmt(Math.abs(tvaDue))} {tvaDue < 0 && <span className="text-[10px] uppercase ml-1 opacity-70">Crédit</span>}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            {tvaRows.length > 0 && (
                                                <tfoot>
                                                    <tr className="bg-slate-900 text-white font-bold">
                                                        <td className="px-4 py-3 uppercase text-xs tracking-wider border-r border-gray-700">Total</td>
                                                        <td className="px-4 py-3 text-right font-mono">{fmt(tvaRows.reduce((s, [, v]) => s + v.baseHTVentes, 0)) || '—'}</td>
                                                        <td className="px-4 py-3 text-right font-mono border-r border-gray-700 text-indigo-600">{fmt(totalTvaFacturee) || '—'}</td>
                                                        <td className="px-4 py-3 text-right font-mono">{fmt(tvaRows.reduce((s, [, v]) => s + v.baseHTAchats, 0)) || '—'}</td>
                                                        <td className="px-4 py-3 text-right font-mono border-r border-gray-700 text-green-400">{fmt(totalTvaRecuperable) || '—'}</td>
                                                        <td className={`px-4 py-3 text-right font-mono whitespace-nowrap ${totalTvaDue > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                            {totalTvaDue === 0 ? '—' : fmt(Math.abs(totalTvaDue))} {totalTvaDue < 0 ? '(Crédit)' : totalTvaDue > 0 ? '(À Payer)' : ''}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>
                                </div>
                            </div>
                        );
                    })()
                }
            </div >

            {/* ─── Sage Export Popup Modal ─────────────────────────── */}
            {showSagePopup && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSagePopup(false)}>
                    <div
                        className="bg-white border border-black shadow-md max-w-xl w-full p-0 relative max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-[#991b1b] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                            <h3 className="font-bold text-lg">Export Sage — Configuration</h3>
                            <button onClick={() => setShowSagePopup(false)} className="text-white/80 hover:text-white text-xl font-bold">✕</button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-4">
                            <div className="bg-amber-50 border border-amber-300 p-4">
                                <p className="font-bold text-amber-800 mb-1">⚙️ Configuration initiale (une seule fois)</p>
                                <p className="text-sm text-amber-700">
                                    Avant d{"'"}importer votre premier fichier TXT, vous devez créer un <strong>modèle de format paramétrable</strong> directement dans Sage. Cette opération ne se fait qu{"'"}une seule fois.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Step 1 */}
                                <div className="flex items-start gap-3">
                                    <span className="bg-[#991b1b] text-white w-6 h-6 flex items-center justify-center text-xs font-bold border border-black shrink-0 mt-0.5">1</span>
                                    <div>
                                        <p className="text-sm font-semibold">Créer le format dans Sage</p>
                                        <p className="text-xs text-gray-600 mt-1">Allez dans <strong>Fichier → Format import/export paramétrable</strong>. Cliquez sur <strong>Nouveau</strong>. Nommez-le <code className="bg-gray-100 px-1 rounded text-[#991b1b]">AutoCompta</code>.</p>
                                    </div>
                                </div>
                                {/* Step 2 */}
                                <div className="flex items-start gap-3">
                                    <span className="bg-[#991b1b] text-white w-6 h-6 flex items-center justify-center text-xs font-bold border border-black shrink-0 mt-0.5">2</span>
                                    <div>
                                        <p className="text-sm font-semibold">Onglet Particularités</p>
                                        <p className="text-xs text-gray-600 mt-1">Délimiteur champ : <strong>Point-virgule</strong> — Délimiteur texte : <strong>Point-virgule</strong></p>
                                        <p className="text-xs text-gray-600">Séparateur décimales : <strong>Virgule</strong></p>
                                        <p className="text-xs text-gray-600">Début d{"'"}enregistrement : <strong className="text-[#991b1b]">2</strong> (pour sauter l{"'"}en-tête) — Entête : <strong>Aucun</strong></p>
                                    </div>
                                </div>
                                {/* Step 3 */}
                                <div className="flex items-start gap-3">
                                    <span className="bg-[#991b1b] text-white w-6 h-6 flex items-center justify-center text-xs font-bold border border-black shrink-0 mt-0.5">3</span>
                                    <div>
                                        <p className="text-sm font-semibold">Mapper les colonnes (dans l{"'"}ordre)</p>
                                        <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                                            <span className="text-gray-500">Col 1 →</span><span className="font-mono">Code journal</span>
                                            <span className="text-gray-500">Col 2 →</span><span className="font-mono">Date de pièce</span>
                                            <span className="text-gray-500">Col 3 →</span><span className="font-mono">N° de pièce</span>
                                            <span className="text-gray-500">Col 4 →</span><span className="font-mono">N° Compte général</span>
                                            <span className="text-gray-500">Col 5 →</span><span className="font-mono">N° Compte tiers</span>
                                            <span className="text-gray-500">Col 6 →</span><span className="font-mono">Libellé écriture</span>
                                            <span className="text-gray-500">Col 7 →</span><span className="font-mono">Sens (D/C)</span>
                                            <span className="text-gray-500">Col 8 →</span><span className="font-mono">Montant</span>
                                            <span className="text-gray-500">Col 9 →</span><span className="font-mono">Lettrage</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Step 4 */}
                                <div className="flex items-start gap-3">
                                    <span className="bg-[#991b1b] text-white w-6 h-6 flex items-center justify-center text-xs font-bold border border-black shrink-0 mt-0.5">4</span>
                                    <div>
                                        <p className="text-sm font-semibold">Importer le fichier</p>
                                        <p className="text-xs text-gray-600 mt-1"><strong>Fichier → Importer → Format paramétrable</strong>.</p>
                                        <p className="text-xs text-gray-600">1. Sélectionnez le modèle <code className="bg-gray-100 px-1 rounded text-[#991b1b]">AutoCompta</code> dans la liste.</p>
                                        <p className="text-xs text-gray-600">2. Parcourez et choisissez le fichier <strong>.txt</strong> téléchargé.</p>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-200" />

                            {/* Download CSV */}
                            <button
                                onClick={() => {
                                    downloadSageCsv();
                                    setShowSagePopup(false);
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-[#991b1b] text-white px-4 py-3 font-bold text-sm border border-black shadow-[3px_3px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#000] transition-all"
                            >
                                <Download className="w-4 h-4" />
                                Télécharger le fichier TXT maintenant
                            </button>

                            {/* Ne plus afficher */}
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 accent-[#991b1b]"
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            localStorage.setItem('sage_popup_dismissed', 'true');
                                        } else {
                                            localStorage.removeItem('sage_popup_dismissed');
                                        }
                                    }}
                                />
                                <span className="text-xs text-gray-500">Ne plus afficher ce guide (téléchargement direct)</span>
                            </label>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
