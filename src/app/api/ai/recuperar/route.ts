import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getKnowledgeContext } from '@/lib/knowledge/knowledgeContext';

/**
 * Interpreta tags técnicas em descrições amigáveis para o prompt da IA.
 * Evita que termos internos como "REINCIDENTE" apareçam na mensagem ao cliente.
 */
function interpretBehaviorTags(tags: string[]): string {
  const interpretations: { [key: string]: string } = {
    'REINCIDENTE': 'Já demonstrou interesse anteriormente',
    'MULTIFILIAL': 'Interessou-se por múltiplos produtos',
    'ERRO_TECNICO': 'Teve dificuldade técnica no checkout',
    'ABANDONO': 'Abandonou carrinho de compras',
    'ALTA_INTENCAO': 'Alta intenção de compra'
  };

  return tags
    .map(tag => interpretations[tag.toUpperCase()] || '')
    .filter(Boolean)
    .join('. ') || 'Primeiro contato com a empresa';
}

export async function POST(req: Request) {
  // Variáveis declaradas fora do try para estarem acessíveis no catch como fallback
  let lead: any = null;
  let linkFinal = 'insight-hub.ai';

  try {
    const { leadId, leadEmail, discountLink } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --- CORREÇÃO: Buscar por EMAIL em leads_profiles (não por ID em sales_events) ---
    // Frontend envia ID de leads_profiles, mas estava buscando em sales_events
    // Solução: Usar email que existe em ambas as tabelas

    // 1. Buscar perfil do lead por email
    const { data: profileData, error: profileError } = await supabase
      .from('leads_profiles')
      .select('*')
      .eq('email', leadEmail)
      .single();

    if (profileError || !profileData) {
      throw new Error('Lead não encontrado.');
    }

    // 2. Buscar último evento de venda para contexto adicional
    const { data: lastEvent } = await supabase
      .from('sales_events')
      .select('*')
      .eq('customer_email', leadEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Consolidar dados (compatibilidade com código existente)
    lead = {
      ...profileData,
      // Dados do perfil
      customer_name: profileData.name,
      customer_email: profileData.email,
      // Dados do último evento (se existir)
      product_name: lastEvent?.product_name || profileData.product_history?.[0] || 'nosso produto',
      status: lastEvent?.status || 'unknown',
      platform_origin: lastEvent?.platform_origin,
      lead_source: lastEvent?.lead_source,
      user_id: profileData.user_id,
      // Referência ao perfil (compatibilidade)
      lead_profile: profileData
    };

    const profile = lead.lead_profile;
    const leadScore = profile?.lead_score || 0;
    const behaviorTags = profile?.behavior_tags || [];
    const productHistory = profile?.product_history || [];

    const nomeProduto = lead.product_name || 'nosso produto';
    // Prioriza o link enviado pelo Front (digitado no Drawer), depois o do banco
    linkFinal = discountLink || lead.custom_discount_link || lead.checkout_url || 'insight-hub.ai';

    // 2. Busca configuração de Tom de Voz REAL do usuário desse lead
    const { data: configData } = await supabase
      .from('user_configs')
      .select('ai_tone')
      .eq('user_id', lead.user_id)
      .maybeSingle();

    const tomDeVoz = configData?.ai_tone || 'consultivo';

    // 3. Buscar contexto da Base de Conhecimento (não crítico - não deve quebrar se falhar)
    let knowledgeContext = '';
    let hasKnowledge = false;

    try {
      knowledgeContext = await getKnowledgeContext(lead.user_id, lead.external_product_id);
      hasKnowledge = knowledgeContext.trim().length > 0;
      console.log(`📚 [Recuperar] Conhecimento: ${hasKnowledge ? `${knowledgeContext.length} chars` : 'vazio'}`);
    } catch (knowledgeError: any) {
      console.warn('⚠️ [Recuperar] Erro ao buscar conhecimento (continuando sem ele):', knowledgeError.message);
      // Continue sem conhecimento - não é crítico
    }

    // 4. Inicializa Gemini SDK
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ [Bruna IA] GEMINI_API_KEY não configurada.');
      throw new Error('Configuração de IA ausente.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // 5. Prompt estruturado focado em Inteligência de Lead e Abordagem de Vendas
    const prompt = `
      Você é um Especialista em Vendas Consultivas com 10 anos de experiência em conversão de leads.
      
      MISSÃO: Criar uma mensagem de WhatsApp ALTAMENTE PERSONALIZADA para recuperar o lead "${lead.customer_name}".

      📊 INTELIGÊNCIA DO LEAD:
      - Nome: ${lead.customer_name}
      - Email: ${lead.customer_email}
      - Temperatura: ${leadScore}% ${leadScore >= 80 ? '🔥 QUENTE' : leadScore >= 50 ? '🌡️ MORNO' : '❄️ FRIO'}
      - Status Atual: ${lead.status}
      - Origem: ${lead.lead_source || lead.platform_origin || 'Desconhecida'}
      - Comportamento: ${interpretBehaviorTags(behaviorTags)}
      - Histórico de Produtos: ${productHistory.length > 0 ? productHistory.join(', ') : 'Primeira interação'}
      - Observações: ${lead.lead_notes || 'Sem observações adicionais'}

      🎯 PRODUTO EM FOCO: "${nomeProduto}"
      🔗 LINK DE RECUPERAÇÃO: ${linkFinal}
      🎨 TOM DE VOZ: ${tomDeVoz.toUpperCase()}

      ${hasKnowledge ? `
📚 CONHECIMENTO DO PRODUTO (use para personalizar):
${knowledgeContext}
` : ''}

      ⚠️ REGRAS CRÍTICAS PARA A MENSAGEM (280 caracteres MAX):
      
      1. **PERSONALIZAÇÃO OBRIGATÓRIA:**
         - Use o NOME do lead naturalmente
         - Mencione algo ESPECÍFICO do comportamento dele (reincidência, produtos vistos, etc.)
         - Se houver histórico de produtos, cite isso como prova de interesse genuíno
      
      2. **ESTRUTURA IDEAL:**
         - Abertura: Cumprimento personalizado + reconhecimento do interesse
         - Corpo: Benefício específico OU remoção de objeção OU gatilho de urgência
         - Fechamento: Call-to-action claro + link
      
      3. **GATILHOS MENTAIS (escolha 1-2 adequados ao perfil):**
         - Lead QUENTE (>80): Urgência + Escassez ("últimas vagas", "oferta por tempo limitado")
         - Lead MORNO (50-80): Prova social + Benefício claro ("mais de X pessoas já garantiram")
         - Lead FRIO (<50): Empatia + Remoção de objeção ("sem compromisso", "pode cancelar a qualquer momento")
         - REINCIDENTE: "Vi que você voltou! Isso mostra que..."
         - ERRO_TÉCNICO: "Resolvemos o problema que você teve. Agora está tudo certo!"
      
      4. **TOM DE VOZ - ${tomDeVoz.toUpperCase()}:**
         ${tomDeVoz === 'persuasivo' ? '- Use verbos de ação fortes, crie senso de urgência, destaque benefícios imediatos' : ''}
         ${tomDeVoz === 'consultivo' ? '- Seja empático, faça perguntas, ofereça ajuda genuína, posicione-se como consultor' : ''}
         ${tomDeVoz === 'cordial' ? '- Seja amigável, leve, use linguagem casual mas profissional, crie conexão' : ''}
      
      5. **PROIBIDO:**
         - ❌ Termos técnicos internos (REINCIDENTE, MULTIFILIAL, ERRO_TECNICO, etc.)
         - ❌ Mensagens genéricas que poderiam ser enviadas para qualquer pessoa
         - ❌ Excesso de emojis (máximo 2-3)
         - ❌ Textos longos (respeite 280 caracteres)
         - ❌ Promessas não cumpridas ou exageros

      📝 FORMATO DE RESPOSTA (JSON):
      Retorne APENAS um objeto JSON válido (sem markdown, sem \`\`\`json):
      {
        "dossie": "Resumo estratégico do perfil do lead em 1-2 linhas (foco em por que ele é promissor e como abordá-lo)",
        "sugestao_abordagem": "Mensagem de WhatsApp personalizada (280 caracteres MAX, incluindo link ${linkFinal})",
        "gatilho_mental": "Nome do gatilho mental principal usado (Urgência, Escassez, Prova Social, Empatia, Autoridade, etc.)"
      }

      EXEMPLO DE BOA MENSAGEM (CONSULTIVO, Lead Morno, Reincidente):
      "Oi Roberto! Vi que você voltou pra dar uma olhada no Ebook Iniciante 📚 Ficou alguma dúvida? Posso ajudar! Mais de 500 alunos já começaram do zero e estão adorando. Bora conversar? ${linkFinal}"

      AGORA CRIE A MENSAGEM PERFEITA PARA ESTE LEAD:
    `;

    // Lista de modelos válidos (obtidos da API Gemini v1beta)
    const modelsToTry = [
      "gemini-2.5-flash",       // Mais rápido e moderno (June 2025)
      "gemini-flash-latest",    // Sempre atualizado automaticamente
      "gemini-2.0-flash",       // Estável e confiável
      "gemini-pro-latest"       // Mais capaz, sempre atualizado
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

    // 6. Parse da resposta JSON
    let parsedResult;
    try {
      const cleanText = text.replace(/```json|```/g, '').trim();
      parsedResult = JSON.parse(cleanText);
    } catch (e) {
      console.warn('⚠️ [Bruna IA] Erro ao parsear JSON, usando texto bruto:', e);
      parsedResult = {
        sugestao_abordagem: text.trim(),
        dossie: 'Análise automática indisponível no momento.',
        gatilho_mental: 'N/A'
      };
    }

    return NextResponse.json({
      message: parsedResult.sugestao_abordagem || text.trim(),
      dossie: parsedResult.dossie,
      gatilho: parsedResult.gatilho_mental
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
