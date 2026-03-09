'use client';

import { Upload, Brain, FileCheck, Download, FileText, Search, Sparkles, BarChart3, Scale, Bot } from 'lucide-react';

const steps = [
    {
        number: '01',
        icon: Upload,
        title: 'Archivez vos documents',
        description: 'Importez vos factures par glisser-déposer. Recherchez, filtrez par statut (À saisir, Saisi, Lettré, Réglé) et retrouvez n\'importe quel document en un instant.',
        color: 'bg-neo-yellow',
        accent: 'border-l-neo-yellow',
        details: [
            'Upload drag & drop instantané',
            'Recherche par nom, fournisseur, montant',
            'Filtres par statut comptable',
            'Classification automatique par l\'IA',
        ],
        visual: (
            <div className="bg-[#fcfaf2] border-3 border-neo-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden text-left relative h-[320px]">
                <div className="w-[200%] h-[200%] origin-top-left scale-50 grid grid-cols-5 bg-white">
                    {/* Left: Uploader */}
                    <div className="col-span-2 border-r-2 border-neo-black p-8 bg-[#fcfaf2]">
                        <div className="bg-white border-2 border-neo-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-6">
                            <div className="flex items-center gap-3 mb-6 border-b-2 border-gray-100 pb-4">
                                <div className="p-2 bg-neo-yellow border-2 border-neo-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><Upload className="w-5 h-5 text-neo-black" /></div>
                                <span className="font-display font-bold text-xl">Importer</span>
                            </div>
                            <div className="border-2 border-dashed border-neo-black bg-neo-cream/30 py-16 px-6 text-center hover:bg-neo-yellow/10 transition-colors cursor-pointer group">
                                <div className="w-16 h-16 bg-white border-2 border-neo-black flex items-center justify-center mx-auto mb-4 group-hover:-translate-y-1 transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <FileText className="w-8 h-8 text-neo-black" />
                                </div>
                                <p className="font-display font-bold text-lg mb-2">Cliquez ou glissez vos fichiers</p>
                                <p className="text-sm text-gray-500 font-medium">PDF, PNG, JPG supportés</p>
                            </div>
                        </div>
                    </div>
                    {/* Right: Filters + Document List */}
                    <div className="col-span-3 p-8 bg-white">
                        {/* Search bar */}
                        <div className="flex gap-4 mb-6">
                            <div className="flex-1 flex items-center gap-3 border-2 border-neo-black px-4 py-3 bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <Search className="w-5 h-5 text-gray-400" />
                                <span className="text-sm text-gray-400 font-mono">Rechercher par nom, fournisseur, montant…</span>
                            </div>
                            <div className="border-2 border-neo-black px-6 py-3 bg-neo-lime text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer">Filtrer</div>
                        </div>
                        {/* Filter pills */}
                        <div className="flex gap-3 mb-8 flex-wrap">
                            {[
                                { label: 'Tous', color: 'bg-neo-black text-white', dot: 'bg-white' },
                                { label: 'À saisir', color: 'bg-white', dot: 'bg-orange-400' },
                                { label: 'Saisi', color: 'bg-white', dot: 'bg-blue-400' },
                                { label: 'Lettré', color: 'bg-white', dot: 'bg-green-400' },
                                { label: 'Réglé', color: 'bg-white', dot: 'bg-emerald-500' },
                            ].map((f) => (
                                <div key={f.label} className={`${f.color} border-2 border-neo-black px-4 py-2 text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:-translate-y-[1px] transition-transform`}>
                                    <span className={`w-2.5 h-2.5 rounded-full border border-neo-black ${f.dot}`}></span> {f.label}
                                </div>
                            ))}
                        </div>
                        {/* Documents header & list */}
                        <div className="bg-white border-2 border-neo-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="bg-neo-black text-white px-5 py-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-neo-yellow" />
                                    <span className="text-sm font-bold tracking-wider">DOCUMENTS RÉCENTS</span>
                                </div>
                                <span className="text-xs bg-neo-lime text-neo-black px-3 py-1 font-bold border-2 border-neo-black">Total: 42</span>
                            </div>
                            {/* Document row */}
                            <div className="p-5 flex items-center gap-4 border-b-2 border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                                <div className="w-12 h-12 bg-neo-cream border-2 border-neo-black flex items-center justify-center shrink-0">
                                    <FileText className="w-6 h-6 text-neo-black" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-lg font-display font-bold truncate text-neo-black mb-1">[AC-2026-0002] FAC — BELATHERM</p>
                                    <p className="text-sm text-gray-500 font-mono">18/02/2026 • 132 336 MAD</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <span className="text-xs font-bold px-3 py-1.5 bg-blue-100 text-blue-700 border-2 border-blue-300">Réglé</span>
                                    <span className="text-xs font-bold px-3 py-1.5 bg-green-100 text-green-700 border-2 border-green-300">Archevé</span>
                                </div>
                            </div>
                            {/* Document row 2 */}
                            <div className="p-5 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors opacity-60">
                                <div className="w-12 h-12 bg-white border-2 border-neo-black flex items-center justify-center shrink-0">
                                    <FileText className="w-6 h-6 text-gray-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-lg font-display font-bold truncate text-gray-700 mb-1">[AC-2026-0003] REÇU — LYDEC</p>
                                    <p className="text-sm text-gray-500 font-mono">19/02/2026 • 1 250 MAD</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <span className="text-xs font-bold px-3 py-1.5 bg-orange-100 text-orange-700 border-2 border-orange-300">À saisir</span>
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
        color: 'bg-neo-pink',
        accent: 'border-l-neo-pink',
        details: [
            'Saisie automatique des écritures',
            'IA : texte → écritures comptables',
            'Journal, Grand Livre, Balance, Bilan & CPC',
            'Lettrage, gestion des tiers et déclaration TVA',
        ],
        visual: (
            <div className="bg-[#fcfaf2] border-3 border-neo-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden text-left relative h-[320px]">
                {/* 50% scale container */}
                <div className="w-[200%] h-[200%] origin-top-left scale-50 bg-[#fcfaf2]">
                    {/* Comptabilité sub-tabs */}
                    <div className="px-8 pt-8 pb-6 flex gap-3 flex-wrap border-b-2 border-neo-black bg-white">
                        {[
                            { label: 'À saisir', active: true, icon: '📋' },
                            { label: 'Journal', active: false, icon: '📒', count: '12' },
                            { label: 'Grand Livre', active: false, icon: '📊' },
                            { label: 'Balance', active: false, icon: '⚖️' },
                            { label: 'Plan Tiers', active: false, icon: '👥' },
                            { label: 'Bilan & CPC', active: false, icon: '💼' },
                        ].map((tab) => (
                            <div key={tab.label} className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-2 border-neo-black cursor-pointer transition-transform hover:-translate-y-1 ${tab.active ? 'bg-neo-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}>
                                <span className="text-lg">{tab.icon}</span> {tab.label}
                                {tab.count && <span className="bg-gray-200 text-neo-black px-2 py-0.5 rounded-sm text-xs ml-2">{tab.count}</span>}
                            </div>
                        ))}
                    </div>

                    <div className="p-8 grid grid-cols-2 gap-8">
                        {/* Documents à comptabiliser section */}
                        <div>
                            <div className="bg-white border-2 border-neo-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full flex flex-col">
                                <div className="px-6 py-4 flex justify-between items-center border-b-2 border-neo-black bg-neo-cream/30">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-neo-black" />
                                        <span className="text-lg font-display font-bold">À comptabiliser</span>
                                    </div>
                                    <span className="text-sm bg-orange-100 text-orange-600 px-3 py-1 font-bold border-2 border-orange-200">0 en attente</span>
                                </div>
                                <div className="p-8 text-center flex-1 flex flex-col justify-center items-center">
                                    <div className="w-16 h-16 bg-green-100 border-2 border-green-600 flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <FileCheck className="w-8 h-8 text-green-600" />
                                    </div>
                                    <p className="text-lg text-neo-black font-bold mb-2">Tous les documents sont traités !</p>
                                    <p className="text-sm text-gray-500 font-medium">Consultez le Journal pour voir les écritures générées automatiquement.</p>
                                </div>
                            </div>
                        </div>

                        {/* Texte → Écritures comptables AI section */}
                        <div>
                            <div className="bg-white border-2 border-neo-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-bl-[100px] -z-0"></div>
                                <div className="px-6 py-4 flex justify-between items-center border-b-2 border-neo-black bg-purple-50 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-purple-500 border-2 border-neo-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <span className="text-lg font-display font-bold text-purple-900">Texte vers écritures</span>
                                    </div>
                                </div>
                                <div className="p-6 relative z-10 flex-1 flex flex-col">
                                    <p className="text-sm font-bold text-neo-black mb-3">Générer depuis un texte brut</p>
                                    <div className="border-2 border-neo-black bg-gray-50 p-4 mb-4 flex-1 min-h-[120px] focus-within:bg-white focus-within:border-purple-500 transition-colors">
                                    </div>
                                    <button className="bg-purple-500 hover:bg-purple-600 transition-colors text-white px-6 py-4 text-base font-display font-bold flex items-center justify-center gap-3 border-2 border-neo-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 w-full">
                                        <Sparkles className="w-5 h-5" /> Générer les écritures comptables
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
        icon: Download,
        title: 'Pilotez votre activité',
        description: 'Visualisez vos KPIs clés, l\'évolution mensuelle de vos dépenses et revenus, et la répartition par catégorie. Tout est mis à jour en temps réel.',
        color: 'bg-neo-blue',
        accent: 'border-l-neo-blue',
        details: [
            'Documents saisis, dépenses, revenus',
            'Évolution financière mois par mois',
            'Top 5 catégories de dépenses',
            'Filtrage par année fiscale',
        ],
        visual: (
            <div className="bg-[#fcfaf2] border-3 border-neo-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden text-left relative h-[320px]">
                {/* 50% scale container to fit the high fidelity dashboard component */}
                <div className="w-[200%] h-[200%] origin-top-left scale-50 p-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-white border-2 border-neo-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">Docs saisis</span>
                                <div className="w-8 h-8 bg-neo-blue border-2 border-neo-black flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <p className="text-4xl font-display font-black">1</p>
                            <p className="text-xs text-gray-500 font-bold mt-2 flex items-center gap-1">
                                <span className="text-neo-blue">+1</span> depuis hier
                            </p>
                        </div>
                        <div className="bg-white border-2 border-neo-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">Dépenses</span>
                                <div className="w-8 h-8 bg-neo-pink border-2 border-neo-black flex items-center justify-center">
                                    <div className="w-4 h-4 text-white font-bold text-center leading-4">↓</div>
                                </div>
                            </div>
                            <p className="text-3xl font-display font-black">120 000 <span className="text-sm text-gray-400">MAD</span></p>
                        </div>
                        <div className="bg-white border-2 border-neo-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">Revenus</span>
                                <div className="w-8 h-8 bg-neo-lime border-2 border-neo-black flex items-center justify-center">
                                    <div className="w-4 h-4 text-black font-bold text-center leading-4">↑</div>
                                </div>
                            </div>
                            <p className="text-3xl font-display font-black">200 000 <span className="text-sm text-gray-400">MAD</span></p>
                        </div>
                        <div className="bg-white border-2 border-neo-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">Année</span>
                                <div className="w-8 h-8 bg-neo-yellow border-2 border-neo-black flex items-center justify-center">
                                    <span className="text-sm">📅</span>
                                </div>
                            </div>
                            <p className="text-4xl font-display font-black">2026</p>
                            <p className="text-xs text-gray-500 font-bold mt-2">Filtrer</p>
                        </div>
                    </div>

                    {/* Charts mockup */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 bg-white border-2 border-neo-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex gap-4 mb-8 border-b-2 border-neo-black pb-4">
                                <div className="w-10 h-10 bg-neo-blue border-2 border-neo-black flex flex-col justify-end p-1.5 gap-1">
                                    <div className="flex gap-0.5 items-end h-full">
                                        <div className="w-2 h-full bg-white/50" />
                                        <div className="w-2 h-2/3 bg-white" />
                                        <div className="w-2 h-1/2 bg-white/80" />
                                    </div>
                                </div>
                                <div>
                                    <p className="font-display font-bold text-xl">Évolution Financière</p>
                                    <p className="text-xs text-gray-500 mt-1">Dépenses vs Revenus — 2026</p>
                                </div>
                            </div>
                            <div className="relative h-48 border-l-2 border-b-2 border-neo-black ml-8 flex items-end px-4">
                                <div className="absolute top-0 right-0 w-full border-t-2 border-dashed border-gray-200" />
                                <div className="absolute top-1/4 right-0 w-full border-t-2 border-dashed border-gray-200" />
                                <div className="absolute top-2/4 right-0 w-full border-t-2 border-dashed border-gray-200" />
                                <div className="absolute top-3/4 right-0 w-full border-t-2 border-dashed border-gray-200" />
                                <div className="w-full h-full flex items-end justify-between px-2 pt-6">
                                    {[
                                        { d: 50, r: 60 }, { d: 40, r: 70 }, { d: 60, r: 50 },
                                        { d: 30, r: 80 }, { d: 70, r: 60 }, { d: 45, r: 55 },
                                        { d: 55, r: 75 }, { d: 65, r: 40 }, { d: 35, r: 65 },
                                        { d: 80, r: 90 }, { d: 40, r: 50 }, { d: 65, r: 85 }
                                    ].map((val, i) => (
                                        <div key={i} className="flex-1 flex justify-center items-end gap-[2px] h-full z-10 px-[2px]">
                                            <div className="w-full max-w-[14px] bg-neo-pink border-2 border-neo-black relative" style={{ height: `${val.d}%` }}></div>
                                            <div className="w-full max-w-[14px] bg-neo-lime border-2 border-neo-black relative" style={{ height: `${val.r}%` }}></div>
                                        </div>
                                    ))}
                                    {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((m, i) => (
                                        <span key={m} className="text-xs font-bold absolute bottom-[-24px]" style={{ left: `calc(${i * (100 / 12)}% + 3.5%)` }}>{m[0]}</span>
                                    ))}
                                </div>
                                <div className="absolute left-[30%] -bottom-12 flex gap-8 text-xs font-bold">
                                    <span className="flex items-center gap-2"><div className="w-4 h-4 bg-neo-pink border-2 border-neo-black" /> Dépenses</span>
                                    <span className="flex items-center gap-2"><div className="w-4 h-4 bg-neo-lime border-2 border-neo-black" /> Revenus</span>
                                </div>
                            </div>
                        </div>

                        {/* Donut Chart */}
                        <div className="col-span-1 bg-white border-2 border-neo-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col">
                            <div className="flex gap-3 mb-6 border-b-2 border-neo-black pb-4">
                                <div className="w-10 h-10 bg-neo-yellow border-2 border-neo-black flex items-center justify-center">
                                    <span className="w-4 h-4 rounded-full border-2 border-neo-black relative">
                                        <span className="absolute top-1/2 left-1/2 w-2 h-[2px] bg-neo-black origin-left -rotate-45" />
                                        <span className="absolute top-1/2 left-1/2 w-2 h-[2px] bg-neo-black origin-left rotate-45" />
                                        <span className="absolute top-1/2 left-1/2 h-2 w-[2px] bg-neo-black origin-bottom" />
                                    </span>
                                </div>
                                <div>
                                    <p className="font-display font-bold text-xl">Par Catégorie</p>
                                    <p className="text-xs text-gray-500 mt-1">Top 5 — 2026</p>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-center items-center">
                                <div className="relative w-40 h-40 mb-6 drop-shadow-sm">
                                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ff90e8" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="150" />
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ffc900" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="175" transform="rotate(144 50 50)" />
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#23a094" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="213" transform="rotate(252 50 50)" />
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#90a8ed" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="213" transform="rotate(306 50 50)" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full m-[26px] border-2 border-neo-black shadow-neo z-10">
                                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total</span>
                                        <span className="text-xl font-display font-black text-neo-black">132K</span>
                                    </div>
                                </div>

                                <div className="w-full space-y-3 mt-auto">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-neo-black bg-[#ff90e8]" /> Achats</div>
                                        <div className="font-mono">52K</div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-neo-black bg-[#ffc900]" /> Services</div>
                                        <div className="font-mono">39K</div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-neo-black bg-[#23a094]" /> Impôts</div>
                                        <div className="font-mono">20K</div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-neo-black bg-[#90a8ed]" /> Personnel</div>
                                        <div className="font-mono">20K</div>
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
    return (
        <section id="comment-ca-marche" className="py-24 bg-neo-cream relative">
            {/* Decorative elements */}
            <div className="absolute top-10 right-10 w-20 h-20 bg-neo-yellow border-3 border-neo-black rotate-12 hidden lg:block" />
            <div className="absolute bottom-20 left-10 w-16 h-16 bg-neo-pink border-3 border-neo-black -rotate-6 hidden lg:block" />

            <div className="section-container">
                {/* Section Header */}
                <div className="text-center mb-20">
                    <div className="inline-block bg-neo-black text-neo-white px-4 py-2 font-display font-bold text-sm uppercase mb-6 rotate-1">
                        Comment ça marche
                    </div>
                    <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
                        Votre comptabilité en
                        <br />
                        <span className="relative inline-block">
                            <span className="relative z-10">4 étapes simples</span>
                            <span className="absolute bottom-2 left-0 w-full h-4 bg-neo-lime -z-0 -rotate-1" />
                        </span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        De la facture papier à l&apos;écriture comptable en quelques clics.
                    </p>
                </div>

                {/* Steps */}
                <div className="space-y-24">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                        >
                            {/* Content */}
                            <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`w-16 h-16 ${step.color} border-3 border-neo-black shadow-neo flex items-center justify-center font-display font-bold text-2xl`}>
                                        {step.number}
                                    </div>
                                    <div className={`w-14 h-14 bg-neo-white border-3 border-neo-black flex items-center justify-center`}>
                                        <step.icon className="w-7 h-7" />
                                    </div>
                                </div>

                                <h3 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                                    {step.title}
                                </h3>

                                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                                    {step.description}
                                </p>

                                <ul className="space-y-3">
                                    {step.details.map((detail, i) => (
                                        <li key={i} className={`flex items-center gap-3 pl-4 border-l-4 ${step.accent}`}>
                                            <span className="text-gray-700">{detail}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Visual */}
                            <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                                {step.visual}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
