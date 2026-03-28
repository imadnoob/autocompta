'use client';

import { useState } from 'react';
import { Search, X, CalendarDays, ChevronDown, ChevronUp, RotateCcw, SlidersHorizontal } from 'lucide-react';

export interface AccountingFilters {
    search: string;
    type: string;
    status: string;
    accountingStatus: string;
    dateRange: string;
    dateFrom: string;
    dateTo: string;
    docDateFrom: string;
    docDateTo: string;
    minAmount: string;
    maxAmount: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

const defaultFilters: AccountingFilters = {
    search: '',
    type: 'all',
    status: 'all',
    accountingStatus: 'all',
    dateRange: 'all',
    dateFrom: '',
    dateTo: '',
    docDateFrom: '',
    docDateTo: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'date',
    sortOrder: 'desc',
};

interface FilterProps {
    onFilterChange: (filters: AccountingFilters) => void;
}

export default function DocumentFilters({ onFilterChange }: FilterProps) {
    const [filters, setFilters] = useState<AccountingFilters>(defaultFilters);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const updateFilter = (key: keyof AccountingFilters, value: string) => {
        const newFilters = { ...filters, [key]: value };
        if (key === 'dateFrom' || key === 'dateTo') {
            newFilters.dateRange = 'custom';
        }
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const resetFilters = () => {
        setFilters(defaultFilters);
        onFilterChange(defaultFilters);
    };

    const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(defaultFilters);

    const typeOptions = [
        { value: 'all', label: 'Tous les types' },
        { value: 'invoice', label: '🧾 Factures' },
        { value: 'receipt', label: '🧾 Reçus' },
        { value: 'credit_note', label: '💳 Avoirs' },
        { value: 'delivery_note', label: '📦 Bons de livraison' },
        { value: 'bank_statement', label: '🏦 Relevés bancaires' },
        { value: 'other', label: '📋 Autres' },
    ];

    const statusOptions = [
        { value: 'all', label: 'Tous', dot: 'bg-gray-400' },
        { value: 'pending', label: 'En attente', dot: 'bg-yellow-500' },
        { value: 'processing', label: 'En cours', dot: 'bg-blue-500' },
        { value: 'completed', label: 'Traités', dot: 'bg-green-500' },
        { value: 'error', label: 'Erreurs', dot: 'bg-red-500' },
    ];

    const accountingStatusOptions = [
        { value: 'all', label: 'Tous', dot: 'bg-gray-400' },
        { value: 'a_saisir', label: 'À saisir', dot: 'bg-orange-500' },
        { value: 'saisi', label: 'Saisi', dot: 'bg-blue-500' },
        { value: 'lettre', label: 'Lettré', dot: 'bg-purple-500' },
        { value: 'doublon', label: 'Doublon', dot: 'bg-red-500' },
    ];

    const dateRangeOptions = [
        { value: 'all', label: 'Toutes les dates' },
        { value: 'today', label: "Aujourd'hui" },
        { value: 'week', label: 'Cette semaine' },
        { value: 'month', label: 'Ce mois' },
        { value: 'quarter', label: 'Ce trimestre' },
        { value: 'year', label: 'Cette année' },
        { value: 'last_month', label: 'Mois dernier' },
        { value: 'last_quarter', label: 'Trimestre dernier' },
        { value: 'custom', label: 'Personnalisé' },
    ];

    const sortOptions = [
        { value: 'date', label: 'Date ajout' },
        { value: 'doc_date', label: 'Date doc' },
        { value: 'name', label: 'Nom' },
        { value: 'amount', label: 'Montant' },
        { value: 'status', label: 'Statut' },
    ];

    return (
        <div className="space-y-3 mb-4">
            {/* Main Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl p-4">
                <div className="flex flex-wrap gap-3 items-center">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, fournisseur, n° facture..."
                            className="w-full pl-10 pr-4 py-2.5 text-sm font-mono border border-slate-200 rounded-xl bg-white focus:outline-none focus:bg-teal-50/20 transition-colors"
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                        />
                        {filters.search && (
                            <button onClick={() => updateFilter('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-800">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Type */}
                    <select
                        value={filters.type}
                        onChange={(e) => updateFilter('type', e.target.value)}
                        className="px-3 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl bg-white focus:outline-none cursor-pointer"
                    >
                        {typeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>

                    {/* Date Range (Upload Date) */}
                    <select
                        value={filters.dateRange}
                        onChange={(e) => updateFilter('dateRange', e.target.value)}
                        className="px-3 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl bg-white focus:outline-none cursor-pointer"
                    >
                        {dateRangeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>📅 {opt.label}</option>
                        ))}
                    </select>

                    {/* Advanced Toggle */}
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold font-medium border border-slate-200 rounded-xl transition-all ${showAdvanced ? 'bg-slate-900 text-white' : 'bg-white hover:bg-teal-50'
                            }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Plus
                        {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {/* Reset */}
                    {hasActiveFilters && (
                        <button
                            onClick={resetFilters}
                            className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold font-medium border border-neo-red text-rose-600 bg-white hover:bg-rose-50 hover:text-white transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Second row: Accounting status chips (left) + Trier (right) */}
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 items-center">
                    {accountingStatusOptions.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => updateFilter('accountingStatus', opt.value)}
                            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold border rounded-xl transition-all duration-150 ${filters.accountingStatus === opt.value
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`}></span>
                            {opt.label}
                        </button>
                    ))}

                    {/* Trier aligned right */}
                    <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-[11px] font-semibold text-gray-500">Trier :</span>
                        <select
                            value={filters.sortBy}
                            onChange={(e) => {
                                const newFilters = { ...filters, sortBy: e.target.value, sortOrder: 'desc' as const };
                                setFilters(newFilters);
                                onFilterChange(newFilters);
                            }}
                            className="px-2 py-1 text-[11px] font-semibold border border-slate-200 rounded-xl bg-white focus:outline-none cursor-pointer h-[28px] w-[110px]"
                        >
                            {sortOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="w-[28px] h-[28px] text-[11px] font-bold border border-slate-200 rounded-xl bg-white hover:bg-teal-50 transition-colors flex items-center justify-center"
                            title={filters.sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
                        >
                            {filters.sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Advanced Panel */}
            {showAdvanced && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-md p-5">
                    {/* Treatment status filter */}
                    <div className="mb-4 pb-4 border-b border-gray-300">
                        <span className="text-xs font-semibold text-gray-600 mr-2">Traitement IA :</span>
                        <div className="inline-flex flex-wrap gap-2 mt-1">
                            {statusOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => updateFilter('status', opt.value)}
                                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold border rounded-xl transition-all duration-150 ${filters.status === opt.value
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${opt.dot}`}></span>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                        {/* Upload Date Range */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                <CalendarDays className="w-3 h-3 inline mr-1" />
                                Date d&apos;ajout — Début
                            </label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl bg-white focus:outline-none focus:bg-teal-50/20"
                                value={filters.dateFrom}
                                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                <CalendarDays className="w-3 h-3 inline mr-1" />
                                Date d&apos;ajout — Fin
                            </label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl bg-white focus:outline-none focus:bg-teal-50/20"
                                value={filters.dateTo}
                                onChange={(e) => updateFilter('dateTo', e.target.value)}
                            />
                        </div>

                        {/* Amount Range */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                Montant min (MAD)
                            </label>
                            <input
                                type="number"
                                placeholder="0"
                                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl bg-white focus:outline-none focus:bg-teal-50/20"
                                value={filters.minAmount}
                                onChange={(e) => updateFilter('minAmount', e.target.value)}
                            />
                        </div>

                        {/* Document Date Range */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                <CalendarDays className="w-3 h-3 inline mr-1" />
                                Date du document — Début
                            </label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl bg-white focus:outline-none focus:bg-teal-50/20"
                                value={filters.docDateFrom}
                                onChange={(e) => updateFilter('docDateFrom', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                <CalendarDays className="w-3 h-3 inline mr-1" />
                                Date du document — Fin
                            </label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl bg-white focus:outline-none focus:bg-teal-50/20"
                                value={filters.docDateTo}
                                onChange={(e) => updateFilter('docDateTo', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                Montant max (MAD)
                            </label>
                            <input
                                type="number"
                                placeholder="∞"
                                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl bg-white focus:outline-none focus:bg-teal-50/20"
                                value={filters.maxAmount}
                                onChange={(e) => updateFilter('maxAmount', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
