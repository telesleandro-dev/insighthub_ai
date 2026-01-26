'use client'

import React from 'react';
import { Rocket, BarChart3, Bell, BrainCircuit, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans">
      {/* Hero Section */}
      <nav className="flex justify-between items-center p-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <BrainCircuit size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">InsightHub AI</span>
        </div>
        <a href="/login" className="bg-slate-800 hover:bg-slate-700 px-5 py-2 rounded-full transition-all text-sm font-medium">
          Entrar no Dashboard
        </a>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-blue-500/20">
          <Rocket size={16} />
          <span>Inteligência Artificial para Infoprodutores</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tighter leading-tight">
          Transforme suas vendas em <br />
          <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            conhecimento estratégico.
          </span>
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
          Recupere carrinhos, monitore suas vendas em tempo real e utilize nossa IA para entender o comportamento do seu cliente automaticamente.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <a href="/login" className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-105">
            Começar Agora <ChevronRight size={20} />
          </a>
          <button className="w-full md:w-auto border border-slate-700 hover:bg-slate-800 px-8 py-4 rounded-xl font-bold transition-all">
            Ver Demonstração
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-32 text-left">
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 transition-colors">
            <div className="bg-blue-500/20 p-3 rounded-xl w-fit mb-6 text-blue-400">
              <Bell size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3">Alertas Inteligentes</h3>
            <p className="text-slate-400 leading-relaxed">Receba notificações de vendas e abandonos direto no seu Telegram com links de recuperação.</p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 transition-colors">
            <div className="bg-indigo-500/20 p-3 rounded-xl w-fit mb-6 text-indigo-400">
              <BarChart3 size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3">Análise de Dados</h3>
            <p className="text-slate-400 leading-relaxed">Visualize seu faturamento e conversão em dashboards intuitivos e fáceis de entender.</p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 transition-colors">
            <div className="bg-purple-500/20 p-3 rounded-xl w-fit mb-6 text-purple-400">
              <BrainCircuit size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3">Insights de IA</h3>
            <p className="text-slate-400 leading-relaxed">Nossa IA analisa os dados da Kiwify para sugerir melhorias no seu funil de vendas.</p>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-slate-800 text-center text-slate-500 text-sm">
        &copy; 2026 InsightHub AI. Todos os direitos reservados.
      </footer>
    </div>
  );
}