'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot, User, History, MessageSquare, Trash2, PlusCircle, BarChart2, ExternalLink, FileText as FileIcon, Paperclip, X, ArrowRight, Bell, ShieldAlert, ListChecks, Calendar, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/lib/supabase';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend
} from 'recharts';

interface Message {
    id: string;
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    lastUpdate: Date;
}

interface Artifact {
    id: string;
    type: string;
    data: any;
    chartType?: string;
    title: string;
}

// Simple Chart Component to render structured data from Agent
const ChartRenderer = ({ data, type = 'bar' }: { data: any, type?: string }) => {
    if (!data) return null;

    let processedData: any[] = [];
    let keys: string[] = ['value']; // default data keys for multi-series

    // 1. Handle object-style format (labels/datasets) - Common for Chart.js
    if (!Array.isArray(data) && data.labels && Array.isArray(data.datasets)) {
        processedData = data.labels.map((label: string, index: number) => {
            const entry: any = { name: label };
            data.datasets.forEach((ds: any) => {
                const key = ds.label || 'value';
                entry[key] = Number(ds.data[index]) || 0;
            });
            return entry;
        });
        keys = data.datasets.map((ds: any) => ds.label || 'value');
    } 
    // 2. Handle array-style format (list of objects) - Standard for Recharts
    else if (Array.isArray(data) && data.length > 0) {
        // Mots-clés réservés pour l'axe X (ne seront pas traités comme des valeurs Y)
        const labelKeys = ['name', 'label', 'month', 'date', 'periode', 'id', 'created_at', 'timestamp'];
        const numericKeys = new Set<string>();

        processedData = data.map(item => {
            // Extraction du nom pour l'axe X
            const nameVal = item.name || item.label || item.month || item.date || item.periode || '?';
            const entry: any = { name: String(nameVal) };
            
            // Extraction dynamique de toutes les métriques numériques pour l'axe Y
            Object.keys(item).forEach(k => {
                if (!labelKeys.includes(k.toLowerCase())) {
                    const val = Number(item[k]);
                    // Si la valeur est un nombre valide, on l'ajoute comme métrique
                    if (!isNaN(val)) {
                        numericKeys.add(k);
                        entry[k] = val;
                    }
                }
            });
            
            return entry;
        });
        
        keys = Array.from(numericKeys);
        
        // Fallback de sécurité au cas où aucune valeur numérique n'est trouvée
        if (keys.length === 0) keys = ['value']; 
    }

    if (processedData.length === 0) return null;

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="h-64 w-full bg-slate-50/30 backdrop-blur-sm rounded-xl p-2 animate-in fade-in zoom-in duration-500">
            <ResponsiveContainer width="100%" height="100%">
                {type === 'line' ? (
                    <LineChart data={processedData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? (v/1000).toFixed(1)+'k' : v} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        {keys.map((key, i) => (
                            <Line key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]} strokeWidth={3} dot={{ r: 3, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
                        ))}
                    </LineChart>
                ) : (
                    <BarChart data={processedData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? (v/1000).toFixed(1)+'k' : v} />
                        <Tooltip cursor={{ fill: '#f1f5f9', radius: 4 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        {keys.map((key, i) => (
                            <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} maxBarSize={30} />
                        ))}
                    </BarChart>
                )}
            </ResponsiveContainer>
        </div>
    );
};

export default function AgentIAModule() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [userId, setUserId] = useState<string | undefined>(undefined);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
    const [activeView, setActiveView] = useState<'chat' | 'alerts'>('chat');

    // File staging (Claude-style pills)
    const [stagedFiles, setStagedFiles] = useState<File[]>([]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get userId for agent tool calls + fetch proactive alerts
    useEffect(() => {
        supabase.auth.getUser().then(({ data }: { data: { user: any } }) => {
            if (data.user) {
                setUserId(data.user.id);
                fetch(`/api/agent?userId=${data.user.id}`).then(r => r.json()).then(d => {
                    if (d.alerts && d.alerts.length > 0) setAlerts(d.alerts);
                }).catch(() => { });
            }
        });
    }, []);

    // Load sessions when userId changes
    useEffect(() => {
        if (!userId) {
            setSessions([]);
            setActiveSessionId(null);
            return;
        }
        
        const storageKey = `autocompta_chats_${userId}`;
        const stored = localStorage.getItem(storageKey);
        
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const formatted = parsed.map((s: any) => ({
                    ...s,
                    lastUpdate: new Date(s.lastUpdate),
                    messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
                }));
                setSessions(formatted);
                if (formatted.length > 0) setActiveSessionId(formatted[0].id);
            } catch (e) {
                console.error("Error loading chats", e);
            }
        } else {
            setSessions([]);
            setActiveSessionId(null);
        }
    }, [userId]);

    const activeSession = sessions.find(s => s.id === activeSessionId) || null;

    useEffect(() => {
        if (!userId) return;
        const storageKey = `autocompta_chats_${userId}`;
        if (sessions.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(sessions));
        } else {
            localStorage.removeItem(storageKey);
        }
    }, [sessions, userId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeSession?.messages, loading]);

    const startNewChat = () => {
        const newId = Date.now().toString();
        const newSession: ChatSession = { id: newId, title: `Nouvelle discussion`, messages: [], lastUpdate: new Date() };
        setSessions([newSession, ...sessions]);
        setActiveSessionId(newId);
        setActiveArtifact(null); // Reset artifact on new chat
    };

    const deleteSession = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const filtered = sessions.filter(s => s.id !== id);
        setSessions(filtered);
        if (activeSessionId === id) setActiveSessionId(filtered.length > 0 ? filtered[0].id : null);
        if (activeSessionId === id) setActiveArtifact(null);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setStagedFiles(prev => [...prev, ...Array.from(files)]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeStagedFile = (index: number) => {
        setStagedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!query.trim() && stagedFiles.length === 0) || loading) return;

        let currentSession = activeSession;
        if (!currentSession) {
            const newId = Date.now().toString();
            const newSession: ChatSession = { id: newId, title: query.slice(0, 30) || "Document", messages: [], lastUpdate: new Date() };
            setSessions([newSession, ...sessions]);
            setActiveSessionId(newId);
            currentSession = newSession;
        }

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: query || "Documents joints",
            timestamp: new Date()
        };

        const updatedMessages = [...currentSession.messages, userMsg];
        const updatedSession = { ...currentSession, messages: updatedMessages, lastUpdate: new Date(), title: currentSession.messages.length === 0 ? (query.slice(0, 30) || "Doc") : currentSession.title };
        setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));

        const currentQuery = query;
        const currentFiles = [...stagedFiles];

        setQuery('');
        setStagedFiles([]);
        setLoading(true);

        try {
            // If there are files, process them first
            for (const file of currentFiles) {
                setUploading(true);
                const user = (await supabase.auth.getUser()).data.user;
                if (!user) throw new Error('Non authentifié');

                const filePath = `${user.id}/${Date.now()}_${file.name}`;
                const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
                if (uploadError) throw uploadError;

                const { data: dbData, error: dbError } = await supabase.from('documents').insert({
                    user_id: user.id, file_path: filePath, file_type: file.type, original_name: file.name, status: 'pending'
                }).select();

                if (dbError) throw dbError;

                // Inform the LLM via context or directly process pipeline
                fetch('/api/pipeline-entries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ documentId: dbData[0].id, filePath: filePath, fileType: file.type })
                }).catch(() => { });
            }
            setUploading(false);

            const finalQuery = currentFiles.length > 0
                ? `${currentQuery}\n[${currentFiles.length} fichier(s) joint(s)]`
                : currentQuery;

            const res = await fetch('/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: finalQuery, userId, history: updatedMessages.slice(-10).map(m => ({ role: m.role, content: m.content })) })
            });
            const data = await res.json();

            const agentMsg: Message = { id: (Date.now() + 1).toString(), role: 'agent', content: data.response, timestamp: new Date() };
            setSessions(prev => prev.map(s => s.id === updatedSession.id ? { ...s, messages: [...updatedMessages, agentMsg], lastUpdate: new Date() } : s));
        } catch (err) {
            console.error("Agent error", err);
            setUploading(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] min-h-[600px] border-t border-slate-200 bg-white">

            {/* Sidebar - History */}
            <div className="hidden lg:flex w-64 flex-col bg-slate-50/50 border-r border-slate-200">
                <div className="p-4 border-b border-slate-200/50 space-y-3">
                    {/* Alerts/Proactive Button */}
                    <button 
                        onClick={() => setActiveView('alerts')}
                        className={`w-full py-2.5 px-4 rounded-xl transition-all font-medium flex items-center gap-3 text-sm relative group ${activeView === 'alerts' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-700 shadow-sm'}`}
                    >
                        <ShieldAlert className={`w-4 h-4 ${activeView === 'alerts' ? 'text-white' : 'text-indigo-500'}`} />
                        <span>Alertes</span>
                        {alerts.filter(a => a.type !== 'summary').length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
                                {alerts.filter(a => a.type !== 'summary').length}
                            </span>
                        )}
                    </button>

                    <button onClick={() => { setActiveView('chat'); startNewChat(); }} className={`w-full py-2.5 px-4 border border-slate-200 text-slate-700 rounded-lg shadow-sm hover:border-violet-300 hover:text-violet-700 transition-all font-medium flex items-center gap-2 text-sm justify-center group ${activeView === 'chat' ? 'bg-white' : 'bg-slate-100/50'}`}>
                        <PlusCircle className="w-4 h-4 text-violet-500 group-hover:rotate-90 transition-transform" />
                        Nouveau Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Historique</div>
                    {sessions.map(session => (
                        <button key={session.id} onClick={() => { setActiveView('chat'); setActiveSessionId(session.id); }} className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center justify-between group text-sm ${activeView === 'chat' && activeSessionId === session.id ? 'bg-violet-50 text-violet-800 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>
                            <div className="flex items-center gap-2.5 overflow-hidden">
                                <MessageSquare className={`w-4 h-4 shrink-0 ${activeView === 'chat' && activeSessionId === session.id ? 'text-violet-500' : 'text-slate-400'}`} />
                                <span className="truncate">{session.title}</span>
                            </div>
                            <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => deleteSession(e, session.id)} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col relative overflow-hidden transition-all duration-300 bg-white ${activeArtifact ? 'lg:max-w-3xl border-r border-slate-200' : ''}`}>
                {/* Chat Header (mobile/clean) */}
                <div className="bg-white px-6 py-4 flex items-center justify-center border-b border-slate-100 z-10 sticky top-0 bg-opacity-90 backdrop-blur-sm hidden">
                    <h3 className="font-semibold text-slate-800 text-sm">Agent AutoCompta</h3>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-8 pb-32 custom-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {activeView === 'alerts' ? (
                            <div className="animate-in fade-in slide-in-from-right-8 duration-500 pb-10">
                                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-5">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">Alertes</h2>
                                        <p className="text-slate-500 text-sm">Surveillance proactive de votre santé financière</p>
                                    </div>
                                </div>

                                {alerts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                        </div>
                                        <h3 className="text-slate-800 font-semibold text-lg">Tout est sous contrôle !</h3>
                                        <p className="text-slate-500 max-w-xs mt-2">Aucune anomalie ou retard n'a été détecté par l'agent à ce jour.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                {(() => {
                                    // 1. Sort all alerts by date descending (most recent first)
                                    const sorted = [...alerts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                    
                                    // 2. Group by normalized date key (YYYY-MM-DD)
                                    const groups: Record<string, any[]> = {};
                                    sorted.forEach(a => {
                                        const dateKey = new Date(a.date).toISOString().split('T')[0];
                                        if (!groups[dateKey]) groups[dateKey] = [];
                                        groups[dateKey].push(a);
                                    });

                                    // 3. Render groups
                                    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(dateKey => {
                                        const groupDate = new Date(dateKey);
                                        const now = new Date();
                                        const isToday = groupDate.getUTCDate() === now.getUTCDate() && 
                                                        groupDate.getUTCMonth() === now.getUTCMonth() && 
                                                        groupDate.getUTCFullYear() === now.getUTCFullYear();
                                        
                                        const displayDate = isToday ? "Aujourd'hui" : groupDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

                                        return (
                                            <div key={dateKey} className="space-y-6">
                                                <div className="flex items-center gap-3 py-2">
                                                    <div className="h-px flex-1 bg-slate-100"></div>
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] bg-white border border-slate-200 px-4 py-1.5 rounded-full shadow-sm flex items-center gap-2">
                                                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                                        {displayDate}
                                                    </span>
                                                    <div className="h-px flex-1 bg-slate-100"></div>
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    {groups[dateKey].map((alert, idx) => (
                                                        <div key={alert.id || idx} className="group relative flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom-4 duration-300">
                                                            <div className={`mt-1 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
                                                                alert.type === 'payment_delay' || alert.type === 'critical' ? 'bg-red-50 border-red-100 text-red-500' :
                                                                alert.type === 'pending_doc' ? 'bg-amber-50 border-amber-100 text-amber-500' :
                                                                'bg-blue-50 border-blue-100 text-blue-500'
                                                            }`}>
                                                                {alert.type === 'payment_delay' || alert.type === 'critical' ? <ShieldAlert className="w-4.5 h-4.5" /> :
                                                                 alert.type === 'pending_doc' ? <FileIcon className="w-4.5 h-4.5" /> :
                                                                 <BarChart2 className="w-4.5 h-4.5" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="prose prose-sm max-w-none text-slate-700 font-medium leading-relaxed">
                                                                    <ReactMarkdown components={{ 
                                                                        p: ({node, ...props}) => <p className="m-0" {...props} />,
                                                                        strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />
                                                                    }}>{alert.message}</ReactMarkdown>
                                                                </div>
                                                                <div className="mt-3 text-[10px] font-bold text-slate-400 flex items-center gap-2.5">
                                                                    <span className={`px-2 py-0.5 rounded-lg border ${
                                                                        alert.type === 'payment_delay' ? 'bg-red-50 border-red-100 text-red-600' : 
                                                                        alert.type === 'critical' ? 'bg-rose-50 border-rose-100 text-rose-600' : 
                                                                        alert.type === 'pending_doc' ? 'bg-orange-50 border-orange-100 text-orange-600' : 
                                                                        'bg-indigo-50 border-indigo-100 text-indigo-600'
                                                                    }`}>
                                                                        {alert.type === 'payment_delay' ? 'REGLEMENT' : 
                                                                         alert.type === 'critical' ? 'IMPORTANT' : 
                                                                         alert.type === 'pending_doc' ? 'JUSTIFICATIF' : 
                                                                         'ACTIVITÉ'}
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span className="flex items-center gap-1">
                                                                        Cité à {new Date(alert.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                        {sessions.length === 0 || !activeSession ? (
                            <div className="flex flex-col items-center justify-center text-center mt-20 space-y-5 animate-in fade-in zoom-in duration-500">
                                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center shadow-md overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent bg-[length:200%_100%] animate-shimmer mix-blend-overlay" />
                                    <Sparkles className="relative z-10 w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-semibold text-slate-800 tracking-tight">Bonjour, je suis votre Agent.</h3>
                                    <p className="text-slate-500 mt-2 max-w-md mx-auto">Posez-moi des questions sur votre comptabilité ou demandez-moi de traiter vos factures.</p>
                                </div>
                            </div>
                        ) : (
                            activeSession.messages.map((msg, index) => (
                                <div key={msg.id} className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'agent' && (
                                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 border border-orange-200/50 flex items-center justify-center shrink-0 mt-0.5">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'bg-[#f4f4f5] px-5 py-3.5 rounded-2xl text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-800 leading-relaxed'}`}>
                                        <div className="prose-table-container text-[15px] print-color-adjust">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    h1: ({ node, ...props }) => <h1 className="text-xl font-semibold mb-4 text-slate-900" {...props} />,
                                                    h2: ({ node, ...props }) => <h2 className="text-lg font-semibold mt-4 mb-2 text-slate-800" {...props} />,
                                                    p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                                                    table: ({ node, ...props }) => (
                                                        <div className="overflow-x-auto my-4 rounded-xl border border-slate-200">
                                                            <table className="w-full text-left text-sm" {...props} />
                                                        </div>
                                                    ),
                                                    thead: ({ node, ...props }) => <thead className="bg-slate-50 text-slate-600 border-b border-slate-200" {...props} />,
                                                    th: ({ node, ...props }) => <th className="px-4 py-3 font-medium whitespace-nowrap" {...props} />,
                                                    td: ({ node, ...props }) => <td className="px-4 py-3 border-b border-slate-100 last:border-0" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc ml-5 mb-4 space-y-1" {...props} />,
                                                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                    strong: ({ node, ...props }) => <strong className="font-semibold text-slate-900" {...props} />,
                                                    code: ({ node, className, children, ...props }: any) => {
                                                        const match = /language-(\w+)/.exec(className || '');
                                                        const isChart = match && match[1] === 'chart';
                                                        if (isChart) {
                                                            try {
                                                                const chartData = JSON.parse(String(children).replace(/\n/g, ''));
                                                                const artifactId = `art-${msg.id}`;
                                                                return (
                                                                    <div className="my-6 space-y-3">
                                                                        <div className="flex items-center justify-between px-1">
                                                                            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                                                <BarChart2 className="w-4 h-4 text-violet-500" />
                                                                                Analyse de données
                                                                            </span>
                                                                            <button 
                                                                                onClick={() => setActiveArtifact({ id: artifactId, type: 'chart', data: chartData.data, chartType: chartData.type, title: 'Visualisation Graphique' })}
                                                                                className="text-[11px] font-medium text-violet-600 hover:text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full transition-colors"
                                                                            >
                                                                                Plein écran
                                                                            </button>
                                                                        </div>
                                                                        <div className="bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
                                                                            <ChartRenderer data={chartData.data} type={chartData.type} />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            } catch (e) {
                                                                return <code className="block bg-slate-100 p-4 rounded-xl overflow-x-auto text-sm my-4 font-mono text-slate-800" {...props}>{children}</code>;
                                                            }
                                                        }

                                                        if (match || String(children).includes('\n')) {
                                                            return <code className="block bg-slate-50 border border-slate-200 p-4 rounded-xl overflow-x-auto text-sm my-4 font-mono text-slate-800" {...props}>{children}</code>;
                                                        }

                                                        return <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[13px] font-mono whitespace-pre-wrap text-pink-600" {...props}>{children}</code>;
                                                    },
                                                    pre: ({ node, children, ...props }: any) => <div className="my-4" {...props}>{children}</div>,
                                                    a: ({ node, ...props }: any) => {
                                                        const isProcessLink = props.href && props.href.startsWith('process:');
                                                        const isAnalyzeLink = props.href && props.href.startsWith('analyze:');
                                                        const isArchiveLink = props.href && props.href.startsWith('archive:');
                                                        const isSaveEntries = props.href && props.href.startsWith('save-entries:');
                                                        const docId = (isProcessLink ? props.href.split(':')[1] : (isAnalyzeLink ? props.href.split(':')[1] : (isArchiveLink ? props.href.split(':')[1] : (isSaveEntries ? null : props.href))))?.trim();
                                                        const isActionLink = isProcessLink || isAnalyzeLink || isArchiveLink;
                                                        const isDocLink = docId && /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(docId);

                                                        if (isDocLink) {
                                                            const handleAction = async () => {
                                                                if (isActionLink) {
                                                                    setLoading(true);
                                                                    let queryText = "";
                                                                    if (isProcessLink) queryText = `Comptabilise le document avec l'ID ${docId}`;
                                                                    if (isAnalyzeLink) queryText = `Analyse le document avec l'ID ${docId}`;
                                                                    if (isArchiveLink) queryText = `Archive le document avec l'ID ${docId}`;
                                                                    try {
                                                                        const res = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: queryText, userId }) });
                                                                        const data = await res.json();
                                                                        const agentMsg: Message = { id: Date.now().toString(), role: 'agent', content: data.response, timestamp: new Date() };
                                                                        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, agentMsg], lastUpdate: new Date() } : s));
                                                                    } catch (err) { console.error("Action error", err); } finally { setLoading(false); }
                                                                } else { window.open(`/dashboard/documents/${docId}`, '_blank'); }
                                                            };
                                                            const linkText = String(props.children);
                                                            const isGenericName = linkText === "VOIR" || linkText === "COMPTABILISER" || linkText === "ANALYSER";
                                                            const title = isGenericName ? `Document ${docId.substring(0, 8).toUpperCase()}` : linkText;
                                                            
                                                            return (
                                                                <button onClick={handleAction} className="flex items-center gap-3 p-3 mt-3 mb-1 border border-slate-200 hover:border-violet-300 hover:shadow-md bg-white rounded-xl transition-all text-left w-full max-w-sm group">
                                                                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                                                                        {isActionLink ? <FileIcon className="w-5 h-5 text-slate-500" /> : <ExternalLink className="w-5 h-5 text-slate-500" />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-sm font-semibold text-slate-800 truncate" title={title}>{title}</div>
                                                                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                                                                            {isActionLink ? (
                                                                                <>
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                                                                                    Action recommandée
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                                    Consulter le document
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-transparent group-hover:bg-violet-50 transition-colors">
                                                                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-violet-600 transition-colors" />
                                                                    </div>
                                                                </button>
                                                            );
                                                        }
                                                        return <a className="text-violet-600 underline decoration-violet-300 underline-offset-2 hover:text-violet-800 transition-colors" {...props} />;
                                                    }
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                                    </div>
                            ))
                        )}
                        {loading && (
                            <div className="flex gap-4 items-start animate-in fade-in duration-300">
                                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 border border-orange-200/50 flex items-center justify-center shrink-0 mt-0.5">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div className="flex items-center gap-2 pt-2.5">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                        </>
                        )}
                    </div>
                </div>

                {/* Input Area (Claude Style Floating Box) - ONLY IN CHAT VIEW */}
                {activeView === 'chat' && (
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4 sm:px-8 pointer-events-none">
                        <div className="max-w-3xl mx-auto md:w-full pointer-events-auto">
                            <div className="bg-[#f4f4f5] border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-400 focus-within:bg-white transition-all duration-300">

                                {/* Staged files area */}
                                {stagedFiles.length > 0 && (
                                    <div className="px-3 pt-3 flex flex-wrap gap-2">
                                        {stagedFiles.map((file, idx) => (
                                            <div key={idx} className="flex items-center gap-2 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-sm animate-in zoom-in-95 duration-200">
                                                <FileIcon className="w-3.5 h-3.5 text-violet-500" />
                                                <span className="truncate max-w-[120px]">{file.name}</span>
                                                <button type="button" onClick={() => removeStagedFile(idx)} className="text-slate-400 hover:text-red-500 ml-1">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        {uploading && (
                                            <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-500">
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Transfert...
                                            </div>
                                        )}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="flex relative">
                                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple accept=".pdf,.png,.jpg,.jpeg" />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading || uploading} className="absolute left-3 bottom-3 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors z-10" title="Ajouter un document">
                                        <Paperclip className="w-5 h-5" />
                                    </button>

                                    <textarea
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); }
                                        }}
                                        placeholder="Posez une question à votre expert comptable..."
                                        className="w-full py-4 pl-12 pr-14 bg-transparent outline-none resize-none text-[15px] placeholder:text-slate-400 min-h-[58px] max-h-40 overflow-y-auto custom-scrollbar"
                                        disabled={loading}
                                        rows={1}
                                    />

                                    <button type="submit" disabled={(!query.trim() && stagedFiles.length === 0) || loading} className={`absolute right-3 bottom-2.5 p-2 rounded-xl transition-all duration-200 flex items-center justify-center ${(!query.trim() && stagedFiles.length === 0) || loading ? 'bg-slate-200 text-slate-400' : 'bg-[#e56b46] text-white shadow-sm hover:bg-[#d4603e]'}`}>
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </button>
                                </form>
                            </div>
                            <div className="text-center mt-3 text-[11px] text-slate-400 font-medium">L'Agent IA peut commettre des erreurs. Vérifiez les écritures.</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Pane: Artifacts (Claude Style) */}
            {activeArtifact && (
                <div className="hidden lg:flex w-full lg:w-[450px] flex-col bg-white border-l border-slate-200 animate-in slide-in-from-right-16 duration-300 shadow-2xl lg:shadow-none z-20 absolute lg:relative right-0 h-full">
                    <div className="flex items-center justify-between p-3.5 border-b border-slate-200 bg-slate-50/50">
                        <div className="flex items-center gap-2 text-slate-700">
                            <Sparkles className="w-4 h-4 text-violet-500" />
                            <span className="font-semibold text-sm">{activeArtifact.title || "Artefact"}</span>
                        </div>
                        <button onClick={() => setActiveArtifact(null)} className="p-1.5 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-700 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-slate-50/30 p-6 custom-scrollbar flex flex-col items-center justify-center">
                        <div className="w-full max-w-md">
                            {activeArtifact.type === 'chart' && (
                                <ChartRenderer data={activeArtifact.data} type={activeArtifact.chartType} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
