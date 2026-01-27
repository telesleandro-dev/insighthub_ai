import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

export const dynamic = 'force-dynamic';

// 1. Definição ÚNICA e SEGURA do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  // 1. Definimos o body FORA do try para o catch conseguir enxergá-lo
  let body: any;

  try {
    body = await req.json();

    // 2. Captura o token tanto pela URL quanto pelo Header
    const { searchParams } = new URL(req.url);
  const secret = 
  searchParams.get('token') || 
  searchParams.get('signature') || // Adicionado para capturar o que aparece no seu log
  req.headers.get('x-hub-token');

console.log("Secret identificado:", secret); // Adicione este log para conferir na Vercel

    // 3. AUDITORIA: Salva o payload bruto imediatamente
    await supabase.from('webhooks_log').insert({
      platform: 'kiwify',
      payload: body,
      status: 'received'
    });

    // ... restante do seu código (Identificação do usuário, etc)
    // 1. AUDITORIA: Salva o payload bruto imediatamente
    await supabase.from('webhooks_log').insert({
      platform: 'kiwify',
      payload: body,
      status: 'received'
    });

    // 2. IDENTIFICAÇÃO DO USUÁRIO
    const { data: userConfig, error: configError } = await supabase
      .from('user_configs')
      .select('user_id, telegram_token, telegram_chat_id')
      .eq('webhook_secret', secret)
      .single();

    if (configError || !userConfig) {
      return NextResponse.json({ error: 'Secret inválido' }, { status: 401 });
    }

    // 3. NORMALIZAÇÃO DE DADOS
    const customer = body.Customer || body.customer || {};
    const productInfo = body.product || {};
    
    const customerData = {
      name: customer.full_name || body.name || 'Cliente Sem Nome',
      email: customer.email || body.email,
      mobile: customer.mobile || body.mobile || '',
      productName: body.product_name || productInfo.product_name || 'Produto Desconhecido',
      externalProductId: body.product_id || productInfo.product_id || '000',
      status: body.status || body.order_status || 'waiting_payment',
      amount: (body.order_amount / 100) || body.amount || 0
    };

    if (!customerData.email) throw new Error('E-mail do cliente ausente');

    // 4. UPSERT DO PRODUTO (Garante unicidade pelo external_id + user_id)
    const { data: productRecord, error: prodError } = await supabase
      .from('products')
      .upsert({ 
        external_id: customerData.externalProductId,
        name: customerData.productName, 
        user_id: userConfig.user_id,
        platform: 'kiwify' 
      }, { onConflict: 'external_id, user_id' }) // Exige o Índice Único que sugeri
      .select()
      .single();

    if (prodError) throw prodError;

    // 5. REGISTRO DA VENDA
    const { error: dbError } = await supabase.from('sales_events').insert({
      user_id: userConfig.user_id,
      product_id: productRecord.id,
      customer_name: customerData.name,
      customer_email: customerData.email,
      customer_phone: customerData.mobile,
      status: customerData.status,
      value: customerData.amount,
      platform_origin: 'kiwify'
    });

    if (dbError) throw dbError;

    // 6. NOTIFICAÇÃO TELEGRAM
    if (userConfig.telegram_token && userConfig.telegram_chat_id) {
        const userBot = new TelegramBot(userConfig.telegram_token);
        const isAbandonment = !['paid', 'approved'].includes(customerData.status);
        const msg = `🚀 *InsightHub AI*\n\n${isAbandonment ? '⚠️ *CARRINHO ABANDONADO*' : '✅ *VENDA APROVADA*'}\n👤 *Cliente:* ${customerData.name}\n💰 *Valor:* R$ ${customerData.amount.toFixed(2)}\n📦 *Produto:* ${customerData.productName}`;

        await userBot.sendMessage(userConfig.telegram_chat_id, msg, {
          parse_mode: 'Markdown',
          reply_markup: isAbandonment && customerData.mobile ? {
            inline_keyboard: [[{ 
              text: '📱 Recuperar no WhatsApp', 
              url: `https://wa.me/55${customerData.mobile.replace(/\D/g, '')}` 
            }]]
          } : undefined
        });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    // Registra o erro no log para auditoria
    await supabase.from('webhooks_log').insert({
      platform: 'kiwify',
      payload: body,
      status: 'error',
      error_message: error.message
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}