'use client';

import { useState } from 'react';
import { Check, X, Sparkles, Building2, Crown } from 'lucide-react';
import Link from 'next/link';

const plans = [
    {
        name: 'Starter',
        icon: Sparkles,
        description: 'Parfait pour les petits établissements qui débutent',
        price: {
            monthly: 299,
            yearly: 249,
        },
        color: 'bg-white border-slate-200 shadow-sm',
        popular: false,
        features: [
            { text: 'Jusqu\'à 100 documents/mois', included: true },
            { text: '1 utilisateur', included: true },
            { text: 'Extraction IA des factures', included: true },
            { text: 'Classification PCM automatique', included: true },
            { text: 'Comptabilisation automatique', included: true },
            { text: 'Export Excel & CSV', included: true },
            { text: 'Lettrage automatique', included: false },
            { text: 'Agent IA', included: false },
        ],
        cta: 'S\'inscrire',
        ctaStyle: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-colors',
    },
    {
        name: 'Professional',
        icon: Building2,
        description: 'Pour les PME en pleine croissance',
        price: {
            monthly: 699,
            yearly: 599,
        },
        color: 'bg-white border-emerald-500 shadow-xl shadow-emerald-900/5 ring-1 ring-emerald-500 rounded-2xl scale-105 z-10',
        popular: true,
        features: [
            { text: 'Jusqu\'à 500 documents/mois', included: true },
            { text: '5 utilisateurs', included: true },
            { text: 'Extraction IA des factures', included: true },
            { text: 'Classification PCM automatique', included: true },
            { text: 'Comptabilisation automatique', included: true },
            { text: 'Lettrage automatique', included: true },
            { text: 'Agent IA', included: true },
            { text: 'Export tous formats (Sage, Ciel...)', included: true },
        ],
        cta: 'Essayer 14 jours gratuits',
        ctaStyle: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors',
    },
    {
        name: 'Enterprise',
        icon: Crown,
        description: 'Solution sur mesure pour les grands groupes',
        price: {
            monthly: null,
            yearly: null,
        },
        color: 'bg-slate-900 border-slate-800 shadow-xl',
        textColor: 'text-white',
        popular: false,
        features: [
            { text: 'Documents illimités', included: true },
            { text: 'Utilisateurs illimités', included: true },
            { text: 'Extraction IA & Classification PCM', included: true },
            { text: 'Comptabilisation & Lettrage auto', included: true },
            { text: 'Agent IA en illimité', included: true },
            { text: 'Multi-établissements', included: true },
            { text: 'Intégration API complète', included: true },
            { text: 'Account manager dédié', included: true },
        ],
        cta: 'Nous contacter',
        ctaStyle: 'bg-white text-slate-900 hover:bg-slate-100 transition-colors',
    },
];

export default function PricingSection() {
    const [isYearly, setIsYearly] = useState(true);

    return (
        <section id="tarifs" className="py-24 bg-slate-50 relative overflow-hidden">
            {/* Background accents */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl -z-0" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-3xl -z-0" />

            <div className="section-container relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-block bg-sky-50 text-sky-600 px-4 py-1.5 rounded-full font-semibold text-sm uppercase mb-6 tracking-wide shadow-sm border border-sky-100">
                        Tarifs
                    </div>
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight text-slate-900">
                        Un prix simple,
                        <br />
                        <span className="text-sky-600">
                            sans surprise
                        </span>
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Choisissez la formule adaptée à votre établissement. Changez ou annulez à tout moment.
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center p-1 bg-slate-200/50 rounded-xl">
                        <button
                            onClick={() => setIsYearly(false)}
                            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${!isYearly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Mensuel
                        </button>
                        <button
                            onClick={() => setIsYearly(true)}
                            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 relative ${isYearly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Annuel
                            <span className="absolute -top-3 -right-4 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 shadow-sm flex items-center">
                                -17%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`relative p-8 rounded-2xl flex flex-col h-full bg-white border transition-all duration-300 ${plan.color}`}
                        >
                            {/* Popular badge */}
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full font-bold text-xs uppercase tracking-wider shadow-sm border border-emerald-600">
                                    ⭐ Le plus populaire
                                </div>
                            )}

                            {/* Plan header */}
                            <div className="flex items-center gap-4 mb-5">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${plan.textColor ? 'bg-slate-800' : (plan.popular ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600')}`}>
                                    <plan.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className={`text-2xl font-bold ${plan.textColor ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                                </div>
                            </div>

                            <p className={`mb-8 flex-1 leading-relaxed ${plan.textColor ? 'text-slate-400' : 'text-slate-500'}`}>
                                {plan.description}
                            </p>

                            {/* Price */}
                            <div className="mb-8 h-24">
                                {plan.price.monthly ? (
                                    <>
                                        <div className="flex items-end gap-1.5 mb-1">
                                            <span className={`text-5xl font-bold tracking-tight ${plan.textColor ? 'text-white' : 'text-slate-900'}`}>
                                                {isYearly ? plan.price.yearly : plan.price.monthly}
                                            </span>
                                            <span className={`text-lg font-medium mb-1.5 ${plan.textColor ? 'text-slate-400' : 'text-slate-500'}`}>
                                                MAD<span className="text-sm">/mois</span>
                                            </span>
                                        </div>
                                        {isYearly && (
                                            <p className={`text-sm font-medium ${plan.textColor ? 'text-slate-500' : 'text-emerald-600/80'}`}>
                                                Facturé annuellement ({plan.price.yearly * 12} MAD/an)
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex h-full items-center">
                                        <div className={`text-4xl font-bold tracking-tight ${plan.textColor ? 'text-white' : 'text-slate-900'}`}>Sur devis</div>
                                    </div>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        {feature.included ? (
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${plan.popular ? 'bg-emerald-100' : (plan.textColor ? 'bg-emerald-500/20' : 'bg-emerald-50')}`}>
                                                <Check className={`w-3.5 h-3.5 ${plan.popular ? 'text-emerald-600' : 'text-emerald-500'}`} />
                                            </div>
                                        ) : (
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${plan.textColor ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                                <X className={`w-3.5 h-3.5 ${plan.textColor ? 'text-slate-600' : 'text-slate-400'}`} />
                                            </div>
                                        )}
                                        <span className={`text-sm font-medium leading-relaxed ${feature.included ? (plan.textColor ? 'text-slate-300' : 'text-slate-700') : (plan.textColor ? 'text-slate-600 line-through' : 'text-slate-400 line-through')}`}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <Link href="/signup" className={`w-full py-3.5 px-6 rounded-xl font-semibold flex items-center justify-center text-center ${plan.ctaStyle}`}>
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Money back guarantee */}
                <div className="mt-20 max-w-2xl mx-auto">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 rounded-xl shadow-sm flex items-center gap-5">
                        <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
                            <span className="text-2xl">🛡️</span>
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-slate-900 text-lg tracking-tight">Garantie satisfait ou remboursé</p>
                            <p className="text-slate-500 mt-1">30 jours pour tester sans risque. Annulation en un seul clic, depuis votre espace.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
