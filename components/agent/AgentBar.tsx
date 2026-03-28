'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, ChevronDown, ChevronUp, Bot, User } from 'lucide-react';

export default function AgentBar() {
    const [query, setQuery] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'agent', content: string }[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMsg = query;
        setQuery('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);
        setIsExpanded(true);

        try {
            const res = await fetch('/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMsg })
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'agent', content: data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'agent', content: "Désolé, une erreur s'est produite." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sticky top-0 z-50 w-full">
            <div className="bg-slate-900 border-b border-slate-200">
                <div className="section-container py-3">

                    {/* Chat History */}
                    {isExpanded && messages.length > 0 && (
                        <div className="max-h-72 overflow-y-auto mb-4 space-y-3 p-4 bg-gray-900 border border-gray-700">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'agent' && (
                                        <div className="w-8 h-8 bg-teal-50 border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                    )}
                                    <div className={`max-w-[75%] px-4 py-3 text-sm ${msg.role === 'user'
                                            ? 'bg-teal-50 text-slate-800 border border-slate-200 rounded-xl'
                                            : 'bg-gray-800 text-white border border-gray-600'
                                        }`}>
                                        {msg.content}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 bg-sky-50 border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                                            <User className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {loading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 bg-teal-50 border border-slate-200 rounded-xl flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    </div>
                                    <div className="bg-gray-800 border border-gray-600 px-4 py-3 text-sm text-gray-400">
                                        Réflexion en cours...
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    )}

                    {/* Input Bar */}
                    <form onSubmit={handleSubmit} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-50 border border-neo-yellow flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 text-slate-800" />
                        </div>

                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Demandez-moi quelque chose... (ex: 'Montre les factures payées')"
                            className="flex-1 bg-gray-900 text-white border border-gray-700 px-4 py-2.5 text-sm font-mono placeholder:text-gray-500 focus:outline-none focus:border-neo-yellow transition-colors"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setIsExpanded(true)}
                        />

                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="w-10 h-10 bg-teal-50 border border-slate-200 rounded-xl flex items-center justify-center shrink-0 hover:-translate-y-0.5 active:translate-y-0.5 transition-transform disabled:opacity-30 disabled:transform-none"
                        >
                            <Send className="w-4 h-4 text-slate-800" />
                        </button>

                        {messages.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="w-10 h-10 border border-gray-600 text-gray-400 flex items-center justify-center hover:border-neo-yellow hover:text-teal-600 transition-colors"
                            >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
