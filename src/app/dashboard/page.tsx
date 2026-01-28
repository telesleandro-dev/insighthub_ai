'use client';

import { useState } from 'react';
import { LayoutDashboard, Brain, RefreshCcw, Settings, Rocket } from "lucide-react";
import DashboardView from "@/components/views/DashboardView";
import RecuperacaoView from "@/components/views/RecuperacaoView";
import InteligenciaView from "@/components/views/InteligenciaView";
import ConfiguracoesView from "@/components/views/ConfiguracoesView";

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Geral', icon: <LayoutDashboard size={18} />, category: 'Monitoramento' },
    { id: 'inteligencia', label: 'Inteligência de Produto', icon: <Brain size={18} />, category: 'Monitoramento' },
    { id: 'recuperacao', label: 'Recuperação de Vendas', icon: <RefreshCcw size={18} />, category: 'Monitoramento' },
    { id: 'config', label: 'Configurações', icon: <Settings size={18} />, category: 'Sistema' },
  ];

  return (
    <div className="flex h-full w-full">
      {/* SIDEBAR REAL E ÚNICA */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-6 flex items-center gap-2 border-b border-slate-800">
          <Rocket className="text-blue-400" size={24} />
          <h1 className="text-xl font-bold tracking-tighter italic text-white">InsightHub</h1>
        </div>

        <nav className="flex-1 p-4 space-y-8 overflow-y-auto">
          {['Monitoramento', 'Sistema'].map((cat) => (
            <div key={cat}>
              <p className="text-[10px] uppercase text-slate-500 font-bold mb-4 px-3 tracking-widest">{cat}</p>
              <div className="space-y-1">
                {menuItems.filter(item => item.category === cat).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeSection === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                      }`}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* CONTEÚDO CENTRAL */}
      <main className="flex-1 overflow-y-auto bg-[#f8f9fc]">
        {activeSection === 'dashboard' && <DashboardView onNavigate={setActiveSection} />}
        {activeSection === 'recuperacao' && <RecuperacaoView />}
        {activeSection === 'inteligencia' && <InteligenciaView />}
        {activeSection === 'config' && <ConfiguracoesView />}
      </main>
    </div>
  );
}