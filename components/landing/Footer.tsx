'use client';

import { ArrowRight, Mail, Phone, MapPin, Linkedin, Twitter, Instagram, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function CTASection() {
    return (
        <section className="py-24 bg-neo-yellow relative overflow-hidden">
            {/* Decorative shapes */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-neo-white border-3 border-neo-black rotate-12 opacity-50" />
            <div className="absolute bottom-10 right-10 w-24 h-24 bg-neo-pink border-3 border-neo-black -rotate-6 opacity-50" />
            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-neo-lime border-3 border-neo-black rotate-45 opacity-30" />

            <div className="section-container relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-block bg-neo-black text-neo-white px-4 py-2 font-display font-bold text-sm uppercase mb-8 rotate-1">
                        🚀 Prêt à démarrer ?
                    </div>

                    <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-neo-black">
                        Automatisez votre
                        <br />
                        comptabilité dès
                        <br />
                        <span className="relative inline-block">
                            <span className="relative z-10">aujourd&apos;hui</span>
                            <span className="absolute bottom-2 left-0 w-full h-4 bg-neo-white -z-0 -rotate-1" />
                        </span>
                    </h2>

                    <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-10">
                        Simplifiez votre comptabilité avec l&apos;intelligence artificielle et le Plan Comptable Marocain.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                        <Link href="/signup" className="btn-neo text-lg px-8 py-4 group bg-neo-black text-neo-white border-neo-white shadow-[4px_4px_0px_0px_#ffffff] hover:shadow-[6px_6px_0px_0px_#ffffff] active:shadow-[2px_2px_0px_0px_#ffffff]">
                            S&apos;inscrire
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a href="mailto:contact@autocompta.ma" className="btn-neo-secondary text-lg px-8 py-4">
                            Parler à un expert
                        </a>
                    </div>

                    <p className="text-sm text-gray-600">
                        ✓ 14 jours d&apos;essai gratuit &nbsp;&nbsp; ✓ Aucune carte bancaire requise &nbsp;&nbsp; ✓ Configuration en 5 min
                    </p>
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
        <footer className="bg-neo-black text-neo-white py-16 border-t-3 border-neo-white">
            <div className="section-container">
                {/* Top section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 bg-neo-yellow border-3 border-neo-white flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-neo-black" />
                            </div>
                            <span className="font-display font-bold text-xl">Autocompta</span>
                        </Link>
                        <p className="text-gray-400 mb-6 max-w-xs">
                            La première solution d&apos;automatisation comptable marocaine propulsée par l&apos;intelligence artificielle.
                        </p>
                        <div className="space-y-2 text-sm text-gray-400">
                            <a href="mailto:contact@autocompta.ma" className="flex items-center gap-2 hover:text-white transition-colors">
                                <Mail className="w-4 h-4" />
                                contact@autocompta.ma
                            </a>
                            <a href="tel:+212522000000" className="flex items-center gap-2 hover:text-white transition-colors">
                                <Phone className="w-4 h-4" />
                                +212 522 00 00 00
                            </a>
                            <p className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Casablanca, Maroc
                            </p>
                        </div>
                    </div>

                    {/* Links */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h4 className="font-display font-bold mb-4">{category}</h4>
                            <ul className="space-y-2">
                                {links.map((link, i) => (
                                    <li key={i}>
                                        <a
                                            href={link.href}
                                            className="text-gray-400 hover:text-white transition-colors text-sm"
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
                <div className="bg-neo-white/10 border-3 border-neo-white/30 p-8 mb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div>
                            <h4 className="font-display font-bold text-xl mb-2">Restez informé</h4>
                            <p className="text-gray-400">
                                Recevez nos conseils comptables et les dernières mises à jour produit.
                            </p>
                        </div>
                        <form className="flex gap-3">
                            <input
                                type="email"
                                placeholder="votre@email.com"
                                className="flex-1 px-4 py-3 bg-neo-white text-neo-black border-3 border-neo-black font-body
                         focus:outline-none focus:ring-2 focus:ring-neo-yellow"
                            />
                            <button type="submit" className="btn-neo">
                                S&apos;inscrire
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-white/10">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} Autocompta. Tous droits réservés. 🇲🇦 Made in Morocco
                    </p>
                    <div className="flex gap-4">
                        {[Twitter, Linkedin, Instagram].map((Icon, i) => (
                            <a
                                key={i}
                                href="#"
                                className="w-10 h-10 bg-white/10 border-2 border-white/20 flex items-center justify-center
                         hover:bg-neo-yellow hover:border-neo-black hover:text-neo-black transition-all"
                            >
                                <Icon className="w-5 h-5" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Easter egg */}
                <div className="mt-8 text-center">
                    <p className="text-gray-600 text-xs cursor-default select-none hover:text-neo-yellow transition-colors duration-1000">
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
