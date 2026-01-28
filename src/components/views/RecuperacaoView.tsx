'use client';

import React, { useState, useEffect } from 'react';
import {
  RefreshCcw,
  Search,
  MessageCircle,
  ExternalLink,
  PencilLine,
  Loader2,
  Tag,
  DollarSign,
  Users,
  Ticket,
  Filter,
  CheckCircle2,
  LayoutGrid, // Novo ícone para o filtro de status
  TrendingUp, // Ícone para os cards
  Clock       // Ícone para os cards
} from "lucide-react";
import { DiscountModal } from '../ui/modalls/DiscountModal';
import { supabase } from '@/lib/supabase';

import { useAuth } from '@/hooks/useAuth';

export default function RecuperacaoView() {
  const { user, loading: authLoading } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [loadingIA, setLoadingIA] = useState<string | null>(null);

  const [filter, setFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // NOVO: Estado para o filtro de status

  // --- CÁLCULOS DE PERFORMANCE (SPRINT 8) ---
  const faturamentoRecuperado = leads
    .filter(l => l.status_abordagem === 'recuperado')
    .reduce((acc, lead) => acc + Number(lead.value || 0), 0);

  const pipelineAtivo = leads
    .filter(l => ['pendente', 'contatado', 'em_negociacao'].includes(l.status_abordagem || 'pendente'))
    .reduce((acc, lead) => acc + Number(lead.value || 0), 0);

  const totalRecuperados = leads.filter(l => l.status_abordagem === 'recuperado').length;
  const taxaConversao = leads.length > 0
    ? ((totalRecuperados / leads.length) * 100).toFixed(1)
    : "0.0";

  const plataformasDisponiveis = Array.from(new Set(leads.map(l => l.platform_origin).filter(Boolean)));

  // Lógica de filtro atualizada para incluir o Status
  const leadsFiltrados = leads.filter(lead => {
    const passaCategoria =
      filter === 'all' ||
      (filter === 'high_value' && Number(lead.value) >= 500) ||
      (filter === 'with_offer' && !!lead.custom_discount_link);

    const passaPlataforma =
      platformFilter === 'all' ||
      lead.platform_origin === platformFilter;

    const passaStatus =
      statusFilter === 'all' ||
      (lead.status_abordagem || 'pendente') === statusFilter;

    return passaCategoria && passaPlataforma && passaStatus;
  });

  const totalLeads = leads.length;
  const totalValue = leads.reduce((acc, lead) => acc + Number(lead.value), 0);
  const leadsComOferta = leads.filter(l => l.custom_discount_link).length;

  const atualizarStatusAbordagem = async (leadId: string, novoStatus: string) => {
    try {
      const response = await fetch('/api/leads/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadId, status: novoStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro na API');
      }

      // Atualiza estado local apenas se sucesso no servidor
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status_abordagem: novoStatus } : l)));
      console.log(`✅ Status salvo via API: ${novoStatus} para ${leadId}`);
    } catch (error: any) {
      console.error('❌ Erro ao salvar status:', error);
      alert(`Erro ao salvar status: ${error.message || 'Falha de conexão'}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      pendente: "bg-slate-100 text-slate-500",
      contatado: "bg-blue-50 text-blue-600 border-blue-100",
      em_negociacao: "bg-purple-50 text-purple-600 border-purple-100",
      recuperado: "bg-emerald-50 text-emerald-600 border-emerald-100"
    };
    return styles[status] || styles.pendente;
  };

  const abordarComIA = async (lead: any) => {
    setLoadingIA(lead.id);
    try {
      const response = await fetch('/api/ai/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          productName: lead.product_name || 'nosso produto',
          customerName: lead.customer_name
        })
      });

      const data = await response.json();

      if (data.message) {
        const telefoneLimpo = lead.customer_phone?.replace(/\D/g, '') || '';
        const url = `https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(data.message)}`;
        window.open(url, '_blank');

        if ((lead.status_abordagem || 'pendente') === 'pendente') {
          await atualizarStatusAbordagem(lead.id, 'contatado');
        }
      } else {
        alert("Erro na Bruna: " + (data.error || "Tente novamente."));
      }
    } catch (error) {
      alert("Falha na conexão com a Bruna IA.");
    } finally {
      setLoadingIA(null);
    }
  };

  const handleOpenCheckout = (url: string) => {
    if (url) window.open(url, '_blank');
  };

  const handleLinkSaved = async () => {
    await fetchPendingLeads();
    setSelectedLead(null);
  };

  async function fetchPendingLeads() {
    if (!user) return;

    const { data, error } = await supabase
      .from('sales_events')
      .select(`
      *,
      products (
        name
      )
    `) // Adicionamos o join para o nome do produto não vir "Sem Nome"
      .eq('user_id', user!.id) // Filtro de segurança (Pilar 3)
      .neq('status', 'paid') // "neq" significa "não é igual a". Traz tudo que não é pago.
      .order('created_at', { ascending: false });

    if (data) setLeads(data);
    if (error) console.error("Erro ao buscar leads:", error);
  }

  useEffect(() => {
    if (user) {
      fetchPendingLeads();
    }
  }, [user]);

  if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Recuperação de Vendas</h2>

        <div className="flex flex-wrap items-center gap-3">
          {/* NOVO: Filtro de Status de Abordagem */}
          <div className="relative flex items-center">
            <LayoutGrid size={14} className="absolute left-3 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm appearance-none cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="pendente">Pendentes</option>
              <option value="contatado">Contatados</option>
              <option value="em_negociacao">Em Negociação</option>
              <option value="recuperado">Recuperados ✅</option>
            </select>
          </div>

          <div className="relative flex items-center">
            <Filter size={14} className="absolute left-3 text-slate-400" />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm appearance-none cursor-pointer"
            >
              <option value="all">Todas as Plataformas</option>
              {plataformasDisponiveis.map(p => (
                <option key={p} value={p}>{p.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'high_value', label: 'Tickets R$ 500+' },
              { id: 'with_offer', label: 'Com Oferta' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id)}
                className={`px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-black transition-all ${filter === btn.id ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- DASHBOARD DE PERFORMANCE (O CORAÇÃO DO ROI) --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-emerald-600 p-6 rounded-3xl border border-emerald-500 shadow-lg shadow-emerald-100">
          <div className="flex items-center gap-2 mb-2 text-emerald-100 opacity-80">
            <DollarSign size={16} />
            <p className="text-[10px] font-bold uppercase tracking-widest">Recuperado</p>
          </div>
          <h3 className="text-2xl font-black text-white">
            {faturamentoRecuperado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h3>
          <p className="mt-2 text-[10px] font-bold text-emerald-100 uppercase">
            {taxaConversao}% de Conversão
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Clock size={16} />
            <p className="text-[10px] font-bold uppercase tracking-widest">Pipeline Ativo</p>
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            {pipelineAtivo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Users size={16} />
            <p className="text-[10px] font-bold uppercase tracking-widest">Leads Pendentes</p>
          </div>
          <h3 className="text-2xl font-black text-blue-600">
            {leads.filter(l => (l.status_abordagem || 'pendente') === 'pendente').length}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <Ticket size={16} />
            <p className="text-[10px] font-bold uppercase tracking-widest">Ofertas Ativas</p>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{leadsComOferta}</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente / Origem</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Produto</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leadsFiltrados.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{lead.customer_name}</span>
                    {lead.custom_discount_link && (
                      <span className="flex items-center gap-1 bg-green-100 text-green-700 text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                        <Tag size={10} /> OFERTA ATIVA
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold uppercase text-slate-400">
                      {lead.platform_origin}
                    </span>
                    <span>{lead.customer_email}</span>
                  </div>
                </td>

                {/* SPRINT 8: STATUS AMPLIADO PARA LEGIBILIDADE MÁXIMA */}
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <select
                      value={lead.status_abordagem || 'pendente'}
                      onChange={(e) => atualizarStatusAbordagem(lead.id, e.target.value)}
                      className={`
                        text-sm font-black uppercase tracking-tight
                        px-4 py-2 rounded-xl border-2
                        cursor-pointer outline-none transition-all 
                        hover:shadow-md active:scale-95
                        ${getStatusBadge(lead.status_abordagem || 'pendente')}
                      `}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="contatado">Contatado</option>
                      <option value="em_negociacao">Em Negociação</option>
                      <option value="recuperado">Recuperado ✅</option>
                    </select>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
                    {lead.product_name || 'Produto não identificado'}
                  </span>
                </td>

                <td className="px-6 py-4 font-black text-slate-700">
                  {Number(lead.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => abordarComIA(lead)}
                      disabled={loadingIA === lead.id}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-50"
                      title="Abordar com a IA"
                    >
                      {loadingIA === lead.id ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
                    </button>

                    <button
                      onClick={() => setSelectedLead(lead)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all"
                      title="Configurar Desconto"
                    >
                      <PencilLine size={18} />
                    </button>

                    <button
                      onClick={() => handleOpenCheckout(lead.checkout_url)}
                      className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                      title="Abrir Checkout"
                    >
                      <ExternalLink size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLead && (
        <DiscountModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={handleLinkSaved}
        />
      )}
    </div>
  );
}