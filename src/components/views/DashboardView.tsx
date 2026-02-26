'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Users, Target, TrendingUp, Award, Share2, Loader2, AlertCircle, ArrowRight, Rocket } from "lucide-react";
import ReactECharts from 'echarts-for-react';
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/hooks/useAuth';

interface DashboardViewProps {
  onNavigate?: (section: string) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false); // Inicialmente false porque o spinner principal vem do authLoading
  const [rawEvents, setRawEvents] = useState<any[]>([]);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7days'); // Sincronizado com InteligenciaLeadsView: today, yesterday, 7days, 30days, all
  const [chartOption, setChartOption] = useState<any>(null);
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);

  const [metrics, setMetrics] = useState({
    faturamento: 0,
    recuperado: 0,
    pipeline: 0, // Dinheiro na mesa
    pendingLeads: 0, // Leads para abordar AGORA
    vendasAprovadas: 0,
    totalLeads: 0,
    taxaConversao: 0,
    topProduct: "Calculando...",
    topPlatform: "Calculando...",
    hotLeads: 0 // NOVO: Leads com score > 50
  });

  // --- UNIFIED DATA LOADER ---
  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      if (!user?.id || authLoading) return;

      console.log('📊 [DashboardView] Carregando métricas para o período:', dateRange);
      setLoading(true);

      try {
        // 1. Fetch ALL leads profiles for the user
        const { data: profiles, error: profilesError } = await supabase
          .from('leads_profiles')
          .select('*')
          .eq('user_id', user.id)
          .in('service_status', ['processed', 'contacted', 'converted'])
          .neq('last_event_type', 'waiting_payment');

        if (profilesError) throw profilesError;

        // 2. Fetch Sales Events for detailed metrics (Product/Platform counts)
        const { data: events, error: eventsError } = await supabase
          .from('sales_events')
          .select(`
            id, product_name, external_product_id, user_id, customer_name, customer_email,
            status, status_abordagem, value, created_at, platform_origin, recovery_status
          `)
          .eq('user_id', user.id);

        if (eventsError) throw eventsError;

        if (profiles && isMounted) {
          // Sync available platforms from events
          const platforms = Array.from(new Set(events?.map((e: any) => e.platform_origin).filter(Boolean) || []));
          setAvailablePlatforms(platforms as string[]);

          setRawEvents(events || []);

          // Process metrics using the unified source (Filtering happens INSIDE processDashboard)
          processDashboard(profiles, events || [], platformFilter, dateRange);
        }
      } catch (err) {
        console.error('❌ [DashboardView] Erro ao carregar dashboard:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, authLoading, dateRange, platformFilter]); // Depende de tudo que deve regerar o gráfico


  const processDashboard = (profiles: any[], events: any[], platform: string, range: string) => {
    // Filtro Temporal Unificado (Sniper Flow)
    const filteredProfiles = profiles.filter(p => {
      if (platform !== 'all' && p.last_platform?.toLowerCase() !== platform) return false;

      const profileTime = new Date(p.created_at).getTime();
      const conversionTime = new Date(p.updated_at).getTime();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      // Lógica Sniper: Para convertidos (ROI), conta a data da venda (updated_at). Para outros, a data de entrada (created_at).
      const isConverted = p.service_status === 'converted';
      const targetTime = isConverted ? conversionTime : profileTime;

      if (range === 'all' || range === '') return true;
      if (range === 'today') return targetTime >= today;
      if (range === 'yesterday') {
        const yesterday = today - 86400000;
        return targetTime >= yesterday && targetTime < today;
      }
      if (range === '7days') return targetTime >= (today - 7 * 86400000);
      if (range === '30days') return targetTime >= (today - 30 * 86400000);
      return true;
    });

    const filteredEvents = events.filter(e => platform === 'all' || e.platform_origin === platform);

    // --- CÁLCULO DE MÉTRICAS (FONTE: LEADS_PROFILES) ---

    // 1. Faturamento Recuperado (Convertidos + Vendas Diretas no período)
    // Apenas 'converted' conta como ROI (regra de negócio: precisa ter sido contacted antes)
    const convertedLeads = filteredProfiles.filter(p => p.service_status === 'converted');
    const valorRecuperado = convertedLeads.reduce((acc, p) => {
      return acc + (Number(p.converted_value || p.potential_value || 0));
    }, 0);

    // 2. Pipeline (Recuperação Potencial)
    // Mesma lógica da Inteligência: Processed ou Contacted, e ignora waiting_payment
    const potentialLeads = filteredProfiles.filter(p =>
      ['processed', 'contacted'].includes(p.service_status) &&
      p.last_event_type !== 'waiting_payment'
    );
    const valorPipeline = potentialLeads.reduce((acc, p) => acc + (Number(p.potential_value) || 0), 0);

    // 3. Leads Quentes (Score 80+) - Padronizado com Inteligência
    const hotLeadsCount = potentialLeads.filter(p => (p.lead_score || 0) >= 80).length;

    // 4. Leads Prontos (Aguardando Abordagem)
    const readyLeadsCount = potentialLeads.filter(p => p.service_status === 'processed').length;

    // 5. Taxa de Conversão (Baseada em converted + direct_sale)
    const taxaConversao = filteredProfiles.length > 0
      ? (convertedLeads.length / filteredProfiles.length) * 100
      : 0;

    // --- GRÁFICO HISTÓRICO ---
    const grouped = convertedLeads.reduce((acc: any, lead) => {
      // Usar a data local para o agrupamento (evita que vendas à noite pulem para o dia seguinte em UTC)
      const d = new Date(lead.updated_at);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const value = Number(lead.converted_value || lead.potential_value || 0);
      acc[dateKey] = (acc[dateKey] || 0) + value;
      return acc;
    }, {});

    const chartDates = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const chartValues = chartDates.map(d => grouped[d]);

    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const val = params[0].value;
          return `${params[0].name}<br/><strong>R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>`;
        }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: chartDates.map(d => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
        axisLabel: { color: '#94a3b8', formatter: (value: number) => `R$ ${value}` }
      },
      series: [
        {
          data: chartValues,
          type: 'bar',
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          barWidth: '40%'
        }
      ]
    };

    setChartOption(option);

    // Plataforma Líder (baseado em eventos no período)
    const platCounts: Record<string, number> = {};
    filteredEvents.forEach(e => {
      const p = e.platform_origin || 'Outros';
      platCounts[p] = (platCounts[p] || 0) + 1;
    });
    const leaderPlatformName = Object.keys(platCounts).sort((a, b) => platCounts[b] - platCounts[a])[0] || "Nenhuma";

    setMetrics({
      faturamento: valorRecuperado,
      recuperado: valorRecuperado,
      pipeline: valorPipeline,
      pendingLeads: readyLeadsCount,
      vendasAprovadas: convertedLeads.length,
      totalLeads: filteredProfiles.length,
      taxaConversao: taxaConversao,
      topProduct: "N/A",
      topPlatform: leaderPlatformName,
      hotLeads: hotLeadsCount
    });
  };

  const handleFilters = (p: string, t: string) => {
    setPlatformFilter(p);
    setDateRange(t);
    // Nota: processDashboard será chamado automaticamente pelo useEffect quando dateRange mudar
  };

  if (authLoading || loading) return <div className="p-8 flex justify-center h-[400px] items-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Visão Geral & Ações</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Foque no que importa: <span className="font-bold text-emerald-600 dark:text-emerald-400">Recupere suas vendas agora.</span></p>
        </div>

        {/* Filtros sincronizados com InteligenciaLeadsView */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-transparent dark:border-slate-700">
            {[
              { value: 'today', label: 'Hoje' },
              { value: 'yesterday', label: 'Ontem' },
              { value: '7days', label: '7 Dias' },
              { value: '30days', label: '30 Dias' },
              { value: 'all', label: 'Tudo' }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleFilters(platformFilter, filter.value)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${dateRange === filter.value
                  ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <select
            value={platformFilter}
            onChange={(e) => handleFilters(e.target.value, dateRange)}
            className="bg-white dark:bg-slate-800 border dark:border-slate-700 p-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 outline-none shadow-sm capitalize"
          >
            <option value="all">Todas Plataformas</option>
            {availablePlatforms.map(plat => (
              <option key={plat} value={plat}>{plat}</option>
            ))}
          </select>
        </div>
      </header>

      {/* --- BLOCO PRESCRITIVO: O DINHEIRO NA MESA --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* CARD 1: OPORTUNIDADE (O QUE FICA PISCANDO PRO USUÁRIO) */}
        <div className="md:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-xl shadow-blue-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700">
            <Target size={180} className="text-white" />
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-sm animate-pulse">
                  Ação Necessária
                </span>
                <span className="text-blue-200 text-[10px] uppercase font-bold tracking-widest">
                  • Potencial na Mesa
                </span>
              </div>
              <h3 className="text-white text-4xl font-black mb-1">
                {metrics.pipeline.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h3>
              <p className="text-blue-100 font-medium text-sm">
                em vendas possíveis aguardando contato imediato.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-6">
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                <p className="text-blue-200 text-[10px] uppercase font-bold">Leads Quentes</p>
                <p className="text-2xl font-black text-white">{metrics.hotLeads}</p>
              </div>

              {metrics.pipeline > 0 && (
                <div className="flex-1">
                  <button
                    onClick={() => onNavigate?.('inteligencia')}
                    className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center gap-2 w-fit cursor-pointer"
                  >
                    Ir para Inteligência <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CARD 2: RESULTADO JÁ OBTIDO (VALIDAÇÃO) */}
        <div className="bg-emerald-500 p-6 rounded-3xl shadow-lg shadow-emerald-100 flex flex-col justify-between relative overflow-hidden border border-emerald-400">
          <Award className="absolute right-[-20px] bottom-[-20px] text-emerald-900/10" size={140} />
          <div>
            <p className="text-emerald-50 font-bold uppercase text-[10px] tracking-widest mb-2 flex items-center gap-2">
              <DollarSign size={14} /> Total Recuperado (Recebido)
            </p>
            <h3 className="text-3xl font-black text-white">
              {metrics.recuperado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <p className="text-emerald-100 text-xs mt-1 font-medium">Dinheiro já em caixa.</p>
          </div>
          <div className="mt-4">
            <p className="text-[10px] text-emerald-100 uppercase font-bold">Taxa de Conversão</p>
            <p className="text-xl font-black text-white">{metrics.taxaConversao.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* --- KPI DE INTELIGÊNCIA: LEADS QUENTES (ESTATÍSTICA) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* (Prioridade Operacional REMOVIDO) */}

        <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-2 text-orange-500">
            <TrendingUp size={16} />
            <p className="text-[10px] font-bold uppercase tracking-widest">Leads Quentes (Score 80+)</p>
          </div>
          <h3 className="text-2xl font-black text-slate-700 dark:text-slate-200">{metrics.hotLeads}</h3>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Temperatura 🔥 Alta</p>
          <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
            <Rocket size={80} />
          </div>
        </div>
      </div>

      {/* --- GRÁFICO HISTÓRICO (ECHARTS) --- */}
      <div className="bg-white dark:bg-slate-900/50 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-widest">Histórico de Faturamento</h3>
            <p className="text-xs text-slate-400 mt-1">Acompanhamento diário para contexto.</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Recuperado</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{metrics.recuperado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
        </div>

        {chartOption && <ReactECharts option={chartOption} style={{ height: 300 }} />}
      </div>
    </div>
  );
}
