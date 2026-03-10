'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { FileText, CheckCircle, Clock, AlertTriangle, ArrowRight, Inbox, Building2, DollarSign, Trash2, BookOpen } from 'lucide-react';
import { AccountingFilters } from './DocumentFilters';

interface Document {
    id: string;
    original_name: string;
    file_path: string;
    created_at: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    accounting_status: string | null;
    extracted_data: any;
    internal_ref: string | null;
    accounting_category: string | null;
}

interface DocumentListProps {
    filters?: AccountingFilters;
    refreshKey?: number;
}

const statusConfig: Record<string, { icon: any; label: string; bg: string; text: string }> = {
    completed: { icon: CheckCircle, label: 'Archivé', bg: 'bg-neo-lime', text: 'text-green-800' },
    pending: { icon: Clock, label: 'En attente', bg: 'bg-neo-yellow', text: 'text-yellow-800' },
    processing: { icon: Clock, label: 'En cours', bg: 'bg-neo-blue', text: 'text-blue-800' },
    error: { icon: AlertTriangle, label: 'Erreur', bg: 'bg-neo-red', text: 'text-red-800' },
};

const accountingStatusConfig: Record<string, { label: string; bg: string; text: string }> = {
    a_saisir: { label: 'À saisir', bg: 'bg-orange-100', text: 'text-orange-700' },
    saisi: { label: 'Saisi', bg: 'bg-blue-100', text: 'text-blue-700' },
    doublon: { label: 'Doublon', bg: 'bg-red-100', text: 'text-red-700' },
    lettre: { label: 'Lettré', bg: 'bg-purple-100', text: 'text-purple-700' },
};

const typePrefix: Record<string, string> = {
    invoice: 'FAC',
    receipt: 'REC',
    credit_note: 'AVO',
    delivery_note: 'BL',
    bank_statement: 'REL',
    other: 'DOC',
};

function getDisplayName(doc: Document): string {
    const data = doc.extracted_data;
    const ref = doc.internal_ref;

    if (!data || doc.status !== 'completed') {
        return ref ? `[${ref}] ${doc.original_name}` : doc.original_name;
    }

    const parts: string[] = [];

    // 1. Type prefix
    const prefix = typePrefix[data.type || data.document_type || ''] || 'DOC';
    parts.push(prefix);

    // 2. Supplier
    if (data.supplier) {
        parts.push(data.supplier.toUpperCase().substring(0, 25));
    }

    // 3. Date
    if (data.date) {
        parts.push(data.date);
    }

    // 4. Amount
    if (data.total_amount != null) {
        parts.push(`${Number(data.total_amount).toLocaleString('fr-FR')} ${data.currency || 'MAD'}`);
    }

    const name = parts.length > 1 ? parts.join(' — ') : doc.original_name;
    return ref ? `[${ref}] ${name}` : name;
}

function getDateRange(range: string): { from: Date | null; to: Date | null } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (range) {
        case 'today': return { from: today, to: now };
        case 'week': {
            const s = new Date(today); s.setDate(today.getDate() - today.getDay() + 1);
            return { from: s, to: now };
        }
        case 'month': return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
        case 'quarter': {
            const q = Math.floor(now.getMonth() / 3) * 3;
            return { from: new Date(now.getFullYear(), q, 1), to: now };
        }
        case 'year': return { from: new Date(now.getFullYear(), 0, 1), to: now };
        case 'last_month': {
            return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 0) };
        }
        case 'last_quarter': {
            const cq = Math.floor(now.getMonth() / 3);
            return { from: new Date(now.getFullYear(), (cq - 1) * 3, 1), to: new Date(now.getFullYear(), cq * 3, 0) };
        }
        default: return { from: null, to: null };
    }
}

export default function DocumentList({ filters, refreshKey }: DocumentListProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const router = useRouter();

    const fetchDocuments = async () => {
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setDocuments(data || []);
        } catch (err) {
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch + realtime subscription
    useEffect(() => {
        fetchDocuments();
        const subscription = supabase
            .channel('documents_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => fetchDocuments())
            .subscribe();
        return () => { subscription.unsubscribe(); };
    }, []);

    // Re-fetch immediately when refreshKey changes (after upload)
    useEffect(() => {
        if (refreshKey !== undefined && refreshKey > 0) {
            fetchDocuments();
        }
    }, [refreshKey]);

    // Auto-poll every 5s while any document is pending/processing
    useEffect(() => {
        const hasPending = documents.some(d => d.status === 'pending' || d.status === 'processing');
        if (!hasPending) return;
        const interval = setInterval(fetchDocuments, 5000);
        return () => clearInterval(interval);
    }, [documents]);

    const handleDelete = async (docId: string, filePath: string) => {
        setDeleting(docId);
        try {
            // Delete from storage
            await supabase.storage.from('documents').remove([filePath]);
            // Delete from database
            const { error } = await supabase.from('documents').delete().eq('id', docId);
            if (error) throw error;
            setDocuments(prev => prev.filter(d => d.id !== docId));
        } catch (err) {
            console.error('Erreur suppression:', err);
        } finally {
            setDeleting(null);
            setConfirmDelete(null);
        }
    };

    // Apply all filters
    const filteredDocs = documents.filter(doc => {
        const data = doc.extracted_data || {};

        // Search
        if (filters?.search) {
            const q = filters.search.toLowerCase();
            const fields = [doc.original_name, data.supplier, data.invoice_number, data.category_name].filter(Boolean).map(f => f.toLowerCase());
            if (!fields.some(f => f.includes(q))) return false;
        }

        // Type
        if (filters?.type && filters.type !== 'all') {
            if ((data.type || '').toLowerCase() !== filters.type) return false;
        }

        // Processing status
        if (filters?.status && filters.status !== 'all') {
            if (doc.status !== filters.status) return false;
        }

        // Accounting status — with doublon detection
        if (filters?.accountingStatus && filters.accountingStatus !== 'all') {
            if (filters.accountingStatus === 'doublon') {
                // Check if this doc has a duplicate (same supplier + ref)
                const ext = doc.extracted_data;
                if (!ext?.supplier || !(ext.invoice_number || ext.number)) return false;
                const ref = (ext.invoice_number || ext.number).toLowerCase();
                const supplier = ext.supplier.toLowerCase();
                const hasDupe = documents.some(other =>
                    other.id !== doc.id &&
                    other.extracted_data?.supplier?.toLowerCase() === supplier &&
                    ((other.extracted_data?.invoice_number || other.extracted_data?.number || '').toLowerCase() === ref)
                );
                if (!hasDupe) return false;
            } else {
                const accStatus = doc.accounting_status || 'a_saisir';
                // Only "lettre" status applies to closed filter
                if (filters.accountingStatus === 'closed') {
                    if (accStatus !== 'lettre') return false;
                }
                // Both "saisi" and "lettre" apply to processed filter
                if (filters.accountingStatus === 'processed') {
                    if (accStatus !== 'saisi') return false;
                } else {
                    if (accStatus !== filters.accountingStatus) return false;
                }
            }
        }

        // Upload date range
        if (filters?.dateRange && filters.dateRange !== 'all') {
            const docDate = new Date(doc.created_at);
            if (filters.dateRange === 'custom') {
                if (filters.dateFrom && docDate < new Date(filters.dateFrom)) return false;
                if (filters.dateTo) { const to = new Date(filters.dateTo); to.setHours(23, 59, 59); if (docDate > to) return false; }
            } else {
                const { from, to } = getDateRange(filters.dateRange);
                if (from && docDate < from) return false;
                if (to && docDate > to) return false;
            }
        }

        // Document date range
        if (filters?.docDateFrom || filters?.docDateTo) {
            const extractedDate = data.date ? new Date(data.date) : null;
            if (!extractedDate) return false;
            if (filters.docDateFrom && extractedDate < new Date(filters.docDateFrom)) return false;
            if (filters.docDateTo) { const to = new Date(filters.docDateTo); to.setHours(23, 59, 59); if (extractedDate > to) return false; }
        }

        // Amount
        if (filters?.minAmount && (data.total_amount || 0) < parseFloat(filters.minAmount)) return false;
        if (filters?.maxAmount && (data.total_amount || 0) > parseFloat(filters.maxAmount)) return false;

        return true;
    });

    // Sort
    const sortedDocs = [...filteredDocs].sort((a, b) => {
        const order = filters?.sortOrder === 'asc' ? 1 : -1;
        const dA = a.extracted_data || {};
        const dB = b.extracted_data || {};
        switch (filters?.sortBy) {
            case 'name': return order * a.original_name.localeCompare(b.original_name);
            case 'amount': return order * ((dA.total_amount || 0) - (dB.total_amount || 0));
            case 'doc_date': return order * ((dA.date || '').localeCompare(dB.date || ''));
            case 'status': return order * a.status.localeCompare(b.status);
            default: return order * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }
    });

    if (loading) {
        return (
            <div className="bg-neo-white border-3 border-neo-black shadow-neo p-8 text-center">
                <div className="w-10 h-10 bg-neo-yellow border-2 border-neo-black mx-auto mb-3 flex items-center justify-center animate-pulse">
                    <Clock className="w-5 h-5" />
                </div>
                <p className="font-display font-semibold">Chargement des documents...</p>
            </div>
        );
    }

    return (
        <div className="bg-neo-white border-3 border-neo-black shadow-neo">
            {/* Header */}
            <div className="px-6 py-4 border-b-3 border-neo-black flex items-center justify-between">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Documents
                </h3>
                <span className="bg-neo-black text-white text-xs font-mono px-3 py-1">
                    {sortedDocs.length}/{documents.length}
                </span>
            </div>

            {/* List */}
            {sortedDocs.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-neo-cream border-3 border-neo-black mx-auto mb-4 flex items-center justify-center">
                        <Inbox className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="font-display font-semibold text-lg mb-1">Aucun document trouvé</p>
                    <p className="text-sm text-gray-500">
                        {documents.length > 0 ? 'Essayez de modifier vos filtres' : 'Téléchargez votre première facture'}
                    </p>
                </div>
            ) : (
                <div className="divide-y-2 divide-gray-100">
                    {sortedDocs.map((doc) => {
                        const status = statusConfig[doc.status] || statusConfig.pending;
                        const StatusIcon = status.icon;
                        const data = doc.extracted_data || {};
                        const accStatus = accountingStatusConfig[doc.accounting_status || 'a_saisir'] || accountingStatusConfig.a_saisir;
                        const isProcessing = doc.status === 'pending' || doc.status === 'processing';

                        return (
                            <div
                                key={doc.id}
                                className={`flex items-center justify-between px-6 py-4 transition-all group ${isProcessing ? 'animate-pulse bg-neo-yellow/5' : 'hover:bg-neo-yellow/10'}`}
                            >
                                {/* Document info — clickable */}
                                <div
                                    onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                                    className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer"
                                >
                                    <div className="w-10 h-10 bg-neo-cream border-2 border-neo-black flex items-center justify-center shrink-0 group-hover:bg-neo-yellow transition-colors">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        {isProcessing ? (
                                            <>
                                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="h-3 bg-gray-100 rounded w-24"></div>
                                                    <span className="text-[10px] font-display font-semibold text-yellow-600 flex items-center gap-1">
                                                        <Clock className="w-3 h-3 animate-spin" />
                                                        Traitement IA en cours...
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <p className="font-display font-semibold group-hover:underline underline-offset-2 truncate">
                                                    {getDisplayName(doc)}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 font-mono flex-wrap">
                                                    <span>{new Date(doc.created_at).toLocaleDateString('fr-MA')}</span>
                                                    {data.date && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-gray-400">Doc: {data.date}</span>
                                                        </>
                                                    )}
                                                    {data.supplier && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-0.5"><Building2 className="w-3 h-3" />{data.supplier}</span>
                                                        </>
                                                    )}
                                                    {data.total_amount != null && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="font-semibold text-neo-black">{data.total_amount.toLocaleString()} {data.currency || 'MAD'}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Badges & Actions */}
                                <div className="flex items-center gap-2 shrink-0 ml-4">
                                    {/* Duplicate badge */}
                                    {(() => {
                                        const ext = doc.extracted_data;
                                        if (!ext?.supplier || !(ext.invoice_number || ext.number)) return null;
                                        const ref = (ext.invoice_number || ext.number).toLowerCase();
                                        const sup = ext.supplier.toLowerCase();
                                        const isDupe = documents.some(o => o.id !== doc.id && o.extracted_data?.supplier?.toLowerCase() === sup && ((o.extracted_data?.invoice_number || o.extracted_data?.number || '').toLowerCase() === ref));
                                        if (!isDupe) return null;
                                        return (
                                            <div className="hidden sm:flex items-center gap-1 px-2 py-1 text-[10px] font-display font-bold border border-red-400 bg-red-100 text-red-700">
                                                ⚠ Doublon
                                            </div>
                                        );
                                    })()}

                                    {/* Accounting status badge — hidden if doublon */}
                                    {!(() => {
                                        const ext = doc.extracted_data;
                                        if (!ext?.supplier || !(ext.invoice_number || ext.number)) return false;
                                        const ref = (ext.invoice_number || ext.number).toLowerCase();
                                        const sup = ext.supplier.toLowerCase();
                                        return documents.some(o => o.id !== doc.id && o.extracted_data?.supplier?.toLowerCase() === sup && ((o.extracted_data?.invoice_number || o.extracted_data?.number || '').toLowerCase() === ref));
                                    })() && (
                                            <div className={`hidden sm:flex items-center gap-1 px-2 py-1 text-[10px] font-display font-semibold border ${accStatus.bg} ${accStatus.text} border-current/20`}>
                                                <BookOpen className="w-3 h-3" />
                                                {accStatus.label}
                                            </div>
                                        )}

                                    {/* Processing status badge */}
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-semibold border-2 border-neo-black ${status.bg} ${status.text}`}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        {status.label}
                                    </div>

                                    {/* Delete button */}
                                    {confirmDelete === doc.id ? (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleDelete(doc.id, doc.file_path)}
                                                disabled={deleting === doc.id}
                                                className="px-2 py-1.5 text-xs font-display font-bold bg-red-500 text-white border-2 border-neo-black hover:bg-red-600 transition-colors"
                                            >
                                                {deleting === doc.id ? '...' : 'Oui'}
                                            </button>
                                            <button
                                                onClick={() => setConfirmDelete(null)}
                                                className="px-2 py-1.5 text-xs font-display bg-neo-white border-2 border-neo-black hover:bg-gray-100"
                                            >
                                                Non
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(doc.id); }}
                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 border-2 border-transparent hover:border-red-300 transition-all opacity-0 group-hover:opacity-100"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}

                                    <ArrowRight
                                        onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
                                        className="w-4 h-4 text-gray-300 group-hover:text-neo-black group-hover:translate-x-1 transition-all cursor-pointer"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
