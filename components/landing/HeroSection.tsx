'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Zap, FileText, Bot, Shield, BarChart3, BookOpen, Scale } from 'lucide-react';

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
        <section className="relative min-h-screen pt-24 pb-16 overflow-hidden grain">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Floating shapes */}
                <div
                    className="absolute top-20 left-[10%] w-32 h-32 bg-neo-yellow border-3 border-neo-black rotate-12 floating"
                    style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px) rotate(12deg)` }}
                />
                <div
                    className="absolute top-40 right-[15%] w-24 h-24 bg-neo-pink border-3 border-neo-black -rotate-6 floating stagger-2"
                    style={{ transform: `translate(${-mousePosition.x}px, ${mousePosition.y}px) rotate(-6deg)` }}
                />
                <div
                    className="absolute bottom-40 left-[20%] w-20 h-20 bg-neo-lime border-3 border-neo-black rotate-45 floating stagger-3"
                    style={{ transform: `translate(${mousePosition.x * 0.5}px, ${-mousePosition.y}px) rotate(45deg)` }}
                />
                <div
                    className="absolute bottom-60 right-[25%] w-16 h-16 bg-neo-blue border-3 border-neo-black floating stagger-4"
                    style={{ transform: `translate(${-mousePosition.x * 0.5}px, ${-mousePosition.y}px)` }}
                />

                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.02]"
                    style={{ backgroundImage: 'linear-gradient(#0a0a0a 1px, transparent 1px), linear-gradient(90deg, #0a0a0a 1px, transparent 1px)', backgroundSize: '50px 50px' }}
                />
            </div>

            <div className="section-container relative z-10">
                <div className="flex flex-col items-center text-center max-w-5xl mx-auto">

                    {/* Badge */}
                    <div className="sticker mb-8 animate-slide-up cursor-magic">
                        <span className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            PFE de HILMI IMAD
                        </span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight mb-8 animate-slide-up stagger-1">
                        La comptabilité
                        <br />
                        <span className="relative inline-block">
                            <span className="relative z-10">automatisée</span>
                            <span className="absolute bottom-2 left-0 w-full h-4 bg-neo-yellow -z-0 -rotate-1" />
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-2xl mb-12 animate-slide-up stagger-2 font-body leading-relaxed">
                        Transformez vos factures en écritures comptables en quelques secondes grâce à
                        l&apos;intelligence artificielle. Conforme au <span className="font-semibold text-neo-black">Plan Comptable Marocain</span>.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-slide-up stagger-3">
                        <Link href="/signup" className="btn-neo text-lg px-8 py-4 group">
                            Découvrir la solution
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Hero Visual - Dashboard Preview */}
                <div className="mt-20 relative animate-scale-in stagger-5">
                    <div className="relative mx-auto max-w-5xl">
                        {/* Browser mockup */}
                        <div className="bg-neo-white border-3 border-neo-black shadow-neo-xl rounded-t-lg overflow-hidden">
                            {/* Browser header */}
                            <div className="bg-neo-black px-4 py-3 flex items-center gap-2">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                </div>
                                <div className="flex-1 mx-4">
                                    <div className="bg-gray-800 rounded px-3 py-1 text-gray-400 text-sm font-mono">
                                        app.autocompta.ma
                                    </div>
                                </div>
                            </div>

                            {/* Exact HTML Replica of the Real Dashboard */}
                            <div className="bg-[#fcfaf2] min-h-[500px] flex flex-col text-left">
                                {/* AgentBar Mockup */}
                                <div className="bg-neo-black text-neo-white py-2 px-6 flex items-center gap-4">
                                    <div className="w-8 h-8 bg-neo-yellow border-2 border-neo-white flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-neo-black" />
                                    </div>
                                    <div className="flex-1 max-w-2xl bg-[#1e2330] border border-gray-600 px-3 py-1.5 flex items-center gap-2">
                                        <span className="text-xs text-gray-500 font-mono">Demandez-moi quelque chose...</span>
                                    </div>
                                </div>

                                {/* Main Dashboard Layout */}
                                <div className="p-6 sm:p-8 flex-1">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-8 h-8 bg-neo-yellow border-2 border-neo-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                    <Sparkles className="w-4 h-4 text-neo-black" />
                                                </div>
                                                <span className="font-display text-2xl font-bold text-neo-black">AutoCompta</span>
                                            </div>
                                            <p className="text-gray-600 text-sm ml-10">Bienvenue 👋</p>
                                        </div>
                                        <div className="border-2 border-neo-black px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                                            <span className="w-3 h-3 border border-neo-black flex items-center justify-center">→</span>
                                            Déconnexion
                                        </div>
                                    </div>

                                    {/* Navigation Tabs */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                                        {[
                                            { name: 'Dashboard', desc: 'Vue d\'ensemble', bg: 'bg-neo-yellow', icon: 'LayoutDashboard', active: true },
                                            { name: 'Documents', desc: 'Archivage & Classification', bg: 'bg-neo-lime', icon: 'FileText' },
                                            { name: 'Comptabilité', desc: 'Saisie & Lettrage', bg: 'bg-neo-blue', icon: 'BookOpen' },
                                            { name: 'Agent IA', desc: 'Work in Progress - Bientôt', bg: 'bg-gray-200', icon: 'Sparkles' },
                                        ].map((tab, i) => (
                                            <div key={i} className={`${tab.bg} border-2 border-neo-black p-3 ${tab.active ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5' : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] opacity-80'} ${i === 3 ? 'grayscale' : ''} relative overflow-hidden`}>
                                                {i === 3 && (
                                                    <div className="absolute top-2 right-[-20px] bg-neo-black text-white text-[8px] font-bold px-8 py-0.5 rotate-45">
                                                        Bientôt
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-display font-bold">{tab.name}</span>
                                                    <div className={`w-5 h-5 flex items-center justify-center ${tab.active ? 'bg-neo-black' : 'bg-neo-black/20'}`}>
                                                        {i === 0 && <span className="w-2.5 h-2.5 bg-white scale-75" style={{ clipPath: 'polygon(0% 0%, 40% 0%, 40% 40%, 0% 40%, 0% 60%, 40% 60%, 40% 100%, 0% 100%, 60% 100%, 60% 60%, 100% 60%, 100% 100%, 100% 0%, 60% 0%, 60% 40%, 100% 40%)' }} />}
                                                        {i === 1 && <FileText className="w-3 h-3 text-gray-700" />}
                                                        {i === 2 && <BookOpen className="w-3 h-3 text-gray-700" />}
                                                        {i === 3 && <Sparkles className="w-3 h-3 text-gray-700" />}
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-gray-700 font-medium">{tab.desc}</p>
                                                {tab.active && <div className="h-0.5 w-full bg-neo-black mt-2" />}
                                            </div>
                                        ))}
                                    </div>

                                    {/* KPI Cards */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                                        <div className="bg-white border-2 border-neo-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Docs saisis</span>
                                                <div className="w-7 h-7 bg-neo-blue border-2 border-neo-black flex items-center justify-center">
                                                    <FileText className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            </div>
                                            <p className="text-3xl font-display font-black">1</p>
                                            <p className="text-[10px] text-gray-500 font-bold mt-1 flex items-center gap-1">
                                                <span className="text-neo-blue">↗</span> Mois courant
                                            </p>
                                        </div>
                                        <div className="bg-white border-2 border-neo-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Dépenses (Achats)</span>
                                                <div className="w-7 h-7 bg-neo-pink border-2 border-neo-black flex items-center justify-center">
                                                    <span className="text-white font-bold text-xs">↘</span>
                                                </div>
                                            </div>
                                            <p className="text-2xl font-display font-black">132.336 MAD</p>
                                            <p className="text-[10px] text-gray-500 font-bold mt-1">Total comptabilisé</p>
                                        </div>
                                        <div className="bg-white border-2 border-neo-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Revenus (Ventes)</span>
                                                <div className="w-7 h-7 bg-neo-lime border-2 border-neo-black flex items-center justify-center">
                                                    <span className="text-neo-black font-bold text-xs">↗</span>
                                                </div>
                                            </div>
                                            <p className="text-2xl font-display font-black">245.890 MAD</p>
                                            <p className="text-[10px] text-gray-500 font-bold mt-1">Total comptabilisé</p>
                                        </div>
                                        <div className="bg-white border-2 border-neo-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Année</span>
                                                <div className="w-7 h-7 bg-neo-yellow border-2 border-neo-black flex items-center justify-center">
                                                    <span className="text-xs">📅</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-neo-black flex items-center justify-center text-[10px] font-bold">&lt;</div>
                                                <p className="text-2xl font-display font-black">2026</p>
                                                <div className="w-5 h-5 border-2 border-neo-black flex items-center justify-center text-[10px] font-bold">&gt;</div>
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-bold mt-1">Filtrer les graphiques</p>
                                        </div>
                                    </div>

                                    {/* Charts */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        {/* Bar Chart */}
                                        <div className="sm:col-span-2 bg-white border-2 border-neo-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                            <div className="flex gap-3 mb-6 border-b-2 border-neo-black pb-3">
                                                <div className="w-8 h-8 bg-neo-blue border-2 border-neo-black flex flex-col justify-end p-1 gap-0.5">
                                                    <div className="flex gap-px items-end h-full">
                                                        <div className="w-1.5 h-full bg-white/50" />
                                                        <div className="w-1.5 h-2/3 bg-white" />
                                                        <div className="w-1.5 h-1/2 bg-white/80" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-display font-bold">Évolution Financière</p>
                                                    <p className="text-[10px] text-gray-500">Dépenses vs Revenus — 2026 (MAD)</p>
                                                </div>
                                            </div>

                                            <div className="relative h-40 border-l border-b border-neo-black ml-6 flex items-end px-2">
                                                <div className="absolute top-0 right-0 w-full border-t border-dashed border-gray-200" />
                                                <div className="absolute top-1/4 right-0 w-full border-t border-dashed border-gray-200" />
                                                <div className="absolute top-2/4 right-0 w-full border-t border-dashed border-gray-200" />
                                                <div className="absolute top-3/4 right-0 w-full border-t border-dashed border-gray-200" />

                                                {/* Left y-axis labels */}
                                                <div className="absolute -left-7 top-0 text-[10px]">100k</div>
                                                <div className="absolute -left-6 top-[25%] text-[10px]">75k</div>
                                                <div className="absolute -left-6 top-[50%] text-[10px]">50k</div>
                                                <div className="absolute -left-6 top-[75%] text-[10px]">25k</div>
                                                <div className="absolute -left-4 bottom-0 text-[10px]">0</div>

                                                <div className="w-full h-full flex items-end justify-between px-2 pt-4">
                                                    {/* Fake data bars mimicking Recharts structure */}
                                                    {[
                                                        { d: 50, r: 60 }, { d: 40, r: 70 }, { d: 60, r: 50 },
                                                        { d: 30, r: 80 }, { d: 70, r: 60 }, { d: 45, r: 55 },
                                                        { d: 55, r: 75 }, { d: 65, r: 40 }, { d: 35, r: 65 },
                                                        { d: 80, r: 90 }, { d: 40, r: 50 }, { d: 65, r: 85 }
                                                    ].map((val, i) => (
                                                        <div key={i} className="flex-1 flex justify-center items-end gap-[1px] h-full group z-10 px-[1px]">
                                                            <div className="w-full max-w-[10px] bg-neo-pink border border-neo-black relative group-hover:bg-neo-pink/80 transition-colors" style={{ height: `${val.d}%` }}></div>
                                                            <div className="w-full max-w-[10px] bg-neo-lime border border-neo-black relative group-hover:bg-neo-lime/80 transition-colors" style={{ height: `${val.r}%` }}></div>
                                                        </div>
                                                    ))}
                                                    {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((m, i) => (
                                                        <span key={m} className="text-[10px] font-bold absolute bottom-[-20px]" style={{ left: `calc(${i * (100 / 12)}% + 3.5%)` }}>{m}</span>
                                                    ))}
                                                </div>

                                                <div className="absolute left-[30%] -bottom-10 flex gap-6 text-[10px] font-bold mt-2">
                                                    <span className="flex items-center gap-1.5 text-neo-pink"><div className="w-3 h-3 bg-neo-pink border border-neo-black" /> Dépenses</span>
                                                    <span className="flex items-center gap-1.5 text-neo-lime"><div className="w-3 h-3 bg-neo-lime border border-neo-black" /> Revenus</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pie Chart */}
                                        <div className="bg-white border-2 border-neo-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col">
                                            <div className="flex gap-2 mb-4 border-b-2 border-neo-black pb-2">
                                                <div className="w-6 h-6 bg-neo-yellow border-2 border-neo-black flex items-center justify-center">
                                                    <span className="w-3 h-3 rounded-full border border-neo-black relative">
                                                        <span className="absolute top-1/2 left-1/2 w-1.5 h-[1px] bg-neo-black origin-left -rotate-45" />
                                                        <span className="absolute top-1/2 left-1/2 w-1.5 h-[1px] bg-neo-black origin-left rotate-45" />
                                                        <span className="absolute top-1/2 left-1/2 h-1.5 w-[1px] bg-neo-black origin-bottom" />
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-display font-bold text-sm">Dépenses par Catégorie</p>
                                                    <p className="text-[10px] text-gray-500">Top 5 catégories — 2026</p>
                                                </div>
                                            </div>
                                            <div className="flex-1 flex flex-col items-center justify-center pt-2">
                                                <div className="relative w-32 h-32 mb-8 drop-shadow-sm">
                                                    {/* Fake SVG Pie Chart mimicking Recharts */}
                                                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                                        {/* Achats de marchandises (40%) */}
                                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ff90e8" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="150" className="transition-all duration-300 hover:stroke-[22px]" />
                                                        {/* Services extérieurs (30%) */}
                                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ffc900" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="175" transform="rotate(144 50 50)" className="transition-all duration-300 hover:stroke-[22px]" />
                                                        {/* Impôts et taxes (15%) */}
                                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#23a094" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="213" transform="rotate(252 50 50)" className="transition-all duration-300 hover:stroke-[22px]" />
                                                        {/* Frais de personnel (15%) */}
                                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#90a8ed" strokeWidth="20" strokeDasharray="251.2" strokeDashoffset="213" transform="rotate(306 50 50)" className="transition-all duration-300 hover:stroke-[22px]" />
                                                    </svg>

                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full m-[22px] shadow-neo border-2 border-neo-black z-10">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total</span>
                                                        <span className="text-sm font-display font-black text-neo-black -mt-0.5">132K</span>
                                                    </div>
                                                </div>

                                                {/* Legend */}
                                                <div className="w-full space-y-2 mt-auto">
                                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                                        <div className="flex items-center gap-2"><div className="w-3 h-3 border border-neo-black bg-[#ff90e8]" /> Achats march.</div>
                                                        <div className="text-gray-600 font-mono">52,934 MAD</div>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                                        <div className="flex items-center gap-2"><div className="w-3 h-3 border border-neo-black bg-[#ffc900]" /> Services ext.</div>
                                                        <div className="text-gray-600 font-mono">39,700 MAD</div>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                                        <div className="flex items-center gap-2"><div className="w-3 h-3 border border-neo-black bg-[#23a094]" /> Impôts et taxes</div>
                                                        <div className="text-gray-600 font-mono">19,850 MAD</div>
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-bold">
                                                        <div className="flex items-center gap-2"><div className="w-3 h-3 border border-neo-black bg-[#90a8ed]" /> Frais de pers.</div>
                                                        <div className="text-gray-600 font-mono">19,850 MAD</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating elements around preview */}
                        <div className="absolute -top-8 -right-8 bg-neo-pink border-3 border-neo-black p-4 shadow-neo rotate-6 hidden lg:block animate-wiggle">
                            <Bot className="w-8 h-8" />
                        </div>
                        <div className="absolute -bottom-6 -left-6 bg-neo-blue border-3 border-neo-black px-4 py-2 shadow-neo -rotate-3 hidden lg:block">
                            <span className="font-display font-bold text-sm">🇲🇦 100% Marocain</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
