'use client';

import React, { useState, useEffect } from 'react';
import {
  Copy, Check, Globe, Key, Plus, Trash2, Save, Loader2,
  Eye, EyeOff, Activity, CheckCircle, XCircle, MessageCircle,
  Brain, DollarSign, BookOpen, Send, AlertCircle
} from "lucide-react";
import { supabase } from '@/lib/supabase';

const USER_ID = 'c048be53-fff6-4446-a8b8-6abf79fce171';

interface Platform {
  platform: string;
  displayName: string;
  api_key: string | null;
  is_active: boolean;
  last_webhook_at: string | null;
  total_webhooks: number;
  total_sales: number;
  total_abandonments: number;
}

interface RecoverySettings {
  ai_tone: 'persuasivo' | 'consultivo' | 'cordial';
  wait_time_minutes: number;
  max_attempts: number;
  retry_interval_hours: number;
  work_start_hour: number;
  work_end_hour: number;
  enabled: boolean;
}

interface DiscountSettings {
  default_discount_percent: number;
  coupon_code: string;
  coupon_validity_hours: number;
  enabled: boolean;
}

interface KnowledgeItem {
  id: string;
  type: 'faq' | 'objection' | 'document';
  title: string;
  content: string;
}

export default function ConfiguracoesView() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'platforms' | 'notifications' | 'recovery' | 'discounts' | 'knowledge'>('platforms');

  // Estados
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [recovery, setRecovery] = useState<RecoverySettings>({
    ai_tone: 'consultivo',
    wait_time_minutes: 60,
    max_attempts: 3,
    retry_interval_hours: 24,
    work_start_hour: 8,
    work_end_hour: 22,
    enabled: true
  });
  const [discounts, setDiscounts] = useState<DiscountSettings>({
    default_discount_percent: 10,
    coupon_code: 'RECUPERA10',
    coupon_validity_hours: 48,
    enabled: false
  });
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<{ [key: string]: boolean }>({});
  const [testingTelegram, setTestingTelegram] = useState(false);

  // Carregar dados
  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    try {
      // Carregar plataformas
      const platformsRes = await fetch(`/api/settings/platforms?user_id=${USER_ID}`);
      const platformsData = await platformsRes.json();

      const platformNames = {
        kiwify: 'Kiwify',
        hotmart: 'Hotmart',
        eduzz: 'Eduzz',
        monetizze: 'Monetizze'
      };

      setPlatforms(platformsData.platforms.map((p: any) => ({
        ...p,
        displayName: platformNames[p.platform as keyof typeof platformNames]
      })));

      // Carregar recuperação
      const recoveryRes = await fetch(`/api/settings/recovery?user_id=${USER_ID}`);
      const recoveryData = await recoveryRes.json();
      setRecovery(recoveryData.settings);

      // Carregar descontos
      const discountsRes = await fetch(`/api/settings/discounts?user_id=${USER_ID}`);
      const discountsData = await discountsRes.json();
      setDiscounts(discountsData.settings);

      // Carregar base de conhecimento
      const knowledgeRes = await fetch(`/api/settings/knowledge?user_id=${USER_ID}`);
      const knowledgeData = await knowledgeRes.json();
      setKnowledge(knowledgeData.items);

      // Carregar Telegram
      const { data: userConfig } = await supabase
        .from('user_configs')
        .select('telegram_token, telegram_chat_id')
        .eq('user_id', USER_ID)
        .maybeSingle();

      if (userConfig) {
        setTelegramToken(userConfig.telegram_token || '');
        setTelegramChatId(userConfig.telegram_chat_id || '');
      }

    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      // Salvar plataformas
      await fetch('/api/settings/platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, platforms })
      });

      // Salvar recuperação
      await fetch('/api/settings/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, settings: recovery })
      });

      // Salvar descontos
      await fetch('/api/settings/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, settings: discounts })
      });

      // Salvar Telegram
      await supabase
        .from('user_configs')
        .upsert({
          user_id: USER_ID,
          telegram_token: telegramToken,
          telegram_chat_id: telegramChatId
        }, { onConflict: 'user_id' });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const testTelegram = async () => {
    if (!telegramToken || !telegramChatId) {
      alert('Preencha Token e Chat ID primeiro');
      return;
    }

    setTestingTelegram(true);
    try {
      const res = await fetch('/api/settings/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: telegramToken, chatId: telegramChatId })
      });

      const data = await res.json();

      if (data.success) {
        alert('✅ Mensagem de teste enviada! Verifique seu Telegram.');
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      alert('Erro ao testar Telegram');
    } finally {
      setTestingTelegram(false);
    }
  };

  const addKnowledgeItem = async (type: 'faq' | 'objection') => {
    const title = prompt(`Título da ${type === 'faq' ? 'pergunta' : 'objeção'}:`);
    const content = prompt('Resposta/Solução:');

    if (!title || !content) return;

    try {
      const res = await fetch('/api/settings/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, type, title, content })
      });

      const data = await res.json();
      if (data.success) {
        setKnowledge([...knowledge, data.item]);
      }
    } catch (error) {
      alert('Erro ao adicionar item');
    }
  };

  const deleteKnowledgeItem = async (id: string) => {
    if (!confirm('Remover este item?')) return;

    try {
      await fetch(`/api/settings/knowledge?id=${id}`, { method: 'DELETE' });
      setKnowledge(knowledge.filter(k => k.id !== id));
    } catch (error) {
      alert('Erro ao remover item');
    }
  };

  const getWebhookUrl = (platform: string) => {
    return `https://insighthub-ai.vercel.app/api/webhook/unified?user_id=${USER_ID}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Nunca';
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Agora';
    if (hours < 24) return `há ${hours}h`;
    return `há ${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Configurações</h1>
          <p className="text-gray-400 mt-1">Gerencie as conexões e a segurança do seu InsightHub</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</>
          ) : saved ? (
            <><Check className="w-5 h-5" /> Salvo!</>
          ) : (
            <><Save className="w-5 h-5" /> Salvar Alterações</>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {[
          { id: 'platforms', label: 'Plataformas', icon: Globe },
          { id: 'notifications', label: 'Notificações', icon: MessageCircle },
          { id: 'recovery', label: 'Recuperação', icon: Brain },
          { id: 'discounts', label: 'Descontos', icon: DollarSign },
          { id: 'knowledge', label: 'Base de Conhecimento', icon: BookOpen }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das Tabs */}
      <div className="space-y-6">

        {/* TAB: Plataformas */}
        {activeTab === 'platforms' && (
          <div className="space-y-4">
            {platforms.map(platform => (
              <div key={platform.platform} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${platform.is_active ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <h3 className="text-xl font-semibold text-white">{platform.displayName}</h3>
                    {platform.is_active ? (
                      <span className="text-sm text-green-400">Conectado</span>
                    ) : (
                      <span className="text-sm text-gray-500">Desconectado</span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Webhook URL:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={getWebhookUrl(platform.platform)}
                        readOnly
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(getWebhookUrl(platform.platform))}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4 text-gray-300" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">API Key (Opcional):</label>
                    <div className="flex gap-2">
                      <input
                        type={visibleKeys[platform.platform] ? 'text' : 'password'}
                        value={platform.api_key || ''}
                        onChange={(e) => {
                          const newPlatforms = platforms.map(p =>
                            p.platform === platform.platform ? { ...p, api_key: e.target.value } : p
                          );
                          setPlatforms(newPlatforms);
                        }}
                        placeholder="Cole sua API Key aqui"
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                      <button
                        onClick={() => setVisibleKeys({ ...visibleKeys, [platform.platform]: !visibleKeys[platform.platform] })}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        {visibleKeys[platform.platform] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
                    <div>
                      <p className="text-sm text-gray-400">Último webhook</p>
                      <p className="text-white font-medium">{formatDate(platform.last_webhook_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total recebido</p>
                      <p className="text-white font-medium">{platform.total_webhooks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Vendas / Abandonos</p>
                      <p className="text-white font-medium">{platform.total_sales} / {platform.total_abandonments}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: Notificações */}
        {activeTab === 'notifications' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Telegram
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Bot Token:</label>
                <input
                  type="text"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Chat ID:</label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="123456789"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <button
                onClick={testTelegram}
                disabled={testingTelegram}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {testingTelegram ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="w-4 h-4" /> Enviar Mensagem de Teste</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB: Recuperação */}
        {activeTab === 'recovery' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Configurações de Recuperação Automática
            </h3>

            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-400 mb-3 block">Tom de Voz:</label>
                <div className="flex gap-4">
                  {(['persuasivo', 'consultivo', 'cordial'] as const).map(tone => (
                    <button
                      key={tone}
                      onClick={() => setRecovery({ ...recovery, ai_tone: tone })}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${recovery.ai_tone === tone
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                    >
                      {tone.charAt(0).toUpperCase() + tone.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Aguardar antes de abordar (minutos):</label>
                  <input
                    type="number"
                    value={recovery.wait_time_minutes}
                    onChange={(e) => setRecovery({ ...recovery, wait_time_minutes: parseInt(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Máximo de tentativas:</label>
                  <input
                    type="number"
                    value={recovery.max_attempts}
                    onChange={(e) => setRecovery({ ...recovery, max_attempts: parseInt(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Intervalo entre tentativas (horas):</label>
                  <input
                    type="number"
                    value={recovery.retry_interval_hours}
                    onChange={(e) => setRecovery({ ...recovery, retry_interval_hours: parseInt(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Horário de funcionamento:</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={recovery.work_start_hour}
                      onChange={(e) => setRecovery({ ...recovery, work_start_hour: parseInt(e.target.value) })}
                      className="w-20 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    />
                    <span className="text-gray-400">às</span>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={recovery.work_end_hour}
                      onChange={(e) => setRecovery({ ...recovery, work_end_hour: parseInt(e.target.value) })}
                      className="w-20 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recovery.enabled}
                  onChange={(e) => setRecovery({ ...recovery, enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-white">Ativar recuperação automática</span>
              </label>
            </div>
          </div>
        )}

        {/* TAB: Descontos */}
        {activeTab === 'discounts' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Descontos para Recuperação
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Desconto padrão (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discounts.default_discount_percent}
                    onChange={(e) => setDiscounts({ ...discounts, default_discount_percent: parseInt(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Código do cupom:</label>
                  <input
                    type="text"
                    value={discounts.coupon_code}
                    onChange={(e) => setDiscounts({ ...discounts, coupon_code: e.target.value.toUpperCase() })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white uppercase"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Validade (horas):</label>
                  <input
                    type="number"
                    value={discounts.coupon_validity_hours}
                    onChange={(e) => setDiscounts({ ...discounts, coupon_validity_hours: parseInt(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={discounts.enabled}
                  onChange={(e) => setDiscounts({ ...discounts, enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-white">Incluir cupom nas mensagens de recuperação</span>
              </label>
            </div>
          </div>
        )}

        {/* TAB: Base de Conhecimento */}
        {activeTab === 'knowledge' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <button
                onClick={() => addKnowledgeItem('faq')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar FAQ
              </button>
              <button
                onClick={() => addKnowledgeItem('objection')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar Objeção
              </button>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">FAQs ({knowledge.filter(k => k.type === 'faq').length})</h4>
              <div className="space-y-3">
                {knowledge.filter(k => k.type === 'faq').map(item => (
                  <div key={item.id} className="flex items-start justify-between p-4 bg-gray-900 rounded-lg">
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.title}</p>
                      <p className="text-gray-400 text-sm mt-1">{item.content}</p>
                    </div>
                    <button
                      onClick={() => deleteKnowledgeItem(item.id)}
                      className="ml-4 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {knowledge.filter(k => k.type === 'faq').length === 0 && (
                  <p className="text-gray-500 text-center py-4">Nenhuma FAQ cadastrada</p>
                )}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Objeções Comuns ({knowledge.filter(k => k.type === 'objection').length})</h4>
              <div className="space-y-3">
                {knowledge.filter(k => k.type === 'objection').map(item => (
                  <div key={item.id} className="flex items-start justify-between p-4 bg-gray-900 rounded-lg">
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.title}</p>
                      <p className="text-gray-400 text-sm mt-1">{item.content}</p>
                    </div>
                    <button
                      onClick={() => deleteKnowledgeItem(item.id)}
                      className="ml-4 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {knowledge.filter(k => k.type === 'objection').length === 0 && (
                  <p className="text-gray-500 text-center py-4">Nenhuma objeção cadastrada</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}