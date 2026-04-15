'use client';

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, FileText, Download, Calendar, DollarSign, Tag, Hash, Building2, Loader2, RefreshCw, Eye, AlertTriangle, CreditCard, Clock, Pencil, Save, X, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DocumentDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [doc, setDoc] = useState<any>(null);
    const [journalEntries, setJournalEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [reprocessing, setReprocessing] = useState(false);
    const [duplicate, setDuplicate] = useState<{ id: string; name: string } | null>(null);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    // Drag to scroll state
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const router = useRouter();

    const typePrefix: Record<string, string> = {
        invoice: 'FAC', receipt: 'REC', credit_note: 'AVO',
        delivery_note: 'BL', bank_statement: 'REL', other: 'DOC',
    };

    const getDisplayName = (d: any): string => {
        const ext = d.extracted_data;
        const ref = d.internal_ref;
        if (!ext || d.status !== 'completed') {
            return ref ? `[${ref}] ${d.original_name}` : d.original_name;
        }
        const parts: string[] = [];
        parts.push(typePrefix[ext.type || ext.document_type || ''] || 'DOC');
        if (ext.supplier) parts.push(ext.supplier.toUpperCase().substring(0, 25));
        if (ext.date) parts.push(ext.date);
        if (ext.total_amount != null) parts.push(`${Number(ext.total_amount).toLocaleString('fr-FR')} ${ext.currency || 'MAD'}`);
        const name = parts.length > 1 ? parts.join(' — ') : d.original_name;
        return ref ? `[${ref}] ${name}` : name;
    };

    const fetchDoc = async () => {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('id', id)
            .single();

        if (error) console.error(error);
        setDoc(data);

        // Fetch journal entries if accounting status exists
        if (data?.accounting_status) {
            const { data: entries } = await supabase
                .from('journal_entries')
                .select('*')
                .eq('doc_id', id)
                .order('created_at', { ascending: true });
            if (entries) setJournalEntries(entries);
        }

        setLoading(false);

        // Get a signed URL for preview/download
        if (data?.file_path) {
            const { data: signedData } = await supabase.storage
                .from('documents')
                .createSignedUrl(data.file_path, 3600); // 1 hour expiry

            if (signedData?.signedUrl) {
                setPreviewUrl(signedData.signedUrl);
            }
        }

        // Duplicate detection: check for same supplier + invoice_number
        if (data?.extracted_data?.supplier && (data.extracted_data.invoice_number || data.extracted_data.number)) {
            const ref = data.extracted_data.invoice_number || data.extracted_data.number;
            const supplier = data.extracted_data.supplier;
            const { data: dupes } = await supabase
                .from('documents')
                .select('id, original_name, extracted_data')
                .neq('id', id)
                .eq('status', 'completed');
            if (dupes) {
                const found = dupes.find((d: any) => {
                    const ext = d.extracted_data;
                    if (!ext) return false;
                    const dRef = ext.invoice_number || ext.number;
                    const dSupplier = ext.supplier;
                    return dRef && dSupplier && dRef.toLowerCase() === ref.toLowerCase() && dSupplier.toLowerCase() === supplier.toLowerCase();
                });
                setDuplicate(found ? { id: found.id, name: found.original_name } : null);
            }
        }
    };

    useEffect(() => {
        fetchDoc();
    }, [id]);

    const handleReprocess = async () => {
        if (!doc) return;
        setReprocessing(true);
        try {
            const res = await fetch('/api/pipeline-entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId: doc.id,
                    filePath: doc.file_path,
                    fileType: doc.file_type
                })
            });
            const result = await res.json();
            if (result.success) {
                // Refresh document data
                await fetchDoc();
            } else {
                console.error('Reprocess failed:', result.error);
            }
        } catch (err) {
            console.error('Reprocess error:', err);
        } finally {
            setReprocessing(false);
        }
    };

    const handleDownload = async () => {
        if (!previewUrl || !doc) return;
        const link = document.createElement('a');
        link.href = previewUrl;
        link.download = doc.original_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const startEditing = () => {
        const d = doc.extracted_data || {};
        setEditForm({
            date: d.date || '',
            supplier: d.supplier || '',
            total_amount: d.total_amount ?? '',
            amount_ht: d.amount_ht ?? '',
            tva_amount: d.tva_amount ?? '',
            tva_rate: d.tva_rate ?? '',
            invoice_number: d.invoice_number || '',
            payment_method: d.payment_method || '',
            payment_date: d.payment_date || '',
        });
        setEditing(true);
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        const updated = {
            ...doc.extracted_data,
            date: editForm.date || null,
            supplier: editForm.supplier || null,
            total_amount: editForm.total_amount !== '' ? Number(editForm.total_amount) : null,
            amount_ht: editForm.amount_ht !== '' ? Number(editForm.amount_ht) : null,
            tva_amount: editForm.tva_amount !== '' ? Number(editForm.tva_amount) : null,
            tva_rate: editForm.tva_rate !== '' ? Number(editForm.tva_rate) : null,
            invoice_number: editForm.invoice_number || null,
            payment_method: editForm.payment_method || null,
            payment_date: editForm.payment_date || null,
        };
        const { error } = await supabase
            .from('documents')
            .update({ extracted_data: updated })
            .eq('id', id);
        if (error) {
            alert(`Erreur: ${error.message}`);
        } else {
            setEditing(false);
            await fetchDoc();
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="section-container py-12 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 bg-teal-50 border border-slate-200 rounded-xl mx-auto mb-4 flex items-center justify-center animate-pulse">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                    <p className="font-semibold">Chargement du document...</p>
                </div>
            </div>
        );
    }

    if (!doc) {
        return (
            <div className="section-container py-12 text-center">
                <div className="w-16 h-16 bg-rose-50 border border-slate-200 rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-8 h-8" />
                </div>
                <h2 className="font-semibold text-2xl font-bold mb-2">Document introuvable</h2>
                <button onClick={() => router.back()} className="inline-flex items-center justify-center gap-2 px-4 py-2 font-medium rounded-xl transition-all shadow-sm mt-4">
                    <ArrowLeft className="w-4 h-4" /> Retour
                </button>
            </div>
        );
    }

    const data = doc.extracted_data || {};
    const isImage = doc.file_type?.startsWith('image/');
    const isPdf = doc.file_type === 'application/pdf';

    const statusConfig: Record<string, { label: string; bg: string }> = {
        processed: { label: 'Archivé', bg: 'bg-green-100 text-green-800 border-green-200' },
        completed: { label: 'Archivé', bg: 'bg-green-100 text-green-800 border-green-200' },
        pending: { label: 'En attente', bg: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        processing: { label: 'En cours', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
        error: { label: 'Erreur', bg: 'bg-rose-100 text-rose-800 border-rose-200' },
    };

    const status = statusConfig[doc.status] || statusConfig.pending;

    const montantHT = data.amount_ht != null
        ? `${data.amount_ht.toLocaleString()} ${data.currency || 'MAD'}`
        : (data.total_amount != null && data.tva_amount != null
            ? `${(data.total_amount - data.tva_amount).toLocaleString()} ${data.currency || 'MAD'}`
            : 'N/A');

    const paymentMethodLabels: Record<string, string> = {
        especes: 'Espèces',
        virement: 'Virement',
        cheque: 'Chèque',
        carte: 'Carte bancaire',
        effet: 'Effet de commerce',
        prelevement: 'Prélèvement',
    };

    const infoCards = [
        { icon: Calendar, label: 'Date', value: data.date || 'N/A' },
        { icon: DollarSign, label: 'Montant TTC', value: data.total_amount ? `${data.total_amount.toLocaleString()} ${data.currency || 'MAD'}` : 'N/A' },
        { icon: Building2, label: 'Fournisseur', value: data.supplier || 'N/A' },
        { icon: DollarSign, label: 'Montant HT', value: montantHT },
        { icon: Hash, label: 'Réf. interne', value: doc.internal_ref || 'N/A' },
        { icon: Hash, label: 'Réf. externe', value: data.invoice_number || 'N/A' },
        { icon: DollarSign, label: 'TVA', value: data.tva_amount != null ? `${data.tva_amount.toLocaleString()} ${data.currency || 'MAD'}` : 'N/A' },
        { icon: Tag, label: 'Taux TVA', value: data.tva_rate != null ? `${data.tva_rate}%` : 'N/A' },
        { icon: CreditCard, label: 'Mode de paiement', value: data.payment_method ? (paymentMethodLabels[data.payment_method] || data.payment_method) : 'N/A' },
        { icon: Clock, label: 'Date de paiement', value: data.payment_date || 'N/A' },
    ];

    return (
        <div className="section-container py-8">
            {/* Back button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 font-semibold text-sm mb-6 hover:text-gray-600 transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Retour au tableau de bord
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Document details */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Header Card */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl p-6">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                                <FileText className="w-7 h-7" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="font-semibold text-2xl font-bold mb-2 truncate">{getDisplayName(doc)}</h1>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className={`px-3 py-1 text-xs font-bold border rounded-xl ${status.bg}`}>
                                        {status.label}
                                    </span>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {new Date(doc.created_at).toLocaleDateString('fr-MA')} à {new Date(doc.created_at).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {(doc.status === 'pending' || doc.status === 'error') && (
                                        <button
                                            onClick={handleReprocess}
                                            disabled={reprocessing}
                                            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-indigo-50 border border-slate-200 rounded-xl hover:-translate-y-0.5 transition-transform disabled:opacity-50"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${reprocessing ? 'animate-spin' : ''}`} />
                                            {reprocessing ? 'Traitement...' : 'Relancer le traitement'}
                                        </button>
                                    )}
                                    {duplicate && (
                                        <span
                                            onClick={() => router.push(`/dashboard/documents/${duplicate.id}`)}
                                            className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-red-100 text-red-700 border border-red-400 cursor-pointer hover:-translate-y-0.5 transition-transform"
                                        >
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            ⚠ Doublon détecté
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Info Cards Grid */}
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-sm text-gray-500 uppercase tracking-wider">Données extraites</span>
                            {!editing ? (
                                <button
                                    onClick={startEditing}
                                    className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/10 border border-transparent hover:border-neo-blue/30 transition-all"
                                    title="Modifier les données"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setEditing(false)}
                                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                                        title="Annuler"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={saving}
                                        className="p-1.5 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-1 text-xs font-bold px-3 disabled:opacity-50"
                                    >
                                        <Save className="w-3.5 h-3.5" />{saving ? '...' : 'Enregistrer'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {!editing ? (
                            <div className="grid grid-cols-2 gap-3">
                                {infoCards.map((card, i) => (
                                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-2">
                                            <card.icon className="w-4 h-4" />
                                            {card.label}
                                        </div>
                                        <p className="font-bold text-lg">{card.value}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { key: 'date', label: 'Date', icon: Calendar, type: 'date' },
                                    { key: 'total_amount', label: 'Montant TTC', icon: DollarSign, type: 'number' },
                                    { key: 'supplier', label: 'Fournisseur', icon: Building2, type: 'text' },
                                    { key: 'amount_ht', label: 'Montant HT', icon: DollarSign, type: 'number' },
                                    { key: 'invoice_number', label: 'Réf. externe', icon: Hash, type: 'text' },
                                    { key: 'tva_amount', label: 'TVA', icon: DollarSign, type: 'number' },
                                    { key: 'tva_rate', label: 'Taux TVA (%)', icon: Tag, type: 'number' },
                                    { key: 'payment_method', label: 'Mode de paiement', icon: CreditCard, type: 'text' },
                                    { key: 'payment_date', label: 'Date de paiement', icon: Clock, type: 'date' },
                                ].map((field) => (
                                    <div key={field.key} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-2">
                                            <field.icon className="w-4 h-4" />
                                            {field.label}
                                        </div>
                                        <input
                                            type={field.type}
                                            step={field.type === 'number' ? '0.01' : undefined}
                                            value={editForm[field.key] ?? ''}
                                            onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))}
                                            className="w-full px-2 py-1.5 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-neo-blue bg-white"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Write section here: Data is Comptabilisée */}
                    {doc?.accounting_status && (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl overflow-hidden">
                            <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-600" />
                                    État Comptable
                                </h3>
                                <span className={`px-3 py-1 font-bold text-xs border rounded-full ${doc.accounting_status === 'saisi' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                    doc.accounting_status === 'lettre' ? 'bg-purple-100 text-purple-700 border-purple-300' :
                                        doc.accounting_status === 'valide' ? 'bg-green-100 text-green-700 border-green-300' :
                                            doc.accounting_status === 'a_saisir' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                                                'bg-gray-100 text-gray-700 border-gray-300'
                                    }`}>
                                    {doc.accounting_status === 'saisi' ? 'Saisi' :
                                        doc.accounting_status === 'lettre' ? 'Lettré' :
                                            doc.accounting_status === 'valide' ? 'Validé' :
                                                doc.accounting_status === 'a_saisir' ? 'À saisir' :
                                                    doc.accounting_status}
                                </span>
                            </div>

                            {journalEntries.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-slate-200 text-left">
                                                <th className="px-3 py-2 font-bold text-gray-600">Jrn</th>
                                                <th className="px-3 py-2 font-bold text-gray-600">Date</th>
                                                <th className="px-3 py-2 font-bold text-gray-600">Compte</th>
                                                <th className="px-3 py-2 font-bold text-gray-600">Libellé</th>
                                                <th className="px-3 py-2 font-bold text-gray-600 text-right">Débit</th>
                                                <th className="px-3 py-2 font-bold text-gray-600 text-right">Crédit</th>
                                                <th className="px-3 py-2 font-bold text-gray-600 text-center">Let.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {journalEntries.map((e, idx) => (
                                                <tr key={e.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                    <td className="px-3 py-2 font-mono font-bold text-[10px] text-gray-500">{e.journal}</td>
                                                    <td className="px-3 py-2 font-mono text-[10px] text-gray-500">{e.entry_date}</td>
                                                    <td className="px-3 py-2 font-mono font-bold text-indigo-600">{e.account}</td>
                                                    <td className="px-3 py-2 truncate max-w-[150px]" title={e.label}>{e.label}</td>
                                                    <td className="px-3 py-2 font-mono font-bold text-right text-green-700">{e.debit > 0 ? Number(e.debit).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : ''}</td>
                                                    <td className="px-3 py-2 font-mono font-bold text-right text-red-600">{e.credit > 0 ? Number(e.credit).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : ''}</td>
                                                    <td className="px-3 py-2 text-center">
                                                        {e.lettre_code && <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1 rounded border border-blue-200">{e.lettre_code}</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-6 text-center text-sm font-semibold text-gray-500">
                                    Aucune écriture comptable trouvée.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Preview & Actions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* File Preview */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl p-6 relative">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <Eye className="w-5 h-5" />
                                Aperçu du fichier
                            </h3>
                            {previewUrl && (isImage || previewUrl.toLowerCase().endsWith('.jpg') || previewUrl.toLowerCase().endsWith('.png')) && (
                                <div className="flex items-center bg-white border border-slate-200 rounded-xl rounded overflow-hidden">
                                    <button onClick={() => setZoomLevel(z => Math.max(0.25, z - 0.25))} className="p-1.5 hover:bg-gray-100 border-r border-slate-200" title="Dézoomer"><ZoomOut className="w-4 h-4" /></button>
                                    <div className="px-3 font-mono text-sm font-bold w-16 text-center">{Math.round(zoomLevel * 100)}%</div>
                                    <button onClick={() => setZoomLevel(z => Math.min(4, z + 0.25))} className="p-1.5 hover:bg-gray-100 border-l border-slate-200" title="Zoomer"><ZoomIn className="w-4 h-4" /></button>
                                    <button onClick={() => setZoomLevel(1)} className="px-3 py-1.5 text-xs font-bold hover:bg-gray-100 border-l border-slate-200">RESET</button>
                                </div>
                            )}
                        </div>

                        {previewUrl ? (
                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                                {isImage ? (
                                    <div
                                        ref={scrollContainerRef}
                                        className={`w-full h-[800px] overflow-auto border-slate-200 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                                        onMouseDown={(e) => {
                                            if (!scrollContainerRef.current) return;
                                            setIsDragging(true);
                                            setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
                                            setStartY(e.pageY - scrollContainerRef.current.offsetTop);
                                            setScrollLeft(scrollContainerRef.current.scrollLeft);
                                            setScrollTop(scrollContainerRef.current.scrollTop);
                                        }}
                                        onMouseUp={() => setIsDragging(false)}
                                        onMouseLeave={() => setIsDragging(false)}
                                        onMouseMove={(e) => {
                                            if (!isDragging || !scrollContainerRef.current) return;
                                            e.preventDefault();
                                            const x = e.pageX - scrollContainerRef.current.offsetLeft;
                                            const y = e.pageY - scrollContainerRef.current.offsetTop;
                                            const walkX = (x - startX) * 2;
                                            const walkY = (y - startY) * 2;
                                            scrollContainerRef.current.scrollLeft = scrollLeft - walkX;
                                            scrollContainerRef.current.scrollTop = scrollTop - walkY;
                                        }}
                                    >
                                        <div
                                            className="bg-gray-50 flex items-center justify-center p-4 select-none"
                                            style={{ width: `${zoomLevel * 100}%`, minWidth: '100%', minHeight: '100%', transition: 'width 0.1s ease-out' }}
                                        >
                                            <img
                                                src={previewUrl}
                                                alt={doc.original_name}
                                                className="w-full h-auto pointer-events-none shadow-sm block"
                                            />
                                        </div>
                                    </div>
                                ) : isPdf ? (
                                    <iframe
                                        src={previewUrl}
                                        className="w-full h-[800px]"
                                        title="Aperçu PDF"
                                    />
                                ) : (
                                    <div className="w-full h-64 flex items-center justify-center text-gray-400">
                                        <div className="text-center">
                                            <FileText className="w-12 h-12 mx-auto mb-2" />
                                            <p className="text-sm">Format non supporté pour l&apos;aperçu</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full h-64 border border-dashed border-gray-300 flex items-center justify-center bg-slate-50">
                                <div className="text-center text-gray-400">
                                    <FileText className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm">Chargement de l&apos;aperçu...</p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleDownload}
                            disabled={!previewUrl}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 font-medium rounded-xl transition-all shadow-sm w-full mt-4 justify-center disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            Télécharger l&apos;original
                        </button>
                    </div>


                </div>
            </div>
        </div >
    );
}
