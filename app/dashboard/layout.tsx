'use client';

import AuthGuard from '@/components/auth/AuthGuard';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </AuthGuard>
    );
}
