'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { FileText, TrendingUp, DollarSign, Clock, Activity, PieChart as PieChartIcon, BarChart3, ArrowUpRight, ArrowDownRight, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DashboardModule() {
    const now = new Date();
    const [stats, setStats] = useState({
        docCountThisMonth: 0,
        totalExpenses: 0,
        totalIncome: 0,
        pendingDocs: 0,
    });

    const [chartData, setChartData] = useState<any>({
        monthlyTrend: [],
        expenseByCategory: []
    });

    const [isLoading, setIsLoading] = useState(true);
    const [allDocuments, setAllDocuments] = useState<any[]>([]);
    const [allManualEntries, setAllManualEntries] = useState<any[]>([]);
    const [availableYears, setAvailableYears] = useState<number[]>([now.getFullYear()]);
    const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

    // Professional SaaS colors
    const COLORS = ['#10b981', '#0ea5e9', '#6366f1', '#f59e0b', '#8b5cf6', '#ec4899'];

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Recompute chart when year selection changes
    useEffect(() => {
        if (allDocuments.length > 0 || allManualEntries.length > 0 || !isLoading) {
            computeChartData(allDocuments, allManualEntries, selectedYear);
        }
    }, [selectedYear, allDocuments, allManualEntries]);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const userId = session.user.id;

            const { data: documents, error } = await supabase
                .from('documents')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;

            const { data: journalEntries, error: jeError } = await supabase
                .from('journal_entries')
                .select('*')
                .eq('user_id', userId);

            if (jeError) throw jeError;

            const docs = documents || [];
            const mEntries = journalEntries || [];
            setAllDocuments(docs);
            setAllManualEntries(mEntries);

            // Derive available years from documents and manual entries
            const yearsSet = new Set<number>([now.getFullYear()]);
            docs.forEach((doc: any) => {
                const d = new Date(doc.created_at);
                yearsSet.add(d.getFullYear());
                if (doc.extracted_data?.date) {
                    const pd = new Date(doc.extracted_data.date);
                    if (!isNaN(pd.getTime())) yearsSet.add(pd.getFullYear());
                }
            });
            mEntries.forEach((entry: any) => {
                if (entry.entry_date) {
                    const pd = new Date(entry.entry_date);
                    if (!isNaN(pd.getTime())) yearsSet.add(pd.getFullYear());
                }
            });
            const years = Array.from(yearsSet).sort((a, b) => b - a);
            setAvailableYears(years);

            // The stats are now fully computed dynamically within computeChartData based on the selectedYear
            computeChartData(docs, mEntries, selectedYear);

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const computeChartData = (docs: any[], mEntries: any[], year: number) => {
        const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        const monthlyMap: Record<string, { name: string; timestamp: number; Dépenses: number; Revenus: number }> = {};
        for (let m = 0; m < 12; m++) {
            const d = new Date(year, m, 1);
            monthlyMap[`${year}-${m}`] = { name: MONTH_LABELS[m], timestamp: d.getTime(), Dépenses: 0, Revenus: 0 };
        }

        const categoryMap: Record<string, number> = {};

        let docCountThisMonth = 0;
        let pendingDocsCount = 0;
        let totalExpYear = 0;
        let totalIncYear = 0;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        docs.forEach((doc: any) => {
            const createdDate = new Date(doc.created_at);
            const isAccountingDone = doc.accounting_status === 'saisi' || doc.accounting_status === 'lettre';
            if (isAccountingDone && createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
                docCountThisMonth++;
            }
            if (doc.status === 'pending' || doc.status === 'processing') pendingDocsCount++;
        });

        // Add journal entries (both manual and auto) to charts and stats
        const manualRefsThisMonth = new Set();
        mEntries.forEach((entry: any) => {
            const account = entry.account || '';
            const accountName = entry.account_name || 'Autre (Manuel)';
            const debit = parseFloat(entry.debit) || 0;
            const credit = parseFloat(entry.credit) || 0;

            let isExpense = account.startsWith('6') || account.startsWith('2');
            let isIncome = account.startsWith('7');

            let historicDate = entry.entry_date ? new Date(entry.entry_date) : new Date(entry.created_at);
            if (isNaN(historicDate.getTime())) historicDate = new Date(entry.created_at);

            if (!entry.doc_id && historicDate.getMonth() === currentMonth && historicDate.getFullYear() === currentYear && entry.ref) {
                manualRefsThisMonth.add(entry.ref);
            }

            if (historicDate.getFullYear() === year) {
                if (isExpense) {
                    const netAmount = debit - credit;
                    totalExpYear += netAmount;
                    const catKey = accountName.trim() === '' ? 'Dépense Diverse' : accountName;
                    categoryMap[catKey] = (categoryMap[catKey] || 0) + netAmount;

                    const monthKey = `${year}-${historicDate.getMonth()}`;
                    if (monthlyMap[monthKey]) {
                        monthlyMap[monthKey].Dépenses += netAmount;
                    }
                }
                if (isIncome) {
                    const netAmount = credit - debit;
                    totalIncYear += netAmount;
                    const monthKey = `${year}-${historicDate.getMonth()}`;
                    if (monthlyMap[monthKey]) {
                        monthlyMap[monthKey].Revenus += netAmount;
                    }
                }
            }
        });

        docCountThisMonth += manualRefsThisMonth.size;

        setStats({ docCountThisMonth, totalExpenses: totalExpYear, totalIncome: totalIncYear, pendingDocs: pendingDocsCount });

        const monthlyTrend = Object.values(monthlyMap).sort((a, b) => a.timestamp - b.timestamp);
        const expenseByCategory = Object.entries(categoryMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        if (expenseByCategory.length === 0) expenseByCategory.push({ name: 'Aucune donnée', value: 1 });
        setChartData({ monthlyTrend, expenseByCategory });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(val);
    };

    // Custom Tooltip for Recharts to match SaaS Style
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-slate-200 rounded-xl p-4 rounded-lg shadow-lg">
                    <p className="font-semibold text-slate-800 mb-2 border-b border-slate-100 pb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm font-medium flex justify-between gap-6" style={{ color: entry.color }}>
                            <span>{entry.name}:</span>
                            <span className="font-semibold">{formatCurrency(entry.value)}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64 bg-white border border-slate-200 rounded-xl shadow-sm rounded-xl p-8">
                <div className="animate-spin w-8 h-8 border border-slate-200 rounded-xl border-t-emerald-500 rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">

            {/* 4 Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Card 1 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Docs saisis</span>
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-emerald-600" />
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-900">{stats.docCountThisMonth}</p>
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Mois courant</span>
                        </div>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Dépenses (Achats)</span>
                        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                            <ArrowDownRight className="w-5 h-5 text-rose-600" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl xl:text-3xl font-bold text-slate-900 truncate">
                            {formatCurrency(stats.totalExpenses)}
                        </p>
                        <div className="mt-2 text-xs font-medium text-slate-500">
                            Total comptabilisé
                        </div>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Revenus (Ventes)</span>
                        <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                            <ArrowUpRight className="w-5 h-5 text-sky-600" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl xl:text-3xl font-bold text-slate-900 truncate">
                            {formatCurrency(stats.totalIncome)}
                        </p>
                        <div className="mt-2 text-xs font-medium text-slate-500">
                            Total comptabilisé
                        </div>
                    </div>
                </div>

                {/* Card 4 — Year Selector */}
                <div className="bg-slate-900 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <span className="font-semibold text-slate-400 uppercase tracking-wider text-xs">Année</span>
                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                            <CalendarDays className="w-5 h-5 text-slate-300" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    const idx = availableYears.indexOf(selectedYear);
                                    if (idx < availableYears.length - 1) setSelectedYear(availableYears[idx + 1]);
                                }}
                                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <p className="text-3xl font-bold text-white">{selectedYear}</p>
                            <button
                                onClick={() => {
                                    const idx = availableYears.indexOf(selectedYear);
                                    if (idx > 0) setSelectedYear(availableYears[idx - 1]);
                                }}
                                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="mt-2 text-xs font-medium text-slate-400">
                            Filtrer les graphiques
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Bar Chart (2/3 width) */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Évolution Financière</h2>
                            <p className="text-slate-500 text-sm mt-1">Dépenses vs Revenus — {selectedYear} (MAD)</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span className="text-xs font-medium text-slate-600">Dépenses</span></div>
                            <div className="flex items-center gap-1.5 ml-3"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-xs font-medium text-slate-600">Revenus</span></div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} stroke="#e2e8f0" axisLine={false} tickLine={false} dy={10} interval={0} />
                                <YAxis tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} stroke="#e2e8f0" axisLine={false} tickLine={false} dx={-10} />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="Dépenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="Revenus" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart (1/3 width) */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-8 flex flex-col justify-between">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Dépenses par Catégorie</h2>
                        <p className="text-slate-500 text-sm mt-1">Top 5 catégories — {selectedYear}</p>
                    </div>

                    <div className="h-[220px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData.expenseByCategory}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.expenseByCategory.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text inside Donut */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs font-medium text-slate-500">Total</span>
                            <span className="text-lg font-bold text-slate-900 truncate max-w-[90px]">
                                {new Intl.NumberFormat('fr-MA', { notation: 'compact' }).format(
                                    chartData.expenseByCategory
                                        .filter((e: any) => e.name !== 'Aucune donnée')
                                        .reduce((sum: number, e: any) => sum + e.value, 0)
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        {chartData.expenseByCategory.map((entry: any, index: number) => (
                            <div key={index} className="flex justify-between items-center text-sm gap-2">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="font-medium text-slate-700 break-words" title={entry.name}>{entry.name}</span>
                                </div>
                                <span className="font-bold text-slate-900 whitespace-nowrap flex-shrink-0">{new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(entry.value)}</span>
                            </div>
                        ))}
                    </div>

                </div>

            </div>
        </div>
    );
}
