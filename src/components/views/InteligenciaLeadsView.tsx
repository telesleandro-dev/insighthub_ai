'use client';

import React, { useState, useEffect } from 'react';
import {
    Search,
    Flame,
    Snowflake,
    Zap,
    Activity,
    ChevronRight,
    Filter,
    X,
    CreditCard,
    ShoppingCart,
    MessageCircle,
    MoreHorizontal,
    LayoutGrid,
    List,
    Brain,
    Building2,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Link as LinkIcon
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function InteligenciaLeadsView() {
    const { user, loading: authLoading } = useAuth();
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'open' | 'converted'>('open');
    const [totalRecoveredInfo, setTotalRecoveredInfo] = useState(0);

    // Restore missing states
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [leadTimeline, setLeadTimeline] = useState<any[]>([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [loadingIA, setLoadingIA] = useState<string | null>(null);
    const [discountLink, setDiscountLink] = useState('');

    // --- ESTADOS DE FILTRO ---
    const [dateRange, setDateRange] = useState('7days'); // today, yesterday, 7days, 30days, all
    const [searchTerm, setSearchTerm] = useState('');
    const [rawLeads, setRawLeads] = useState<any[]>([]); // Conjunto total para métricas

    // --- MÉTRICAS (Dinâmicas) ---
    const metrics = React.useMemo(() => {
        const total = rawLeads.length;
        const recovered = totalRecoveredInfo;

        // Pipeline: Soma de leads Processados ou Contatados no período
        const potential = rawLeads
            .filter(l => ['processed', 'contacted'].includes(l.service_status))
            .reduce((acc, l) => acc + Number(l.potential_value || 0), 0);

        const boiling = rawLeads.filter(l => l.lead_score >= 80 && ['processed', 'contacted'].includes(l.service_status)).length;

        const convertedCount = rawLeads.filter(l => l.service_status === 'converted').length;
        const conversionRate = total > 0 ? ((convertedCount / total) * 100).toFixed(1) : '0.0';

        return { recovered, potential, boiling, conversionRate };
    }, [rawLeads, totalRecoveredInfo]);

    // --- FETCH DATA (Unified hook to prevent loops) ---
    useEffect(() => {
        let isMounted = true;

        async function loadAllData() {
            if (!user?.id || authLoading) return;

            console.log('🔄 [InteligenciaLeadsView] Carregando dados para o usuário:', user.id);
            setLoading(true);

            try {
                // 2. Fetch Detailed Leads Profiles
                // Agora inclui direct_sale para não perder leads que convertem organicamente
                let query = supabase
                    .from('leads_profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .in('service_status', ['processed', 'contacted', 'converted'])
                    .neq('last_event_type', 'waiting_payment')
                    .order('updated_at', { ascending: false });

                const { data, error } = await query;

                if (error) throw error;

                if (data && isMounted) {
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                    let filtered = data;

                    // Date Filtering (SINCRO COM DASHBOARD)
                    if (dateRange === 'today') {
                        filtered = data.filter(l => {
                            const time = new Date(l.created_at).getTime();
                            const upTime = new Date(l.updated_at).getTime();
                            // Para abertos, usamos created_at. Para convertidos, usamos updated_at (data da venda).
                            if (['converted', 'direct_sale'].includes(l.service_status)) return upTime >= today;
                            return time >= today;
                        });
                    } else if (dateRange === 'yesterday') {
                        const yesterday = today - 86400000;
                        filtered = data.filter(l => {
                            const time = new Date(l.created_at).getTime();
                            const upTime = new Date(l.updated_at).getTime();
                            const target = ['converted', 'direct_sale'].includes(l.service_status) ? upTime : time;
                            return target >= yesterday && target < today;
                        });
                    } else if (dateRange === '7days') {
                        const sevenDays = today - 7 * 86400000;
                        filtered = data.filter(l => {
                            const target = ['converted', 'direct_sale'].includes(l.service_status) ? new Date(l.updated_at).getTime() : new Date(l.created_at).getTime();
                            return target >= sevenDays;
                        });
                    } else if (dateRange === '30days') {
                        const thirtyDays = today - 30 * 86400000;
                        filtered = data.filter(l => {
                            const target = ['converted', 'direct_sale'].includes(l.service_status) ? new Date(l.updated_at).getTime() : new Date(l.created_at).getTime();
                            return target >= thirtyDays;
                        });
                    }

                    setRawLeads(filtered);

                    // --- CÁLCULO DE ROI SINCRONIZADO NO PERÍODO ---
                    const totalConvertedInPeriod = filtered
                        .filter(l => l.service_status === 'converted')
                        .reduce((acc, lead) => {
                            const value = Number(lead.converted_value || lead.potential_value || 0);
                            return acc + value;
                        }, 0);

                    setTotalRecoveredInfo(totalConvertedInPeriod);

                    // Client-side Filters
                    let display = filtered;
                    if (searchTerm) {
                        const lower = searchTerm.toLowerCase();
                        display = display.filter(l =>
                            l.name?.toLowerCase().includes(lower) ||
                            l.email?.toLowerCase().includes(lower)
                        );
                    }

                    if (activeTab === 'open') {
                        display = display.filter(l => ['processed', 'contacted'].includes(l.service_status));
                    } else if (activeTab === 'converted') {
                        display = display.filter(l => l.service_status === 'converted');
                    }

                    setLeads(display);
                }
            } catch (err) {
                console.error('❌ [InteligenciaLeadsView] Erro ao carregar dados:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadAllData();

        // --- REAL-TIME LISTENER ---
        const channel = supabase
            .channel(`leads_changes_${user?.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'leads_profiles',
                filter: `user_id=eq.${user?.id}`
            }, () => {
                console.log('⚡ [Real-time] Mudança detectada nos leads! Recarregando...');
                loadAllData();
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [user?.id, authLoading, dateRange, activeTab, searchTerm]);

    // --- FETCH TIMELINE (REAL) ---
    useEffect(() => {
        async function fetchTimeline() {
            if (selectedLead) {
                setDiscountLink(''); // Limpa link anterior
                setLoadingTimeline(true);

                const { data, error } = await supabase
                    .from('sales_events')
                    .select('*')
                    .eq('user_id', user?.id)
                    .eq('customer_email', selectedLead.email) // Link by email
                    .order('created_at', { ascending: false });

                if (data) {
                    setLeadTimeline(data);
                } else {
                    console.error('Error fetching timeline:', error);
                }
                setLoadingTimeline(false);
            } else {
                setDiscountLink('');
                setLeadTimeline([]);
            }
        }

        fetchTimeline();
    }, [selectedLead, user?.id]);

    // --- UPDATE SERVICE STATUS ---
    const updateServiceStatus = async (leadId: string, newStatus: string) => {
        // Optimistic Update
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, service_status: newStatus } : l));
        setRawLeads(prev => prev.map(l => l.id === leadId ? { ...l, service_status: newStatus } : l));

        const lead = rawLeads.find(l => l.id === leadId);
        if (!lead) return;

        try {
            // 1. Atualizar Perfil
            const { error: profileError } = await supabase
                .from('leads_profiles')
                .update({
                    service_status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', leadId);

            if (profileError) throw profileError;

            // 2. Se for conversão, registrar evento de venda para somar no ROI
            if (newStatus === 'converted') {
                let finalValue = lead.potential_value || 0;

                // Fallback: Se o lead não tem valor potencial, busca o valor do último evento de checkout
                if (finalValue === 0) {
                    const { data: lastEvent } = await supabase
                        .from('sales_events')
                        .select('value')
                        .eq('customer_email', lead.email)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    if (lastEvent?.value) finalValue = lastEvent.value;
                }

                const { error: eventError } = await supabase
                    .from('sales_events')
                    .insert({
                        user_id: user?.id,
                        lead_profile_id: leadId,
                        product_name: lead.product_history?.[0] || 'Manual Recovery',
                        customer_email: lead.email,
                        customer_name: lead.name,
                        customer_phone: lead.phone || '',
                        status: 'paid', // Status padrão para conversão manual
                        value: finalValue,
                        platform_origin: 'insighthub', // Origem manual
                        status_abordagem: 'recuperado',
                        recovery_status: 'converted',
                        converted_at: new Date().toISOString()
                    });

                if (eventError) console.error("Erro ao registrar evento manual:", eventError);

                // Update metrics locally to reflect the new conversion without a full refetch loop
                setTotalRecoveredInfo(prev => prev + finalValue);
            }
        } catch (error) {
            console.error("❌ [InteligenciaLeadsView] Erro ao atualizar status:", error);
            // Em caso de erro, o ideal seria reverter o optimistic update, 
            // mas por agora vamos apenas evitar o reload infinito.
        }
    };

    // --- IA / WHATSAPP ---
    const abordarComIA = async (lead: any) => {
        setLoadingIA(lead.id);
        try {
            // Find last product of interest
            const lastProduct = lead.product_history?.[lead.product_history.length - 1] || 'nosso produto';

            const response = await fetch('/api/ai/recuperar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId: lead.id,           // Mantido para compatibilidade
                    leadEmail: lead.email,     // NOVO: Email para busca correta
                    productName: lastProduct,
                    customerName: lead.name,
                    discountLink: discountLink
                })
            });

            // SEGURANÇA: Verificar se a resposta está OK antes de parsear
            if (!response.ok) {
                console.error('❌ [Frontend] Erro HTTP:', response.status, response.statusText);
                throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
            }

            // SEGURANÇA: Verificar se há conteúdo antes de parsear JSON
            const responseText = await response.text();
            if (!responseText || responseText.trim() === '') {
                console.error('❌ [Frontend] Resposta vazia da API');
                throw new Error('Resposta vazia da API');
            }

            // Parse do JSON com tratamento de erro
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ [Frontend] Erro ao parsear JSON:', parseError);
                console.error('📄 [Frontend] Resposta recebida:', responseText.substring(0, 200));
                throw new Error('Resposta inválida da API');
            }

            if (data.message) {
                // --- ATUALIZAÇÃO REATIVA DO DOSSIÊ NO FRONTEND ---
                const updatedDossie = data.dossie || selectedLead?.lead_summary;
                const newStatus = (selectedLead?.service_status === 'pending' || selectedLead?.service_status === 'processed')
                    ? 'contacted'
                    : selectedLead?.service_status;

                const updatedLead = {
                    ...selectedLead!,
                    lead_summary: updatedDossie,
                    service_status: newStatus
                };

                // Atualizar estados locais para refletir na UI sem recarregar
                setSelectedLead(updatedLead);
                setLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
                setRawLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));

                // Abrir WhatsApp
                const phoneClean = lead.phone?.replace(/\D/g, '') || '';
                const url = `https://wa.me/55${phoneClean}?text=${encodeURIComponent(data.message)}`;
                window.open(url, '_blank');

                // Atualizar status no servidor (se necessário)
                if (['pending', 'processed'].includes(lead.service_status || 'pending')) {
                    updateServiceStatus(lead.id, 'contacted');
                }
            } else {
                alert("Erro na IA: " + (data.error || 'Resposta inválida'));
            }
        } catch (error: any) {
            console.error('❌ [Frontend] Erro completo:', error);
            alert("Erro ao gerar mensagem: " + (error.message || 'Erro desconhecido'));
        } finally {
            setLoadingIA(null);
        }
    };


    // --- HELPERS VISUAIS ---
    const getTemperature = (score: number) => {
        if (score >= 90) return { label: 'FERVENDO', color: 'text-red-100', bg: 'bg-gradient-to-r from-orange-600 to-red-600 shadow-lg shadow-red-500/30 animate-pulse' };
        if (score >= 80) return { label: 'QUENTE', color: 'text-orange-600', bg: 'bg-orange-100 border-orange-200' };
        if (score >= 50) return { label: 'MORNO', color: 'text-yellow-600', bg: 'bg-yellow-100 border-yellow-200' };
        return { label: 'FRIO', color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' };
    };

    // Formata Valor: Se service_status = 'converted' OU converted_value > 0, mostra Convertido
    const getLeadValue = (lead: any) => {
        const potential = Number(lead.potential_value || 0);
        const converted = Number(lead.converted_value || 0);

        // Se o lead está marcado como convertido, sempre mostrar "Convertido"
        if (lead.service_status === 'converted') {
            return {
                val: converted > 0 ? converted : potential,
                label: 'Convertido',
                style: 'text-emerald-600'
            };
        }

        // Para leads não convertidos, se tem converted_value > 0, mostrar Convertido
        if (converted > 0) {
            return { val: converted, label: 'Convertido', style: 'text-emerald-600' };
        }

        return { val: potential, label: 'Potencial', style: 'text-slate-600' };
    };

    const getFlowIcons = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (['paid', 'pix_generated', 'completed', 'approved'].includes(s)) return <CheckCircle2 size={16} className="text-emerald-500" />;
        if (['refused', 'rejected'].includes(s)) return <AlertCircle size={16} className="text-red-500" />;
        return <ShoppingCart size={16} className="text-slate-400" />; // Abandoned/Pending
    };

    if (authLoading || loading) return <div className="p-8 flex justify-center h-[400px] items-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

    // --- RENDER ---
    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in pb-24 h-full flex flex-col max-w-[1600px] mx-auto">

            {/* 1. HEADER & METRICS CARDS */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Brain className="text-blue-600" /> Inteligência de Vendas
                        </h2>
                        <p className="text-sm text-slate-500">Monitoramento e recuperação de alta performance.</p>
                        <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono select-all cursor-pointer inline-block" onClick={() => navigator.clipboard.writeText(user?.id || '')} title="Clique para copiar">
                            WEBHOOK ID: <span className="text-blue-600 dark:text-blue-400 font-bold">{user?.id}</span>
                        </div>
                        {/* DEBUG ERROR LOGS */}
                        <div className="mt-2 text-xs text-slate-500">
                            Última sincronização: {new Date().toLocaleTimeString()} | Leads: {leads.length}
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-all font-bold text-xs flex items-center gap-2 shadow-sm"
                    >
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Atualizar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Card 1: Leads Fervendo */}
                <div className="bg-gradient-to-br from-red-500 to-orange-500 p-6 rounded-2xl text-white shadow-lg shadow-orange-500/20 relative overflow-hidden">
                    <Flame className="absolute right-4 top-4 text-white/20" size={60} />
                    <p className="text-xs font-bold uppercase tracking-widest text-orange-100 mb-1">Fervendo 🔥</p>
                    <h3 className="text-4xl font-black">{metrics.boiling}</h3>
                    <p className="text-xs text-orange-100 mt-1">Leads com Score 90+</p>
                </div>

                {/* Card 2: Recuperação Potencial */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <Activity className="absolute right-4 top-4 text-slate-100 dark:text-slate-800" size={60} />
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Potencial (Mesa)</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                        {metrics.potential.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Status Pendente + Score Alto</p>
                </div>

                {/* Card 3: Recuperado */}
                <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                    <CreditCard className="absolute right-4 top-4 text-white/20" size={60} />
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-100 mb-1">Em Caixa</p>
                    <h3 className="text-3xl font-black">{metrics.recovered.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                    <p className="text-xs text-emerald-100 mt-1">Vendas Recuperadas</p>
                </div>

                {/* Card 4: Conversão */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Conversão</p>
                    <div className="flex items-end gap-2">
                        <h3 className="text-3xl font-black text-blue-600">{metrics.conversionRate}%</h3>
                        <span className="text-xs text-slate-400 mb-1.5">de aproveitamento</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${metrics.conversionRate}%` }}></div>
                    </div>
                </div>
            </div>


            {/* 2. CONTROLS BAR (Date, Search, Filter) */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 bg-[#f8f9fc] dark:bg-slate-950 z-10 py-2">

                {/* Search */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou e-mail..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm"
                    />
                </div>

                {/* Filters Group */}
                <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto pb-1">
                    {/* Date Selector */}
                    <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex shadow-sm">
                        {[
                            { id: 'today', label: 'Hoje' },
                            { id: 'yesterday', label: 'Ontem' },
                            { id: '7days', label: '7D' },
                            { id: '30days', label: '30D' },
                            { id: 'all', label: 'Tudo' }
                        ].map(d => (
                            <button
                                key={d.id}
                                onClick={() => setDateRange(d.id)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${dateRange === d.id
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>

                    {/* Main Tabs (Atendimento vs Convertidos) */}
                    <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                        {[
                            { id: 'open', label: 'Em Atendimento', icon: Activity },
                            { id: 'converted', label: 'Convertidos', icon: CheckCircle2 }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'open' | 'converted')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <tab.icon size={14} className={tab.id === 'converted' ? 'text-emerald-500' : 'text-blue-500'} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. TABLE */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Cliente</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Score (Temp.)</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Valor</th>
                                <th className="pl-6 pr-8 py-4 text-xs font-bold text-slate-500 uppercase text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {leads.map(lead => {
                                const valInfo = getLeadValue(lead);
                                const temp = getTemperature(lead.lead_score);

                                return (
                                    <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">

                                        {/* CLIENTE */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">
                                                    {lead.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{lead.name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span>{lead.last_platform}</span>
                                                        <span className="text-[10px]">•</span>
                                                        <span>{new Date(lead.last_interaction_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* SCORE */}
                                        <td className="px-6 py-4 text-center">
                                            <div className={`
                                                inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase
                                                ${temp.bg} ${temp.color} border
                                            `}>
                                                {lead.lead_score >= 80 && <Flame size={12} />}
                                                {lead.lead_score} - {temp.label}
                                            </div>
                                        </td>

                                        {/* STATUS */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 items-start">
                                                {/* Flow Status */}
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                                    {getFlowIcons(lead.last_event_type)}
                                                    <span className="capitalize">{lead.last_event_type}</span>
                                                </div>

                                                {/* Service Status Selector or Badge */}
                                                {['converted', 'direct_sale'].includes(lead.service_status) ? (
                                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${lead.service_status === 'converted'
                                                        ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30'
                                                        : 'bg-blue-100 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30'
                                                        }`}>
                                                        {lead.service_status === 'converted' ? (
                                                            <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                                                        ) : (
                                                            <Activity size={12} className="text-blue-600 dark:text-blue-400" />
                                                        )}
                                                        <span className={`text-[10px] font-black uppercase tracking-wide ${lead.service_status === 'converted' ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-700 dark:text-blue-400'
                                                            }`}>
                                                            {lead.service_status === 'converted' ? 'Recuperado' : 'Venda Direta'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <select
                                                        value={lead.service_status || 'pending'}
                                                        onChange={(e) => updateServiceStatus(lead.id, e.target.value)}
                                                        className={`
                                                            text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border outline-none cursor-pointer
                                                            bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 text-slate-700 dark:text-slate-300
                                                        `}
                                                    >
                                                        <option value="pending">Pendente</option>
                                                        <option value="contacted">Contatado</option>
                                                        <option value="converted">Marcar como Convertido</option>
                                                    </select>
                                                )}
                                            </div>
                                        </td>

                                        {/* VALOR */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-sm font-black ${valInfo.style}`}>
                                                    {valInfo.val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                                <span className="text-[9px] uppercase font-bold text-slate-400">{valInfo.label}</span>
                                            </div>
                                        </td>

                                        {/* AÇÕES */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => abordarComIA(lead)}
                                                    className="p-2 bg-slate-100 hover:bg-green-500 hover:text-white text-slate-600 rounded-xl transition-all"
                                                    title="Chamar no WhatsApp"
                                                >
                                                    {loadingIA === lead.id ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => setSelectedLead(lead)}
                                                    className="p-2 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded-xl transition-all shadow-sm"
                                                    title="Ver Detalhes (Drawer)"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </div>
                                        </td>

                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {!loading && leads.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                            Nenhum lead encontrado com os filtros atuais.
                        </div>
                    )}
                </div>
            </div>

            {/* DRAWER LATERAL (Mantido igual) */}
            {
                selectedLead && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setSelectedLead(null)}></div>
                        <div className="relative w-full md:w-[500px] bg-white dark:bg-slate-950 h-full shadow-2xl animate-in slide-in-from-right p-0 flex flex-col">
                            {/* Drawer Header */}
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/50">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedLead.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${getTemperature(selectedLead.lead_score).bg} ${getTemperature(selectedLead.lead_score).color}`}>
                                            Score {selectedLead.lead_score}
                                        </span>
                                    </div>
                                    <div className="mt-3 space-y-1">
                                        <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                                            <MessageCircle size={14} className="text-slate-400" /> {selectedLead.email}
                                        </p>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[8px] font-bold text-slate-500 dark:text-slate-400">#</div>
                                            {selectedLead.phone || 'Sem telefone'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full">
                                    <X size={20} className="text-slate-500 dark:text-slate-400" />
                                </button>
                            </div>

                            {/* Drawer Body - Timeline */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">

                                {/* Destaque Financeiro */}
                                <div className="bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-xl flex justify-between items-center shadow-lg">
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">
                                            {selectedLead.converted_value > 0 ? 'Valor Em Caixa' : 'Valor Potencial'}
                                        </p>
                                        <p className="text-2xl font-black">
                                            {(selectedLead.converted_value > 0 ? selectedLead.converted_value : selectedLead.potential_value)
                                                .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                    </div>
                                </div>

                                {/* AI Summary - NOVO */}
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 rounded-xl relative overflow-hidden">
                                    <div className="absolute right-0 top-0 p-2 opacity-5">
                                        <Brain size={80} className="text-indigo-900 dark:text-indigo-300" />
                                    </div>
                                    <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Zap size={14} className="fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400" /> Análise da IA
                                    </h4>
                                    <p className="text-sm text-indigo-900 dark:text-indigo-100 leading-relaxed font-medium relative z-10">
                                        {selectedLead.lead_summary || "Analisando comportamento de compra... Nenhuma observação crítica detectada no momento."}
                                    </p>
                                </div>

                                {/* Timeline Loop */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Activity size={14} /> Histórico Completo
                                    </h4>
                                    <div className="space-y-6 relative border-l-2 border-slate-100 dark:border-slate-800 ml-2 pl-6">
                                        {leadTimeline.map((t, idx) => (
                                            <div key={t.id} className="relative">
                                                <div className={`
                                                absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm
                                                ${['paid', 'pix_generated'].includes(t.status) ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}
                                            `}></div>

                                                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-[10px] font-bold uppercase text-slate-400">{t.platform_origin}</span>
                                                        <span className="text-[10px] text-slate-400">{new Date(t.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{t.product_name}</p>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded capitalize ${['paid', 'approved'].includes(t.status)
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                            : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                                            }`}>
                                                            {t.status}
                                                        </span>
                                                        <span className="font-bold text-slate-600 dark:text-slate-400 text-sm">
                                                            R$ {Number(t.value).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Drawer Actions */}
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Cole aqui o link de desconto (opcional)..."
                                        value={discountLink}
                                        onChange={(e) => setDiscountLink(e.target.value)}
                                        className="w-full pl-9 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white placeholder:text-slate-400"
                                    />
                                </div>
                                <button
                                    onClick={() => abordarComIA(selectedLead)}
                                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-green-200"
                                >
                                    <MessageCircle size={18} /> Mensagem Inteligente no WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
