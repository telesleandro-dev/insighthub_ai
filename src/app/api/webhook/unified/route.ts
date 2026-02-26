/**
 * Unified Webhook Handler
 * 
 * Webhook unificado que suporta múltiplas plataformas de pagamento.
 * Usa o sistema de adaptadores para detectar e processar automaticamente
 * webhooks de Kiwify, Hotmart, Eduzz, Monetizze e outras plataformas.
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { platformRegistry } from '@/lib/platforms/registry';
import { MissingDataError, InvalidSignatureError } from '@/lib/platforms/index';

export const dynamic = 'force-dynamic';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('[Webhook] ERRO CRÍTICO: Variáveis do Supabase não encontradas!');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');


/**
 * Motor de Inteligência: Calcula o score e define as tags de comportamento do lead.
 */
function calculateLeadScoreAndTags(
    currentProfile: any,
    newStatus: string,
    newProduct: string
): { score: number; tags: string[] } {
    let score = currentProfile?.lead_score || 0;
    let tags = currentProfile?.behavior_tags || [];
    const lastInteraction = currentProfile?.last_interaction_at ? new Date(currentProfile.last_interaction_at) : new Date();
    const now = new Date();

    // 1. TIME DECAY (Degradação por Tempo)
    // Se a última interação foi há mais de 30 dias, o score reseta para 20 (base fria)
    const diffDays = Math.floor((now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
        score = Math.min(score, 20);
    } else if (diffDays > 7) {
        score = Math.floor(score * 0.7); // Reduz 30% se mais de uma semana
    }

    // 2. LÓGICA DE STATUS
    const statusLower = newStatus.toLowerCase();

    if (['waiting_payment', 'refused', 'rejected', 'expired'].includes(statusLower)) {
        score += 40; // Tentativa ou Erro Técnico
        if (['refused', 'rejected'].includes(statusLower)) {
            if (!tags.includes('ERRO_TECNICO')) tags.push('ERRO_TECNICO');
        }
    } else if (statusLower === 'abandoned') {
        score += 20; // Abandono
    } else if (['paid', 'approved', 'complete'].includes(statusLower)) {
        score = 0; // Comprou = Score Zero (resolvido)
        tags = tags.filter((t: string) => t !== 'ERRO_TECNICO' && t !== 'REINCIDENTE');
        if (!tags.includes('CLIENTE_CONVERTIDO')) tags.push('CLIENTE_CONVERTIDO');
    }

    // 3. RECORRÊNCIA E MULTIFILIAL
    const totalEvents = (currentProfile?.total_events || 0) + 1;
    if (totalEvents > 1 && !tags.includes('REINCIDENTE')) {
        tags.push('REINCIDENTE');
    }

    // Verifica interações em dias diferentes (+30 pontos)
    if (diffDays >= 1 && diffDays <= 30) {
        score += 30;
    }

    // Multifilial: Verifica se o produto é novo no histórico
    const productHistory = currentProfile?.product_history || [];
    if (newProduct && !productHistory.includes(newProduct)) {
        if (productHistory.length > 0 && !tags.includes('MULTIFILIAL')) {
            tags.push('MULTIFILIAL');
        }
    }

    // Limites de Score
    score = Math.max(0, Math.min(100, score));

    return { score, tags };
}

/**
 * Auto-limpeza: Remove/atualiza eventos anteriores quando lead pagar
 */
async function cleanupPreviousEvents(
    userId: string,
    customerEmail: string,
    productId: string
): Promise<void> {
    try {
        console.log(`🧹 [Auto-Limpeza] Buscando eventos para User: ${userId}, Email: ${customerEmail}`);

        const { data: previousEvents } = await supabase
            .from('sales_events')
            .select('id, recovery_status')
            .eq('user_id', userId)
            .eq('customer_email', customerEmail)
            .in('recovery_status', ['eligible', 'pending'])
            .order('created_at', { ascending: false });

        console.log(`🧹 [Auto-Limpeza] Encontrados: ${previousEvents?.length || 0} eventos anteriores.`);

        if (previousEvents && previousEvents.length > 0) {
            const ids = previousEvents.map(e => e.id);
            console.log(`🧹 [Auto-Limpeza] IDs a converter:`, ids);

            const { error: updateError } = await supabase
                .from('sales_events')
                .update({
                    recovery_status: 'cleared', // Alterado de 'converted' para evitar somas duplicadas (ROI Puro)
                    status_abordagem: 'recuperado', // Remove do pipeline "Dinheiro na Mesa" do Dashboard
                    converted_at: new Date().toISOString()
                })
                .in('id', ids);

            if (updateError) {
                console.error('❌ [Auto-Limpeza] Erro ao atualizar:', updateError.message);
            } else {
                console.log('✅ [Auto-Limpeza] Sucesso ao marcar como recuperado.');
            }
        }
    } catch (error: any) {
        console.error('[Auto-Limpeza] Erro:', error.message);
    }
}

/**
 * Retorna mensagem descritiva baseada no status
 */
function getStatusMessage(status: string, paymentMethod?: string): { emoji: string; text: string } {
    const statusLower = status.toLowerCase();

    const statusMap: Record<string, { emoji: string; text: string }> = {
        'abandoned': { emoji: '⚠️', text: 'CARRINHO ABANDONADO' },
        'waiting_payment': {
            emoji: paymentMethod === 'pix' ? '⏳' : '⏳',
            text: paymentMethod === 'pix' ? 'PIX GERADO' : 'AGUARDANDO PAGAMENTO'
        },
        'pending': { emoji: '⏳', text: 'PAGAMENTO PENDENTE' },
        'refused': { emoji: '❌', text: 'PAGAMENTO RECUSADO' },
        'rejected': { emoji: '❌', text: 'PAGAMENTO REJEITADO' },
        'expired': { emoji: '⏰', text: 'PIX EXPIRADO' },
        'paid': { emoji: '✅', text: 'VENDA APROVADA' },
        'approved': { emoji: '✅', text: 'VENDA APROVADA' },
        'complete': { emoji: '✅', text: 'VENDA CONCLUÍDA' },
        'refunded': { emoji: '↩️', text: 'VENDA ESTORNADA' },
        'chargeback': { emoji: '⚠️', text: 'CHARGEBACK' }
    };

    return statusMap[statusLower] || { emoji: '📌', text: 'NOVO EVENTO' };
}


/**
 * Handler POST para webhooks de todas as plataformas
 */
export async function POST(req: Request) {
    let body: any;
    let detectedPlatform: string = 'unknown';

    try {
        // 1. PARSE DO PAYLOAD COM PROTEÇÃO
        try {
            body = await req.json();
        } catch (parseError: any) {
            console.error('[Webhook] ❌ Erro ao parsear JSON no webhook:', parseError.message);
            return NextResponse.json(
                {
                    error: 'Invalid JSON',
                    message: 'The request body must be a valid JSON',
                    details: parseError.message
                },
                { status: 400 }
            );
        }

        if (!body || Object.keys(body).length === 0) {
            console.error('[Webhook] ❌ Payload vazio recebido');
            return NextResponse.json({ error: 'Payload vazio' }, { status: 400 });
        }

        console.log('[Webhook] Payload recebido:', JSON.stringify(body).substring(0, 200) + '...');

        // 2. EXTRAÇÃO DO USER_ID
        const { searchParams } = new URL(req.url);
        const userIdFromUrl = searchParams.get('user_id');

        if (!userIdFromUrl) {
            console.error('[Webhook] user_id ausente na URL');
            return NextResponse.json({ error: 'user_id ausente na URL' }, { status: 400 });
        }

        const userId = userIdFromUrl.trim();
        console.log('[Webhook] User ID:', userId);

        // 📌 VALIDAÇÃO DE API KEY (Segurança para N8n e Integrações Externas)
        // Aceita via header OU via query parameter (para compatibilidade com n8n)
        const apiKey = req.headers.get('x-api-key') || searchParams.get('api_key');
        const systemSecret = process.env.WEBHOOK_SECRET;

        if (!apiKey) {
            console.error('[Webhook] ❌ API Key ausente. Use header x-api-key ou query param api_key.');
            return NextResponse.json(
                {
                    error: 'Missing API Key',
                    message: 'Include x-api-key header or api_key query parameter for authentication',
                    documentation: 'https://github.com/telesleandro-dev/insighthub_ai#webhook-authentication'
                },
                { status: 401 }
            );
        }

        // VERIFICAÇÃO 1: Master Key (WEBHOOK_SECRET do .env)
        const isMasterKey = systemSecret && apiKey.trim() === systemSecret.trim();

        if (isMasterKey) {
            console.log('[Webhook] ✅ Autenticado via Master Key (WEBHOOK_SECRET)');
        } else {
            console.log(`[Webhook] [DEBUG] Master Key mismatch: Header size: ${apiKey.trim().length}, Env size: ${systemSecret?.trim().length}`);
            // VERIFICAÇÃO 2: Validar API Key no banco de dados
            const { data: apiKeyConfig, error: apiConfigError } = await supabase
                .from('user_configs')
                .select('user_id, id')
                .eq('api_key', apiKey)
                .maybeSingle();

            if (apiConfigError || !apiKeyConfig) {
                const maskedKey = apiKey.substring(0, 10) + '...';
                console.error('[Webhook] ❌ API Key inválida:', maskedKey);

                return NextResponse.json(
                    {
                        error: 'Invalid API Key',
                        message: 'The provided API key is not valid or has been revoked',
                        hint: 'Generate a new API key in Settings > Integrations or use the system WEBHOOK_SECRET'
                    },
                    { status: 401 }
                );
            }

            // Verificar se o user_id da URL corresponde ao da API Key
            if (apiKeyConfig.user_id !== userId) {
                console.error('[Webhook] ❌ user_id não corresponde à API Key');
                return NextResponse.json(
                    {
                        error: 'User ID Mismatch',
                        message: 'The user_id in URL does not match the API key owner'
                    },
                    { status: 403 }
                );
            }

            console.log('[Webhook] ✅ Autenticado via User API Key para user:', userId);
        }

        // Debug Service Key
        const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
        console.log('[Webhook] Service Key Present:', hasServiceKey);

        // 3. DETECÇÃO AUTOMÁTICA DA PLATAFORMA
        const adapter = platformRegistry.detect(body);

        if (!adapter) {
            console.error('[Webhook] Plataforma não reconhecida');

            // Log do webhook não reconhecido
            await supabase.from('webhooks_log').insert({
                platform: 'unknown',
                payload: body,
                status: 'error',
                error_message: 'Plataforma não reconhecida',
                user_id: userId
            });

            return NextResponse.json({
                error: 'Plataforma não suportada',
                supportedPlatforms: platformRegistry.getAllNames()
            }, { status: 400 });
        }

        detectedPlatform = adapter.name;
        console.log(`[Webhook] Plataforma detectada: ${adapter.displayName}`);

        // 3.1. VALIDAÇÃO ESPECÍFICA PARA INSIGHTHUB ADAPTER
        if (adapter.name === 'insighthub') {
            const apiKey = req.headers.get('x-api-key');
            // Para simplificar, usamos o WEBHOOK_SECRET do sistema como chave padrão
            const systemSecret = process.env.WEBHOOK_SECRET;

            if (process.env.NODE_ENV !== 'development' && systemSecret && apiKey !== systemSecret) {
                console.error('[Webhook] API Key inválida para InsightHubAdapter');
                return NextResponse.json({ error: 'API Key inválida' }, { status: 401 });
            } else if (process.env.NODE_ENV === 'development' && systemSecret && apiKey !== systemSecret) {
                console.warn('[Webhook] OBS: API Key ignorada em ambiente de desenvolvimento.');
            }
        }

        // 4. LOG DE AUDITORIA (RECEBIDO)
        await supabase.from('webhooks_log').insert({
            platform: adapter.name,
            payload: body,
            status: 'received',
            user_id: userId
        });

        // 5. BUSCAR CONFIGURAÇÃO DO USUÁRIO
        // Bypass Auth for Testing (Temporary Debug)
        let userAuthData: any = null;
        let bypass = false;

        if (userId === 'bypass_auth_999') {
            console.log('[Webhook] Bypass Auth Activated');
            bypass = true;
            userAuthData = { user: { id: 'dfe126ac-0bb0-46d9-9d4a-938a22044a4f', email: 'test_setup@insighthub.ai' } };
        } else if (isMasterKey) {
            console.log('[Webhook] 🛠️ Master Key bypass: Usando ID da URL diretamente');
            userAuthData = { user: { id: userId, email: 'system-master@insighthub.ai' } };
        } else {
            console.log('[Webhook] [DEBUG] Searching for user ID:', userId);
            const { data, error: authErr } = await supabase.auth.admin.getUserById(userId);
            if (authErr) console.error('[Webhook] [DEBUG] Auth Admin Error:', authErr.message);
            userAuthData = data;
        }

        if (!userAuthData || !userAuthData.user) {
            console.error('[Webhook] Usuário não localizado no Auth', userId);
            return NextResponse.json({
                error: 'Usuário não localizado (Debug)',
                receivedId: userId,
                debug: { isMasterKey },
                details: 'ID invalido ou não encontrado no Auth.'
            }, { status: 400 });
        }

        // If bypass, use the hardcoded ID for logic
        const effectiveUserId = bypass ? userAuthData.user.id : userId;

        const { data: dbUserConfig, error: configError } = await supabase
            .from('user_configs')
            .select('user_id, telegram_token, telegram_chat_id')
            .eq('user_id', effectiveUserId)
            .maybeSingle();

        if (configError) {
            console.error('[Webhook] Erro ao buscar configuração:', configError.message);
            return NextResponse.json({
                error: 'Erro no banco de dados',
                details: configError.message
            }, { status: 500 });
        }

        let userConfig = dbUserConfig;

        if (!userConfig && isMasterKey) {
            console.log('[Webhook] 🛠️ Master Key fallback: Criando configuração temporária em memória');
            userConfig = {
                user_id: effectiveUserId,
                telegram_token: null,
                telegram_chat_id: null
            };
        }

        if (!userConfig) {
            console.warn('[Webhook] Usuário não encontrado:', userId);
            return NextResponse.json({
                error: 'Usuário não localizado',
                debug: {
                    isMasterKey,
                    apiKeySize: apiKey?.trim().length,
                    systemSecretSize: systemSecret?.trim().length,
                    match: apiKey?.trim() === (systemSecret || '').trim()
                }
            }, { status: 401 });
        }

        // 6. NORMALIZAR DADOS DO WEBHOOK
        let normalizedData;
        try {
            normalizedData = adapter.normalizeData(body);
            console.log('[Webhook] Dados normalizados:', {
                customer: normalizedData.customerName,
                product: normalizedData.productName,
                amount: normalizedData.amount,
                status: normalizedData.status
            });
        } catch (error) {
            if (error instanceof MissingDataError) {
                console.error('[Webhook] Dados obrigatórios ausentes:', error.message);
                return NextResponse.json({ error: error.message }, { status: 400 });
            }
            throw error;
        }



        const statusLower = normalizedData.status.toLowerCase();

        // --- LÓGICA DE DECISÃO (GATEKEEPER) ---

        // 1. BUSCAR PERFIL EXISTENTE (case-insensitive para evitar falhas por capitalização do email)
        const normalizedEmail = (normalizedData.customerEmail || '').trim().toLowerCase();
        console.log(`[Webhook] Buscando perfil para user: ${userConfig.user_id}, email: ${normalizedEmail}`);
        const { data: currentProfile } = await supabase
            .from('leads_profiles')
            .select('*')
            .eq('user_id', userConfig.user_id)
            .ilike('email', normalizedEmail)
            .maybeSingle();

        // 2. EVENTO DE SUCESSO (PAID / APPROVED)
        if (['paid', 'approved', 'complete'].includes(statusLower)) {
            if (!currentProfile) {
                console.log('[Webhook] Venda Direta (Lead Inexistente) - Ignorado de propósito.');
                // Log de sucesso diferenciado para auditoria
                await supabase.from('webhooks_log').insert({
                    platform: adapter.name,
                    payload: { ...body, result_type: 'direct_sale_new_lead_ignored' },
                    status: 'processed',
                    user_id: userId
                });
                return NextResponse.json({ success: true, message: 'Venda Direta ignorada' });
            }

            // Lead Existe: Re-buscar para garantir status mais recente (evitar race condition)
            const { data: freshProfile } = await supabase
                .from('leads_profiles')
                .select('*')
                .eq('id', currentProfile.id)
                .single();

            const profileToCheck = freshProfile || currentProfile;

            console.log(`[Webhook] Verificando ROI para: ${profileToCheck.email} | Status Atual: ${profileToCheck.service_status}`);

            // Verificar se é ROI válido (Case insensitive)
            // Agora aceita tanto 'contacted' quanto 'processed' (IA já rodou)
            const checkIsRecovery = (p: any) => {
                const status = (p?.service_status || '').toLowerCase();
                return ['contacted', 'processed'].includes(status);
            };

            const isRoiValid = checkIsRecovery(profileToCheck);

            // LOG DE DIAGNÓSTICO (Arquivo Local)
            try {
                const fs = require('fs');
                const logMsg = `[${new Date().toISOString()}] Email: ${profileToCheck.email} | ServiceStatus: ${profileToCheck.service_status} | ROI Valid: ${isRoiValid}\n`;
                fs.appendFileSync('webhook_debug.log', logMsg);
            } catch (e) { console.error('Logged file error', e); }

            // LOG DE DIAGNÓSTICO (Crucial para entender falhas de ROI)
            console.log(`[Webhook ROI Debug] Lead: ${profileToCheck.email}, ServiceStatus: ${profileToCheck.service_status}, ROI_Valid: ${isRoiValid}`);

            // Tenta registrar log de diagnóstico (se falhar não trava o webhook)
            await supabase.from('webhooks_log').insert({
                platform: adapter.name,
                payload: { event: 'roi_check', status_db: profileToCheck.service_status, roi_valid: isRoiValid },
                status: 'processing',
                user_id: userConfig.user_id
            }).then(({ error }) => { if (error) console.error('Erro Log Debug:', error.message) });

            // Auto-limpeza: Marcar eventos de falha anteriores como 'cleared'
            await cleanupPreviousEvents(
                userConfig.user_id,
                normalizedData.customerEmail,
                normalizedData.productId
            );

            // Determinar novo status do perfil
            const newServiceStatus = isRoiValid ? 'converted' : 'direct_sale';

            // 1. Atualizar Perfil de Lead
            const { data: updatedRows, error: profileUpdateError } = await supabase
                .from('leads_profiles')
                .update({
                    service_status: newServiceStatus,
                    lead_score: 0,
                    last_event_type: normalizedData.status,
                    last_interaction_at: new Date().toISOString(),
                    converted_value: normalizedData.amount,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentProfile.id)
                .select('id, service_status, email');

            if (profileUpdateError) {
                console.error('[Webhook] ❌ ERRO CRÍTICO ao atualizar perfil:', profileUpdateError.message, '| Code:', profileUpdateError.code);
                try {
                    const fs = require('fs');
                    fs.appendFileSync('webhook_debug.log', `[CRITICAL UPDATE ERROR] ${new Date().toISOString()} | ID: ${currentProfile.id} | Error: ${profileUpdateError.message}\n`);
                } catch (e) { }
            } else {
                console.log(`[Webhook] ✅ Perfil atualizado: ${updatedRows?.length ?? 0} row(s) | Status: ${newServiceStatus} | ID: ${currentProfile.id}`);
                if (!updatedRows || updatedRows.length === 0) {
                    console.error('[Webhook] ⚠️ UPDATE não afetou nenhuma row! Verificar se o ID existe:', currentProfile.id);
                    try {
                        const fs = require('fs');
                        fs.appendFileSync('webhook_debug.log', `[WARNING NO ROWS UPDATED] ${new Date().toISOString()} | ID: ${currentProfile.id} | Status pretendido: ${newServiceStatus}\n`);
                    } catch (e) { }
                }
            }

            // 2. Registrar Evento de Venda (Sempre registra para histórico, mas ROI depende do recovery_status)
            const { error: eventError } = await supabase.from('sales_events').insert({
                user_id: userConfig.user_id,
                lead_profile_id: currentProfile.id,
                product_name: normalizedData.productName,
                external_product_id: normalizedData.productId,
                customer_email: normalizedData.customerEmail,
                customer_name: normalizedData.customerName,
                customer_phone: normalizedData.customerPhone || '',
                status: normalizedData.status,
                value: normalizedData.amount,
                platform_origin: adapter.name,
                external_transaction_id: normalizedData.transactionId,
                status_abordagem: isRoiValid ? 'recuperado' : 'organico',
                recovery_status: isRoiValid ? 'converted' : 'organic', // 'converted' soma no ROI, 'organic' não.
                converted_at: new Date().toISOString(),
                payment_method: normalizedData.metadata?.payment_method,
                lead_source: normalizedData.leadSource || null,
                lead_tags: currentProfile.behavior_tags,
                lead_notes: normalizedData.leadNotes || null
            });

            if (eventError) {
                try {
                    const fs = require('fs');
                    fs.appendFileSync('webhook_debug.log', `[ERROR] Sales Event Insert Failed: ${eventError.message}\n`);
                } catch (e) { console.error('Logged file error', e); }

                console.error('[Webhook] Erro ao registrar evento de venda:', eventError.message);
                // Log de erro específico
                await supabase.from('webhooks_log').insert({
                    platform: adapter.name,
                    payload: { ...body, error_context: 'sales_event_insert_failed' },
                    status: 'error',
                    error_message: eventError.message,
                    user_id: userId
                });
            }

            // Log de processamento com sucesso
            await supabase.from('webhooks_log').insert({
                platform: adapter.name,
                payload: {
                    ...body,
                    result_type: isRoiValid ? 'recovered_sale_roi' : 'organic_sale_known_lead',
                    roi_valid: isRoiValid
                },
                status: 'processed',
                user_id: userId
            });

            console.log(`[Webhook] Venda processada: ${isRoiValid ? 'ROI Recuperado' : 'Orgânica'}`);
            return NextResponse.json({
                success: true,
                message: isRoiValid ? 'Venda Recuperada processada' : 'Venda Orgânica processada'
            });
        }

        // 3. EVENTO DE LIMBO (WAITING_PAYMENT)
        if (['waiting_payment', 'pending'].includes(statusLower)) {
            if (!currentProfile) {
                console.log('[Webhook] Novo Boleto/Pix (Lead Inexistente) - Ignorado (Limbo).');
                // Log de sucesso
                await supabase.from('webhooks_log').insert({
                    platform: adapter.name,
                    payload: { ...body, result_type: 'limbo_new_lead_ignored' },
                    status: 'processed',
                    user_id: userId
                });
                return NextResponse.json({ success: true, message: 'Limbo ignorado' });
            }

            // Lead Existe: Atualizar timestamp mas manter status (invisível na lista se não for falha)
            const { error: profileUpdateError } = await supabase.from('leads_profiles').update({
                last_interaction_at: new Date().toISOString(),
                last_platform: adapter.displayName,
                updated_at: new Date().toISOString()
            }).eq('id', currentProfile.id);

            if (profileUpdateError) {
                console.error('[Webhook] Erro ao atualizar perfil de lead em limbo:', profileUpdateError.message);
            }

            // Log de sucesso
            await supabase.from('webhooks_log').insert({
                platform: adapter.name,
                payload: { ...body, result_type: 'limbo_known_lead_updated' },
                status: 'processed',
                user_id: userId
            });
            return NextResponse.json({ success: true, message: 'Lead em Limbo atualizado (sem mudança de status)' });
        }

        // 4. EVENTOS DE FALHA (ABANDONED, REFUSED, EXPIRED)
        // Upsert Profile e colocar na lista (Pending)

        // Calcular Score (Simplificado ou manter a chamada anterior)
        const intelligence = calculateLeadScoreAndTags(
            currentProfile,
            normalizedData.status,
            normalizedData.productName
        );

        let serviceStatus = 'pending';

        // Se já estava sendo atendido pelo Humano (Contacted), manter status para não quebrar fluxo
        if (currentProfile?.service_status === 'contacted') {
            serviceStatus = 'contacted';
        }
        // Se era 'processed' (IA já viu) mas chegou nova falha e não foi contatado, volta para pending 
        // para o n8n re-analisar o contexto completo (opcional, mantemos pending por padrão do Modo Sniper)

        const productHistory = currentProfile?.product_history || [];
        if (normalizedData.productName && !productHistory.includes(normalizedData.productName)) {
            productHistory.push(normalizedData.productName);
        }

        // 8. VERIFICAR SE JÁ EXISTE EVENTO COM MESMO external_transaction_id
        if (normalizedData.transactionId) {
            const { data: existingEvent } = await supabase
                .from('sales_events')
                .select('id, created_at')
                .eq('external_transaction_id', normalizedData.transactionId)
                .eq('user_id', userConfig.user_id)
                .maybeSingle();

            if (existingEvent) {
                console.log('[Webhook] ⚠️ WEBHOOK DUPLICADO IGNORADO!');
                // Log de sucesso
                await supabase.from('webhooks_log').insert({
                    platform: adapter.name,
                    payload: { ...body, result_type: 'duplicate_webhook_ignored' },
                    status: 'processed',
                    user_id: userId
                });
                return NextResponse.json({
                    success: true,
                    message: 'Webhook duplicado ignorado',
                    existing_event_id: existingEvent.id
                });
            }
        }

        // Upsert do perfil do lead com incremento de total_events
        // NOTA: Para atomicidade total sob concorrência extrema, migrar para RPC SQL (ver migration 020)
        const { data: leadProfile, error: profileError } = await supabase
            .from('leads_profiles')
            .upsert({
                user_id: userConfig.user_id,
                email: normalizedData.customerEmail,
                name: normalizedData.customerName,
                phone: normalizedData.customerPhone,
                total_events: (currentProfile?.total_events || 0) + 1,
                lead_score: intelligence.score,
                behavior_tags: intelligence.tags,
                product_history: productHistory,
                last_event_type: normalizedData.status,
                last_interaction_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                potential_value: normalizedData.amount,
                converted_value: 0,
                service_status: serviceStatus,
                lead_summary: normalizedData.leadSummary || body.lead_summary || body.analise || body.dossie || currentProfile?.lead_summary || null,
                last_platform: adapter.displayName
            }, { onConflict: 'user_id,email' })
            .select()
            .single();

        if (profileError) {
            console.error('[Webhook] Erro upsert perfil:', profileError);
            // Log error but try to convert to event
            await supabase.from('webhooks_log').insert({
                platform: adapter.name,
                payload: { ...body, error_context: 'profile_upsert_failed' },
                status: 'error',
                error_message: `Profile Error: ${profileError.message}`,
                user_id: userId
            });
        }

        // Registrar Evento de Falha (Para Timeline)
        const { error: dbError } = await supabase.from('sales_events').insert({
            user_id: userConfig.user_id,
            lead_profile_id: leadProfile?.id,
            product_name: normalizedData.productName,
            external_product_id: normalizedData.productId,
            customer_email: normalizedData.customerEmail,
            customer_name: normalizedData.customerName,
            customer_phone: normalizedData.customerPhone || '',
            status: normalizedData.status,
            value: normalizedData.amount,
            platform_origin: adapter.name,
            external_transaction_id: normalizedData.transactionId,
            status_abordagem: 'pendente',
            recovery_status: 'eligible',
            payment_method: normalizedData.metadata?.payment_method,
            lead_source: normalizedData.leadSource || null,
            lead_tags: intelligence.tags,
            lead_notes: normalizedData.leadNotes || null
        });

        if (dbError) {
            console.error('[Webhook] Erro ao registrar evento de falha:', dbError.message);
            // Log de erro
            await supabase.from('webhooks_log').insert({
                platform: adapter.name,
                payload: { ...body, error_context: 'sales_event_insert_failed' },
                status: 'error',
                error_message: `Sales Event Error: ${dbError.message}`,
                user_id: userId
            });
        } else {
            console.log('[Webhook] Evento de falha registrado com sucesso.');
        }

        // Notificação Telegram
        if (userConfig.telegram_token && userConfig.telegram_chat_id) {
            try {
                const userBot = new TelegramBot(userConfig.telegram_token);

                // Obter mensagem descritiva baseada no status
                const statusInfo = getStatusMessage(normalizedData.status, normalizedData.metadata?.payment_method);

                const message = `🚀 *InsightHub AI*\n\n${statusInfo.emoji} *${statusInfo.text}*\n\n👤 *Cliente:* ${normalizedData.customerName}\n💰 *Valor:* R$ ${normalizedData.amount.toFixed(2)}\n📦 *Produto:* ${normalizedData.productName}\n🏷️ *Plataforma:* ${adapter.displayName.toUpperCase()}`;

                const options: any = {
                    parse_mode: 'Markdown'
                };

                // Adiciona botão de WhatsApp se for abandono/recusa e tiver telefone
                const shouldShowWhatsApp = ['abandoned', 'refused', 'rejected', 'expired'].includes(normalizedData.status.toLowerCase());
                if (shouldShowWhatsApp && normalizedData.customerPhone) {
                    const phoneClean = normalizedData.customerPhone.replace(/\D/g, '');
                    options.reply_markup = {
                        inline_keyboard: [[{
                            text: '📱 Recuperar no WhatsApp',
                            url: `https://wa.me/55${phoneClean}`
                        }]]
                    };
                }

                await userBot.sendMessage(userConfig.telegram_chat_id, message, options);
                console.log('[Webhook] Notificação Telegram enviada');
            } catch (telegramError: any) {
                console.error('[Webhook] Erro ao enviar Telegram:', telegramError.message);
                // Não falha o webhook se o Telegram falhar
            }
        }

        // Log de sucesso para eventos de falha
        await supabase.from('webhooks_log').insert({
            platform: adapter.name,
            payload: body,
            status: 'processed',
            user_id: userId
        });

        return NextResponse.json({
            success: true,
            transactionId: normalizedData.transactionId,
            message: 'Falha registrada. Lead na lista de recuperação.'
        });



    } catch (error: any) {
        console.error('[Webhook] Erro ao processar:', error);

        // Log de erro
        await supabase.from('webhooks_log').insert({
            platform: detectedPlatform,
            payload: body || {},
            status: 'error',
            error_message: error.message || 'Erro desconhecido'
        });

        return NextResponse.json({
            error: 'Erro ao processar webhook',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * Handler GET para verificar status do webhook
 */
export async function GET(req: Request) {
    const platforms = platformRegistry.getPlatformInfo();

    return NextResponse.json({
        status: 'online',
        version: '2.0.0',
        supportedPlatforms: platforms,
        totalPlatforms: platformRegistry.count
    });
}
