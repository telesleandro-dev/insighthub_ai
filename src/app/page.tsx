'use client'
import React from 'react';
import { Rocket, BarChart3, Bell, BrainCircuit, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <nav className="flex justify-between items-center p-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg"><BrainCircuit size={24} /></div>
          <span className="text-xl font-bold italic">InsightHub AI</span>
        </div>
        <a href="/dashboard" className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-full text-sm font-medium transition-all">
          Acessar Dashboard
        </a>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-20 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tighter">
          Venda mais com <span className="text-blue-500">Inteligência.</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
          Monitore vendas da Kiwify em tempo real e recupere carrinhos com auxílio de IA.
        </p>
        <div className="flex justify-center gap-4">
          <a href="/dashboard" className="bg-white text-black px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-all">
            Começar Agora <ChevronRight size={20} />
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-32 text-left">
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800">
            <Bell className="text-blue-400 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Alertas Automáticos</h3>
            <p className="text-slate-400">Notificações no Telegram para cada evento de venda ou abandono.</p>
          </div>
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800">
            <BarChart3 className="text-indigo-400 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Dashboard Real-time</h3>
            <p className="text-slate-400">Acompanhe suas métricas de faturamento e conversão instantaneamente.</p> 
          </div>
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800">
            <BrainCircuit className="text-purple-400 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">IA de Recuperação</h3>
            <p className="text-slate-400">Sugestões inteligentes para abordar clientes que não finalizaram a compra.</p>
          </div>
        </div>
      </main>
    </div>
  );
}