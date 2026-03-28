'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { Upload, Brain, FileCheck, Download, FileText, Search, Sparkles, BarChart3, Scale, Bot, Send, Paperclip, ExternalLink, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const steps = [
    {
        number: '01',
        icon: Upload,
        title: 'Archivage de vos documents',
        description: 'Importez vos factures par glisser-déposer. Recherchez, filtrez par statut (À saisir, Saisi, Lettré, Réglé) et retrouvez n\'importe quel document en un instant.',
        color: 'bg-emerald-100 text-emerald-600',
        accent: 'border-l-emerald-500',
        details: [
            'Upload drag & drop instantané',
            'Recherche par nom, fournisseur, montant',
            'Filtres par statut comptable',
            'Classification automatique par l\'IA',
        ],
        visual: (
            <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-xl rounded-2xl overflow-hidden text-left relative h-[320px] ring-1 ring-slate-900/5">
                <div className="w-[200%] h-[200%] origin-top-left scale-50 grid grid-cols-5 bg-white">
                    {/* Left: Uploader */}
                    <div className="col-span-2 border-r border-slate-200 p-8 bg-slate-50">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-6">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                <div className="p-2 bg-emerald-50 rounded-lg"><Upload className="w-5 h-5 text-emerald-600" /></div>
                                <span className="font-semibold text-slate-900 text-xl tracking-tight">Importer</span>
                            </div>
                            <div className="border border-dashed border-slate-200 rounded-xl bg-slate-50 py-16 px-6 text-center hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer group">
                                <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:-translate-y-1 transition-transform shadow-sm">
                                    <FileText className="w-8 h-8 text-slate-400" />
                                </div>
                                <p className="font-semibold text-slate-900 text-lg mb-2">Cliquez ou glissez vos fichiers</p>
                                <p className="text-sm text-slate-500 font-medium">PDF, PNG, JPG supportés</p>
                            </div>
                        </div>
                    </div>
                    {/* Right: Filters + Document List */}
                    <div className="col-span-3 p-8 bg-white">
                        {/* Search bar */}
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1 flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
                                <Search className="w-5 h-5 text-slate-400" />
                                <span className="text-sm text-slate-400">Rechercher par nom, fournisseur, montant…</span>
                            </div>
                            <div className="border border-slate-200 rounded-xl px-6 py-3 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold shadow-sm cursor-pointer transition-colors">Filtrer</div>
                        </div>
                        {/* Filter pills */}
                        <div className="flex gap-3 mb-8 flex-wrap">
                            {[
                                { label: 'Tous', color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20', dot: 'bg-emerald-500' },
                                { label: 'À saisir', color: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50', dot: 'bg-orange-400' },
                                { label: 'Saisi', color: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50', dot: 'bg-blue-400' },
                                { label: 'Lettré', color: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50', dot: 'bg-indigo-400' },
                                { label: 'Réglé', color: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50', dot: 'bg-emerald-500' },
                            ].map((f) => (
                                <div key={f.label} className={`${f.color} px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer transition-colors`}>
                                    <span className={`w-2 h-2 rounded-full ${f.dot}`}></span> {f.label}
                                </div>
                            ))}
                        </div>
                        {/* Documents header & list */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-slate-400" />
                                    <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Documents Récents</span>
                                </div>
                                <span className="text-xs bg-white text-slate-600 px-3 py-1 font-semibold border border-slate-200 rounded-xl rounded-full shadow-sm">Total: 42</span>
                            </div>
                            {/* Document row */}
                            <div className="p-5 flex items-center gap-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
                                    <FileText className="w-6 h-6 text-rose-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-semibold truncate text-slate-900 mb-1">[AC-2026-0002] FAC — BELATHERM</p>
                                    <p className="text-sm text-slate-500 font-mono">18/02/2026 • 132 336 MAD</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Réglé</span>
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 rounded-xl">Archivé</span>
                                </div>
                            </div>
                            {/* Document row 2 */}
                            <div className="p-5 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors">
                                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                                    <FileText className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-semibold truncate text-slate-900 mb-1">[AC-2026-0003] REÇU — LYDEC</p>
                                    <p className="text-sm text-slate-500 font-mono">19/02/2026 • 1 250 MAD</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">À saisir</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ),
    },
    {
        number: '02',
        icon: Brain,
        title: 'Comptabilité intelligente',
        description: 'Saisissez vos écritures comptables automatiquement ou collez le texte d\'une facture et laissez l\'IA générer les écritures. Consultez le Journal, Grand Livre, Balance et Lettrage.',
        color: 'bg-indigo-100 text-indigo-600',
        accent: 'border-l-indigo-500',
        details: [
            'Saisie automatique des écritures',
            'IA : texte → écritures comptables',
            'Journal, Grand Livre, Balance, Bilan & CPC',
            'Lettrage, gestion des tiers et déclaration TVA',
        ],
        visual: (
            <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-xl rounded-2xl overflow-hidden text-left relative h-[320px] ring-1 ring-slate-900/5">
                {/* 50% scale container */}
                <div className="w-[200%] h-[200%] origin-top-left scale-50 bg-slate-50">
                    {/* Comptabilité sub-tabs */}
                    <div className="px-8 pt-8 pb-6 flex gap-3 flex-wrap border-b border-slate-200 bg-white">
                        {[
                            { label: 'À saisir', active: true, icon: '📋' },
                            { label: 'Journal', active: false, icon: '📒', count: '12' },
                            { label: 'Grand Livre', active: false, icon: '📊' },
                            { label: 'Balance', active: false, icon: '⚖️' },
                            { label: 'Plan Tiers', active: false, icon: '👥' },
                            { label: 'Bilan & CPC', active: false, icon: '💼' },
                        ].map((tab) => (
                            <div key={tab.label} className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl border cursor-pointer transition-all ${tab.active ? 'bg-slate-900 text-white border-slate-900 shadow-md transform -translate-y-0.5' : 'bg-white text-slate-600 border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5'}`}>
                                <span className="text-lg">{tab.icon}</span> {tab.label}
                                {tab.count && <span className={`px-2 py-0.5 rounded-md text-xs ml-2 font-medium ${tab.active ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'}`}>{tab.count}</span>}
                            </div>
                        ))}
                    </div>

                    <div className="p-8 grid grid-cols-2 gap-8">
                        {/* Documents à comptabiliser section */}
                        <div>
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm h-full flex flex-col overflow-hidden">
                                <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-slate-400" />
                                        <span className="text-lg font-semibold text-slate-900">À comptabiliser</span>
                                    </div>
                                    <span className="text-xs bg-orange-50 text-orange-600 px-3 py-1 font-semibold border border-orange-100 rounded-full">0 en attente</span>
                                </div>
                                <div className="p-8 text-center flex-1 flex flex-col justify-center items-center">
                                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-emerald-100">
                                        <FileCheck className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <p className="text-lg text-slate-900 font-bold mb-2 tracking-tight">Tous les documents sont traités !</p>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[250px]">Consultez le Journal pour voir les écritures générées automatiquement.</p>
                                </div>
                            </div>
                        </div>

                        {/* Texte → Écritures comptables AI section */}
                        <div>
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm h-full flex flex-col relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/50 rounded-bl-full -z-0 transition-transform group-hover:scale-110 duration-700"></div>
                                <div className="px-6 py-4 flex justify-between items-center border-b border-indigo-50 bg-white/60 backdrop-blur-sm relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500 rounded-lg text-white shadow-sm shadow-indigo-200">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <span className="text-lg font-semibold text-indigo-950">Texte vers écritures</span>
                                    </div>
                                </div>
                                <div className="p-6 relative z-10 flex-1 flex flex-col">
                                    <p className="text-sm font-semibold text-slate-700 mb-3">Générer depuis un texte brut</p>
                                    <div className="border border-slate-200 rounded-xl bg-slate-50 p-4 mb-5 flex-1 min-h-[120px] focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-inner">
                                    </div>
                                    <button className="bg-indigo-600 hover:bg-indigo-700 transition-all text-white px-6 py-3.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2.5 shadow-sm shadow-indigo-600/20 hover:shadow-md hover:shadow-indigo-600/20 hover:-translate-y-0.5 w-full">
                                        <Sparkles className="w-4 h-4" /> Générer les écritures
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ),
    },
    {
        number: '03',
        icon: Bot,
        title: 'Agent IA à votre service',
        description: "Dites à l'Agent ce que vous voulez faire — il analyse, saisit les écritures, classe les documents et génère vos états financiers. Un assistant qui automatise tout le workflow comptable.",
        color: 'bg-emerald-100 text-emerald-700',
        accent: 'border-l-emerald-500',
        details: [
            'Comptabilisation automatique sur simple demande',
            'Analyse et réponse sur vos données en temps réel',
            'Délégation des tâches comptables',
            'Disponible 24h/24, 7j/7',
        ],
        visual: (
            <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-xl rounded-2xl overflow-hidden text-left relative h-[320px] ring-1 ring-slate-900/5">
                <div className="w-[200%] h-[200%] origin-top-left scale-50 flex flex-col bg-white">
                    {/* Chat messages */}
                    <div className="flex-1 p-8 space-y-6 overflow-hidden">
                        {/* User message 1 */}
                        <div className="flex justify-end">
                            <div className="bg-slate-100 text-slate-900 px-6 py-4 rounded-2xl rounded-br-md max-w-[80%] text-base font-medium shadow-sm">
                                Comptabilise les factures non saisies
                            </div>
                        </div>

                        {/* Agent response 1 */}
                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0">
                                <Sparkles className="w-6 h-6 text-orange-500" />
                            </div>
                            <div className="flex-1 space-y-4">
                                <p className="text-lg text-slate-700 font-medium pt-1">Les 3 factures ont été comptabilisées.</p>

                                {/* Doc Cards */}
                                <div className="space-y-3 pr-20">
                                    {[
                                        { ref: 'AC-2026-0002', name: 'BELATHERM' },
                                    ].map(doc => (
                                        <div key={doc.ref} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:border-emerald-500 transition-colors shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                                                    <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">[{doc.ref}] DOC — {doc.name}...</p>
                                                    <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1.5 mt-0.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Consulter le document
                                                    </p>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* User message 2 */}
                        <div className="flex justify-end">
                            <div className="bg-slate-100 text-slate-900 px-6 py-4 rounded-2xl rounded-br-md max-w-[80%] text-base font-medium shadow-sm">
                                C&apos;est quoi le solde du fournisseur BELATHERM ?
                            </div>
                        </div>

                        {/* Agent response 2 */}
                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0">
                                <Sparkles className="w-6 h-6 text-orange-500" />
                            </div>
                            <div className="flex-1 space-y-4">
                                <p className="text-lg text-slate-700 font-medium pt-1">Le solde de BELATHERM est de 132 336 MAD créditeur.</p>
                                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:border-emerald-500 transition-colors shadow-sm pr-20 mr-20">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                                            <ExternalLink className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">[AC-2026-0002] DOC — BELATHERM...</p>
                                            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1.5 mt-0.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Consulter le document
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-300" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Input bar INSIDE the app frame */}
                    <div className="px-8 py-6 border-t border-slate-100 bg-white flex flex-col gap-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 text-lg text-slate-500 flex items-center justify-between shadow-inner">
                            <div className="flex items-center gap-5">
                                <Paperclip className="w-6 h-6 text-slate-400" />
                                <span>Posez une question à votre expert comptable...</span>
                            </div>
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                <Send className="w-5 h-5 text-white ml-0.5" />
                            </div>
                        </div>
                        <p className="text-sm text-center text-slate-400">L&apos;Agent IA peut commettre des erreurs. Vérifiez les écritures.</p>
                    </div>
                </div>
            </div>
        ),
    },
    {
        number: '04',
        icon: Download,
        title: 'Pilotage de votre activité',
        description: "Visualisez vos KPIs clés, l'évolution mensuelle de vos dépenses et revenus, et la répartition par catégorie. Tout est mis à jour en temps réel.",
        color: 'bg-cyan-100 text-cyan-600',
        accent: 'border-l-cyan-500',
        details: [
            'Documents saisis, dépenses, revenus',
            'Évolution financière mois par mois',
            'Top 5 catégories de dépenses',
            'Filtrage par année fiscale',
        ],
        visual: (
            <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-xl rounded-2xl overflow-hidden text-left relative h-[320px] ring-1 ring-slate-900/5">
                {/* 50% scale container to fit the high fidelity dashboard component */}
                <div className="w-[200%] h-[200%] origin-top-left scale-50 p-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Docs saisis</span>
                                <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-sky-600" />
                                </div>
                            </div>
                            <p className="text-4xl font-bold text-slate-900 tracking-tight">1</p>
                            <p className="text-xs text-slate-500 font-medium mt-2 flex items-center gap-1.5">
                                <span className="text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md">+1</span> depuis hier
                            </p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Dépenses</span>
                                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                                    <div className="w-4 h-4 text-rose-600 font-bold text-center leading-4">↓</div>
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-slate-900 tracking-tight">120 000 <span className="text-sm text-slate-400 font-medium">MAD</span></p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Revenus</span>
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <div className="w-4 h-4 text-emerald-600 font-bold text-center leading-4">↑</div>
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-slate-900 tracking-tight">200 000 <span className="text-sm text-slate-400 font-medium">MAD</span></p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Année</span>
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                    <span className="text-sm">📅</span>
                                </div>
                            </div>
                            <p className="text-4xl font-bold text-slate-900 tracking-tight">2026</p>
                            <p className="text-xs text-indigo-600 font-semibold mt-2 cursor-pointer hover:text-indigo-700">Filtrer</p>
                        </div>
                    </div>

                    {/* Charts mockup */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                            <div className="flex gap-4 mb-8 border-b border-slate-100 pb-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 text-lg">Évolution Financière</p>
                                    <p className="text-sm text-slate-500 mt-0.5">Dépenses vs Revenus — 2026</p>
                                </div>
                            </div>
                            <div className="relative h-48 border-l border-b border-slate-200 ml-8 flex items-end px-4">
                                <div className="absolute top-0 right-0 w-full border-t border-dashed border-slate-100" />
                                <div className="absolute top-1/4 right-0 w-full border-t border-dashed border-slate-100" />
                                <div className="absolute top-2/4 right-0 w-full border-t border-dashed border-slate-100" />
                                <div className="absolute top-3/4 right-0 w-full border-t border-dashed border-slate-100" />
                                <div className="w-full h-full flex items-end justify-between px-2 pt-6">
                                    {[
                                        { d: 50, r: 60 }, { d: 40, r: 70 }, { d: 60, r: 50 },
                                        { d: 30, r: 80 }, { d: 70, r: 60 }, { d: 45, r: 55 },
                                        { d: 55, r: 75 }, { d: 65, r: 40 }, { d: 35, r: 65 },
                                        { d: 80, r: 90 }, { d: 40, r: 50 }, { d: 65, r: 85 }
                                    ].map((val, i) => (
                                        <div key={i} className="flex-1 flex justify-center items-end gap-1 h-full z-10 px-0.5 group">
                                            <div className="w-full max-w-[12px] bg-rose-400 rounded-t-sm relative transition-all group-hover:bg-rose-500" style={{ height: `${val.d}%` }}></div>
                                            <div className="w-full max-w-[12px] bg-emerald-400 rounded-t-sm relative transition-all group-hover:bg-emerald-500" style={{ height: `${val.r}%` }}></div>
                                        </div>
                                    ))}
                                    {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((m, i) => (
                                        <span key={m} className="text-[11px] font-medium text-slate-500 absolute bottom-[-24px]" style={{ left: `calc(${i * (100 / 12)}% + 3.5%)` }}>{m[0]}</span>
                                    ))}
                                </div>
                                <div className="absolute left-[30%] -bottom-12 flex gap-8 text-xs font-semibold text-slate-600">
                                    <span className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-rose-400" /> Dépenses</span>
                                    <span className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-emerald-400" /> Revenus</span>
                                </div>
                            </div>
                        </div>

                        {/* Donut Chart */}
                        <div className="col-span-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
                            <div className="flex gap-3 mb-6 border-b border-slate-100 pb-4">
                                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <div className="w-4 h-4 rounded-full border border-orange-500 border-t-orange-200" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 text-lg">Par Catégorie</p>
                                    <p className="text-sm text-slate-500 mt-0.5">Top 4 — 2026</p>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-center items-center">
                                <div className="relative w-40 h-40 mb-6 drop-shadow-sm">
                                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f43f5e" strokeWidth="16" strokeDasharray="251.2" strokeDashoffset="150" className="opacity-90 transition-all hover:opacity-100" />
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="16" strokeDasharray="251.2" strokeDashoffset="175" transform="rotate(144 50 50)" className="opacity-90 transition-all hover:opacity-100" />
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="16" strokeDasharray="251.2" strokeDashoffset="213" transform="rotate(252 50 50)" className="opacity-90 transition-all hover:opacity-100" />
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#6366f1" strokeWidth="16" strokeDasharray="251.2" strokeDashoffset="213" transform="rotate(306 50 50)" className="opacity-90 transition-all hover:opacity-100" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full m-[18px] shadow-sm z-10 border border-slate-50">
                                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-0.5">Total</span>
                                        <span className="text-2xl font-bold text-slate-900 tracking-tight">132K</span>
                                    </div>
                                </div>

                                <div className="w-full space-y-3.5 mt-auto">
                                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                                        <div className="flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Achats</div>
                                        <div className="font-mono text-slate-900">52K</div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                                        <div className="flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Services</div>
                                        <div className="font-mono text-slate-900">39K</div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                                        <div className="flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Impôts</div>
                                        <div className="font-mono text-slate-900">20K</div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                                        <div className="flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Personnel</div>
                                        <div className="font-mono text-slate-900">20K</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        ),
    },
];

export default function HowItWorksSection() {
    const [activeStep, setActiveStep] = useState(0);
    const [direction, setDirection] = useState(0);

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 500 : -500,
            opacity: 0,
            scale: 0.95
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 500 : -500,
            opacity: 0,
            scale: 0.95
        })
    };

    const nextStep = () => {
        if (activeStep < steps.length - 1) {
            setDirection(1);
            setActiveStep((prev: number) => prev + 1);
        }
    };

    const prevStep = () => {
        if (activeStep > 0) {
            setDirection(-1);
            setActiveStep((prev: number) => prev - 1);
        }
    };

    const step = steps[activeStep];

    const contentVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: 0.1 + i * 0.1,
                duration: 0.5,
                ease: [0.215, 0.610, 0.355, 1.000] as any,
            }
        })
    };

    const visualVariants: Variants = {
        hidden: { opacity: 0, scale: 0.9, rotateY: direction > 0 ? 10 : -10 },
        visible: {
            opacity: 1,
            scale: 1,
            rotateY: 0,
            transition: {
                delay: 0.3,
                duration: 0.8,
                type: "spring" as const,
                stiffness: 100,
                damping: 20
            }
        }
    };

    return (
        <section id="comment-ca-marche" className="py-32 bg-slate-100 relative overflow-hidden">
            {/* Background decorative elements - enhanced for better contrast through glass */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-200/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 -z-0" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-200/50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 -z-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-100/30 rounded-full blur-[120px] -z-0" />

            <div className="section-container relative z-10">
                {/* Section Header */}
                <div className="text-center mb-20 max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block bg-white text-emerald-600 px-5 py-2 rounded-2xl font-bold text-xs uppercase mb-8 shadow-sm border border-slate-100 tracking-widest"
                    >
                        Le Processus
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8 tracking-tighter text-slate-900 leading-[1.1]"
                    >
                        Votre comptabilité en
                        <br />
                        <motion.span
                            animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                            transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
                            className="bg-clip-text text-transparent bg-[linear-gradient(110deg,#059669,45%,#34d399,55%,#0284c7)] bg-[length:200%_100%] leading-tight pb-2"
                        >
                            4 étapes simples
                        </motion.span>
                    </motion.h2 >
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-500 font-medium leading-relaxed px-4"
                    >
                        De la facture papier à l&apos;écriture comptable. Un workflow automatisé conçu pour la conformité et l'excellence au Maroc.
                    </motion.p>
                </div>

                {/* Modern Step Navigation Tabs */}
                <div className="flex justify-center mb-16 relative">
                    <div className="bg-white/40 backdrop-blur-xl p-2 rounded-3xl border border-white/50 shadow-2xl inline-flex gap-2 overflow-x-auto no-scrollbar max-w-full">
                        {steps.map((s, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setDirection(idx > activeStep ? 1 : -1);
                                    setActiveStep(idx);
                                }}
                                className={`group relative flex items-center gap-4 px-7 py-4 rounded-2xl text-sm font-bold transition-all whitespace-nowrap overflow-hidden ${activeStep === idx
                                    ? 'text-white'
                                    : 'text-slate-400 hover:text-slate-900'
                                    }`}
                            >
                                {activeStep === idx && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-slate-900 -z-10"
                                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                    />
                                )}
                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors ${activeStep === idx ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                                    {s.number}
                                </span>
                                <span className="tracking-wide">{s.number}. {idx === 0 ? 'Archivage' : idx === 1 ? 'Comptabilité' : idx === 2 ? 'Agent IA' : 'Pilotage'}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Interactive Carousel Box */}
                <div className="relative min-h-[650px] lg:min-h-[580px]">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={activeStep}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="bg-white/5 border border-white/20 backdrop-blur-3xl rounded-[3rem] p-8 lg:p-16 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative"
                            transition={{
                                x: { type: "spring", stiffness: 260, damping: 26 },
                                opacity: { duration: 0.2 }
                            }}
                        >
                            {/* Grainy Noise Texture Layer */}
                            <div
                                className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay -z-10"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                                }}
                            />
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                                {/* Staggered Content Side */}
                                <div className="space-y-10">
                                    <motion.div
                                        custom={0} variants={contentVariants} initial="hidden" animate="visible"
                                        className="flex items-center gap-5"
                                    >
                                        <div className={`w-16 h-16 rounded-[1.25rem] ${step.color} shadow-lg shadow-emerald-500/10 flex items-center justify-center font-bold text-2xl`}>
                                            {step.number}
                                        </div>
                                        <div className="w-16 h-16 bg-white rounded-[1.25rem] shadow-sm border border-slate-100 flex items-center justify-center text-slate-800">
                                            <step.icon className="w-7 h-7" />
                                        </div>
                                    </motion.div>

                                    <div>
                                        <motion.h3
                                            custom={1} variants={contentVariants} initial="hidden" animate="visible"
                                            className="text-4xl sm:text-5xl font-bold mb-6 text-slate-900 tracking-tighter"
                                        >
                                            {step.title}
                                        </motion.h3>

                                        <motion.p
                                            custom={2} variants={contentVariants} initial="hidden" animate="visible"
                                            className="text-xl text-slate-500 mb-10 leading-relaxed font-medium"
                                        >
                                            {step.description}
                                        </motion.p>

                                        <div className="space-y-5">
                                            {step.details.map((detail, i) => (
                                                <motion.div
                                                    key={i}
                                                    custom={3 + i} variants={contentVariants} initial="hidden" animate="visible"
                                                    className="flex items-center gap-5 group"
                                                >
                                                    <div className={`w-1.5 h-6 rounded-full transition-all duration-300 group-hover:h-8 ${step.accent.replace('border-l-', 'bg-')}`} />
                                                    <span className="text-slate-700 font-bold text-lg">{detail}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    <motion.div
                                        custom={7} variants={contentVariants} initial="hidden" animate="visible"
                                        className="pt-4"
                                    >
                                        <button
                                            onClick={nextStep}
                                            className={`group px-10 py-5 rounded-2xl font-bold text-lg transition-all flex items-center gap-4 ${activeStep === steps.length - 1
                                                ? 'bg-slate-900 text-white hover:bg-black'
                                                : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-2xl hover:shadow-emerald-500/30'
                                                }`}
                                        >
                                            {activeStep === steps.length - 1 ? "Lancez-vous maintenant" : "Explorer l'étape suivante"}
                                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
                                        </button>
                                    </motion.div>
                                </div>

                                {/* Dynamic Visual Side with Card Hover Effect */}
                                <motion.div
                                    variants={visualVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="relative perspective-1000"
                                >
                                    <div className="relative group/card transition-all duration-700">
                                        {/* Floating decorative elements fixed to mockup */}
                                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-400/10 rounded-full blur-[60px] animate-pulse" />
                                        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-400/10 rounded-full blur-[60px] animate-pulse delay-700" />

                                        <div className="relative transform transition-all duration-500 group-hover/card:scale-[1.01] group-hover/card:-translate-y-2">
                                            {step.visual}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Progress Control (Arrows + Counter) */}
                    <div className="flex items-center justify-between mt-12 px-6">
                        <div className="flex gap-4">
                            <button
                                onClick={prevStep}
                                disabled={activeStep === 0}
                                className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-800 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none hover:shadow-md active:scale-95"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={nextStep}
                                disabled={activeStep === steps.length - 1}
                                className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-800 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none hover:shadow-md active:scale-95"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-sm font-mono font-bold text-slate-400 tracking-tighter">
                                <span className="text-slate-900">0{activeStep + 1}</span> / 0{steps.length}
                            </div>
                            <div className="hidden sm:flex gap-1.5">
                                {steps.map((_, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setActiveStep(idx)}
                                        className={`h-1.5 rounded-full cursor-pointer transition-all duration-500 ${activeStep === idx ? 'w-12 bg-emerald-600' : 'w-4 bg-slate-200 hover:bg-slate-300'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
