import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

export const dynamic = 'force-dynamic';

// 1. Definição ÚNICA e SEGURA do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// LOG DE SEGURANÇA (Aparecerá nos logs da Vercel)
if (!supabaseUrl || !supabaseKey) {
  console.error("ERRO CRÍTICO: Variáveis do Supabase não encontradas!");
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export async function POST(req: Request) {
  let body: any;
  let userIdFromUrl: string | null = null;

  try {
    body = await req.json();
    console.log('📦 Webhook Kiwify recebido:', JSON.stringify(body, null, 2));

    // 2. IDENTIFICAÇÃO DINÂMICA (A Solução Definitiva)
    const { searchParams } = new URL(req.url);
    userIdFromUrl = searchParams.get('user_id');

    console.log('🔑 user_id da URL:', userIdFromUrl);

    // Mantemos o log para auditoria caso precise debugar
    await supabase.from('webhooks_log').insert({
      platform: 'kiwify',
      payload: body,
      status: 'received',
      user_id: userIdFromUrl // Se sua tabela tiver essa coluna, ajuda muito
    });

    if (!userIdFromUrl) {
      console.error('❌ user_id ausente na URL');
      return NextResponse.json({ error: 'user_id ausente na URL' }, { status: 400 });
    }


    // 3. BUSCA CONFIGURAÇÃO (Garantindo formato UUID)
    const targetId = userIdFromUrl?.trim();

    // Log para conferir no painel da Vercel se o ID está chegando limpo
    console.log("🔍 Buscando UUID no banco:", targetId);

    const { data: userConfig, error: configError } = await supabase
      .from('user_configs')
      .select('user_id, telegram_token, telegram_chat_id')
      .eq('user_id', targetId)
      .maybeSingle();

    if (configError) {
      // Se houver erro de tipagem ou permissão, ele aparecerá aqui
      console.error("❌ Erro retornado pelo Supabase:", configError.message);
      return NextResponse.json({ error: 'Erro no banco de dados', details: configError.message }, { status: 500 });
    }

    if (!userConfig) {
      // Se não houver erro, mas não encontrar a linha
      console.warn("⚠️ Nenhum usuário encontrado com o UUID:", targetId);
      return NextResponse.json({ error: 'Usuário não localizado' }, { status: 401 });
    }

    // 4. NORMALIZAÇÃO DE DADOS
    const customer = body.Customer || body.customer || {};
    const productInfo = body.product || {};

    const customerData = {
      name: customer.full_name || body.name || 'Cliente Sem Nome',
      email: customer.email || body.email,
      mobile: customer.mobile || body.mobile || '',
      productName: body.product_name || productInfo.product_name || 'Produto Desconhecido',
      externalProductId: String(body.product_id || productInfo.product_id || '000'),
      status: body.status || body.order_status || 'waiting_payment',
      amount: (body.order_amount / 100) || body.amount || 0,
      externalTransactionId: body.order_id || body.transaction_id || body.id || null,
      cpf: customer.cpf || body.cpf || null
    };

    console.log('📊 Dados extraídos:', {
      productName: customerData.productName,
      externalProductId: customerData.externalProductId,
      customerEmail: customerData.email,
      status: customerData.status,
      amount: customerData.amount,
      externalTransactionId: customerData.externalTransactionId
    });

    if (!customerData.email) {
      console.error('❌ E-mail do cliente ausente');
      throw new Error('E-mail do cliente ausente');
    }

    // 5. UPSERT DO PRODUTO
    console.log('💾 Fazendo upsert do produto...');
    const { data: productRecord, error: prodError } = await supabase
      .from('products')
      .upsert({
        external_id: customerData.externalProductId,
        name: customerData.productName,
        user_id: userConfig.user_id,
        platform: 'kiwify'
      }, { onConflict: 'external_id, user_id' })
      .select()
      .single();

    if (prodError) {
      console.error('❌ Erro ao fazer upsert do produto:', prodError);
      throw prodError;
    }

    console.log('✅ Produto salvo/atualizado:', productRecord);

    // 5.1. BUSCAR PREÇO DO PRODUTO SE AMOUNT = 0 (carrinho abandonado)
    let finalAmount = customerData.amount;
    if (finalAmount === 0 && productRecord.price) {
      console.log('💰 Amount = 0, usando preço do produto cadastrado:', productRecord.price);
      finalAmount = productRecord.price;
    }

    // 6. VERIFICAR DUPLICAÇÃO (idempotência)
    console.log('🔍 Verificando duplicação...');

    // Verificar por external_transaction_id se disponível
    if (customerData.externalTransactionId) {
      const { data: existingByTxId } = await supabase
        .from('sales_events')
        .select('id')
        .eq('external_transaction_id', customerData.externalTransactionId)
        .maybeSingle();

      if (existingByTxId) {
        console.log('⚠️ Venda já existe (transaction_id):', customerData.externalTransactionId);
        return NextResponse.json({
          success: true,
          message: 'Webhook já processado (idempotente)',
          sale_id: existingByTxId.id
        }, { status: 200 });
      }
    }

    // Verificar por email + minuto (fallback se não tiver transaction_id)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: existingByEmail } = await supabase
      .from('sales_events')
      .select('id')
      .eq('customer_email', customerData.email)
      .eq('product_id', productRecord.id)
      .eq('status', customerData.status)
      .gte('created_at', oneMinuteAgo)
      .maybeSingle();

    if (existingByEmail) {
      console.log('⚠️ Venda duplicada detectada (mesmo email/produto/status no último minuto)');
      return NextResponse.json({
        success: true,
        message: 'Duplicate prevented',
        sale_id: existingByEmail.id
      }, { status: 200 });
    }

    // 7. REGISTRO DA VENDA
    console.log('💾 Registrando venda...');
    const { error: dbError } = await supabase.from('sales_events').insert({
      user_id: userConfig.user_id,
      product_id: productRecord.id,
      customer_name: customerData.name,
      customer_email: customerData.email,
      customer_phone: customerData.mobile,
      status: customerData.status,
      value: finalAmount,
      platform_origin: 'kiwify',
      external_transaction_id: customerData.externalTransactionId,
      platform_metadata: {
        cpf: customerData.cpf,
        raw_status: body.status,
        order_id: body.order_id,
        checkout_link: body.checkout_link
      }
    });

    if (dbError) {
      console.error('❌ Erro ao registrar venda:', dbError);
      throw dbError;
    }

    console.log('✅ Venda registrada com sucesso');

    // 7. NOTIFICAÇÃO TELEGRAM (NÃO BLOQUEIA RESPOSTA)
    if (userConfig.telegram_token && userConfig.telegram_chat_id) {
      console.log('📱 Tentando enviar notificação Telegram...');
      try {
        const userBot = new TelegramBot(userConfig.telegram_token);
        const isAbandonment = !['paid', 'approved'].includes(customerData.status);
        const msg = `🚀 *InsightHub AI*\\n\\n${isAbandonment ? '⚠️ *CARRINHO ABANDONADO*' : '✅ *VENDA APROVADA*'}\\n👤 *Cliente:* ${customerData.name}\\n💰 *Valor:* R$ ${customerData.amount.toFixed(2)}\\n📦 *Produto:* ${customerData.productName}`;

        await userBot.sendMessage(userConfig.telegram_chat_id, msg, {
          parse_mode: 'Markdown',
          reply_markup: isAbandonment && customerData.mobile ? {
            inline_keyboard: [[{
              text: '📱 Recuperar no WhatsApp',
              url: `https://wa.me/55${customerData.mobile.replace(/\D/g, '')}`
            }]]
          } : undefined
        });
        console.log('✅ Telegram enviado');
      } catch (telegramError: any) {
        // NÃO FALHA o webhook se Telegram der erro
        console.error('⚠️ Erro ao enviar Telegram (não crítico):', telegramError.message);
      }
    }

    // RESPOSTA DE SUCESSO SEMPRE
    console.log('✅ Webhook processado com sucesso');
    return NextResponse.json({
      success: true,
      product: {
        id: productRecord.id,
        name: customerData.productName,
        external_id: customerData.externalProductId
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Erro fatal no webhook:', error.message);
    await supabase.from('webhooks_log').insert({
      platform: 'kiwify',
      payload: body || {},
      status: 'error',
      error_message: error.message,
      user_id: userIdFromUrl
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}