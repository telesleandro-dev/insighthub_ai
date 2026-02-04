import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY não configurada' }, { status: 500 });
        }

        // Usar API REST diretamente
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        const models = data.models?.map((model: any) => ({
            name: model.name,
            displayName: model.displayName,
            supportedGenerationMethods: model.supportedGenerationMethods
        })) || [];

        console.log('📋 Modelos disponíveis (REST API):', models);

        return NextResponse.json({
            success: true,
            count: models.length,
            models: models,
            raw: data
        });

    } catch (error: any) {
        console.error('❌ Erro ao listar modelos:', error);
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
