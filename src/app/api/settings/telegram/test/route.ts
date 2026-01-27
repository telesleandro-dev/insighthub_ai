/**
 * API: Test Telegram
 * 
 * POST: Envia mensagem de teste para o Telegram
 */

import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';

export async function POST(req: Request) {
    try {
        const { token, chatId } = await req.json();

        if (!token || !chatId) {
            return NextResponse.json({
                error: 'token e chatId são obrigatórios'
            }, { status: 400 });
        }

        // Criar bot temporário para teste
        const bot = new TelegramBot(token);

        const message = `🎉 *Teste de Conexão - InsightHub AI*\n\n✅ Seu Telegram está configurado corretamente!\n\nVocê receberá notificações sobre:\n• Vendas aprovadas\n• Carrinhos abandonados\n• Recuperações bem-sucedidas`;

        await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown'
        });

        return NextResponse.json({
            success: true,
            message: 'Mensagem de teste enviada com sucesso!'
        });

    } catch (error: any) {
        console.error('[API Telegram Test] Erro:', error);

        let errorMessage = 'Erro ao enviar mensagem';

        if (error.message.includes('bot token')) {
            errorMessage = 'Token do bot inválido';
        } else if (error.message.includes('chat not found')) {
            errorMessage = 'Chat ID não encontrado';
        } else if (error.message.includes('Forbidden')) {
            errorMessage = 'Bot bloqueado ou sem permissão';
        }

        return NextResponse.json({
            error: errorMessage,
            details: error.message
        }, { status: 400 });
    }
}
