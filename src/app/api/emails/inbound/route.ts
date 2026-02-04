/**
 * API Endpoint: Email Inbound via CloudMailin
 * 
 * CloudMailin: https://www.cloudmailin.com/
 * Recebe emails encaminhados e salva em inbox_messages
 * Análise de IA feita automaticamente com Gemini
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { analyzeEmail } from '@/lib/ai/emailAnalyzer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('CRITICAL: Supabase environment variables are missing!');
}

const supabase = createClient(supabaseUrl || '', serviceRoleKey || '');

/**
 * CloudMailin payload format (JSON)
 * Docs: https://docs.cloudmailin.com/http_post_formats/json/
 */
interface CloudMailinPayload {
    envelope: {
        from: string;
        to: string[];
        recipients: string[];
    };
    headers: {
        Subject: string;
        From: string;
        To: string;
        [key: string]: string;
    };
    plain?: string;
    html?: string;
}

export async function POST(req: NextRequest) {
    try {
        console.log('[Email Inbound CloudMailin] 📧 Webhook recebido');

        const payload: CloudMailinPayload = await req.json();

        const sender = payload.envelope.from;
        const recipient = payload.envelope.to[0];
        const subject = payload.headers.Subject || '(sem assunto)';
        const bodyText = payload.plain || payload.html?.replace(/<[^>]*>/g, '') || '';

        console.log('[Email Inbound] From:', sender);
        console.log('[Email Inbound] To:', recipient);
        console.log('[Email Inbound] Subject:', subject);

        // 1. IDENTIFICAR USUÁRIO pelo email CloudMailin
        const { data: emailConfig, error: configError } = await supabase
            .from('user_email_configs')
            .select('user_id, id')
            .eq('forwarding_email', recipient)
            .eq('is_active', true)
            .maybeSingle();

        if (configError || !emailConfig) {
            console.error('[Email Inbound] ❌ Email config não encontrado:', recipient);
            return NextResponse.json(
                { error: 'Email configuration not found. Please configure in Settings.' },
                { status: 404 }
            );
        }

        const userId = emailConfig.user_id;
        console.log('[Email Inbound] ✅ User ID:', userId);

        // 2. VERIFICAR DUPLICAÇÃO
        const { data: existing } = await supabase
            .from('inbox_messages')
            .select('id')
            .eq('user_id', userId)
            .eq('sender', sender)
            .eq('subject', subject)
            .gte('received_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
            .maybeSingle();

        if (existing) {
            console.log('[Email Inbound] ⚠️ Email duplicado ignorado');
            return NextResponse.json({ success: true, message: 'Duplicate email ignored' });
        }

        // 3. ANALISAR EMAIL COM IA (Gemini)
        console.log('[Email Inbound] 🤖 Iniciando análise com Gemini...');
        const analysis = await analyzeEmail(sender, subject, bodyText);
        console.log('[Email Inbound] ✅ Análise completa:', {
            sentimento: analysis.analise_sentimento,
            intencao: analysis.intencao,
            conversao: analysis.probabilidade_conversao
        });

        // 4. VINCULAR PRODUTO AUTOMATICAMENTE (via email do remetente)
        let productId = null;

        if (analysis.produto_identificado) {
            console.log('[Email Inbound] 🎯 Produto identificado pela IA:', analysis.produto_identificado);

            // Buscar produtos do usuário
            const { data: products } = await supabase
                .from('products')
                .select('id, name')
                .eq('user_id', userId);

            if (products && products.length > 0) {
                // Normalizar e buscar match
                const normalizeString = (str: string) =>
                    str.toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^\w\s]/g, '')
                        .trim();

                const searchTerm = normalizeString(analysis.produto_identificado);

                for (const product of products) {
                    const productName = normalizeString(product.name);
                    if (productName.includes(searchTerm) || searchTerm.includes(productName)) {
                        productId = product.id;
                        console.log('[Email Inbound] ✅ Produto vinculado:', product.name);
                        break;
                    }
                }
            }
        }

        // Se não identificou por nome, tenta por email em sales_events
        if (!productId) {
            const { data: salesEvent } = await supabase
                .from('sales_events')
                .select('product_id')
                .eq('customer_email', sender)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (salesEvent) {
                productId = salesEvent.product_id;
                console.log('[Email Inbound] ✅ Produto vinculado via histórico de vendas');
            }
        }

        // 5. SALVAR NO BANCO
        const { data: message, error: insertError } = await supabase
            .from('inbox_messages')
            .insert({
                user_id: userId,
                sender,
                subject,
                body_text: bodyText,
                analise_sentimento: analysis.analise_sentimento,
                intencao: analysis.intencao,
                resumo_executivo: analysis.resumo_executivo,
                dores_identificadas: analysis.dores_identificadas,
                probabilidade_conversao: analysis.probabilidade_conversao,
                sugestao_resposta: analysis.sugestao_resposta,
                produto_identificado: analysis.produto_identificado,
                product_id: productId,
                raw_analysis: analysis,
                processed: true,
                received_at: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) {
            console.error('[Email Inbound] ❌ Erro ao salvar:', insertError);
            throw insertError;
        }

        console.log('[Email Inbound] ✅ Email salvo:', message.id);

        // 6. ATUALIZAR ESTATÍSTICAS
        const { data: currentConfig } = await supabase
            .from('user_email_configs')
            .select('total_emails_received')
            .eq('id', emailConfig.id)
            .single();

        await supabase
            .from('user_email_configs')
            .update({
                total_emails_received: (currentConfig?.total_emails_received || 0) + 1,
                last_email_at: new Date().toISOString()
            })
            .eq('id', emailConfig.id);

        console.log('[Email Inbound] 🎉 Processamento completo!');

        return NextResponse.json({
            success: true,
            message_id: message.id,
            analysis: {
                sentimento: analysis.analise_sentimento,
                intencao: analysis.intencao,
                conversao: analysis.probabilidade_conversao
            }
        });

    } catch (error: any) {
        console.error('[Email Inbound] ❌ Erro fatal:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// Health check
export async function GET() {
    return NextResponse.json({
        status: 'online',
        service: 'cloudmailin-inbound',
        provider: 'CloudMailin',
        timestamp: new Date().toISOString()
    });
}
