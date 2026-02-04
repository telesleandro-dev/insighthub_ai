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
 * Determina o status de recuperação baseado no status da plataforma
 */
function determineRecoveryStatus(platformStatus: string, paymentMethod?: string): string {
    const statusLower = platformStatus.toLowerCase();

    // Leads IMEDIATAMENTE recuperáveis
    if (['abandoned', 'refused', 'rejected', 'expired', 'refunded', 'chargeback'].includes(statusLower)) {
        return 'eligible';
    }

    // Leads em ESPERA (PIX gerado, aguardando pagamento)
    if (['waiting_payment', 'pending'].includes(statusLower)) {
        return 'pending';
    }

    // Convertidos (pagos)
    if (['paid', 'approved', 'complete'].includes(statusLower)) {
        return 'converted';
    }

    // Padrão: aguardando (mais seguro que marcar como eligible)
    return 'pending';
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
        const { data: previousEvents } = await supabase
            .from('sales_events')
            .select('id')
            .eq('user_id', userId)
            .eq('customer_email', customerEmail)
            .eq('product_id', productId)
            .in('recovery_status', ['eligible', 'pending'])
            .order('created_at', { ascending: false });

        if (previousEvents && previousEvents.length > 0) {
            const ids = previousEvents.map(e => e.id);

            await supabase
                .from('sales_events')
                .update({
                    recovery_status: 'converted',
                    converted_at: new Date().toISOString()
                })
                .in('id', ids);

            console.log('🧹 [Auto-Limpeza] Convertidos', ids.length, 'eventos anteriores');
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
        // 1. PARSE DO PAYLOAD
        body = await req.json();
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

        // 4. LOG DE AUDITORIA (RECEBIDO)
        await supabase.from('webhooks_log').insert({
            platform: adapter.name,
            payload: body,
            status: 'received',
            user_id: userId
        });

        // 5. BUSCAR CONFIGURAÇÃO DO USUÁRIO
        const { data: userConfig, error: configError } = await supabase
            .from('user_configs')
            .select('user_id, telegram_token, telegram_chat_id')
            .eq('user_id', userId)
            .maybeSingle();

        if (configError) {
            console.error('[Webhook] Erro ao buscar configuração:', configError.message);
            return NextResponse.json({
                error: 'Erro no banco de dados',
                details: configError.message
            }, { status: 500 });
        }

        if (!userConfig) {
            console.warn('[Webhook] Usuário não encontrado:', userId);
            return NextResponse.json({ error: 'Usuário não localizado' }, { status: 401 });
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


        // 7. BUSCAR OU CRIAR PRODUTO
        let productRecord: any = null;

        // 7.1. Primeiro, tentar encontrar produto existente por external_id
        const { data: existingProduct } = await supabase
            .from('products')
            .select('*')
            .eq('external_id', normalizedData.productId)
            .eq('user_id', userConfig.user_id)
            .single();

        if (existingProduct) {
            productRecord = existingProduct;
            console.log('[Webhook] Produto encontrado por external_id:', productRecord.id);
        } else {
            // 7.2. Se não encontrou, buscar por nome similar (case-insensitive)
            const { data: productsByName } = await supabase
                .from('products')
                .select('*')
                .eq('user_id', userConfig.user_id)
                .ilike('name', `%${normalizedData.productName}%`);

            if (productsByName && productsByName.length > 0) {
                // Usar o primeiro produto encontrado com nome similar
                productRecord = productsByName[0];
                console.log('[Webhook] Produto encontrado por nome similar:', productRecord.id, productRecord.name);

                // Atualizar external_id do produto para sincronizar
                await supabase
                    .from('products')
                    .update({ external_id: normalizedData.productId })
                    .eq('id', productRecord.id);

                console.log('[Webhook] External_id atualizado para sincronizar');
            } else {
                // 7.3. Se não encontrou nenhum, criar novo produto
                const { data: newProduct, error: prodError } = await supabase
                    .from('products')
                    .insert({
                        external_id: normalizedData.productId,
                        name: normalizedData.productName,
                        user_id: userConfig.user_id,
                        platform: adapter.name
                    })
                    .select()
                    .single();

                if (prodError) {
                    console.error('[Webhook] Erro ao criar produto:', prodError.message);
                    throw prodError;
                }

                productRecord = newProduct;
                console.log('[Webhook] Novo produto criado:', productRecord.id);
            }
        }

        // 7.4. BUSCAR PREÇO DO PRODUTO SE AMOUNT = 0 (carrinho abandonado)
        let finalAmount = normalizedData.amount;
        if (finalAmount === 0 && productRecord.price) {
            console.log('[Webhook] Amount = 0, usando preço do produto:', productRecord.price);
            finalAmount = productRecord.price;
        }

        // 7.5. DETERMINAR STATUS DE RECUPERAÇÃO
        const recoveryStatus = determineRecoveryStatus(
            normalizedData.status,
            normalizedData.metadata?.payment_method
        );
        console.log('[Webhook] Recovery Status:', recoveryStatus);

        // 7.6. AUTO-LIMPEZA: Se lead pagou, converter eventos anteriores
        if (recoveryStatus === 'converted') {
            await cleanupPreviousEvents(
                userConfig.user_id,
                normalizedData.customerEmail,
                productRecord.id
            );
        }

        // 8. REGISTRAR EVENTO DE VENDA
        const { error: dbError } = await supabase.from('sales_events').insert({
            user_id: userConfig.user_id,
            product_id: productRecord.id,
            customer_name: normalizedData.customerName,
            customer_email: normalizedData.customerEmail,
            customer_phone: normalizedData.customerPhone || '',
            status: normalizedData.status,
            value: finalAmount,
            platform_origin: adapter.name,
            external_transaction_id: normalizedData.transactionId,
            platform_metadata: normalizedData.metadata || {},
            status_abordagem: 'pendente',
            recovery_status: recoveryStatus,  // ⬅️ NOVO!
            payment_method: normalizedData.metadata?.payment_method || null,  // ⬅️ NOVO!
            converted_at: recoveryStatus === 'converted' ? new Date().toISOString() : null  // ⬅️ NOVO!
        });


        if (dbError) {
            console.error('[Webhook] Erro ao registrar venda:', dbError.message);
            throw dbError;
        }

        console.log('[Webhook] Venda registrada com sucesso');


        // 9. ENVIAR NOTIFICAÇÃO TELEGRAM
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

        // 10. LOG DE SUCESSO
        await supabase.from('webhooks_log').insert({
            platform: adapter.name,
            payload: body,
            status: 'processed',
            user_id: userId
        });

        // 11. RESPOSTA DE SUCESSO
        return NextResponse.json({
            success: true,
            platform: adapter.name,
            transactionId: normalizedData.transactionId,
            message: 'Webhook processado com sucesso'
        }, { status: 200 });

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
