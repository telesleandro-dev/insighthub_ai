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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rawEvents, setRawEvents] = useState<any[]>([]);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('7days');
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

  useEffect(() => {
    async function loadData() {
      if (!user?.id) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('sales_events')
        .select(`
          id,
          product_name,
          external_product_id,
          user_id,
          customer_name,
          customer_email,
          status,
          status_abordagem, 
          value,
          created_at,
          platform_origin,
          recovery_status,
          recovered_at,
          lead_profile:leads_profiles(lead_score)
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error("Erro Supabase:", error);
        setLoading(false);
        return;
      }

      if (data) {
        setRawEvents(data);
        const platforms = Array.from(new Set(data.map((e: any) => e.platform_origin).filter(Boolean)));
        setAvailablePlatforms(platforms as string[]);
        processDashboard(data, 'all', '7days');
      }

      setLoading(false);
    }

    loadData();
  }, [user?.id]);

  const processDashboard = async (events: any[], platform: string, range: string) => {
    const now = new Date();

    const filtered = events.filter(e => {
      const eventDate = new Date(e.created_at);
      const diffDays = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
      const passaPlataforma = platform === 'all' || e.platform_origin === platform;

      let passaTempo = true;
      if (range === 'today') passaTempo = diffDays < 1;
      if (range === '7days') passaTempo = diffDays <= 7;
      if (range === '30days') passaTempo = diffDays <= 30;

      return passaPlataforma && passaTempo;
    });

    // --- CÁLCULO DE MÉTRICAS OPERACIONAIS (ALINHADO COM INTELIGÊNCIA DE VENDAS) ---
    // 1. Vendas Aprovadas/Recuperadas (Status de Sucesso)
    const successStatuses = ['paid', 'pix_generated', 'completed', 'approved'];

    // Vendas Gerais (Para histórico total, se quiser mostrar tudo)
    const todasVendas = filtered.filter(e => successStatuses.includes(e.status?.toLowerCase()));

    // Vendas Recuperadas (ROI Puro)
    const vendasRecuperadas = todasVendas.filter(e => e.recovery_status === 'converted');

    // Total Recuperado: Soma do valor das vendas RECUPERADAS (blindado contra orgânico)
    const valorRecuperado = vendasRecuperadas.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);


    // 2. Leads Quentes (Score >= 80 + Status pending/contacted)
    // ALINHADO COM INTELIGÊNCIA DE VENDAS: Contar leads ÚNICOS (não eventos)
    const uniqueLeadProfiles = Array.from(
      new Map(
        filtered
          .filter(e => e.lead_profile)
          .map(e => [e.lead_profile.id, e.lead_profile])
      ).values()
    );

    const hotLeadsCount = uniqueLeadProfiles.filter(profile =>
      profile.lead_score >= 80 &&
      ['pending', 'contacted'].includes(profile.service_status)
    ).length;

    // 3. Pipeline (Dinheiro na Mesa)
    // Lógica: Todos os NÃO convertidos (independente de pending/contacted)
    const pipeline = filtered.filter(e => {
      const isConverted = successStatuses.includes(e.status?.toLowerCase());
      const isRecovered = e.recovery_status === 'converted';
      return !isConverted && !isRecovered;
    });

    const valorPipeline = pipeline.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

    // 4. Leads Pendentes (Geral)
    // Todos que não converteram e estão pendentes (independente do score, para visão geral)
    const pendingLeads = filtered.filter(e =>
      !successStatuses.includes(e.status?.toLowerCase()) &&
      (e.status_abordagem || 'pendente') === 'pendente'
    );

    const faturamentoTotal = valorRecuperado; // Neste contexto, faturamento = recuperado (foco em recuperação)

    // 1. Gráfico Histórico (Echarts) - APENAS VENDAS RECUPERADAS
    const grouped = vendasRecuperadas.reduce((acc: any, curr) => {
      // ⬅️ CORREÇÃO: Usar recovered_at quando disponível, fallback para created_at
      const dateToUse = curr.recovered_at || curr.created_at;
      const dateKey = new Date(dateToUse).toISOString().split('T')[0];
      acc[dateKey] = (acc[dateKey] || 0) + (Number(curr.value) || 0);
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

    const platCounts: Record<string, number> = {};
    filtered.forEach(e => {
      const p = e.platform_origin || 'Outros';
      platCounts[p] = (platCounts[p] || 0) + 1;
    });
    const leaderPlatformName = Object.keys(platCounts).sort((a, b) => platCounts[b] - platCounts[a])[0] || "Nenhuma";

    // --- CORREÇÃO FINAL: Taxa de Conversão alinhada com InteligenciaLeadsView ---
    // PROBLEMA ANTERIOR: Estava contando EVENTOS (sales_events), não PERFIS (leads_profiles)
    // Um lead pode ter múltiplos eventos, causando discrepância
    // SOLUÇÃO: Consultar leads_profiles diretamente para contar perfis únicos

    let taxaConversaoCorreta = 0;

    if (user?.id) {
      // Buscar perfis de leads do usuário
      const { data: leadProfiles } = await supabase
        .from('leads_profiles')
        .select('service_status')
        .eq('user_id', user.id);

      if (leadProfiles && leadProfiles.length > 0) {
        // Contar perfis por status
        const leadsConvertidos = leadProfiles.filter(l => l.service_status === 'converted').length;
        const leadsPending = leadProfiles.filter(l => l.service_status === 'pending').length;
        const leadsContacted = leadProfiles.filter(l => l.service_status === 'contacted').length;

        // Total de leads gerenciáveis (excluindo direct_sale e outros status)
        const totalLeadsGerenciaveis = leadsPending + leadsContacted + leadsConvertidos;

        // Taxa = convertidos / total gerenciáveis
        taxaConversaoCorreta = totalLeadsGerenciaveis > 0
          ? (leadsConvertidos / totalLeadsGerenciaveis) * 100
          : 0;
      }
    }

    setMetrics({
      faturamento: faturamentoTotal,
      recuperado: valorRecuperado,
      pipeline: valorPipeline,
      pendingLeads: pendingLeads.length,
      vendasAprovadas: vendasRecuperadas.length, // ROI apenas
      totalLeads: filtered.length,
      taxaConversao: taxaConversaoCorreta, // ← CORRIGIDO (conta perfis, não eventos)
      topProduct: "N/A", // Não usado mais na UI principal
      topPlatform: leaderPlatformName,
      hotLeads: hotLeadsCount
    });
  };

  const handleFilters = (p: string, t: string) => {
    setPlatformFilter(p);
    setTimeRange(t);
    processDashboard(rawEvents, p, t);
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Visão Geral & Ações</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Foque no que importa: <span className="font-bold text-emerald-600 dark:text-emerald-400">Recupere suas vendas agora.</span></p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-transparent dark:border-slate-700">
            {['today', '7days', '30days'].map((t) => (
              <button
                key={t}
                onClick={() => handleFilters(platformFilter, t)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${timeRange === t ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                {t === 'today' ? 'Hoje' : t === '7days' ? '7 Dias' : '30 Dias'}
              </button>
            ))}
          </div>

          <select
            value={platformFilter}
            onChange={(e) => handleFilters(e.target.value, timeRange)}
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
