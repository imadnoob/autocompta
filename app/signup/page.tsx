'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, User, ArrowRight, Sparkles, Check, Building, Fingerprint, ChevronDown } from 'lucide-react';

export default function SignupPage() {
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [ice, setIce] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [sector, setSector] = useState('COMMERCE');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        company_name: companyName,
                        ice: ice,
                        sector: sector,
                    },
                },
            });
            if (error) throw error;
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Erreur lors de l\'inscription');
        } finally {
            setLoading(false);
        }
    };

    const benefits = [
        'Extraction IA des factures',
        'Classification PCM automatique',
        'Comptabilisation automatique',
        'Agent IA',
    ];

    if (success) {
        return (
            <div className="min-h-screen bg-sky-50 flex items-center justify-center p-8">
                <div className="max-w-md text-center">
                    <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl shadow-sm rounded-2xl-lg mx-auto mb-8 flex items-center justify-center">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="font-semibold text-4xl font-bold mb-4">
                        Vérifiez votre email !
                    </h1>
                    <p className="text-lg text-gray-700 mb-8">
                        Nous avons envoyé un lien de confirmation à <strong>{email}</strong>.
                        Cliquez sur le lien pour activer votre compte.
                    </p>
                    <Link href="/login" className="inline-flex items-center justify-center gap-2 px-4 py-2 font-medium rounded-xl transition-all shadow-sm inline-flex">
                        Retour à la connexion
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Left side - Visual */}
            <div className="hidden lg:flex flex-1 bg-slate-100 items-center justify-center p-12 relative overflow-hidden">
                {/* Decorative shapes */}
                <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-100 rounded-3xl rotate-12 opacity-50" />
                <div className="absolute bottom-20 right-10 w-24 h-24 bg-violet-200 rounded-full -rotate-6 opacity-50" />
                <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-sky-200 rounded-2xl rotate-45 opacity-50" />

                <div className="relative z-10 max-w-md">
                    <h2 className="font-semibold text-4xl font-bold mb-8">
                        Commencez à automatiser votre comptabilité
                    </h2>
                    <ul className="space-y-4">
                        {benefits.map((benefit, i) => (
                            <li key={i} className="flex items-center gap-3 text-lg font-medium text-slate-800">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                    <Check className="w-5 h-5" />
                                </div>
                                {benefit}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <Link href="/" className="inline-flex items-center gap-2 mb-12 group">
                        <div className="w-10 h-10 bg-teal-50 border border-slate-200 rounded-xl shadow-md flex items-center justify-center group-hover:rotate-12 transition-transform">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-xl">Autocompta</span>
                    </Link>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="font-semibold text-4xl font-bold mb-2">
                            Créer un compte
                        </h1>
                        <p className="text-gray-600">
                            Inscrivez-vous gratuitement et commencez en 5 minutes.
                        </p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-500 text-red-700 font-medium">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSignup} className="space-y-5">
                        <div>
                            <label className="block font-semibold mb-2">
                                Nom complet
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder=""
                                    required
                                    className="w-full bg-slate-50 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm pl-12"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold mb-2">
                                Nom de l&apos;entreprise
                            </label>
                            <div className="relative">
                                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder=""
                                    required
                                    className="w-full bg-slate-50 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm pl-12"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold mb-2">
                                ICE (Identifiant Commun de l&apos;Entreprise)
                            </label>
                            <div className="relative">
                                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={ice}
                                    onChange={(e) => setIce(e.target.value)}
                                    placeholder="15 chiffres"
                                    required
                                    className="w-full bg-slate-50 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm pl-12"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold mb-2">
                                Secteur d&apos;activité
                            </label>
                            <div className="relative">
                                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                    value={sector}
                                    onChange={(e) => setSector(e.target.value)}
                                    required
                                    className="w-full bg-slate-50 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm pl-12 pr-10 appearance-none cursor-pointer"
                                >
                                    <option value="COMMERCE">Commerce</option>
                                    <option value="SERVICE">Service</option>
                                    <option value="HOTELLERIE_RESTAURATION">Hôtellerie & Restauration</option>
                                    <option value="INDUSTRIE">Industrie</option>
                                    <option value="BTP_CONSTRUCTION">BTP & Construction</option>
                                    <option value="PROMOTION_IMMOBILIERE">Promotion Immobilière</option>
                                    <option value="AGRICULTURE">Agriculture</option>
                                    <option value="TRANSPORT_LOGISTIQUE">Transport & Logistique</option>
                                    <option value="ASSOCIATION_COOPERATIVE">Association & Coopérative</option>
                                    <option value="PROFESSION_LIBERALE">Profession Libérale</option>
                                    <option value="ARTISANAT">Artisanat</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder=""
                                    required
                                    className="w-full bg-slate-50 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm pl-12"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold mb-2">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder=""
                                    minLength={8}
                                    required
                                    className="w-full bg-slate-50 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm pl-12"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-emerald-600 text-white hover:bg-emerald-700 w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 font-medium rounded-xl transition-all shadow-sm text-lg disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Créer mon compte gratuit
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        <p className="text-xs text-gray-500 text-center">
                            En vous inscrivant, vous acceptez nos{' '}
                            <a href="#" className="underline">conditions d&apos;utilisation</a> et{' '}
                            <a href="#" className="underline">politique de confidentialité</a>.
                        </p>
                    </form>

                    {/* Login link */}
                    <p className="mt-8 text-center text-gray-600">
                        Déjà un compte ?{' '}
                        <Link href="/login" className="font-semibold text-slate-800 underline underline-offset-4 hover:text-gray-700">
                            Se connecter
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
