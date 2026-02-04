'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Copy, Check, Globe, ShieldCheck,
  MessageCircle, FileUp, Save, Loader2, Brain, CheckCircle,
  Info, Activity, LayoutDashboard, Database, Bell, Mail, Zap,
  FileText, Trash2
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';



export default function ConfiguracoesView() {
  const { user, profile, loading: authLoading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiTone, setAiTone] = useState('consultivo');
  const [activeTab, setActiveTab] = useState<'webhook' | 'email'>('webhook');
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Knowledge Files
  const [knowledgeFiles, setKnowledgeFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Email Intelligence config - COMENTADO (aguardando hospedagem de domínio)
  // const [emailConfig, setEmailConfig] = useState<{
  //   forwarding_email: string;
  //   total_emails_received: number;
  //   last_email_at: string | null;
  //   is_active: boolean;
  // } | null>(null);
  // const [loadingEmailConfig, setLoadingEmailConfig] = useState(false);

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
        .select('ai_tone')
        .eq('user_id', user!.id)
        .maybeSingle();

      const { data: configData } = await supabase
        .from('user_configs')
        .select('telegram_enabled, telegram_token, telegram_chat_id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (isMounted) {
        if (settingsData) {
          setAiTone(settingsData.ai_tone || 'consultivo');
        }
        if (configData) {
          setTelegramEnabled(configData.telegram_enabled ?? true);
          setTelegramToken(configData.telegram_token || '');
          setTelegramChatId(configData.telegram_chat_id || '');
        }

        // COMENTADO: Load email config CloudMailin (aguardando hospedagem de domínio)
        // const { data: emailConfigData } = await supabase
        //   .from('user_email_configs')
        //   .select('forwarding_email, total_emails_received, last_email_at, is_active')
        //   .eq('user_id', user!.id)
        //   .maybeSingle();
        //
        // if (emailConfigData) {
        //   setEmailConfig(emailConfigData);
        // } else {
        //   const { data: newConfig, error: createError } = await supabase
        //     .from('user_email_configs')
        //     .insert({ user_id: user!.id })
        //     .select('forwarding_email, total_emails_received, last_email_at, is_active')
        //     .single();
        //   if (!createError && newConfig) {
        //     setEmailConfig(newConfig);
        //   }
        // }
      }
    }
    loadSettings();
    return () => { isMounted = false; };
  }, [user?.id]);

  // Carregar arquivos da base de conhecimento
  useEffect(() => {
    const loadFiles = async () => {
      if (!user) return;
      
      setLoadingFiles(true);
      try {
        const { data, error } = await supabase
          .from('knowledge_files')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setKnowledgeFiles(data);
        } else if (error) {
          console.error('Erro ao carregar arquivos:', error);
          // Pode ser que a migration 013 ainda não foi executada
        }
      } catch (err) {
        console.error('Erro inesperado:', err);
      } finally {
        setLoadingFiles(false);
      }
    };

    loadFiles();
  }, [user?.id]);


  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;



  const handleSaveAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch('/api/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          aiTone,
          telegramToken,
          telegramChatId
        }),
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
    if (!file || !user) return;

    setUploading(true);
    try {
      // Upload COMPLETO via API (Storage + DB com SERVICE_ROLE - bypass RLS)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);

      const uploadResponse = await fetch('/api/knowledge/upload-complete', {
        method: 'POST',
        body: formData
      });

      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadResult.error);
      
      const insertedFile = uploadResult.file;

      alert('✅ Arquivo enviado! Processando texto...');

      // Processar extração de texto em background
      fetch('/api/knowledge/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: insertedFile.id,
          userId: user.id
        })
      }).then(res => {
        if (res.ok) {
          console.log('✅ Texto extraído com sucesso');
        } else {
          console.error('❌ Erro na extração de texto');
        }
      });

      // Recarregar lista
      const { data } = await supabase
        .from('knowledge_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setKnowledgeFiles(data);

    } catch (error: any) {
      alert('❌ Erro: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (file: any) => {
    if (!confirm(`Deletar "${file.file_name}"?`)) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('knowledge-base')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('knowledge_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      alert('✅ Arquivo deletado!');
      setKnowledgeFiles(knowledgeFiles.filter(f => f.id !== file.id));
    } catch (error: any) {
      alert('❌ Erro: ' + error.message);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 animate-in fade-in duration-500 overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 px-6 py-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-lg shadow-blue-200 dark:shadow-blue-900/20 shadow-lg">
              <LayoutDashboard className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Configurações</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Gerencie suas integrações e preferências da IA.</p>
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
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Zap className="text-amber-500" size={18} />
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">Canais de Entrada de Dados</h3>
                </div>
                {/* Tabs Switcher */}
                <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-lg self-start">
                  <button
                    onClick={() => setActiveTab('webhook')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'webhook' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  >
                    Webhook
                  </button>
                  <button
                    onClick={() => setActiveTab('email')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'email' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
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
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 group hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                      <Globe className="text-slate-400" size={16} />
                      <code className="text-[11px] text-slate-600 dark:text-slate-300 flex-1 truncate font-mono font-bold">{webhookUrl}</code>
                      <button onClick={() => copyToClipboard(webhookUrl)} className="p-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm">
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
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                      Encaminhe e-mails de dúvidas de leads para este endereço. Nossa IA analisará o conteúdo e gerará insights no menu <strong>Inteligência de Produto</strong>.
                    </p>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 group hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                      <Mail className="text-slate-400" size={16} />
                      <code className="text-[11px] text-slate-600 dark:text-slate-300 flex-1 truncate font-mono font-bold select-all">
                        {profile?.insighthub_email || 'Carregando...'}
                      </code>
                      <button
                        onClick={() => copyToClipboard(profile?.insighthub_email || '')}
                        className="p-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm"
                        disabled={!profile?.insighthub_email}
                      >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 px-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 w-fit px-2 py-1 rounded">
                      <Info size={12} />
                      <span className="text-[10px] font-bold">Endereço exclusivo. Não compartilhe publicamente.</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* CARD 2: BASE DE CONHECIMENTO */}
            <section className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                  <Database className="text-purple-600 dark:text-purple-400" size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs">Base de Conhecimento Local</h4>
                  <p className="text-[9px] text-slate-400 font-medium">Envie arquivos para enriquecer as respostas da IA</p>
                </div>
              </div>

              {/* Botão de Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.txt,.doc,.docx"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs shadow-sm disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FileUp size={16} />
                      Enviar Arquivo
                    </>
                  )}
                </button>
                <p className="text-[9px] text-slate-400 mt-2 text-center">
                  Formatos aceitos: PDF, TXT, DOC, DOCX
                </p>
              </div>

              {/* Lista de Arquivos */}
              {knowledgeFiles.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <FileText size={14} />
                    Arquivos Importados ({knowledgeFiles.length})
                  </h5>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {knowledgeFiles.map((file) => (
                      <div 
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 group hover:border-purple-300 dark:hover:border-purple-600 transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                            <FileText className="text-purple-600 dark:text-purple-400" size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                              {file.file_name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteFile(file)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Deletar arquivo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loadingFiles && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="animate-spin text-purple-600" size={20} />
                  <span className="ml-2 text-xs text-slate-500">Carregando arquivos...</span>
                </div>
              )}

              {knowledgeFiles.length === 0 && !loadingFiles && (
                <div className="text-center py-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <Database className="mx-auto text-slate-400 mb-2" size={24} />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nenhum arquivo enviado ainda
                  </p>
                </div>
              )}
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

              {telegramEnabled && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 pt-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Bot Token</label>
                    <input
                      type="password"
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                      placeholder="Ex: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 transition-all font-mono text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Chat ID</label>
                    <input
                      type="text"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="Ex: 123456789"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 transition-all font-mono text-slate-700"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400">
                    Crie um bot no <a href="https://t.me/BotFather" target="_blank" className="text-blue-500 hover:underline">BotFather</a> e pegue o token e seu chat ID.
                  </p>
                </div>
              )}

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