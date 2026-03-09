'use client';

import { useEffect, useState } from 'react';
import { supabase, isDemoMode } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // In demo mode, skip auth check
        if (isDemoMode) {
            setLoading(false);
            return;
        }

        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            } else {
                setLoading(false);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            if (!session) {
                router.push('/login');
            }
        });

        checkAuth();

        return () => subscription.unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '100vh', width: '100vw' }}>
                <Loader2 className="animate-spin" size={40} style={{ color: 'var(--accent-primary)' }} />
            </div>
        );
    }

    return (
        <>
            {isDemoMode && (
                <div style={{
                    background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                }}>
                    <AlertTriangle size={16} />
                    <strong>DEMO MODE</strong> - Configure .env.local with Supabase credentials for full functionality
                </div>
            )}
            {children}
        </>
    );
}
