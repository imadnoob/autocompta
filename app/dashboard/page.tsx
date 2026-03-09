'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DocumentUploader from '@/components/modules/DocumentUploader';
import DocumentList from '@/components/modules/DocumentList';
import DocumentFilters, { AccountingFilters } from '@/components/modules/DocumentFilters';
import ComptabiliteModule from '@/components/modules/ComptabiliteModule';
import DashboardModule from '@/components/modules/DashboardModule';
import { LogOut, LayoutDashboard, FileText, BookOpen, BarChart3, Sparkles, TrendingUp, Clock, DollarSign } from 'lucide-react';

type ModuleKey = 'dashboard' | 'documents' | 'comptabilite' | 'agentia';

const modules: { key: ModuleKey; label: string; icon: any; bg: string; description: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, bg: 'bg-neo-yellow', description: 'Vue d\'ensemble' },
    { key: 'documents', label: 'Documents', icon: FileText, bg: 'bg-neo-lime', description: 'Archivage & Classification' },
    { key: 'comptabilite', label: 'Comptabilité', icon: BookOpen, bg: 'bg-neo-blue', description: 'Saisie & Lettrage' },
    { key: 'agentia', label: 'Agent IA', icon: Sparkles, bg: 'bg-gray-200', description: 'Work in Progress - Bientôt' },
];

export default function DashboardPage() {
    const router = useRouter();
    const [activeModule, setActiveModule] = useState<ModuleKey>('dashboard');
    const [filters, setFilters] = useState<AccountingFilters>({
        search: '', type: 'all', status: 'all', accountingStatus: 'all',
        dateRange: 'all', dateFrom: '', dateTo: '', docDateFrom: '', docDateTo: '',
        minAmount: '', maxAmount: '', sortBy: 'date', sortOrder: 'desc'
    });
    const [refreshKey, setRefreshKey] = useState(0);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (data.user) {
                setUserName(data.user.user_metadata?.full_name || data.user.email || '');
            }
        };
        getUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="section-container py-8">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-neo-yellow border-3 border-neo-black shadow-neo flex items-center justify-center">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <h1 className="font-display text-3xl sm:text-4xl font-bold">AutoCompta</h1>
                    </div>
                    <p className="text-gray-600 ml-[52px]">
                        Bienvenue{userName ? `, ${userName}` : ''} 👋
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="btn-neo-secondary text-sm flex items-center gap-2 self-start"
                >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                </button>
            </header>

            {/* Module Navigation */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {modules.map((mod) => {
                    const Icon = mod.icon;
                    const isActive = activeModule === mod.key;
                    return (
                        <button
                            key={mod.key}
                            onClick={() => mod.key !== 'agentia' && setActiveModule(mod.key as ModuleKey)}
                            disabled={mod.key === 'agentia'}
                            className={`${mod.bg} border-3 border-neo-black p-5 text-left transition-all ${isActive
                                ? 'shadow-neo-lg -translate-x-1 -translate-y-1 ring-2 ring-neo-black'
                                : mod.key === 'agentia'
                                    ? 'opacity-50 cursor-not-allowed grayscale'
                                    : 'shadow-neo hover:shadow-neo-lg hover:-translate-x-1 hover:-translate-y-1 opacity-60 hover:opacity-100'
                                } relative overflow-hidden`}
                        >
                            {mod.key === 'agentia' && (
                                <div className="absolute top-2 right-[-20px] bg-neo-black text-white text-[10px] font-bold px-8 py-1 rotate-45">
                                    Bientôt
                                </div>
                            )}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-display font-bold text-gray-800">{mod.label}</span>
                                <div className={`w-8 h-8 flex items-center justify-center ${isActive ? 'bg-neo-black text-white' : 'bg-neo-black/20 text-gray-700'}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 font-medium">{mod.description}</p>
                            {isActive && (
                                <div className="w-full h-1 bg-neo-black mt-3"></div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Module Content */}
            {activeModule === 'dashboard' && (
                <div className="w-full">
                    <DashboardModule />
                </div>
            )}

            {activeModule === 'documents' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <DocumentUploader onUploadComplete={() => setRefreshKey(k => k + 1)} />
                    </div>
                    <div className="lg:col-span-2 space-y-4">
                        <DocumentFilters onFilterChange={setFilters} />
                        <DocumentList filters={filters} refreshKey={refreshKey} />
                    </div>
                </div>
            )}

            {activeModule === 'comptabilite' && (
                <ComptabiliteModule />
            )}
        </div>
    );
}
