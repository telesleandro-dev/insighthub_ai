'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Copy, Check, Globe, Key, ShieldCheck, Plus,
  Trash2, MessageCircle, FileUp, Save, Loader2, Brain, CheckCircle,
  Eye, EyeOff, Info, Activity, ChevronDown, LayoutDashboard, Database, Bell
} from "lucide-react";
import { supabase } from '@/lib/supabase';

const USER_ID = 'c048be53-fff6-4446-a8b8-6abf79fce171';

// Configuração das plataformas e seus campos específicos
const PLATFORM_OPTIONS = [
  { id: 'kiwify', name: 'Kiwify', label: 'API Key (Opcional)', placeholder: 'Cole sua API Key da Kiwify' },
  { id: 'hotmart', name: 'Hotmart', label: 'Token de Segurança (H-Token)', placeholder: 'O H-Token gerado na Hotmart' },
  { id: 'eduzz', name: 'Eduzz', label: 'API Key / Public Token', placeholder: 'Sua chave de API da Eduzz' },
  { id: 'monetizze', name: 'Monetizze', label: 'Chave Única', placeholder: 'Sua chave única da Monetizze' }
];

export default function ConfiguracoesView() {
  const [copied, setCopied] = useState(false);
  const webhookUrl = `http://localhost:3000/api/webhook/unified?user_id=${USER_ID}`;
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiTone, setAiTone] = useState('consultivo');
  const [apiKeys, setApiKeys] = useState([
    { name: 'kiwify', value: '' }
  ]);
  const [visibleKeys, setVisibleKeys] = useState<{ [key: number]: boolean }>({});
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Dados para os feedbacks visuais de Tom de Voz
  const toneData = {
    persuasivo: { desc: "fechamento", ex: "Últimas horas para garantir sua vaga com desconto! Vamos fechar?" },
    consultivo: { desc: "esclarecer objeções", ex: "Vi que ficou com dúvida no checkout. Qual detalhe posso esclarecer?" },
    cordial: { desc: "relacionamento", ex: "Olá! Notei que não concluiu seu pedido. Posso te ajudar?" }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      // Carregar configurações de user_settings (antigo/legado mas persistente no front)
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('ai_tone, api_keys')
        .eq('user_id', USER_ID)
        .maybeSingle();

      // Carregar configurações de user_configs (onde o Telegram está)
      const { data: configData } = await supabase
        .from('user_configs')
        .select('telegram_enabled')
        .eq('user_id', USER_ID)
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
  }, []);

  const addKeyField = () => setApiKeys([...apiKeys, { name: 'kiwify', value: '' }]);
  const removeKeyField = (index: number) => setApiKeys(apiKeys.filter((_, i) => i !== index));

  const updateKey = (index: number, field: string, val: string) => {
    const newKeys = [...apiKeys];
    (newKeys[index] as any)[field] = val;
    setApiKeys(newKeys);
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      // 1. Salvar na API centralizada que cuida de várias tabelas
      const response = await fetch('/api/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, aiTone, apiKeys }),
      });

      // 2. Salvar flag do telegram separadamente em user_configs via Supabase direto (mais rápido e seguro)
      await supabase.from('user_configs').upsert({
        user_id: USER_ID,
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
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
    <div className="min-h-screen bg-slate-50/50 p-2 md:p-4 animate-in fade-in duration-500 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* Header Compacto */}
        <header className="flex justify-between items-center gap-4 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-md shadow-blue-100">
              <LayoutDashboard className="text-white" size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-none mb-1">Configurações</h2>
              <p className="text-[10px] font-medium text-slate-500">Tudo em uma única tela para seu InsightHub.</p>
            </div>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 text-xs"
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
            <span>{saved ? 'Salvo!' : 'Salvar Alterações'}</span>
          </button>
        </header>

        {/* Row 1: Webhook e Telegram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <section className="md:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="text-blue-600" size={16} />
              <h3 className="font-bold text-slate-800 text-sm">Webhook Unificado</h3>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 group">
              <code className="text-[10px] text-slate-500 flex-1 truncate font-mono font-bold">{webhookUrl}</code>
              <button onClick={copyToClipboard} className="p-1.5 bg-white rounded border border-slate-200 text-slate-400 hover:text-blue-600 transition-all">
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
            <div className="flex items-center gap-3 px-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Aguardando Webhooks</span>
              </div>
              <div className="w-px h-2 bg-slate-200" />
              <div className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck size={12} />
                <span className="text-[10px] font-medium">Criptografia SSL ativa</span>
              </div>
            </div>
          </section>

          {/* Telegram Switch Ativado */}
          <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-blue-50 p-1.5 rounded-md">
                  <Bell className="text-blue-600" size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Avisos Telegram</h4>
                  <p className="text-[9px] text-slate-400 font-medium tracking-tight">Vendas e Abandonos</p>
                </div>
              </div>
              <button
                onClick={() => setTelegramEnabled(!telegramEnabled)}
                className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${telegramEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${telegramEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className={`text-[9px] font-bold p-2 rounded-lg text-center transition-colors ${telegramEnabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
              NOTIFICAÇÕES {telegramEnabled ? 'ATIVADAS' : 'DESATIVADAS'}
            </div>
          </section>
        </div>

        {/* Row 2: Conectores e IA */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

          <section className="md:col-span-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Key className="text-blue-600" size={16} />
                <h3 className="font-bold text-slate-800 text-sm">Conectores de Dados</h3>
              </div>
              <button onClick={addKeyField} className="text-blue-600 px-2 py-1 rounded text-[10px] font-black hover:bg-blue-50 transition-colors uppercase tracking-widest border border-blue-100">
                + Adicionar
              </button>
            </div>

            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {apiKeys.map((key, index) => {
                const platformConfig = PLATFORM_OPTIONS.find(p => p.id === key.name) || PLATFORM_OPTIONS[0];
                return (
                  <div key={index} className="flex gap-2 items-end bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                    <div className="w-1/3">
                      <select
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-700 outline-none"
                        value={key.name}
                        onChange={(e) => updateKey(index, 'name', e.target.value)}
                      >
                        {PLATFORM_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type={visibleKeys[index] ? "text" : "password"}
                        placeholder={platformConfig.label}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-medium text-slate-900 outline-none"
                        value={key.value}
                        onChange={(e) => updateKey(index, 'value', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setVisibleKeys(prev => ({ ...prev, [index]: !prev[index] }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {visibleKeys[index] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                    <button onClick={() => removeKeyField(index)} className="text-slate-300 hover:text-red-500 p-1.5">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="md:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="text-blue-600" size={16} />
              <h3 className="font-bold text-slate-800 text-sm">Personalidade IA</h3>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {(['persuasivo', 'consultivo', 'cordial'] as const).map((tone) => (
                <button
                  key={tone}
                  onClick={() => setAiTone(tone)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-[10px] font-bold transition-all ${aiTone === tone ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                    }`}
                >
                  <span>{tone.toUpperCase()} <span className="font-normal lowercase text-[9px] ml-1 opacity-60">({toneData[tone].desc})</span></span>
                  {aiTone === tone && <CheckCircle size={12} />}
                </button>
              ))}
            </div>
            <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
              <p className="text-[10px] text-slate-600 italic leading-tight">
                "{toneData[aiTone as keyof typeof toneData].ex}"
              </p>
            </div>
          </section>
        </div>

        {/* Row 3: Base Local Embaixo */}
        <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
              <Database className="text-white" size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Base de Conhecimento Local</h3>
              <p className="text-[10px] text-slate-400 font-medium">Carregue manuais ou PDFs para treinar as respostas da sua IA.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all"
            >
              <FileUp size={14} />
              <span>{uploading ? 'ENVIANDO...' : 'UPLOAD DE ARQUIVOS'}</span>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}