'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot, User, History, MessageSquare, Trash2, PlusCircle } from 'lucide-react';

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

export default function AgentIAModule() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial session if none exists
    useEffect(() => {
        const stored = localStorage.getItem('autocompta_chats');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Convert string dates back to Date objects
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
        }
    }, []);

    // Selection of active session
    const activeSession = sessions.find(s => s.id === activeSessionId) || null;

    // Save to local storage
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem('autocompta_chats', JSON.stringify(sessions));
        }
    }, [sessions]);

    // Scroll to bottom
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeSession?.messages, loading]);

    const startNewChat = () => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: `Discussion ${sessions.length + 1}`,
            messages: [],
            lastUpdate: new Date()
        };
        setSessions([newSession, ...sessions]);
        setActiveSessionId(newSession.id);
    };

    const deleteSession = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const filtered = sessions.filter(s => s.id !== id);
        setSessions(filtered);
        if (activeSessionId === id) {
            setActiveSessionId(filtered.length > 0 ? filtered[0].id : null);
        }
        if (filtered.length === 0) localStorage.removeItem('autocompta_chats');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || loading) return;

        let currentSession = activeSession;
        if (!currentSession) {
            const newSession: ChatSession = {
                id: Date.now().toString(),
                title: query.slice(0, 30) + (query.length > 30 ? '...' : ''),
                messages: [],
                lastUpdate: new Date()
            };
            setSessions([newSession, ...sessions]);
            setActiveSessionId(newSession.id);
            currentSession = newSession;
        }

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: query,
            timestamp: new Date()
        };

        const updatedMessages = [...currentSession.messages, userMsg];
        const updatedSession = {
            ...currentSession,
            messages: updatedMessages,
            lastUpdate: new Date(),
            title: currentSession.messages.length === 0 ? query.slice(0, 30) + (query.length > 30 ? '...' : '') : currentSession.title
        };

        setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
        setQuery('');
        setLoading(true);

        try {
            const res = await fetch('/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMsg.content })
            });
            const data = await res.json();

            const agentMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'agent',
                content: data.response || "Mhm, je n'ai pas pu générer de réponse.",
                timestamp: new Date()
            };

            setSessions(prev => prev.map(s => s.id === updatedSession.id ? {
                ...s,
                messages: [...updatedMessages, agentMsg],
                lastUpdate: new Date()
            } : s));
        } catch (err) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'agent',
                content: "Désolé, une erreur s'est produite lors de la communication avec l'IA.",
                timestamp: new Date()
            };
            setSessions(prev => prev.map(s => s.id === updatedSession.id ? {
                ...s,
                messages: [...updatedMessages, errorMsg],
                lastUpdate: new Date()
            } : s));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[600px]">
            {/* Sidebar - History */}
            <div className="w-full lg:w-72 flex flex-col gap-4">
                <button
                    onClick={startNewChat}
                    className="btn-neo bg-neo-purple text-white w-full flex items-center justify-center gap-2 mb-2"
                >
                    <PlusCircle className="w-4 h-4" />
                    Nouvelle discussion
                </button>

                <div className="card-neo bg-neo-white flex-1 flex flex-col p-4 overflow-hidden">
                    <div className="flex items-center gap-2 mb-4 text-neo-black border-b-2 border-neo-black pb-2">
                        <History className="w-4 h-4" />
                        <span className="font-display font-bold text-sm">Historique</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {sessions.length === 0 ? (
                            <p className="text-xs text-gray-500 italic text-center py-8">Aucun historique</p>
                        ) : (
                            sessions.map(session => (
                                <button
                                    key={session.id}
                                    onClick={() => setActiveSessionId(session.id)}
                                    className={`w-full text-left p-2.5 border-2 transition-all flex items-center justify-between group ${activeSessionId === session.id
                                            ? 'bg-neo-yellow border-neo-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                            : 'bg-white border-transparent hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                                        <span className="text-xs font-bold truncate">{session.title}</span>
                                    </div>
                                    <Trash2
                                        className="w-3.5 h-3.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => deleteSession(e, session.id)}
                                    />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Main Chat Interface */}
            <div className="flex-1 flex flex-col card-neo bg-neo-white relative overflow-hidden p-0">
                {/* Chat Header */}
                <div className="bg-neo-black text-white p-4 flex items-center gap-3 border-b-3 border-neo-black">
                    <div className="w-8 h-8 bg-neo-yellow border-2 border-neo-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                        <Sparkles className="w-4 h-4 text-neo-black" />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-sm">Agent IA Autocompta</h3>
                        <p className="text-[10px] text-neo-yellow uppercase tracking-widest font-bold">Expert-Comptable IA</p>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-neo-cream/30 custom-scrollbar">
                    {(!activeSession || activeSession.messages.length === 0) ? (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
                            <div className="w-16 h-16 bg-neo-yellow border-3 border-neo-black shadow-neo flex items-center justify-center rotate-3">
                                <Bot className="w-8 h-8 text-neo-black" />
                            </div>
                            <div>
                                <h3 className="font-display text-xl font-bold mb-2">Comment puis-je vous aider ?</h3>
                                <p className="text-sm text-gray-600 italic">
                                    "Analysez mes dépenses du mois de mars" ou "Quelles sont les factures en attente ?"
                                </p>
                            </div>
                        </div>
                    ) : (
                        activeSession.messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'agent' && (
                                    <div className="w-8 h-8 bg-neo-purple border-2 border-neo-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div className={`max-w-[85%] px-4 py-3 border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${msg.role === 'user'
                                        ? 'bg-neo-yellow border-neo-black text-neo-black'
                                        : 'bg-white border-neo-black text-neo-black whitespace-pre-wrap'
                                    }`}>
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                    <span className="text-[10px] opacity-50 mt-2 block font-mono">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 bg-neo-black text-white flex items-center justify-center shrink-0 border-2 border-neo-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        <User className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {loading && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 bg-neo-purple border-2 border-neo-black flex items-center justify-center shrink-0 animate-bounce">
                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                            </div>
                            <div className="bg-white border-2 border-neo-black px-4 py-3 text-sm italic text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                L'agent analyse vos données...
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t-3 border-neo-black">
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Posez votre question comptable..."
                            className="flex-1 input-neo py-3 shadow-neo"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="btn-neo bg-neo-purple text-white px-6 disabled:opacity-50 disabled:transform-none"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
