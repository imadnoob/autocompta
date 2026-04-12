'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DocumentUploader from '@/components/modules/DocumentUploader';
import DocumentList from '@/components/modules/DocumentList';
import DocumentFilters, { AccountingFilters } from '@/components/modules/DocumentFilters';
import ComptabiliteModule from '@/components/modules/ComptabiliteModule';
import DashboardModule from '@/components/modules/DashboardModule';
import AgentIAModule from '@/components/modules/AgentIAModule';
import { LogOut, LayoutDashboard, FileText, BookOpen, BarChart3, Sparkles, TrendingUp, Clock, DollarSign } from 'lucide-react';

type ModuleKey = 'dashboard' | 'documents' | 'comptabilite' | 'agentia';

const modules: { key: ModuleKey; label: string; icon: any; iconBg: string; iconColor: string; description: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', description: 'Vue d\'ensemble' },
    { key: 'documents', label: 'Documents', icon: FileText, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', description: 'Archivage & Classification' },
    { key: 'comptabilite', label: 'Comptabilité', icon: BookOpen, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', description: 'Saisie & Lettrage' },
    { key: 'agentia', label: 'Agent IA', icon: Sparkles, iconBg: 'bg-violet-100', iconColor: 'text-violet-600', description: 'Assistant Intelligent' },
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
        <div className="section-container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer bg-[length:200%_auto]" />
                        <Sparkles className="w-6 h-6 text-white relative z-10" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">AutoCompta</h1>
                        <p className="text-slate-500 text-sm">
                            Bienvenue{userName ? `, ${userName}` : ''} 👋
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
                >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                </button>
            </header>

            {/* Module Navigation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {modules.map((mod) => {
                    const Icon = mod.icon;
                    const isActive = activeModule === mod.key;
                    return (
                        <button
                            key={mod.key}
                            onClick={() => setActiveModule(mod.key as ModuleKey)}
                            className={`bg-white p-5 text-left transition-all duration-300 rounded-2xl border ${isActive
                                ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500'
                                : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                } relative overflow-hidden group`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 shadow-sm
                                 ${isActive ? mod.iconBg : 'bg-slate-100 group-hover:bg-slate-200'}
                                 ${isActive ? mod.iconColor : 'text-slate-500'}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <span className={`block text-sm font-bold mb-0.5 transition-colors ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>{mod.label}</span>
                                    <p className="text-xs text-slate-500 font-medium">{mod.description}</p>
                                </div>
                            </div>
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

            {activeModule === 'agentia' && (
                <AgentIAModule />
            )}
        </div>
    );
}
