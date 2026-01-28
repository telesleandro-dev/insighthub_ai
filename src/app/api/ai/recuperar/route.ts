import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  // Variáveis declaradas fora do try para estarem acessíveis no catch como fallback
  let lead: any = null;
  let linkFinal = 'insight-hub.ai';

  try {
    const { leadId } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Busca dados do Lead e Produto
    const { data: leadData, error: leadError } = await supabase
      .from('sales_events')
      .select('*, products(name)')
      .eq('id', leadId)
      .single();

    if (leadError || !leadData) throw new Error('Lead não encontrado.');
    lead = leadData;

    const nomeProduto = lead.products?.name || 'nosso produto';
    linkFinal = lead.custom_discount_link || lead.checkout_url || 'insight-hub.ai';

    // 2. Busca configuração de Tom de Voz REAL do usuário desse lead
    const { data: configData } = await supabase
      .from('user_configs')
      .select('ai_tone')
      .eq('user_id', lead.user_id)
      .maybeSingle();

    const tomDeVoz = configData?.ai_tone || 'consultivo';

    // 3. Inicializa Gemini SDK
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ [Bruna IA] GEMINI_API_KEY não configurada.');
      throw new Error('Configuração de IA ausente.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // 4. Prompt estruturado
    const prompt = `
      Persona: Você é a Bruna, uma assistente de vendas empática e persuasiva do InsightHub AI.
      Objetivo: Recuperar um cliente que abandonou o carrinho do produto "${nomeProduto}".
      Cliente: ${lead.customer_name}
      Tom de Voz: ${tomDeVoz.toUpperCase()}
      Link de Compra: ${linkFinal}

      Instruções:
      - Respeite o tom ${tomDeVoz.toUpperCase()} (Persuasivo = Urgência/Escassez | Consultivo = Ajudar com Dúvidas | Cordial = Gentileza).
      - Texto curto para WhatsApp (máximo 300 caracteres).
      - Use emojis de forma moderada e profissional.
      - Inclua o link ${linkFinal} obrigatoriamente.
      - Não use aspas ou prefixos como "Bruna:".
    `;

    // Lista de modelos para tentativa (Fallback em Cascata para evitar 429)
    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite-preview-02-05",
      "gemini-1.5-pro",
      "gemini-1.5-flash-latest"
    ];

    let text: string | null = null;
    let errors: string[] = [];

    // Tentativa em Loop
    for (const modelName of modelsToTry) {
      try {
        console.log(`🔄 [Bruna IA] Tentando modelo: ${modelName}...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
          }
        });

        const result = await model.generateContent(prompt);
        text = result.response.text();

        if (text) break; // Sucesso! Sai do loop

      } catch (err: any) {
        console.warn(`⚠️ [Bruna IA] Falha no modelo ${modelName}: ${err.message}`);
        errors.push(`${modelName}: ${err.message}`);
        // Continua para o próximo modelo...
      }
    }

    if (!text) {
      throw new Error(`Todos os modelos falharam. Detalhes: ${errors.join(' | ')}`);
    }

    return NextResponse.json({
      message: text.trim()
    });

  } catch (error: any) {
    console.error('❌ [Bruna IA] Erro no Processamento:', error.message);

    // Fallback robusto
    const customerName = lead?.customer_name || 'lá';
    const fallbackMap: { [key: string]: string } = {
      'persuasivo': `Oi ${customerName}! ⏳ Não deixe essa chance passar. Seu ${lead?.products?.name || 'produto'} está reservado. Finalize aqui: ${linkFinal}`,
      'consultivo': `Olá ${customerName}! Ficou com alguma dúvida sobre o ${lead?.products?.name || 'produto'}? Posso ajudar! Link para retomar: ${linkFinal}`,
      'cordial': `Oi ${customerName}! Tudo bem? Vi que não concluiu seu pedido. Se precisar de algo, me chame! Link: ${linkFinal}`
    };

    return NextResponse.json({
      error: 'Falha na IA',
      message: fallbackMap[lead?.ai_tone || 'consultivo'] || fallbackMap['consultivo']
    }, { status: 200 });
  }
}
