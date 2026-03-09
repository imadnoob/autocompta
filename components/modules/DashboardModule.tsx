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

    // Neo-brutalist distinct colors
    const COLORS = ['#ff90e8', '#ffc900', '#23a094', '#90a8ed', '#ff5c5c', '#8a2be2'];

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
            if (createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) docCountThisMonth++;
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
            .map(([name, value]) => ({ name: name.length > 25 ? name.substring(0, 25) + '...' : name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        if (expenseByCategory.length === 0) expenseByCategory.push({ name: 'Aucune donnée', value: 1 });
        setChartData({ monthlyTrend, expenseByCategory });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(val);
    };

    // Custom Tooltip for Recharts to match Neo-brutalism
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-neo-white border-3 border-neo-black p-3 shadow-neo">
                    <p className="font-display font-bold mb-1 border-b-2 border-neo-black pb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm font-semibold flex justify-between gap-4" style={{ color: entry.color }}>
                            <span>{entry.name}:</span>
                            <span>{formatCurrency(entry.value)}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64 bg-neo-white border-3 border-neo-black shadow-neo p-8">
                <div className="animate-spin w-10 h-10 border-4 border-neo-black border-t-neo-yellow rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">

            {/* 4 Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1 */}
                <div className="bg-neo-white border-3 border-neo-black p-5 shadow-neo hover:-translate-y-1 hover:shadow-neo-lg transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-display font-bold text-gray-500 uppercase tracking-wider text-xs">Docs saisis</span>
                        <div className="w-10 h-10 bg-neo-blue border-3 border-neo-black flex items-center justify-center shadow-sm">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div>
                        <p className="font-display text-4xl font-black text-neo-black">{stats.docCountThisMonth}</p>
                        <div className="mt-2 flex items-center gap-1 text-xs font-bold text-gray-500">
                            <TrendingUp className="w-3 h-3 text-neo-blue" />
                            <span>Mois courant</span>
                        </div>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-neo-white border-3 border-neo-black p-5 shadow-neo hover:-translate-y-1 hover:shadow-neo-lg transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-display font-bold text-gray-500 uppercase tracking-wider text-xs">Dépenses (Achats)</span>
                        <div className="w-10 h-10 bg-neo-pink border-3 border-neo-black flex items-center justify-center shadow-sm">
                            <ArrowDownRight className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div>
                        <p className="font-display text-2xl xl:text-3xl font-black text-neo-black truncate">
                            {formatCurrency(stats.totalExpenses)}
                        </p>
                        <div className="mt-2 text-xs font-bold text-gray-500">
                            Total comptabilisé
                        </div>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-neo-white border-3 border-neo-black p-5 shadow-neo hover:-translate-y-1 hover:shadow-neo-lg transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-display font-bold text-gray-500 uppercase tracking-wider text-xs">Revenus (Ventes)</span>
                        <div className="w-10 h-10 bg-neo-lime border-3 border-neo-black flex items-center justify-center shadow-sm">
                            <ArrowUpRight className="w-5 h-5 text-neo-black" />
                        </div>
                    </div>
                    <div>
                        <p className="font-display text-2xl xl:text-3xl font-black text-neo-black truncate">
                            {formatCurrency(stats.totalIncome)}
                        </p>
                        <div className="mt-2 text-xs font-bold text-gray-500">
                            Total comptabilisé
                        </div>
                    </div>
                </div>

                {/* Card 4 — Year Selector */}
                <div className="bg-neo-white border-3 border-neo-black p-5 shadow-neo hover:-translate-y-1 hover:shadow-neo-lg transition-all flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="font-display font-bold text-gray-500 uppercase tracking-wider text-xs">Année</span>
                        <div className="w-10 h-10 bg-neo-yellow border-3 border-neo-black flex items-center justify-center shadow-sm">
                            <CalendarDays className="w-5 h-5 text-neo-black" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    const idx = availableYears.indexOf(selectedYear);
                                    if (idx < availableYears.length - 1) setSelectedYear(availableYears[idx + 1]);
                                }}
                                className="w-8 h-8 border-3 border-neo-black flex items-center justify-center cursor-pointer hover:bg-neo-yellow transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <p className="font-display text-3xl font-black text-neo-black">{selectedYear}</p>
                            <button
                                onClick={() => {
                                    const idx = availableYears.indexOf(selectedYear);
                                    if (idx > 0) setSelectedYear(availableYears[idx - 1]);
                                }}
                                className="w-8 h-8 border-3 border-neo-black flex items-center justify-center cursor-pointer hover:bg-neo-yellow transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="mt-2 text-xs font-bold text-gray-500">
                            Filtrer les graphiques
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Bar Chart (2/3 width) */}
                <div className="lg:col-span-2 bg-neo-white border-3 border-neo-black shadow-neo p-6">
                    <div className="flex items-center gap-3 mb-6 border-b-3 border-neo-black pb-4">
                        <div className="w-10 h-10 bg-neo-blue text-white border-3 border-neo-black flex items-center justify-center rounded-sm">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-display text-xl font-bold">Évolution Financière</h2>
                            <p className="text-gray-500 text-sm">Dépenses vs Revenus — {selectedYear} (MAD)</p>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#000" vertical={false} opacity={0.1} />
                                <XAxis dataKey="name" tick={{ fontFamily: 'inherit', fontWeight: 'bold' }} stroke="#000" interval={0} />
                                <YAxis tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k`.replace('.0k', 'k') : val} tick={{ fontFamily: 'inherit' }} stroke="#000" />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                                <Legend iconType="square" wrapperStyle={{ fontWeight: 'bold', paddingTop: '10px' }} />
                                <Bar dataKey="Dépenses" fill="#ff5c5c" stroke="#000" strokeWidth={2} radius={[2, 2, 0, 0]} />
                                <Bar dataKey="Revenus" fill="#23a094" stroke="#000" strokeWidth={2} radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart (1/3 width) */}
                <div className="bg-neo-white border-3 border-neo-black shadow-neo p-6">
                    <div className="flex items-center gap-3 mb-6 border-b-3 border-neo-black pb-4">
                        <div className="w-10 h-10 bg-neo-yellow text-neo-black border-3 border-neo-black flex items-center justify-center rounded-sm">
                            <PieChartIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-display text-xl font-bold">Dépenses par Catégorie</h2>
                            <p className="text-gray-500 text-sm">Top 5 catégories — {selectedYear}</p>
                        </div>
                    </div>

                    <div className="h-[250px] w-full mt-2 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData.expenseByCategory}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="#000"
                                    strokeWidth={2}
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
                            <span className="text-xs font-bold text-gray-500">Total</span>
                            <span className="text-md font-display font-black truncate max-w-[80px]">
                                {new Intl.NumberFormat('fr-MA', { notation: 'compact' }).format(
                                    chartData.expenseByCategory
                                        .filter((e: any) => e.name !== 'Aucune donnée')
                                        .reduce((sum: number, e: any) => sum + e.value, 0)
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        {chartData.expenseByCategory.map((entry: any, index: number) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-3 h-3 border-2 border-neo-black flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="font-medium text-gray-700 truncate">{entry.name}</span>
                                </div>
                                <span className="font-bold">{new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(entry.value)}</span>
                            </div>
                        ))}
                    </div>

                </div>

            </div>
        </div>
    );
}
