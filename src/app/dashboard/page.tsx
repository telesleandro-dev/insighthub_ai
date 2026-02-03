'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Brain, RefreshCcw, Settings, Rocket, LogOut, ShieldAlert, Package } from "lucide-react";
import DashboardView from "@/components/views/DashboardView";
import RecuperacaoView from "@/components/views/RecuperacaoView";
import InteligenciaView from "@/components/views/InteligenciaView";
import ConfiguracoesView from "@/components/views/ConfiguracoesView";
import AdminUsersView from "@/components/views/AdminUsersView";
import ProdutosView from "@/components/views/ProdutosView";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  // Definimos os itens do menu dinamicamente com useMemo
  const menuItems = useMemo(() => {
    const items = [
      { id: 'dashboard', label: 'Dashboard Geral', icon: <LayoutDashboard size={18} />, category: 'Monitoramento' },
      { id: 'inteligencia', label: 'Inteligência de Produto', icon: <Brain size={18} />, category: 'Monitoramento' },
      { id: 'recuperacao', label: 'Recuperação de Vendas', icon: <RefreshCcw size={18} />, category: 'Monitoramento' },
      { id: 'produtos', label: 'Produtos', icon: <Package size={18} />, category: 'Gerenciar' },
      { id: 'config', label: 'Configurações', icon: <Settings size={18} />, category: 'Sistema' },
    ];

    if (profile?.role === 'admin') {
      items.push({
        id: 'admin',
        label: 'Gestão de Usuários',
        icon: <ShieldAlert size={18} />,
        category: 'Sistema'
      });
    }
    return items;
  }, [profile?.role]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-full w-full">
      {/* SIDEBAR REAL E ÚNICA */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-6 flex items-center gap-2 border-b border-slate-800">
          <Rocket className="text-blue-400" size={24} />
          <h1 className="text-xl font-bold tracking-tighter italic text-white">InsightHub</h1>
        </div>

        <nav className="flex-1 p-4 space-y-8 overflow-y-auto">
          {['Monitoramento', 'Gerenciar', 'Sistema'].map((cat) => (
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

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white uppercase">
              {profile?.name?.[0] || user?.email?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{profile?.name || (loading ? 'Carregando...' : 'Usuário')}</p>
              <p className="text-[10px] text-slate-500 truncate lowercase">{user?.email}</p>
              {/* DEBUG: Mostrar role */}
              {profile?.role && (
                <p className="text-[9px] font-bold uppercase mt-1 px-1.5 py-0.5 rounded bg-purple-500 text-white inline-block">
                  {profile.role}
                </p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <ThemeToggle />
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut size={16} className="text-red-500" /> Sair da Conta
          </button>
        </div>
      </aside>

      {/* CONTEÚDO CENTRAL */}
      <main className="flex-1 overflow-y-auto bg-[#f8f9fc] dark:bg-slate-950 transition-colors duration-300">
        {activeSection === 'dashboard' && <DashboardView onNavigate={setActiveSection} />}
        {activeSection === 'recuperacao' && <RecuperacaoView />}
        {activeSection === 'inteligencia' && <InteligenciaView />}
        {activeSection === 'produtos' && <ProdutosView />}
        {activeSection === 'config' && <ConfiguracoesView />}
        {activeSection === 'admin' && <AdminUsersView />}
      </main>
    </div>
  );
}