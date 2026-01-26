import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { leadId } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Busca dados do Lead e Produto
    const { data: lead, error: leadError } = await supabase
      .from('sales_events')
      .select('*, products(name)')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) throw new Error('Lead não encontrado.');

    const nomeProduto = lead.products?.name || 'seu pedido';
    const linkFinal = lead.custom_discount_link || lead.checkout_url;

    // 2. Busca configuração de Tom de Voz
    const { data: settings } = await supabase
      .from('user_settings')
      .select('ai_tone')
      .single();

    const tomDeVoz = settings?.ai_tone || 'consultivo';

    // 3. Prompt estruturado
    const prompt = `Você é a Bruna, assistente de vendas. Recupere ${lead.customer_name} que abandonou o ${nomeProduto}. Tom: ${tomDeVoz.toUpperCase()}. Use o link ${linkFinal} no final. Regras: WhatsApp, curto, com emojis, sem aspas.`;

    // 4. CHAMADA COM MODELO GEMINI-PRO (Máxima Estabilidade)

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("❌ LOG GOOGLE:", data.error.message);
    }

    const mensagemIA = data.candidates?.[0]?.content?.parts?.[0]?.text;

    // 5. Fallback Inteligente
    const fallbackMessage = `Oi ${lead.customer_name}! 😊 Notei que não concluiu a compra do ${nomeProduto}. Consegui um link especial para você finalizar aqui: ${linkFinal}`;

    return NextResponse.json({ 
      message: mensagemIA ? mensagemIA.trim() : fallbackMessage 
    });

  } catch (error: any) {
    console.error('❌ ERRO ROTA:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 