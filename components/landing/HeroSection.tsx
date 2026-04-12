'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Zap, FileText, Bot, Shield, BarChart3, BookOpen, Scale, LayoutDashboard } from 'lucide-react';

export default function HeroSection() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth - 0.5) * 20,
                y: (e.clientY / window.innerHeight - 0.5) * 20,
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <section className="relative min-h-screen pt-24 pb-16 overflow-hidden bg-slate-50">
            {/* Animated Background Elements (Soft glowing orbs) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl opacity-50 mix-blend-multiply floating"
                    style={{ transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)` }}
                />
                <div className="absolute top-1/3 right-1/4 w-[30rem] h-[30rem] bg-sky-200/40 rounded-full blur-3xl opacity-50 mix-blend-multiply floating stagger-2"
                    style={{ transform: `translate(${-mousePosition.x * 0.5}px, ${-mousePosition.y * 0.5}px)` }}
                />
            </div>

            <div className="section-container relative z-10">
                <div className="flex flex-col items-center text-center max-w-5xl mx-auto">

                    {/* Badge */}
                    <div className="sticker mb-8 animate-slide-up">
                        <span className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            PFE de HILMI IMAD
                        </span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-slate-900 mb-8 animate-slide-up stagger-1 leading-tight">
                        La comptabilité
                        <br />
                        <span className="bg-linear-to-r from-emerald-600 via-emerald-400 to-emerald-600 bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer">automatisée</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg sm:text-xl md:text-2xl text-slate-600 max-w-2xl mb-12 animate-slide-up stagger-2 leading-relaxed">
                        Transformez vos factures en écritures comptables en quelques secondes grâce à
                        l&apos;intelligence artificielle. Conforme au <span className="font-semibold text-slate-900">Plan Comptable Marocain</span>.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-slide-up stagger-3">
                        <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-4 py-2 font-medium rounded-xl transition-all shadow-sm text-lg px-8 py-4 group">
                            Découvrir la solution
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Hero Visual - Dashboard Preview */}
                <div className="mt-20 relative animate-scale-in stagger-5">
                    <div className="relative mx-auto max-w-5xl">
                        {/* Browser mockup */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-2xl rounded-2xl overflow-hidden ring-1 ring-slate-900/5">
                            {/* Browser header */}
                            <div className="bg-slate-100/50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                                </div>
                                <div className="flex-1 mx-4 flex justify-center">
                                    <div className="bg-white border border-slate-200 rounded-xl/60 rounded-md px-3 py-1 flex items-center gap-2 text-slate-400 text-xs shadow-sm">
                                        <Shield className="w-3 h-3" />
                                        autocompta.online
                                    </div>
                                </div>
                            </div>

                            {/* Exact HTML Replica of the Real Dashboard */}
                            <div className="bg-slate-50 min-h-[500px] flex flex-col text-left">
                                {/* AgentBar Mockup */}
                                <div className="bg-white border-b border-slate-200 py-2 px-6 flex items-center gap-4">
                                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div className="flex-1 max-w-2xl bg-slate-100 border border-transparent rounded-lg px-3 py-2 flex items-center gap-2">
                                        <span className="text-sm text-slate-500">Posez une question à l'Agent IA...</span>
                                    </div>
                                </div>

                                {/* Main Dashboard Layout */}
                                <div className="p-6 sm:p-8 flex-1">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                                                    <Sparkles className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-2xl font-semibold text-slate-900 tracking-tight">AutoCompta</span>
                                            </div>
                                            <p className="text-slate-500 text-sm">Bienvenue, Hilmi 👋</p>
                                        </div>
                                        <div className="border border-slate-200 rounded-xl bg-white rounded-lg px-4 py-2 text-sm font-medium shadow-sm flex items-center gap-2 text-slate-600 transition-colors hover:bg-slate-50">
                                            Déconnexion
                                        </div>
                                    </div>

                                    {/* Navigation Tabs */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                        {[
                                            { name: 'Dashboard', desc: 'Vue d\'ensemble', bg: 'bg-emerald-50 border-emerald-500', icon: 'LayoutDashboard', active: true, iconClass: 'text-emerald-700' },
                                            { name: 'Documents', desc: 'Archivage & Classification', bg: 'bg-white border-transparent', icon: 'FileText', iconClass: 'text-slate-400' },
                                            { name: 'Comptabilité', desc: 'Saisie & Lettrage', bg: 'bg-white border-transparent', icon: 'BookOpen', iconClass: 'text-slate-400' },
                                            { name: 'Agent IA', desc: 'Assistant Intelligent', bg: 'bg-white border-transparent', icon: 'Sparkles', iconClass: 'text-slate-400' },
                                        ].map((tab, i) => (
                                            <div key={i} className={`border ${tab.bg} p-4 rounded-xl shadow-sm transition-all ${tab.active ? 'ring-1 ring-emerald-500' : 'hover:border-slate-300'} relative overflow-hidden`}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className={`text-sm font-semibold ${tab.active ? 'text-emerald-900' : 'text-slate-700'}`}>{tab.name}</span>
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tab.active ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                                        {i === 0 && <LayoutDashboard className="w-4 h-4 text-emerald-600" />}
                                                        {i === 1 && <FileText className="w-4 h-4 text-slate-500" />}
                                                        {i === 2 && <BookOpen className="w-4 h-4 text-slate-500" />}
                                                        {i === 3 && <Sparkles className="w-4 h-4 text-slate-400" />}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-3">{tab.desc}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* KPI Cards */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Docs saisis</span>
                                                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                            </div>
                                            <p className="text-3xl font-bold text-slate-900">53</p>
                                            <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
                                                ↗ <span className="text-slate-500">Mois courant</span>
                                            </p>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Dépenses</span>
                                                <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center">
                                                    <ArrowRight className="w-4 h-4 rotate-45" />
                                                </div>
                                            </div>
                                            <p className="text-2xl font-bold text-slate-900 tracking-tight">132.336 <span className="text-sm font-medium text-slate-500">MAD</span></p>
                                            <p className="text-xs text-slate-500 font-medium mt-2">Total comptabilisé</p>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Revenus</span>
                                                <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                                                    <ArrowRight className="w-4 h-4 -rotate-45" />
                                                </div>
                                            </div>
                                            <p className="text-2xl font-bold text-slate-900 tracking-tight">245.890 <span className="text-sm font-medium text-slate-500">MAD</span></p>
                                            <p className="text-xs text-slate-500 font-medium mt-2">Total comptabilisé</p>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Période</span>
                                                <div className="w-8 h-8 bg-slate-50 text-slate-500 rounded-lg flex items-center justify-center">
                                                    <span className="text-xs">📅</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <button className="text-slate-400 hover:text-slate-600 px-2">&lt;</button>
                                                <p className="text-xl font-bold text-slate-900">2026</p>
                                                <button className="text-slate-400 hover:text-slate-600 px-2">&gt;</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Charts */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        {/* Bar Chart */}
                                        <div className="sm:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                            <div className="flex gap-4 mb-6 border-b border-slate-100 pb-4">
                                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                                    <BarChart3 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">Évolution Financière</p>
                                                    <p className="text-xs text-slate-500">Dépenses vs Revenus — 2026 (MAD)</p>
                                                </div>
                                            </div>

                                            <div className="relative h-48 border-l border-b border-slate-200 ml-8 flex items-end px-2 pb-1">
                                                <div className="absolute top-0 right-0 w-full border-t border-dashed border-slate-200" />
                                                <div className="absolute top-1/4 right-0 w-full border-t border-dashed border-slate-200" />
                                                <div className="absolute top-2/4 right-0 w-full border-t border-dashed border-slate-200" />
                                                <div className="absolute top-3/4 right-0 w-full border-t border-dashed border-slate-200" />

                                                {/* Left y-axis labels */}
                                                <div className="absolute -left-9 top-0 text-[10px] text-slate-400">100k</div>
                                                <div className="absolute -left-8 top-[25%] text-[10px] text-slate-400">75k</div>
                                                <div className="absolute -left-8 top-[50%] text-[10px] text-slate-400">50k</div>
                                                <div className="absolute -left-8 top-[75%] text-[10px] text-slate-400">25k</div>
                                                <div className="absolute -left-4 bottom-0 text-[10px] text-slate-400">0</div>

                                                <div className="w-full h-full flex items-end justify-between px-2 pt-4">
                                                    {/* Fake data bars */}
                                                    {[
                                                        { d: 50, r: 60 }, { d: 40, r: 70 }, { d: 60, r: 50 },
                                                        { d: 30, r: 80 }, { d: 70, r: 60 }, { d: 45, r: 55 },
                                                        { d: 55, r: 75 }, { d: 65, r: 40 }, { d: 35, r: 65 },
                                                        { d: 80, r: 90 }, { d: 40, r: 50 }, { d: 65, r: 85 }
                                                    ].map((val, i) => (
                                                        <div key={i} className="flex-1 flex justify-center items-end gap-1 h-full z-10">
                                                            <div className="w-full max-w-[12px] bg-rose-400 rounded-t-sm transition-all hover:bg-rose-500" style={{ height: `${val.d}%` }}></div>
                                                            <div className="w-full max-w-[12px] bg-emerald-400 rounded-t-sm transition-all hover:bg-emerald-500" style={{ height: `${val.r}%` }}></div>
                                                        </div>
                                                    ))}
                                                    {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((m, i) => (
                                                        <span key={m} className="text-[10px] text-slate-500 absolute bottom-[-24px]" style={{ left: `calc(${i * (100 / 12)}% + 3.5%)` }}>{m}</span>
                                                    ))}
                                                </div>

                                                <div className="absolute left-1/2 -translate-x-1/2 -bottom-12 flex gap-6 text-xs text-slate-600 mt-2">
                                                    <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Dépenses</span>
                                                    <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Revenus</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pie Chart */}
                                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
                                            <div className="flex gap-4 mb-4 border-b border-slate-100 pb-4">
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center">
                                                    <span className="w-4 h-4 rounded-full border border-indigo-500 relative block">
                                                        <span className="absolute top-1/2 left-1/2 w-2 h-[2px] bg-indigo-500 origin-left -rotate-45" />
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">Dépenses par Catégorie</p>
                                                    <p className="text-[10px] text-slate-500">Top 5 catégories — 2026</p>
                                                </div>
                                            </div>
                                            <div className="flex-1 flex flex-col items-center justify-center pt-2">
                                                <div className="relative w-36 h-36 mb-8 mt-2">
                                                    {/* Fake SVG Pie Chart */}
                                                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#38bdf8" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="150" className="transition-all duration-300" />
                                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#818cf8" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="175" transform="rotate(144 50 50)" className="transition-all duration-300" />
                                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#34d399" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="213" transform="rotate(252 50 50)" className="transition-all duration-300" />
                                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f472b6" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="213" transform="rotate(306 50 50)" className="transition-all duration-300" />
                                                    </svg>

                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full m-[20px] shadow-sm z-10">
                                                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total</span>
                                                        <span className="text-lg font-bold text-slate-900 -mt-0.5">132K</span>
                                                    </div>
                                                </div>

                                                {/* Legend */}
                                                <div className="w-full space-y-2 mt-auto">
                                                    <div className="flex justify-between items-center text-[10px] font-medium text-slate-600">
                                                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Achats march.</div>
                                                        <div className="text-slate-500 font-mono text-[10px]">52,934 MAD</div>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-medium text-slate-600">
                                                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Services ext.</div>
                                                        <div className="text-slate-500 font-mono text-[10px]">39,700 MAD</div>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-medium text-slate-600">
                                                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Impôts et taxes</div>
                                                        <div className="text-slate-500 font-mono text-[10px]">19,850 MAD</div>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-medium text-slate-600">
                                                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-pink-400" /> Frais de pers.</div>
                                                        <div className="text-slate-500 font-mono text-[10px]">19,850 MAD</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating elements around preview */}
                        <div className="absolute -top-6 -right-6 bg-white border border-slate-200 rounded-xl p-4 shadow-xl rotate-3 hidden lg:block">
                            <Bot className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div className="absolute -bottom-4 -left-4 bg-white border border-slate-200 rounded-xl rounded-lg px-4 py-2 shadow-lg -rotate-2 hidden lg:block">
                            <span className="font-semibold text-sm text-slate-700">🇲🇦 Conforme Plan Comptable Marocain</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
