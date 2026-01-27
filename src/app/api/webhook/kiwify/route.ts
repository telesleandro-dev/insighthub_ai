import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

export const dynamic = 'force-dynamic';

// 1. Definição ÚNICA e SEGURA do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// DICA: Use a SERVICE_ROLE_KEY no backend para evitar bloqueios de RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  let body: any;

  try {
    body = await req.json();

    // 2. IDENTIFICAÇÃO DINÂMICA (A Solução Definitiva)
    const { searchParams } = new URL(req.url);
    const userIdFromUrl = searchParams.get('user_id');

    // Mantemos o log para auditoria caso precise debugar
    await supabase.from('webhooks_log').insert({
      platform: 'kiwify',
      payload: body,
      status: 'received',
      user_id: userIdFromUrl // Se sua tabela tiver essa coluna, ajuda muito
    });

    if (!userIdFromUrl) {
      return NextResponse.json({ error: 'user_id ausente na URL' }, { status: 400 });
    }

    // 3. BUSCA CONFIGURAÇÃO PELO ID DO USUÁRIO (Escalável)
   
// 3. BUSCA CONFIGURAÇÃO PELO ID DO USUÁRIO
console.log("Tentando buscar ID no banco:", userIdFromUrl);

const { data: userConfig, error: configError } = await supabase
  .from('user_configs')
  .select('*') // Vamos pegar tudo para testar
  .eq('user_id', userIdFromUrl.trim()) // O .trim() remove espaços invisíveis
  .maybeSingle();

if (configError) {
  console.error("ERRO CRÍTICO DO SUPABASE:", configError.message);
}

if (!userConfig) {
  console.log("AVISO: O Supabase não encontrou nenhuma linha para este ID.");
  // Vamos listar as IDs que existem no banco só para comparar no log
  const { data: allConfigs } = await supabase.from('user_configs').select('user_id').limit(5);
  console.log("IDs que existem no banco no momento:", allConfigs);
  
  return NextResponse.json({ 
    error: 'Usuario nao encontrado', 
    id_buscado: userIdFromUrl 
  }, { status: 401 });

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
      amount: (body.order_amount / 100) || body.amount || 0
    };

    if (!customerData.email) throw new Error('E-mail do cliente ausente');

    // 5. UPSERT DO PRODUTO
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

    if (prodError) throw prodError;

    // 6. REGISTRO DA VENDA
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

    // 7. NOTIFICAÇÃO TELEGRAM
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
    await supabase.from('webhooks_log').insert({
      platform: 'kiwify',
      payload: body || {},
      status: 'error',
      error_message: error.message
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}