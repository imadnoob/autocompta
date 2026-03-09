'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Sparkles } from 'lucide-react';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { href: '#fonctionnalites', label: 'Fonctionnalités' },
        { href: '#comment-ca-marche', label: 'Comment ça marche' },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-neo-cream/95 backdrop-blur-sm border-b-3 border-neo-black shadow-neo' : 'bg-transparent'
            }`}>
            <div className="section-container py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="group flex items-center gap-2">
                        <div className="w-10 h-10 bg-neo-yellow border-3 border-neo-black shadow-neo flex items-center justify-center
                          group-hover:rotate-12 transition-transform duration-300">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <span className="font-display font-bold text-xl tracking-tight">Autocompta</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="font-display font-medium text-neo-black hover:text-gray-600 
                         relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[3px] 
                         after:bg-neo-yellow after:transition-all after:duration-300 hover:after:w-full"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/login" className="font-display font-medium hover:underline underline-offset-4">
                            Connexion
                        </Link>
                        <Link href="/signup" className="btn-neo text-sm">
                            S&apos;inscrire
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden w-10 h-10 bg-neo-yellow border-3 border-neo-black shadow-neo 
                     flex items-center justify-center active:shadow-neo-active active:translate-x-[2px] active:translate-y-[2px]"
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden mt-4 p-6 bg-neo-white border-3 border-neo-black shadow-neo-lg animate-slide-up">
                        <div className="flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="font-display font-medium text-lg py-2 border-b-2 border-gray-100"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="flex flex-col gap-3 mt-4">
                                <Link href="/login" className="btn-neo-secondary text-center">
                                    Connexion
                                </Link>
                                <Link href="/signup" className="btn-neo text-center">
                                    S&apos;inscrire
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
