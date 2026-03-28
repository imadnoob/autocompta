'use client';

import { Zap, Shield, Target } from 'lucide-react';

const arguments_ = [
    {
        icon: Zap,
        title: 'Rapidité',
        subtitle: 'Saisie instantanée par l\'IA.',
        description: "De la facture papier au journal comptable en moins de 3 secondes. L'intelligence artificielle extrait, classifie et saisit vos données sans aucune intervention manuelle.",
        accent: 'text-emerald-600',
    },
    {
        icon: Shield,
        title: 'Conformité',
        subtitle: 'Rigueur PCM native.',
        description: "Oubliez les erreurs de saisie. AutoCompta suit rigoureusement le Plan Comptable Marocain pour garantir une comptabilité saine, structurée et 100% conforme aux normes fiscales.",
        accent: 'text-slate-900',
    },
    {
        icon: Target,
        title: 'Efficacité',
        subtitle: 'Adieu les tâches répétitives.',
        description: "Libérez votre temps pour ce qui compte vraiment. Centralisez vos documents, automatisez vos écritures et pilotez votre activité avec des tableaux de bord mis à jour en temps réel.",
        accent: 'text-slate-900',
    },
];

export default function FeaturesSection() {
    return (
        <section id="fonctionnalites" className="py-32 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="mb-24">
                    <div className="inline-block bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] mb-8 border border-emerald-100">
                        Comptabilité par IA
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-8 max-w-4xl">
                        Un workflow simplifié, <br />
                        <span className="bg-linear-to-r from-emerald-600 via-emerald-400 to-emerald-600 bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer">une rigueur absolue.</span>
                    </h2>
                </div>

                {/* 3 Arguments - Typography Focused */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-12">
                    {arguments_.map((arg, i) => {
                        const Icon = arg.icon;
                        return (
                            <div
                                key={i}
                                className="group flex flex-col gap-8 hover:scale-[1.02] transition-transform duration-500"
                            >
                                {/* Line Decor */}
                                <div className="h-[1px] w-full bg-slate-100 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 h-full w-0 bg-emerald-500 group-hover:w-full transition-all duration-700 ease-in-out" />
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <Icon className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
                                        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-slate-400">
                                            {arg.title}
                                        </h3>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                                            {arg.subtitle}
                                        </p>
                                        <p className="text-slate-500 text-base leading-relaxed max-w-sm">
                                            {arg.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Subtle background decoration */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03] overflow-hidden">
                <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-emerald-500 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 -right-1/4 w-[800px] h-[800px] bg-emerald-300 rounded-full blur-[120px]" />
            </div>
        </section>
    );
}
