'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Users, Target, TrendingUp, Award, Share2, Loader2, AlertCircle, ArrowRight, Rocket } from "lucide-react";
import ReactECharts from 'echarts-for-react';
import { supabase } from "@/lib/supabase";

interface DashboardViewProps {
  onNavigate?: (section: string) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
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
    topPlatform: "Calculando..."
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const { data, error } = await supabase
        .from('sales_events')
        .select(`
          id,
          product_id,
          user_id,
          customer_name,
          customer_email,
          status,
          status_abordagem, 
          value,
          created_at,
          platform_origin,
          products!sales_events_product_id_fkey (
            name
          )
        `)
        .eq('user_id', 'c048be53-fff6-4446-a8b8-6abf79fce171');

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
  }, []);

  const processDashboard = (events: any[], platform: string, range: string) => {
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

    // --- CÁLCULO DE MÉTRICAS OPERACIONAIS (PRESCRITIVAS) ---
    const aprovadas = filtered.filter(e => e.status === 'paid');
    const recuperadas = filtered.filter(e => e.status_abordagem === 'recuperado');

    // Pipeline: Tudo que não foi pago e não foi perdido/recuperado, OU seja, o que está na mesa
    const pipeline = filtered.filter(e =>
      e.status !== 'paid' &&
      (['pendente', 'contatado', 'em_negociacao'].includes(e.status_abordagem || 'pendente'))
    );

    const pendingLeads = filtered.filter(e => (e.status_abordagem || 'pendente') === 'pendente' && e.status !== 'paid');

    const faturamentoTotal = aprovadas.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    const valorRecuperado = recuperadas.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    const valorPipeline = pipeline.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

    // 1. Gráfico Histórico (Echarts)
    const grouped = aprovadas.reduce((acc: any, curr) => {
      const dateKey = new Date(curr.created_at).toISOString().split('T')[0];
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

    // 2. Produto Campeão (Foco Operacional)
    const prodCounts: Record<string, number> = {};
    pipeline.forEach(e => { // Focamos o produto campeão no PIPELINE (Onde tem dinheiro a recuperar)
      const productName = Array.isArray(e.products)
        ? e.products[0]?.name
        : e.products?.name || e.product_name || 'Produto Não Localizado';
      prodCounts[productName] = (prodCounts[productName] || 0) + 1;
    });

    // Se não tiver pipeline, usamos o histórico de vendas mesmo
    if (pipeline.length === 0) {
      aprovadas.forEach(e => {
        const productName = Array.isArray(e.products)
          ? e.products[0]?.name
          : e.products?.name || e.product_name || 'Produto Não Localizado';
        prodCounts[productName] = (prodCounts[productName] || 0) + 1;
      });
    }

    const topProductName = Object.keys(prodCounts).sort((a, b) => prodCounts[b] - prodCounts[a])[0] || "Nenhum";

    const platCounts: Record<string, number> = {};
    filtered.forEach(e => {
      const p = e.platform_origin || 'Outros';
      platCounts[p] = (platCounts[p] || 0) + 1;
    });
    const leaderPlatformName = Object.keys(platCounts).sort((a, b) => platCounts[b] - platCounts[a])[0] || "Nenhuma";

    setMetrics({
      faturamento: faturamentoTotal,
      recuperado: valorRecuperado,
      pipeline: valorPipeline,
      pendingLeads: pendingLeads.length,
      vendasAprovadas: aprovadas.length,
      totalLeads: filtered.length,
      taxaConversao: filtered.length > 0 ? (aprovadas.length / filtered.length) * 100 : 0,
      topProduct: topProductName,
      topPlatform: leaderPlatformName
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Visão Geral & Ações</h2>
          <p className="text-sm text-slate-500">Foque no que importa: <span className="font-bold text-emerald-600">Recupere suas vendas agora.</span></p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border">
            {['today', '7days', '30days'].map((t) => (
              <button
                key={t}
                onClick={() => handleFilters(platformFilter, t)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${timeRange === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                {t === 'today' ? 'Hoje' : t === '7days' ? '7 Dias' : '30 Dias'}
              </button>
            ))}
          </div>

          <select
            value={platformFilter}
            onChange={(e) => handleFilters(e.target.value, timeRange)}
            className="bg-white border p-2 rounded-xl text-xs font-bold text-slate-600 outline-none shadow-sm capitalize"
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
              </div>
              <h3 className="text-white text-4xl font-black mb-1">
                {metrics.pipeline.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h3>
              <p className="text-blue-100 font-medium text-sm">
                em vendas possíveis aguardando seu contato.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-6">
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                <p className="text-blue-200 text-[10px] uppercase font-bold">Leads Pendentes</p>
                <p className="text-2xl font-black text-white">{metrics.pendingLeads}</p>
              </div>

              {metrics.pendingLeads > 0 && (
                <div className="flex-1">
                  <p className="text-white text-sm font-bold mb-2 flex items-center gap-2">
                    <AlertCircle size={14} />
                    {metrics.pendingLeads} clientes esperando agora
                  </p>
                  <button
                    onClick={() => onNavigate?.('recuperacao')}
                    className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center gap-2 w-fit cursor-pointer"
                  >
                    Ir para Recuperação <ArrowRight size={16} />
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
              <DollarSign size={14} /> Total Recuperado
            </p>
            <h3 className="text-3xl font-black text-white">
              {metrics.recuperado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <p className="text-emerald-100 text-xs mt-1 font-medium">Dinheiro salvo do abandono.</p>
          </div>
        </div>
      </div>

      {/* --- BLOCO SECUNDÁRIO: CONTEXTO E OPERACIONAL --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PRODUTO CAMPEÃO COM FOCO OPERACIONAL */}
        <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
              <TrendingUp size={14} /> Prioridade Operacional
            </p>
            <h4 className="text-lg font-black text-slate-800">{metrics.topProduct}</h4>
            <p className="text-slate-500 text-xs mt-1">Este é o produto com maior volume de oportunidades no período. Priorize a recuperação dele.</p>
          </div>
          <div className="hidden md:block bg-blue-50 p-3 rounded-full">
            <Rocket className="text-blue-600" size={24} />
          </div>
        </div>

        {/* KPI SECUNDÁRIO */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2 opacity-50">
            <Target size={16} />
            <p className="text-[10px] font-bold uppercase tracking-widest">Conversão Geral</p>
          </div>
          <h3 className="text-2xl font-black text-slate-700">{metrics.taxaConversao.toFixed(1)}%</h3>
          <p className="text-[10px] text-slate-400 mt-1">Métrica apenas informativa.</p>
        </div>
      </div>

      {/* --- GRÁFICO HISTÓRICO (ECHARTS) --- */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-widest">Histórico de Faturamento</h3>
            <p className="text-xs text-slate-400 mt-1">Acompanhamento diário para contexto.</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total no Período</p>
            <p className="text-xl font-black text-slate-900">{metrics.faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
        </div>

        {chartOption && <ReactECharts option={chartOption} style={{ height: 300 }} />}
      </div>
    </div>
  );
}
