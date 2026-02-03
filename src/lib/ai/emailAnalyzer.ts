/**
 * AI Email Analyzer
 * Uses Google Gemini to analyze customer emails and extract insights
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface EmailAnalysis {
    analise_sentimento: 'Positivo' | 'Neutro' | 'Negativo';
    intencao: 'Dúvida' | 'Suporte' | 'Venda' | 'Reclamação' | 'Elogio' | 'Negociação';
    resumo_executivo: string;
    dores_identificadas: string[];
    probabilidade_conversao: number;
    sugestao_resposta: string;
    produto_identificado?: string; // NEW: nome do produto mencionado no email
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function analyzeEmail(
    sender: string,
    subject: string,
    body: string
): Promise<EmailAnalysis> {
    const prompt = buildPrompt(sender, subject, body);

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                temperature: 0.7,
            }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        if (!text) {
            throw new Error('Empty response from Gemini');
        }

        // Gemini pode retornar markdown com ```json, então vamos limpar
        text = text.trim();

        // Remove markdown code blocks se existir
        if (text.startsWith('```json')) {
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (text.startsWith('```')) {
            text = text.replace(/```\n?/g, '');
        }

        // Encontra o JSON válido na resposta
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('No JSON found in response:', text);
            throw new Error('Invalid JSON response from Gemini');
        }

        const analysis = JSON.parse(jsonMatch[0]) as EmailAnalysis;

        // Validate and sanitize
        return validateAnalysis(analysis);
    } catch (error) {
        console.error('Error analyzing email with Gemini AI:', error);
        throw error;
    }
}

function buildPrompt(sender: string, subject: string, body: string): string {
    return `
Analise o seguinte email de um potencial cliente e retorne um JSON estruturado com insights de vendas.

**Email:**
De: ${sender}
Assunto: ${subject}

Conteúdo:
${body}

**Instrução:**
Retorne um JSON com a seguinte estrutura EXATA:

{
  "analise_sentimento": "Positivo" | "Neutro" | "Negativo",
  "intencao": "Dúvida" | "Suporte" | "Venda" | "Reclamação" | "Elogio" | "Negociação",
  "resumo_executivo": "Uma frase resumindo o que o lead quer",
  "dores_identificadas": ["array", "de", "dores ou objeções mencionadas"],
  "probabilidade_conversao": 0-100 (número inteiro estimando chance de compra),
  "sugestao_resposta": "Sugestão de abordagem para o vendedor responder no WhatsApp",
  "produto_identificado": "Nome exato do produto mencionado ou null se não identificado"
}

**Critérios:**
- analise_sentimento: Tom geral da mensagem
- intencao: Propósito principal do email
- dores_identificadas: Problemas, dúvidas ou objeções específicas mencionadas
- probabilidade_conversao: Baseie-se em nível de interesse, urgência e clareza da necessidade
- sugestao_resposta: Deve ser prática, empática e orientada a conversão
- produto_identificado: Se o email menciona um produto específico (curso, mentoria, e-book, etc), extraia o nome EXATO. Caso contrário, retorne null
`.trim();
}

function validateAnalysis(analysis: any): EmailAnalysis {
    // Ensure required fields exist
    const validated: EmailAnalysis = {
        analise_sentimento: ['Positivo', 'Neutro', 'Negativo'].includes(analysis.analise_sentimento)
            ? analysis.analise_sentimento
            : 'Neutro',
        intencao: ['Dúvida', 'Suporte', 'Venda', 'Reclamação', 'Elogio', 'Negociação'].includes(analysis.intencao)
            ? analysis.intencao
            : 'Dúvida',
        resumo_executivo: analysis.resumo_executivo || 'Email sem conteúdo claro',
        dores_identificadas: Array.isArray(analysis.dores_identificadas) ? analysis.dores_identificadas : [],
        probabilidade_conversao: Math.min(100, Math.max(0, parseInt(analysis.probabilidade_conversao) || 0)),
        sugestao_resposta: analysis.sugestao_resposta || 'Responder com empatia e esclarecer dúvidas',
        produto_identificado: analysis.produto_identificado || undefined // NEW
    };

    return validated;
}
