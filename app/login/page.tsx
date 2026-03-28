'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Erreur de connexion');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Left side - Form */}
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
                            Bon retour !
                        </h1>
                        <p className="text-gray-600">
                            Connectez-vous pour accéder à votre tableau de bord.
                        </p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-500 text-red-700 font-medium">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-6">
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
                            <div className="flex justify-between items-center mb-2">
                                <label className="font-semibold">
                                    Mot de passe
                                </label>
                                <a href="#" className="text-sm text-gray-500 hover:text-slate-800 underline underline-offset-2">
                                    Mot de passe oublié ?
                                </a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder=""
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
                                    Se connecter
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Signup link */}
                    <p className="mt-8 text-center text-gray-600">
                        Pas encore de compte ?{' '}
                        <Link href="/signup" className="font-semibold text-slate-800 underline underline-offset-4 hover:text-gray-700">
                            Créer un compte
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right side - Visual */}
            <div className="hidden lg:flex flex-1 bg-slate-900 items-center justify-center p-12 relative overflow-hidden">
                {/* Decorative shapes */}
                <div className="absolute top-10 right-10 w-32 h-32 bg-emerald-100 rounded-3xl rotate-12 opacity-20" />
                <div className="absolute bottom-20 left-10 w-24 h-24 bg-violet-500 rounded-full -rotate-6 opacity-20" />
                <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-sky-500 rounded-2xl rotate-45 opacity-20" />

                <div className="relative z-10 text-center text-white max-w-md">
                    <div className="w-20 h-20 bg-emerald-500 rounded-2xl shadow-lg mx-auto mb-8 flex items-center justify-center -rotate-6">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="font-semibold text-4xl font-bold mb-4">
                        Passez à la comptabilité intelligente
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Gagnez du temps et évitez les erreurs grâce à l'automatisation par IA.
                    </p>
                </div>
            </div>
        </div>
    );
}
