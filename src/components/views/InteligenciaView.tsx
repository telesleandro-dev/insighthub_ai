'use client';

import { useState, useEffect } from 'react';
import {
    TrendingUp, TrendingDown, Minus,
    HelpCircle, AlertTriangle, Clock, Target,
    Mail, MessageSquare, Brain, Loader2, ArrowRight,
    Filter, ChevronDown, Check, Search, Calendar
} from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import ReactECharts from 'echarts-for-react';

// Using mock data for MVP visualization
const PRODUCTS_MOCK = [
    { id: 'all', name: 'Todos os produtos' },
    { id: 'p1', name: 'Curso Master de Vendas' },
    { id: 'p2', name: 'Mentoria Individual' },
    { id: 'p3', name: 'E-book: Começando do Zero' }
];

const MOCK_DATA = {
    totalMessages: 83,
    objections: [
        { category: "Preço / Valor", count: 35, trend: "up", suggestion: "Reforce o ROI e parcelamento. O cliente não vê o retorno claro." },
        { category: "Dúvida sobre Resultado", count: 22, trend: "stable", suggestion: "Use mais provas sociais e garantias de satisfação." },
        { category: "Falta de Urgência", count: 15, trend: "down", suggestion: "Crie escassez real (bônus por tempo limitado)." },
        { category: "Não Entendeu o Produto", count: 8, trend: "up", suggestion: "Simplifique a promessa. A oferta está confusa." },
        { category: "Outros", count: 3, trend: "stable", suggestion: "Monitore casos isolados." }
    ]
};

export default function InteligenciaView() {
    const { user, profile, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [chartOption, setChartOption] = useState<any>(null);

    // Filters State
    const [timeFilter, setTimeFilter] = useState('7d');
    const [selectedProduct, setSelectedProduct] = useState(PRODUCTS_MOCK[0]);
    const [isProductOpen, setIsProductOpen] = useState(false);
    const [productSearch, setProductSearch] = useState('');

    useEffect(() => {
        if (authLoading) return;
        // Simulate loading
        setTimeout(() => {
            setLoading(false);
            processChart();
        }, 1000);
    }, [selectedProduct, timeFilter, authLoading]);

    const processChart = () => {
        const data = MOCK_DATA.objections;
        const total = MOCK_DATA.totalMessages;

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
                text: `{val|${total}}\n{label|mensagens}`,
                left: '28%', // Center relative to the pie (which is on the left side)
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
                    name: 'Objeções',
                    type: 'pie',
                    radius: ['55%', '85%'],
                    center: ['30%', '50%'], // Left align chart to use horizontal space
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
                    data: data.map(o => ({ value: o.count, name: o.category }))
                }
            ]
        };

        setChartOption(option);
    };

    const getTrendBadge = (trend: string) => {
        if (trend === 'up') {
            return (
                <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-100">
                    <TrendingUp size={12} /> Aumentando
                </div>
            );
        }
        if (trend === 'down') {
            return (
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                    <TrendingDown size={12} /> Diminuindo
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1.5 bg-slate-50 text-slate-500 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-slate-100">
                <Minus size={12} /> Estável
            </div>
        );
    };

    const filteredProducts = PRODUCTS_MOCK.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase())
    );

    if (authLoading || loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" size={32} /></div>;

    const insightEmail = profile?.insighthub_email || 'Carregando...';

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 font-sans max-w-7xl mx-auto">

            {/* HEAD & TOOLBAR */}
            <div className="space-y-6">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <Brain className="text-purple-600" size={28} />
                            Inteligência de Produto
                            <span className="bg-purple-100 text-purple-700 text-xs font-black px-2 py-1 rounded uppercase tracking-wider">Beta</span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Descubra <span className="font-bold text-purple-600">por que seus leads não compram</span> analisando dúvidas reais.
                        </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs text-slate-600 flex items-center gap-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Mail size={14} className="text-purple-600" />
                            <span className="font-semibold">Encaminhe para:</span>
                        </div>
                        <code className="bg-white px-2 py-1 rounded border border-slate-200 font-mono font-bold text-purple-700 select-all">
                            {insightEmail}
                        </code>
                    </div>
                </header>

                {/* FILTERS TOOLBAR */}
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">

                    {/* Time Filter (Segmented Control) */}
                    <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 w-full md:w-auto">
                        {[
                            { id: 'today', label: 'Hoje' },
                            { id: '7d', label: '7 dias' },
                            { id: '30d', label: '30 dias' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTimeFilter(t.id)}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex-1 md:flex-none text-center ${timeFilter === t.id
                                    ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200'
                                    : 'text-slate-500 hover:text-slate-700'
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
                            className="w-full flex items-center justify-between bg-white border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 transition-colors"
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
                                                setSelectedProduct(p);
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

            {/* NEW LAYOUT: CHART TOP, DIAGNOSTICS BOTTOM */}

            {/* FULL WIDTH CHART */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[350px]">
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

                <div className="w-full h-72">
                    {chartOption && <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />}
                </div>
            </section>

            {/* DIAGNOSTICS LIST */}
            <section className="space-y-5">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Brain size={16} className="text-slate-400" /> Diagnóstico e Plano de Ação
                    </h3>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-bold">{MOCK_DATA.objections.length} insights encontrados</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MOCK_DATA.objections.map((obj, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">

                            <div>
                                {/* Header do Card */}
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-1 h-8 bg-blue-500 rounded-full mt-1"></div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-base">{obj.category}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                {getTrendBadge(obj.trend)}
                                                <span className="text-slate-300 text-[10px]">•</span>
                                                <span className="text-xs text-slate-500 font-medium">{obj.count} casos</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sugestão Premium */}
                                <div className="bg-slate-900 rounded-xl p-0.5 shadow-md overflow-hidden">
                                    <div className="bg-slate-900/50 backdrop-blur-sm p-4 flex items-start gap-3">
                                        <div className="bg-indigo-500 p-1.5 rounded-lg shrink-0 shadow-lg shadow-indigo-500/20 mt-0.5">
                                            <Brain size={14} className="text-white" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none">Sugestão IA</p>
                                            <p className="text-slate-100 text-sm font-medium leading-relaxed">
                                                {obj.suggestion}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button className="mt-4 w-full text-center text-slate-400 hover:text-blue-600 text-xs font-bold transition-colors py-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100">
                                Ver mensagens originais
                            </button>

                        </div>
                    ))}
                </div>
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
