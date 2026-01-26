import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import TelegramBot from 'node-telegram-bot-api'
import { GoogleGenerativeAI } from "@google/generative-ai"

const telegramToken = process.env.TELEGRAM_BOT_TOKEN || ''
const chatId = process.env.TELEGRAM_CHAT_ID || ''
const geminiKey = process.env.GOOGLE_GEMINI_KEY || ''
const bot = new TelegramBot(telegramToken)

export async function POST(request: Request) {
  const secret = request.headers.get('x-hub-token');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const payload = await request.json()
    
    // 1. MAPEAMENTO INTELIGENTE POR PLATAFORMA
    let platform = 'desconhecida';
    let customerData = {
      name: 'Cliente',
      email: '',
      phone: '',
      value: 0,
      status: 'waiting_payment',
      product: 'Produto'
    };

    if (payload.product_name) { // Lógica Kiwify
      platform = 'kiwify';
      customerData = {
        name: payload.Customer?.full_name || 'Cliente',
        email: payload.Customer?.email,
        phone: payload.Customer?.mobile || '',
        value: payload.order_amount / 100 || 0, // Kiwify envia em centavos
        status: payload.status === 'paid' ? 'paid' : 'waiting_payment',
        product: payload.product_name
      };
    } else if (payload.hottok) { // Lógica Hotmart
      platform = 'hotmart';
      customerData = {
        name: payload.name || 'Cliente',
        email: payload.email,
        phone: payload.phone_number || '',
        value: payload.price_value || 0,
        status: payload.status === 'approved' ? 'paid' : 'waiting_payment',
        product: payload.prod_name
      };
    }

   // 2. ALIMENTA O DASHBOARD (SALES_EVENTS)
    console.log('📦 Payload recebido para processar:', customerData);

    const { data: insertData, error: eventError } = await supabase
      .from('sales_events')
      .insert({
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        value: customerData.value,
        status: customerData.status,
        platform_origin: platform,
        product_name: customerData.product,
        status_abordagem: 'pendente'
      })
      .select();

    if (eventError) {
      // ESTE LOG APARECERÁ NO TERMINAL DO NPM RUN DEV
      console.error('❌ ERRO CRÍTICO NO SUPABASE:', eventError.message);
      console.error('Código do erro:', eventError.code);
    } else {
      console.log('✅ SUCESSO: Lead salvo com ID:', insertData?.[0]?.id);
    }

    // 3. IA: RESUMO ESTRATÉGICO
    const genAI = new GoogleGenerativeAI(geminiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    let aiSummary = `Nova interação de ${customerData.name} via ${platform.toUpperCase()}.`;

    try {
      const prompt = `Resuma este evento de venda de forma curta e profissional para um dono de negócio: ${JSON.stringify(customerData)}`;
      const result = await model.generateContent(prompt);
      aiSummary = result.response.text().trim();
    } catch (aiErr) { console.error("IA Falhou"); }

    // 4. TELEGRAM COM BOTÃO DE WHATSAPP
    const isAbandonment = customerData.status === 'waiting_payment';
    const message = `
${isAbandonment ? '⚠️ *ABANDONO DE CARRINHO*' : '✅ *VENDA REALIZADA*'}
    
${aiSummary}

💰 *Valor:* R$ ${customerData.value.toFixed(2)}
👤 *Cliente:* ${customerData.name}
📍 *Origem:* ${platform.toUpperCase()}`;

    // Adiciona botão de ação se for para recuperar
    const opts = {
      parse_mode: 'Markdown' as 'Markdown',
      reply_markup: isAbandonment && customerData.phone ? {
        inline_keyboard: [[
          { 
            text: '📱 Recuperar no WhatsApp', 
            url: `https://wa.me/55${customerData.phone.replace(/\D/g, '')}` 
          }
        ]]
      } : undefined
    };

    await bot.sendMessage(chatId, message, opts);

    return NextResponse.json({ received: true }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: 'Falha ao processar' }, { status: 500 })
  }
}