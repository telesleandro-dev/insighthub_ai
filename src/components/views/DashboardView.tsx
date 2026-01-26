'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Users, Target, TrendingUp, Award, Share2, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "@/lib/supabase";

export default function DashboardView() {
  const [loading, setLoading] = useState(true);
  const [rawEvents, setRawEvents] = useState<any[]>([]);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('7days'); 
  const [chartData, setChartData] = useState<any[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);

  const [metrics, setMetrics] = useState({
    faturamento: 0,
    vendasAprovadas: 0,
    totalLeads: 0,
    taxaConversao: 0,
    topProduct: "Calculando...",
    topPlatform: "Calculando..."
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      // Query utilizando o join padrão do Supabase
      const { data, error } = await supabase
  .from('sales_events')
  .select(`
    id,
    product_id,
    user_id,
    customer_name,
    customer_email,
    status,
    value,
    created_at,
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
        console.log("DEBUG_INSIGHT_HUB:", data);
        console.log("CONTEÚDO DA PRIMEIRA VENDA:", JSON.stringify(data[0], null, 2));
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

  const aprovadas = filtered.filter(e => e.status === 'paid');
  
  // 1. Agrupar por Data para o Gráfico
  const grouped = aprovadas.reduce((acc: any, curr) => {
    const dateKey = new Date(curr.created_at).toISOString().split('T')[0];
    acc[dateKey] = (acc[dateKey] || 0) + (Number(curr.value) || 0);
    return acc;
  }, {});

  const chartArray = Object.keys(grouped)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .map(dateKey => ({
      name: new Date(dateKey + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      total: grouped[dateKey]
    }));

  setChartData(chartArray);

  // 2. Cálculo do Produto Campeão (Ajustado para o retorno do Supabase)
  const prodCounts: Record<string, number> = {};
  
  aprovadas.forEach(e => {
    // RESOLUÇÃO: Tenta ler como Array (padrão Supabase), depois como Objeto, depois Redundância
    const productName = Array.isArray(e.products) 
      ? e.products[0]?.name 
      : e.products?.name || e.product_name || 'Produto Não Localizado';
    
    prodCounts[productName] = (prodCounts[productName] || 0) + 1;
  });

  const faturamentoTotal = aprovadas.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  
  const platCounts: Record<string, number> = {};
  aprovadas.forEach(e => {
    const p = e.platform_origin || 'Outros';
    platCounts[p] = (platCounts[p] || 0) + (Number(e.value) || 0);
  });

  const topProductName = Object.keys(prodCounts).sort((a, b) => prodCounts[b] - prodCounts[a])[0] || "Nenhum";
  const leaderPlatformName = Object.keys(platCounts).sort((a, b) => platCounts[b] - platCounts[a])[0] || "Nenhuma";

  setMetrics({
    faturamento: faturamentoTotal,
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-sm text-slate-500">Desempenho por período e distribuição diária.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Faturamento", value: metrics.faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: <DollarSign className="text-emerald-500" /> },
          { label: "Vendas", value: metrics.vendasAprovadas, icon: <Target className="text-blue-500" /> },
          { label: "Leads", value: metrics.totalLeads, icon: <Users className="text-purple-500" /> },
          { label: "Conversão", value: `${metrics.taxaConversao.toFixed(1)}%`, icon: <TrendingUp className="text-orange-500" /> },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-2 bg-slate-50 w-fit rounded-lg mb-4">{stat.icon}</div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <Award className="absolute right-[-10px] top-[-10px] text-white/10" size={120} />
          <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-1">Produto Campeão</p>
          <h3 className="text-xl font-black text-white truncate">{metrics.topProduct}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl"><Share2 className="text-slate-400" /></div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Plataforma Líder</p>
            <h3 className="text-xl font-black text-slate-800 uppercase">{metrics.topPlatform}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6 uppercase text-[10px] tracking-widest">Faturamento por Dia</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 10}} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 10}} 
                tickFormatter={(value) => `R$ ${value}`} 
              />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}