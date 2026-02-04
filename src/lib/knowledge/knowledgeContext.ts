import { createClient } from '@supabase/supabase-js';

/**
 * Função auxiliar para buscar contexto da base de conhecimento
 * Usada em prompts de recuperação de vendas e geração de mensagens
 */
export async function getKnowledgeContext(userId: string, productId?: string): Promise<string> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const query = supabase
        .from('knowledge_files')
        .select('file_name, extracted_text')
        .eq('user_id', userId)
        .eq('processing_status', 'completed')
        .not('extracted_text', 'is', null);

    // Se tiver product_id, filtrar por produto
    if (productId) {
        query.eq('product_id', productId);
    }

    const { data, error } = await query.limit(5); // Máximo 5 arquivos

    if (error || !data || data.length === 0) {
        return '';
    }

    // Montar contexto
    const context = data
        .map((file) => {
            return `
📄 Arquivo: ${file.file_name}
---
${file.extracted_text}
---
`;
        })
        .join('\n\n');

    // Limitar tamanho total do contexto (máx 10.000 caracteres)
    if (context.length > 10000) {
        return context.substring(0, 10000) + '\n\n[... contexto truncado ...]';
    }

    return context;
}

/**
 * Exemplo de uso em prompt de recuperação de vendas:
 */
export function buildRecoveryPrompt(
    customerName: string,
    productName: string,
    knowledgeContext: string,
    tone: string = 'consultivo'
): string {
    const toneInstructions = {
        persuasivo: 'Use tom persuasivo, focado em urgência e escassez',
        consultivo: 'Use tom consultivo, esclarecendo dúvidas e gerando confiança',
        cordial: 'Use tom cordial e empático, focado em relacionamento'
    };

    return `Você é um especialista em recuperação de vendas.

CONTEXTO DA BASE DE CONHECIMENTO:
${knowledgeContext || 'Nenhuma informação adicional disponível.'}

TAREFA:
Gere uma mensagem de recuperação de carrinho para:
- Cliente: ${customerName}
- Produto: ${productName}
- Tom: ${toneInstructions[tone as keyof typeof toneInstructions]}

INSTRUÇÕES:
1. Use as informações da Base de Conhecimento acima para responder possíveis dúvidas
2. Seja específico sobre os benefícios do produto ${productName}
3. Inclua um call-to-action claro
4. Mantenha a mensagem entre 100-150 palavras
5. Personalize usando o nome do cliente

MENSAGEM:`;
}
