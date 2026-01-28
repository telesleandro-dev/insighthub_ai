'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Copy, Check, Globe, Key, ShieldCheck, Plus,
  Trash2, MessageCircle, FileUp, Save, Loader2, Brain, CheckCircle,
  Eye, EyeOff, Info, Activity, ChevronDown, LayoutDashboard, Database, Bell, Mail, Zap
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const PLATFORM_OPTIONS = [
  { id: 'kiwify', name: 'Kiwify', label: 'API Key (Opcional)', placeholder: 'Cole sua API Key da Kiwify' },
  { id: 'hotmart', name: 'Hotmart', label: 'Token de Segurança (H-Token)', placeholder: 'O H-Token gerado na Hotmart' },
  { id: 'eduzz', name: 'Eduzz', label: 'API Key / Public Token', placeholder: 'Sua chave de API da Eduzz' },
  { id: 'monetizze', name: 'Monetizze', label: 'Chave Única', placeholder: 'Sua chave única da Monetizze' }
];

export default function ConfiguracoesView() {
  const { user, profile, loading: authLoading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiTone, setAiTone] = useState('consultivo');
  const [activeTab, setActiveTab] = useState<'webhook' | 'email'>('webhook');
  const [apiKeys, setApiKeys] = useState([
    { name: 'kiwify', value: '' }
  ]);
  const [visibleKeys, setVisibleKeys] = useState<{ [key: number]: boolean }>({});
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const webhookUrl = user ? `https://insighthub.ai/api/webhook/unified?user_id=${user.id}` : 'Carregando...';

  // Dados para os feedbacks visuais de Tom de Voz
  const toneData = {
    persuasivo: { title: "Lobo de Wall Street", desc: "Focado em fechamento e escassez.", ex: "Últimas horas com desconto!" },
    consultivo: { title: "Consultor Técnico", desc: "Esclarece dúvidas e gera confiança.", ex: "Vi que ficou com dúvida..." },
    cordial: { title: "Amigo Próximo", desc: "Foco em relacionamento e empatia.", ex: "Olá! Posso te ajudar?" }
  };

  useEffect(() => {
    let isMounted = true;
    if (!user) return;

    async function loadSettings() {
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('ai_tone, api_keys')
        .eq('user_id', user!.id)
        .maybeSingle();

      const { data: configData } = await supabase
        .from('user_configs')
        .select('telegram_enabled')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (isMounted) {
        if (settingsData) {
          setAiTone(settingsData.ai_tone || 'consultivo');
          if (settingsData.api_keys && Array.isArray(settingsData.api_keys)) {
            setApiKeys(settingsData.api_keys);
          }
        }
        if (configData) {
          setTelegramEnabled(configData.telegram_enabled ?? true);
        }
      }
    }
    loadSettings();
    return () => { isMounted = false; };
  }, [user]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  const addKeyField = () => setApiKeys([...apiKeys, { name: 'kiwify', value: '' }]);
  const removeKeyField = (index: number) => setApiKeys(apiKeys.filter((_, i) => i !== index));

  const updateKey = (index: number, field: string, val: string) => {
    const newKeys = [...apiKeys];
    (newKeys[index] as any)[field] = val;
    setApiKeys(newKeys);
  };

  const handleSaveAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch('/api/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, aiTone, apiKeys }),
      });

      await supabase.from('user_configs').upsert({
        user_id: user.id,
        telegram_enabled: telegramEnabled,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        alert("Erro ao salvar no banco.");
      }
    } catch (error) {
      alert("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const filePath = `knowledge/${Math.random()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('knowledge-base').upload(filePath, file);
      alert("Arquivo enviado!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 animate-in fade-in duration-500 overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-lg shadow-blue-200 shadow-lg">
              <LayoutDashboard className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Configurações</h2>
              <p className="text-xs text-slate-500 font-medium">Gerencie suas integrações e preferências da IA.</p>
            </div>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={loading}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 text-sm"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : saved ? <CheckCircle size={16} /> : <Save size={16} />}
            <span>{saved ? 'Salvo com Sucesso!' : 'Salvar Alterações'}</span>
          </button>
        </header>

        {/* LAYOUT PRINCIPAL: 2 COLUNAS (3/4 + 1/4) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* COLUNA ESQUERDA: Integrações Técnicas (span-8) */}
          <div className="lg:col-span-8 space-y-6">

            {/* CARD 1: CANAIS DE ENTRADA (Tabs) */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Zap className="text-amber-500" size={18} />
                  <h3 className="font-bold text-slate-800 text-sm">Canais de Entrada de Dados</h3>
                </div>
                {/* Tabs Switcher */}
                <div className="flex bg-slate-200/50 p-1 rounded-lg self-start">
                  <button
                    onClick={() => setActiveTab('webhook')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'webhook' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Webhook
                  </button>
                  <button
                    onClick={() => setActiveTab('email')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    E-mail
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'webhook' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="flex justify-between items-start">
                      <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                        URL única para receber notificações de venda da <strong>Kiwify, Hotmart, Eduzz ou Monetizze</strong>. Copie e cole na configuração de webhook da sua plataforma.
                      </p>
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Ativo
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 group hover:border-blue-200 transition-colors">
                      <Globe className="text-slate-400" size={16} />
                      <code className="text-[11px] text-slate-600 flex-1 truncate font-mono font-bold">{webhookUrl}</code>
                      <button onClick={() => copyToClipboard(webhookUrl)} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 transition-all shadow-sm">
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 px-1">
                      <ShieldCheck size={12} className="text-slate-400" />
                      <span className="text-[10px] text-slate-400 font-medium">Conexão segura via SSL (HTTPS)</span>
                    </div>
                  </div>
                )}

                {activeTab === 'email' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                    <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                      Encaminhe e-mails de dúvidas de leads para este endereço. Nossa IA analisará o conteúdo e gerará insights no menu <strong>Inteligência de Produto</strong>.
                    </p>
                    <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 group hover:border-blue-200 transition-colors">
                      <Mail className="text-slate-400" size={16} />
                      <code className="text-[11px] text-slate-600 flex-1 truncate font-mono font-bold select-all">
                        insights+usuario_demo@insighthub.ai
                      </code>
                      <button
                        onClick={() => copyToClipboard("insights+usuario_demo@insighthub.ai")}
                        className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 transition-all shadow-sm"
                      >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 px-1 text-amber-600 bg-amber-50 w-fit px-2 py-1 rounded">
                      <Info size={12} />
                      <span className="text-[10px] font-bold">Endereço exclusivo. Não compartilhe publicamente.</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* CARD 2: CONECTORES DE API */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Key className="text-blue-600" size={18} />
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Chaves de API</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Conecte suas contas para importar dados históricos.</p>
                  </div>
                </div>
                <button onClick={addKeyField} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-colors flex items-center gap-1">
                  <Plus size={12} /> Adicionar
                </button>
              </div>

              <div className="space-y-3">
                {apiKeys.map((key, index) => {
                  const platformConfig = PLATFORM_OPTIONS.find(p => p.id === key.name) || PLATFORM_OPTIONS[0];
                  return (
                    <div key={index} className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl border border-slate-100 transition-all hover:shadow-sm">
                      <div className="w-1/3 min-w-[120px]">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Plataforma</label>
                        <div className="relative">
                          <select
                            className="w-full appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                            value={key.name}
                            onChange={(e) => updateKey(index, 'name', e.target.value)}
                          >
                            {PLATFORM_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Credencial</label>
                        <div className="relative">
                          <input
                            type={visibleKeys[index] ? "text" : "password"}
                            placeholder={platformConfig.placeholder}
                            className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-[11px] font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                            value={key.value}
                            onChange={(e) => updateKey(index, 'value', e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setVisibleKeys(prev => ({ ...prev, [index]: !prev[index] }))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 p-1"
                          >
                            {visibleKeys[index] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                      <button onClick={() => removeKeyField(index)} className="mt-6 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* CARD 3: BASE DE CONHECIMENTO */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-slate-100 p-3 rounded-xl">
                  <Database className="text-slate-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">Base de Conhecimento Local</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Carregue manuais, FAQs ou PDFs do seu produto. A IA usará esses arquivos para responder dúvidas com precisão.
                  </p>
                </div>
              </div>
              <div className="w-full md:w-auto">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-slate-200 active:scale-95"
                >
                  <FileUp size={16} />
                  <span>{uploading ? 'ENVIANDO...' : 'CARREGAR ARQUIVO'}</span>
                </button>
              </div>
            </section>

          </div>

          {/* COLUNA DIREITA: Preferências e Comportamento (span-4) */}
          <div className="lg:col-span-4 space-y-6">

            {/* CARD 4: PERSONALIDADE IA */}
            <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Brain className="text-purple-600" size={18} />
                <h3 className="font-bold text-slate-800 text-sm">Personalidade da IA</h3>
              </div>

              <div className="flex flex-col gap-3">
                {(Object.entries(toneData) as [string, any][]).map(([key, data]) => {
                  const isSelected = aiTone === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setAiTone(key)}
                      className={`relative group flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${isSelected
                        ? 'border-purple-600 bg-purple-50 shadow-sm'
                        : 'border-transparent bg-slate-50 hover:bg-slate-100 hover:border-slate-200'
                        }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${isSelected ? 'border-purple-600' : 'border-slate-300 group-hover:border-slate-400'}`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-purple-600" />}
                      </div>
                      <div>
                        <span className={`text-xs font-bold block mb-0.5 ${isSelected ? 'text-purple-900' : 'text-slate-700'}`}>
                          {data.title}
                        </span>
                        <span className="text-[10px] text-slate-500 leading-tight block">
                          {data.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-[10px] italic leading-relaxed relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <MessageCircle size={40} />
                </div>
                <span className="font-bold text-purple-400 not-italic block mb-1">Exemplo de resposta:</span>
                "{toneData[aiTone as keyof typeof toneData].ex}"
              </div>
            </section>

            {/* CARD 5: NOTIFICAÇÕES (Telegram) */}
            <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Bell className="text-blue-600" size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">Telegram</h4>
                    <p className="text-[9px] text-slate-400 font-medium">Alertas em tempo real</p>
                  </div>
                </div>
                <button
                  onClick={() => setTelegramEnabled(!telegramEnabled)}
                  className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${telegramEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow-sm ${telegramEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-50 pt-3">
                Receba notificações de novas vendas, abandonos de carrinho e insights de produto diretamente no seu celular.
              </p>
            </section>

          </div>

        </div>
      </div>
    </div>
  );
}