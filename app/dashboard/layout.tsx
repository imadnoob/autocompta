'use client';

import AuthGuard from '@/components/auth/AuthGuard';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-neo-cream flex flex-col">
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </AuthGuard>
    );
}
