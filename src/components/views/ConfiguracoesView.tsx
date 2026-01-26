'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Copy, Check, Globe, Key, ShieldCheck, Plus, 
  Trash2, MessageCircle, FileUp, Save, Loader2, Brain, CheckCircle,
  Eye, EyeOff, Info, Activity 
} from "lucide-react";
import { supabase } from '@/lib/supabase';

export default function ConfiguracoesView() {
  // Estados originais mantidos integralmente
  const [copied, setCopied] = useState(false);
  const webhookUrl = "http://localhost:3000/api/webhook";
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiTone, setAiTone] = useState('consultivo');
  const [apiKeys, setApiKeys] = useState([
    { name: 'KIWIFY', value: '' },
    { name: 'HOTMART', value: '' }
  ]);

  // Dados para os feedbacks visuais de Tom de Voz
  const toneData = {
    persuasivo: { desc: "foco em fechamento", ex: "Últimas horas para garantir sua vaga com desconto! Vamos fechar?" },
    consultivo: { desc: "foco em esclarecer objeções", ex: "Vi que ficou com dúvida no checkout. Qual detalhe do curso posso te esclarecer?" },
    cordial: { desc: "foco em relacionamento", ex: "Olá! Notei que não concluiu seu pedido. Posso te ajudar com alguma dúvida?" }
  };

  const [visibleKeys, setVisibleKeys] = useState<{ [key: number]: boolean }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // useEffect "Vigilante" para carregamento de dados
  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      const { data } = await supabase
        .from('user_settings')
        .select('ai_tone, api_keys')
        .eq('user_id', 'c048be53-fff6-4446-a8b8-6abf79fce171')
        .maybeSingle();

      if (data && isMounted) {
        setAiTone(data.ai_tone || 'consultivo');
        if (data.api_keys && Array.isArray(data.api_keys)) {
          setApiKeys(data.api_keys);
        }
      }
    }
    loadSettings();
    return () => { isMounted = false; }; 
  }, []);

  // Gestão de Chaves de API - Restaurado e Mantido
  const addKeyField = () => setApiKeys([...apiKeys, { name: '', value: '' }]);
  const removeKeyField = (index: number) => setApiKeys(apiKeys.filter((_, i) => i !== index));
  
  const updateKey = (index: number, field: 'name' | 'value', val: string) => {
    const newKeys = [...apiKeys];
    newKeys[index][field] = val;
    setApiKeys(newKeys);
  };

  const toggleVisibility = (index: number) => {
    setVisibleKeys(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
const handleSaveAll = async () => {
  setLoading(true);
  
  // LOG DE DEBUG: Verifique no console (F12) se este array contém todos os dados
  console.log("Dados que serão enviados:", { aiTone, apiKeys });

  try {
    const response = await fetch('/api/settings/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: 'c048be53-fff6-4446-a8b8-6abf79fce171', // Seu UID real
        aiTone: aiTone, 
        apiKeys: apiKeys // Enviamos o array completo de plataformas
      }),
    });

    if (response.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      alert("Erro ao salvar no banco. Verifique o console.");
    }
  } catch (error) {
    alert("Falha de conexão.");
  } finally {
    setLoading(false);
  }
};

  const handleSelectFiles = () => fileInputRef.current?.click();
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
    <div className="p-8 space-y-8 animate-in fade-in duration-500 font-sans">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Configurações</h2>
          <p className="text-sm font-medium text-slate-500">Gerencie as conexões e a segurança do seu InsightHub.</p>
        </div>
        <button 
          onClick={handleSaveAll}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 text-sm"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : saved ? <CheckCircle size={18} /> : <Save size={18} />}
          {saved ? 'Salvo!' : 'Salvar Alterações'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Webhook URL */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-wider">
            <Globe size={18} />
            <h3>Webhook URLs</h3>
          </div>
          <p className="text-base font-semibold text-slate-600">URL única para receber dados da Kiwify, Hotmart ou Eduzz.</p>
          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <code className="text-[11px] text-slate-700 flex-1 truncate font-mono font-bold">{webhookUrl}</code>
            <button onClick={copyToClipboard} className="text-slate-400 hover:text-blue-600 transition-colors">
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-[11px] flex items-center gap-1.5 font-bold text-amber-500">
              <Activity size={20} /> Nenhum evento recebido ainda.
            </span>
            <span className="text-[14px] text-slate-500 flex items-center gap-1.5 font-medium">
              <ShieldCheck size={12} /> Usamos apenas eventos de venda e lead. Sem acesso financeiro.
            </span>
          </div>
        </div>

        {/* Tom de Voz da IA */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-wider">
            <MessageCircle size={18} />
            <h3>Tom de Voz (IA)</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['persuasivo', 'consultivo', 'cordial'].map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => setAiTone(tone)}
                className={`py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1 ${
                  aiTone === tone ? 'border-blue-600 bg-blue-50/50 text-blue-700' : 'border-slate-50 text-slate-400 hover:border-slate-200'
                }`}
              >
                {tone}
                <span className="text-[9px] font-bold lowercase tracking-normal">
                  {toneData[tone as keyof typeof toneData].desc}
                </span>
              </button>
            ))}
          </div>
          <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100/50">
            <p className="text-[11px] text-blue-700 font-bold mb-1 flex items-center gap-1.5">
              <Brain size={12} /> Exemplo de mensagem:
            </p>
            <p className="text-[12px] text-slate-700 italic font-semibold leading-relaxed">
              "{toneData[aiTone as keyof typeof toneData].ex}"
            </p>
          </div>
        </div>

        {/* Conexão com Plataformas (BOTÃO ADICIONAR RESTAURADO) */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 flex flex-col lg:col-span-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-wider">
              <Key size={18} />
              <h3>Conexão com Plataformas</h3>
            </div>
            {/* BOTÃO ADICIONAR: Restaurado aqui */}
            <button onClick={addKeyField} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all">
              <Plus size={14} /> Adicionar
            </button>
          </div>
          <div className="text-[15px] text-slate-600 flex items-center gap-1.5 italic font-semibold mb-2">
            <Info size={14} className="text-blue-400" /> Acesso somente leitura para sincronizar leads e status.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apiKeys.map((key, index) => (
              <div key={index} className="flex gap-2 animate-in slide-in-from-left-2 items-center">
                <input 
                  placeholder="PLATAFORMA" 
                  className="w-1/3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold uppercase text-slate-900 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-blue-500/20"
                  value={key.name}
                  onChange={(e) => updateKey(index, 'name', e.target.value)}
                />
                <div className="flex-1 relative">
                  <input 
                    type={visibleKeys[index] ? "text" : "password"} 
                    placeholder="API Key / Token" 
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 pr-8 text-[11px] font-medium text-slate-900 outline-none focus:ring-1 focus:ring-blue-500/20"
                    onChange={(e) => updateKey(index, 'value', e.target.value)}
                  />
                  <button type="button" onClick={() => toggleVisibility(index)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors">
                    {visibleKeys[index] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button onClick={() => removeKeyField(index)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Base de Conhecimento */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-wider">
            <ShieldCheck size={18} />
            <h3>Base de Conhecimento (IA)</h3>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt" />
          <div 
            onClick={handleSelectFiles}
            className="border-2 border-dashed border-slate-100 rounded-2xl p-8 text-center bg-slate-50/30 flex flex-col items-center gap-3 hover:border-blue-200 transition-all cursor-pointer group"
          >
            <FileUp className="text-blue-500" size={24} />
            <div>
              <p className="text-sm font-bold text-slate-700 leading-snug">Adicione manuais, FAQs ou sua página de vendas</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Quanto mais material você enviar, mais precisas serão as mensagens da IA.</p>
            </div>
            <button type="button" className="bg-white border shadow-sm px-6 py-2 rounded-xl text-[11px] font-bold text-slate-700">
              {uploading ? 'Enviando...' : 'Selecionar Arquivos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}