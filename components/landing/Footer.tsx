'use client';

import { ArrowRight, Mail, Phone, MapPin, Linkedin, Twitter, Instagram, Sparkles, Check } from 'lucide-react';
import Link from 'next/link';

export default function CTASection() {
    return (
        <section className="py-24 bg-emerald-600 relative overflow-hidden">
            {/* Decorative shapes */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-700 rounded-full blur-3xl opacity-50 translate-y-1/3 -translate-x-1/3" />

            <div className="section-container relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-block bg-emerald-700/50 text-emerald-50 px-4 py-1.5 rounded-full font-semibold text-sm uppercase mb-8 border border-emerald-500/30 backdrop-blur-sm tracking-wide">
                        🚀 Prêt à démarrer ?
                    </div>

                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white tracking-tight">
                        Automatisez votre
                        <br />
                        comptabilité dès
                        <br />
                        <span className="text-emerald-200">
                            aujourd&apos;hui
                        </span>
                    </h2>

                    <p className="text-xl text-emerald-100/90 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Simplifiez votre comptabilité avec l&apos;intelligence artificielle et le Plan Comptable Marocain.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                        <Link href="/signup" className="flex items-center justify-center gap-2 bg-white text-emerald-600 font-semibold px-8 py-4 rounded-xl shadow-lg shadow-emerald-900/20 hover:bg-emerald-50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            S&apos;inscrire
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <a href="mailto:contact@autocompta.ma" className="flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-white bg-emerald-700/50 border border-emerald-500/50 hover:bg-emerald-700/70 transition-colors backdrop-blur-sm">
                            Parler à un expert
                        </a>
                    </div>

                    <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-sm font-medium text-emerald-100">
                        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300" /> 14 jours d&apos;essai gratuit</span>
                        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300" /> Aucune carte bancaire requise</span>
                        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300" /> Configuration en 5 min</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

export function Footer() {
    const footerLinks = {
        Produit: [
            { label: 'Fonctionnalités', href: '#fonctionnalites' },
            { label: 'Comment ça marche', href: '#comment-ca-marche' },
            { label: 'Connexion', href: '/login' },
            { label: 'Inscription', href: '/signup' },
        ],
        Ressources: [
            { label: 'Documentation', href: '#' },
            { label: 'Blog', href: '#' },
            { label: 'Guides PCM', href: '#' },
            { label: 'Webinaires', href: '#' },
            { label: 'FAQ', href: '#' },
        ],
        Entreprise: [
            { label: 'À propos', href: '#' },
            { label: 'Carrières', href: '#' },
            { label: 'Presse', href: '#' },
            { label: 'Contact', href: '#' },
            { label: 'Partenaires', href: '#' },
        ],
        Légal: [
            { label: 'Conditions d\'utilisation', href: '#' },
            { label: 'Politique de confidentialité', href: '#' },
            { label: 'Mentions légales', href: '#' },
            { label: 'RGPD', href: '#' },
        ],
    };

    return (
        <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
            <div className="section-container">
                {/* Top section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center gap-3 mb-6 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center shadow-lg shadow-emerald-900/50 group-hover:shadow-emerald-900/80 transition-shadow">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-white">Autocompta</span>
                        </Link>
                        <p className="text-slate-400 mb-8 max-w-xs leading-relaxed">
                            La première solution d&apos;automatisation comptable marocaine propulsée par l&apos;intelligence artificielle.
                        </p>
                        <div className="space-y-4 text-sm text-slate-400">
                            <a href="mailto:contact@autocompta.ma" className="flex items-center gap-3 hover:text-emerald-400 transition-colors">
                                <Mail className="w-4 h-4" />
                                contact@autocompta.ma
                            </a>
                            <a href="tel:+212522000000" className="flex items-center gap-3 hover:text-emerald-400 transition-colors">
                                <Phone className="w-4 h-4" />
                                +212 522 00 00 00
                            </a>
                            <p className="flex items-center gap-3">
                                <MapPin className="w-4 h-4" />
                                Casablanca, Maroc
                            </p>
                        </div>
                    </div>

                    {/* Links */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h4 className="font-semibold text-white mb-6 uppercase tracking-wider text-sm">{category}</h4>
                            <ul className="space-y-3.5">
                                {links.map((link, i) => (
                                    <li key={i}>
                                        <a
                                            href={link.href}
                                            className="text-slate-400 hover:text-emerald-400 transition-colors text-sm"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Newsletter */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 lg:p-10 mb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                        <div>
                            <h4 className="font-bold text-white text-xl mb-3 tracking-tight">Restez informé</h4>
                            <p className="text-slate-400 leading-relaxed">
                                Recevez nos conseils comptables et les dernières mises à jour produit.
                            </p>
                        </div>
                        <form className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="email"
                                placeholder="votre@email.com"
                                className="flex-1 px-4 py-3 bg-slate-900/50 text-white border border-slate-700 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-500 transition-shadow"
                            />
                            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-colors whitespace-nowrap">
                                S&apos;inscrire
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-slate-800">
                    <p className="text-slate-500 text-sm">
                        © {new Date().getFullYear()} Autocompta. Tous droits réservés. 🇲🇦 Made in Morocco
                    </p>
                    <div className="flex gap-4">
                        {[Twitter, Linkedin, Instagram].map((Icon, i) => (
                            <a
                                key={i}
                                href="#"
                                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400
                         hover:bg-emerald-500 hover:text-white transition-colors"
                            >
                                <Icon className="w-4 h-4" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Easter egg */}
                <div className="mt-12 text-center">
                    <p className="text-slate-600/50 text-xs cursor-default select-none hover:text-emerald-400/50 transition-colors duration-1000">
                        Crafted with ❤️ and lots of ☕ by passionate developers.
                        <span className="opacity-0 hover:opacity-100 transition-opacity duration-500 ml-2">
                            🎉 You found the easter egg!
                        </span>
                    </p>
                </div>
            </div>
        </footer>
    );
}
