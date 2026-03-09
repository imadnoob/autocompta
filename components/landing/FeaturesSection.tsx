'use client';

import { useState } from 'react';
import { FileText, Brain, Scale, BarChart3, BookOpen, Shield } from 'lucide-react';

const features = [
    {
        icon: Brain,
        title: 'Extraction IA',
        description: 'L\'intelligence artificielle analyse vos factures, reçus et relevés bancaires. Elle extrait automatiquement le fournisseur, les montants, la TVA, et classifie selon le PCM.',
        color: 'bg-neo-yellow',
        details: ['Extraction automatique des données', 'Détection du fournisseur et de la date', 'Calcul et vérification de la TVA', 'Classification PCM intelligente'],
    },
    {
        icon: BookOpen,
        title: 'Comptabilité automatisée',
        description: 'Les écritures comptables sont générées automatiquement à partir de vos documents. Journal d\'achats, de ventes, de banque et de caisse — tout est saisi en un clic.',
        color: 'bg-neo-lime',
        details: ['Journaux HA, VT, BQ, CA, OD', 'Saisie en un clic depuis les documents', 'Lettrage automatique des écritures', 'Comptabilisation et règlement des factures'],
    },
    {
        icon: Scale,
        title: 'États de synthèse',
        description: 'Bilan et CPC générés automatiquement conformément au Plan Comptable Marocain. Filtrage par année avec cumul correct pour le Bilan et reset annuel pour le CPC.',
        color: 'bg-neo-pink',
        details: ['Bilan actif/passif complet', 'CPC avec résultat d\'exploitation, financier et net', 'Ajustements manuels pour le capital et réserves', 'Injection automatique du résultat dans le Bilan'],
    },
    {
        icon: BarChart3,
        title: 'Dashboard temps réel',
        description: 'Visualisez l\'évolution de vos dépenses et revenus mois par mois. Répartition des charges par catégorie PCM et suivi des KPIs financiers.',
        color: 'bg-neo-blue',
        details: ['Graphiques mensuels dépenses/revenus', 'Répartition des charges par catégorie', 'Sélection de l\'année avec filtrage', 'KPIs : documents saisis, total dépenses'],
    },
    {
        icon: FileText,
        title: 'Gestion documentaire',
        description: 'Tous vos documents comptables au même endroit. Upload, suivi du statut, filtrage avancé, détection des doublons et référencement interne automatique.',
        color: 'bg-neo-orange',
        details: ['Upload drag & drop multi-fichiers', 'Statuts : à saisir, saisi, réglé', 'Détection automatique des doublons', 'Référencement interne (FAC, REC, AVO...)'],
    },
    {
        icon: Shield,
        title: 'Conforme PCM Marocain',
        description: 'Toute la comptabilité suit rigoureusement le Plan Comptable Marocain. Les comptes de charges (6xxx), produits (7xxx), actifs et passifs sont classés automatiquement.',
        color: 'bg-neo-purple',
        details: ['Plan Comptable Marocain intégré', 'Classes 1 à 5 pour le Bilan', 'Classes 6 et 7 pour le CPC', 'Prise en compte des sous-comptes tiers', 'Base de comptes PCM vectorisée pour la recherche'],
    },
];

export default function FeaturesSection() {
    const [activeFeature, setActiveFeature] = useState(0);

    return (
        <section id="fonctionnalites" className="py-24 bg-neo-black text-neo-white relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }} />
            </div>

            <div className="section-container relative z-10">
                {/* Section Header */}
                <div className="text-center mb-20">
                    <div className="inline-block bg-neo-yellow text-neo-black px-4 py-2 font-display font-bold text-sm uppercase mb-6 border-3 border-neo-white -rotate-1">
                        Fonctionnalités
                    </div>
                    <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
                        Tout ce qu&apos;il vous faut
                        <br />
                        <span className="text-stroke">pour automatiser</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Une suite complète d&apos;outils de comptabilité automatisée, conforme au PCM marocain.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            onMouseEnter={() => setActiveFeature(index)}
                            className={`group p-8 border-3 border-neo-white transition-all duration-300 cursor-pointer
                         ${activeFeature === index ? 'bg-neo-white text-neo-black -translate-x-2 -translate-y-2 shadow-[8px_8px_0px_0px_#fef08a]' : 'hover:bg-neo-white/10'}`}
                        >
                            <div className={`w-14 h-14 ${feature.color} border-3 border-neo-black mb-6 flex items-center justify-center
                             ${activeFeature === index ? '' : 'border-neo-white'}`}>
                                <feature.icon className="w-7 h-7" />
                            </div>

                            <h3 className="font-display text-2xl font-bold mb-4">{feature.title}</h3>
                            <p className={`mb-6 leading-relaxed ${activeFeature === index ? 'text-gray-600' : 'text-gray-400'}`}>
                                {feature.description}
                            </p>

                            {/* Feature details - show on active */}
                            <div className={`overflow-hidden transition-all duration-300 ${activeFeature === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <ul className="space-y-2">
                                    {feature.details.map((detail, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm">
                                            <span className="w-2 h-2 bg-neo-yellow" />
                                            {detail}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="text-center">
                    <p className="text-gray-400 mb-6">Et bien plus encore… Découvrez par vous-même</p>
                    <a href="/signup" className="btn-neo inline-flex">
                        Essayer maintenant
                    </a>
                </div>
            </div>
        </section>
    );
}
