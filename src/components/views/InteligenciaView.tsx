'use client';

import { useState, useEffect } from 'react';
import {
    TrendingUp, TrendingDown, Minus,
    HelpCircle, AlertTriangle, Clock, Target,
    Mail, MessageSquare, Brain, Loader2, ArrowRight,
    Filter, ChevronDown, Check, Search, Calendar, Copy, CheckCircle2
} from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import ReactECharts from 'echarts-for-react';
import ReputationThermometer from '@/components/ReputationThermometer';

// Removed mock - using real products from API

interface EmailAnalytics {
    totalMessages: number;
    intentionCounts: Record<string, number>;
    sentimentCounts: Record<string, number>;
    avgConversion: number;
    topPainPoints: { pain: string; count: number }[];
    reputationScore: number; // NEW
    reputationLabel: 'Ruim' | 'Neutro' | 'Bom' | 'Excelente'; // NEW
    messages: any[];
}

function useEmailAnalytics(userId: string | undefined, timeFilter: string, productId?: string) {
    const [data, setData] = useState<EmailAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        async function fetchAnalytics() {
            setLoading(true);
            try {
                let url = `/api/emails/analytics?userId=${userId}&timeFilter=${timeFilter}`;
                if (productId && productId !== 'all') {
                    url += `&productId=${productId}`;
                }
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch analytics');
                const result = await response.json();
                setData(result);
            } catch (err: any) {
                setError(err.message);
                console.error('Error fetching email analytics:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchAnalytics();
    }, [userId, timeFilter, productId]);

    return { data, loading, error };
}

export default function InteligenciaView() {
    const { user, profile, loading: authLoading } = useAuth();
    const { products, loading: productsLoading } = useProducts(user?.id);
    const [chartOption, setChartOption] = useState<any>(null);

    // Filters State
    const [timeFilter, setTimeFilter] = useState('7d');
    const [selectedProductId, setSelectedProductId] = useState<string>('all');
    const [isProductOpen, setIsProductOpen] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [showAISuggestions, setShowAISuggestions] = useState(true); // NEW: toggle IA
    const [copiedId, setCopiedId] = useState<string | null>(null); // NEW: para feedback de cópia

    // Fetch real data with product filter
    const { data: analyticsData, loading: analyticsLoading, error } = useEmailAnalytics(user?.id, timeFilter, selectedProductId);

    // Build products list with "All" option
    const productsWithAll = [
        { id: 'all', name: 'Todos os produtos' },
        ...products
    ];

    const selectedProduct = productsWithAll.find(p => p.id === selectedProductId) || productsWithAll[0];

    // Update chart when data changes
    useEffect(() => {
        if (!analyticsData) return;

        const intentionData = Object.entries(analyticsData.intentionCounts).map(([name, value]) => ({
            value,
            name
        }));

        const totalMessages = analyticsData.totalMessages;

        const option = {
            tooltip: { trigger: 'item' },
            legend: {
                orient: 'vertical',
                right: '15%',
                top: 'middle',
                icon: 'circle',
                itemGap: 15,
                textStyle: { color: '#64748b', fontSize: 13 }
            },
            title: {
                text: `{val|${totalMessages}}\n{label|mensagens}`,
                left: '28%',
                top: 'center',
                textAlign: 'center',
                textStyle: {
                    rich: {
                        val: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', padding: [0, 0, 4, 0] },
                        label: { fontSize: 12, color: '#94a3b8' }
                    }
                }
            },
            series: [
                {
                    name: 'Intenções',
                    type: 'pie',
                    radius: ['55%', '85%'],
                    center: ['30%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 6,
                        borderColor: '#fff',
                        borderWidth: 3
                    },
                    label: { show: false },
                    emphasis: {
                        scale: true,
                        scaleSize: 5
                    },
                    data: intentionData
                }
            ]
        };

        setChartOption(option);
    }, [analyticsData]);

    const getSentimentBadge = (sentiment: string) => {
        if (sentiment === 'Positivo') {
            return (
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                    <TrendingUp size={12} /> Positivo
                </div>
            );
        }
        if (sentiment === 'Negativo') {
            return (
                <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-100">
                    <TrendingDown size={12} /> Negativo
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1.5 bg-slate-50 text-slate-500 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-slate-100">
                <Minus size={12} /> Neutro
            </div>
        );
    };

    // Copy to clipboard function
    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000); // Reset after 2s
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const filteredProducts = productsWithAll.filter((p: any) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase())
    );

    if (authLoading || analyticsLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" size={32} /></div>;

    if (error) return <div className="min-h-[60vh] flex items-center justify-center text-red-600">Erro ao carregar dados: {error}</div>;

    if (!analyticsData) return <div className="min-h-[60vh] flex items-center justify-center text-slate-500">Nenhum dado disponível</div>;

    const insightEmail = profile?.insighthub_email || 'Carregando...';

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 font-sans max-w-7xl mx-auto">

            {/* HEAD & TOOLBAR */}
            <div className="space-y-6">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <Brain className="text-purple-600 dark:text-purple-400" size={28} />
                            Inteligência de Produto
                            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-black px-2 py-1 rounded uppercase tracking-wider">Beta</span>
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Descubra <span className="font-bold text-purple-600 dark:text-purple-400">por que seus leads não compram</span> analisando dúvidas reais.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        {/* Email forward info */}
                        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Mail size={14} className="text-purple-600 dark:text-purple-400" />
                                <span className="font-semibold">Encaminhe para:</span>
                            </div>
                            <code className="bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 font-mono font-bold text-purple-700 dark:text-purple-400 select-all">
                                {insightEmail}
                            </code>
                        </div>

                        {/* Toggle Sugestões IA */}
                        <label className="flex items-center gap-2 cursor-pointer select-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <input
                                type="checkbox"
                                checked={showAISuggestions}
                                onChange={(e) => setShowAISuggestions(e.target.checked)}
                                className="w-4 h-4 accent-purple-600"
                            />
                            <span>Mostrar sugestões de IA</span>
                        </label>
                    </div>
                </header>

                {/* FILTERS TOOLBAR */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">

                    {/* Time Filter (Segmented Control) */}
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center gap-1 w-full md:w-auto">
                        {[
                            { id: 'today', label: 'Hoje' },
                            { id: '7d', label: '7 dias' },
                            { id: '30d', label: '30 dias' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTimeFilter(t.id)}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex-1 md:flex-none text-center ${timeFilter === t.id
                                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Product Selection */}
                    <div className="relative w-full md:w-72">
                        <button
                            onClick={() => setIsProductOpen(!isProductOpen)}
                            className="w-full flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
                        >
                            <span className="truncate">{selectedProduct.name}</span>
                            <ChevronDown size={14} className="text-slate-400" />
                        </button>

                        {isProductOpen && (
                            <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-2 border-b border-slate-100">
                                    <div className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                                        <Search size={12} className="text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Buscar produto..."
                                            className="bg-transparent border-none outline-none text-xs w-full text-slate-700 placeholder:text-slate-400"
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto p-1">
                                    {filteredProducts.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                setSelectedProductId(p.id);
                                                setIsProductOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg flex items-center justify-between group"
                                        >
                                            {p.name}
                                            {selectedProduct.id === p.id && <Check size={12} className="text-purple-600" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* NEW LAYOUT: CHART + THERMOMETER SIDE BY SIDE */}

            {/* CHARTS GRID: PIZZA + THERMOMETER */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PIZZA CHART */}
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="w-full flex justify-between items-center mb-4 border-b border-slate-50 pb-4">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                            <Target size={18} className="text-blue-500" />
                            Distribuição de Objeções
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                            <Calendar size={12} />
                            <span>Dados dos últimos {timeFilter === 'today' ? '24h' : timeFilter === '7d' ? '7 dias' : '30 dias'}</span>
                        </div>
                    </div>

                    <div className="w-full h-72 flex items-center justify-center">
                        {chartOption && <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />}
                    </div>
                </section>

                {/* REPUTATION THERMOMETER */}
                <ReputationThermometer
                    score={analyticsData.reputationScore || 50}
                    label={analyticsData.reputationLabel || 'Neutro'}
                    totalMessages={analyticsData.totalMessages}
                />
            </div>

            {/* DIAGNOSTICS LIST */}
            <section className="space-y-5">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Brain size={16} className="text-slate-400" /> Diagnóstico e Plano de Ação
                    </h3>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-bold">
                        {analyticsData.messages.length} emails analisados
                    </span>
                </div>

                {analyticsData.messages.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                        <Mail className="mx-auto text-slate-300 mb-3" size={48} />
                        <h4 className="text-slate-600 font-bold mb-2">Nenhum email recebido ainda</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                            Encaminhe emails de dúvidas de leads para <strong>{profile?.insighthub_email}</strong> e nossa IA irá analisar automaticamente.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analyticsData.messages.slice(0, 10).map((msg: any, i: number) => (
                            <div key={msg.id || i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">

                                <div>
                                    {/* Header do Card */}
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="w-1 h-8 bg-blue-500 rounded-full mt-1"></div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-800 text-base truncate">{msg.subject || 'Sem assunto'}</h4>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    {getSentimentBadge(msg.analise_sentimento)}
                                                    <span className="text-slate-300 text-[10px]">•</span>
                                                    <span className="text-xs text-slate-500 font-medium">{msg.intencao || 'Dúvida'}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1 truncate">De: {msg.sender}</p>
                                            </div>
                                        </div>
                                        {msg.probabilidade_conversao !== null && msg.probabilidade_conversao !== undefined && (
                                            <div className="text-center">
                                                <div className={`text-2xl font-black ${msg.probabilidade_conversao >= 70 ? 'text-green-600' : msg.probabilidade_conversao >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                                                    {msg.probabilidade_conversao}%
                                                </div>
                                                <div className="text-[9px] text-slate-400 font-bold uppercase">Conversão</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Resumo Executivo */}
                                    {msg.resumo_executivo && (
                                        <div className="mb-3 bg-slate-50 p-3 rounded-lg">
                                            <p className="text-xs text-slate-700 leading-relaxed italic">
                                                "{msg.resumo_executivo}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Dores Identificadas */}
                                    {msg.dores_identificadas && msg.dores_identificadas.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Dores Identificadas:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {msg.dores_identificadas.slice(0, 3).map((dor: string, idx: number) => (
                                                    <span key={idx} className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-md text-[10px] font-medium">
                                                        {dor}
                                                    </span>
                                                ))}
                                                {msg.dores_identificadas.length > 3 && (
                                                    <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md text-[10px] font-medium">
                                                        +{msg.dores_identificadas.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Sugestão de Resposta - CONDITIONAL BASED ON TOGGLE */}
                                    {showAISuggestions && msg.sugestao_resposta && (
                                        <div className="bg-slate-900 rounded-xl p-0.5 shadow-md overflow-hidden">
                                            <div className="bg-slate-900/50 backdrop-blur-sm p-4">
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <div className="bg-indigo-500 p-1.5 rounded-lg shrink-0 shadow-lg shadow-indigo-500/20 mt-0.5">
                                                            <Brain size={14} className="text-white" />
                                                        </div>
                                                        <div className="space-y-1 flex-1">
                                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none">Sugestão IA</p>
                                                        </div>
                                                    </div>
                                                    {/* COPY BUTTON */}
                                                    <button
                                                        onClick={() => copyToClipboard(msg.sugestao_resposta, msg.id)}
                                                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors shrink-0"
                                                        title="Copiar sugestão"
                                                    >
                                                        {copiedId === msg.id ? (
                                                            <>
                                                                <CheckCircle2 size={14} />
                                                                Copiado!
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy size={14} />
                                                                Copiar
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                                <p className="text-slate-100 text-sm font-medium leading-relaxed">
                                                    {msg.sugestao_resposta}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                                    <span className="text-[10px] text-slate-400">
                                        {new Date(msg.received_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <button className="text-slate-400 hover:text-blue-600 text-xs font-bold transition-colors">
                                        Ver original
                                    </button>
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* FOOTER INFO */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-3">
                <HelpCircle size={18} className="text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">Como funciona a Inteligência de Produto?</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Nossa IA analisa automaticamente o conteúdo dos e-mails encaminhados para identificar padrões de objeção.
                        Isso ajuda você a ajustar sua copy e oferta para converter mais.
                    </p>
                </div>
            </div>

        </div>
    );
}
