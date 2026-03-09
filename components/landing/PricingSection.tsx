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
        color: 'bg-neo-white',
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
        ctaStyle: 'btn-neo-secondary',
    },
    {
        name: 'Professional',
        icon: Building2,
        description: 'Pour les PME en pleine croissance',
        price: {
            monthly: 699,
            yearly: 599,
        },
        color: 'bg-neo-yellow',
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
        ctaStyle: 'btn-neo',
    },
    {
        name: 'Enterprise',
        icon: Crown,
        description: 'Solution sur mesure pour les grands groupes',
        price: {
            monthly: null,
            yearly: null,
        },
        color: 'bg-neo-black',
        textColor: 'text-neo-white',
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
        ctaStyle: 'btn-neo',
    },
];

export default function PricingSection() {
    const [isYearly, setIsYearly] = useState(true);

    return (
        <section id="tarifs" className="py-24 bg-neo-white relative overflow-hidden">
            {/* Background accents */}
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-neo-yellow/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-neo-pink/30 rounded-full blur-3xl" />

            <div className="section-container relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-block bg-neo-lime text-neo-black px-4 py-2 font-display font-bold text-sm uppercase mb-6 border-3 border-neo-black rotate-1">
                        Tarifs
                    </div>
                    <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
                        Un prix simple,
                        <br />
                        <span className="relative inline-block">
                            <span className="relative z-10">sans surprise</span>
                            <span className="absolute bottom-2 left-0 w-full h-4 bg-neo-yellow -z-0 rotate-1" />
                        </span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                        Choisissez la formule adaptée à votre établissement. Changez ou annulez à tout moment.
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center gap-4 bg-neo-cream p-2 border-3 border-neo-black">
                        <button
                            onClick={() => setIsYearly(false)}
                            className={`px-6 py-2 font-display font-semibold transition-all ${!isYearly ? 'bg-neo-black text-white' : 'hover:bg-gray-100'
                                }`}
                        >
                            Mensuel
                        </button>
                        <button
                            onClick={() => setIsYearly(true)}
                            className={`px-6 py-2 font-display font-semibold transition-all relative ${isYearly ? 'bg-neo-black text-white' : 'hover:bg-gray-100'
                                }`}
                        >
                            Annuel
                            <span className="absolute -top-3 -right-3 bg-neo-pink text-neo-black text-xs font-bold px-2 py-0.5 border-2 border-neo-black rotate-6">
                                -17%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`relative p-8 border-3 border-neo-black ${plan.color} ${plan.textColor || ''} 
                         ${plan.popular ? 'shadow-neo-xl -translate-y-4' : 'shadow-neo'}
                         transition-all duration-300 hover:shadow-neo-xl hover:-translate-y-2`}
                        >
                            {/* Popular badge */}
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neo-pink text-neo-black px-4 py-1 font-display font-bold text-sm border-3 border-neo-black">
                                    ⭐ Le plus populaire
                                </div>
                            )}

                            {/* Plan header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-12 h-12 ${plan.popular ? 'bg-neo-black text-white' : 'bg-neo-yellow'} border-3 border-neo-black flex items-center justify-center`}>
                                    <plan.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
                                </div>
                            </div>

                            <p className={`mb-6 ${plan.textColor ? 'text-gray-300' : 'text-gray-600'}`}>
                                {plan.description}
                            </p>

                            {/* Price */}
                            <div className="mb-8">
                                {plan.price.monthly ? (
                                    <>
                                        <div className="flex items-end gap-1">
                                            <span className="font-display text-5xl font-bold">
                                                {isYearly ? plan.price.yearly : plan.price.monthly}
                                            </span>
                                            <span className={`text-lg ${plan.textColor ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                                                MAD/mois
                                            </span>
                                        </div>
                                        {isYearly && (
                                            <p className={`text-sm ${plan.textColor ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Facturé annuellement ({plan.price.yearly * 12} MAD/an)
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <div className="font-display text-3xl font-bold">Sur devis</div>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        {feature.included ? (
                                            <div className="w-6 h-6 bg-green-500 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 bg-gray-300 flex items-center justify-center">
                                                <X className="w-4 h-4 text-gray-500" />
                                            </div>
                                        )}
                                        <span className={feature.included ? '' : 'text-gray-400 line-through'}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <Link href="/signup" className={`${plan.ctaStyle} w-full justify-center`}>
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Money back guarantee */}
                <div className="mt-16 text-center">
                    <div className="inline-flex items-center gap-4 bg-neo-cream px-8 py-4 border-3 border-neo-black shadow-neo">
                        <span className="text-4xl">🛡️</span>
                        <div className="text-left">
                            <p className="font-display font-bold">Garantie satisfait ou remboursé</p>
                            <p className="text-sm text-gray-600">30 jours pour tester sans risque. Annulation en 1 clic.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
