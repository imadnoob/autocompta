'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, User, ArrowRight, Sparkles, Check } from 'lucide-react';

export default function SignupPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
            <div className="min-h-screen bg-neo-lime flex items-center justify-center p-8">
                <div className="max-w-md text-center">
                    <div className="w-20 h-20 bg-neo-white border-3 border-neo-black shadow-neo-lg mx-auto mb-8 flex items-center justify-center">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="font-display text-4xl font-bold mb-4">
                        Vérifiez votre email !
                    </h1>
                    <p className="text-lg text-gray-700 mb-8">
                        Nous avons envoyé un lien de confirmation à <strong>{email}</strong>.
                        Cliquez sur le lien pour activer votre compte.
                    </p>
                    <Link href="/login" className="btn-neo inline-flex">
                        Retour à la connexion
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neo-cream flex">
            {/* Left side - Visual */}
            <div className="hidden lg:flex flex-1 bg-neo-yellow items-center justify-center p-12 relative overflow-hidden">
                {/* Decorative shapes */}
                <div className="absolute top-10 left-10 w-32 h-32 bg-neo-black border-3 border-neo-black rotate-12" />
                <div className="absolute bottom-20 right-10 w-24 h-24 bg-neo-pink border-3 border-neo-black -rotate-6" />
                <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-neo-white border-3 border-neo-black rotate-45" />

                <div className="relative z-10 max-w-md">
                    <h2 className="font-display text-4xl font-bold mb-8">
                        Commencez à automatiser votre comptabilité
                    </h2>
                    <ul className="space-y-4">
                        {benefits.map((benefit, i) => (
                            <li key={i} className="flex items-center gap-3 text-lg">
                                <div className="w-8 h-8 bg-neo-black text-neo-white flex items-center justify-center">
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
                        <div className="w-10 h-10 bg-neo-yellow border-3 border-neo-black shadow-neo flex items-center justify-center group-hover:rotate-12 transition-transform">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <span className="font-display font-bold text-xl">Autocompta</span>
                    </Link>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="font-display text-4xl font-bold mb-2">
                            Créer un compte
                        </h1>
                        <p className="text-gray-600">
                            Inscrivez-vous gratuitement et commencez en 5 minutes.
                        </p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-3 border-red-500 text-red-700 font-medium">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSignup} className="space-y-5">
                        <div>
                            <label className="block font-display font-semibold mb-2">
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
                                    className="input-neo pl-12"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-display font-semibold mb-2">
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
                                    className="input-neo pl-12"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-display font-semibold mb-2">
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
                                    className="input-neo pl-12"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-neo w-full justify-center text-lg py-4 disabled:opacity-50"
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
                        <Link href="/login" className="font-semibold text-neo-black underline underline-offset-4 hover:text-gray-700">
                            Se connecter
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
