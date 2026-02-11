/**
 * API Endpoint: Gerenciamento de API Keys para Integração com N8n
 * 
 * Este endpoint permite que usuários gerem, visualizem e revoguem suas API Keys
 * para autenticação em integrações externas (n8n, Make, Zapier, etc.)
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('[API Key] ERRO: Variáveis do Supabase não encontradas!');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

/**
 * GET: Buscar API Key atual do usuário
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json(
                { error: 'user_id é obrigatório' },
                { status: 400 }
            );
        }

        // Buscar configuração do usuário
        const { data, error } = await supabase
            .from('user_configs')
            .select('api_key')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('[API Key] Erro ao buscar:', error);
            return NextResponse.json(
                { error: 'Erro ao buscar API Key' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            has_api_key: !!data.api_key,
            api_key: data.api_key || null,
            masked_key: data.api_key ? `${data.api_key.substring(0, 10)}...` : null
        });
    } catch (error: any) {
        console.error('[API Key] Erro:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST: Gerar nova API Key
 */
export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('user_id');
        const action = searchParams.get('action'); // 'generate' ou 'revoke'

        if (!userId) {
            return NextResponse.json(
                { error: 'user_id é obrigatório' },
                { status: 400 }
            );
        }

        // AÇÃO: REVOGAR API KEY
        if (action === 'revoke') {
            const { error } = await supabase
                .from('user_configs')
                .update({ api_key: null })
                .eq('user_id', userId);

            if (error) {
                console.error('[API Key] Erro ao revogar:', error);
                return NextResponse.json(
                    { error: 'Erro ao revogar API Key' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'API Key revogada com sucesso'
            });
        }

        // AÇÃO: GERAR NOVA API KEY (padrão)
        // Formato: ih_[64 caracteres hexadecimais]
        const newApiKey = `ih_${randomBytes(32).toString('hex')}`;

        // Verificar se user_configs existe, senão criar
        const { data: existingConfig } = await supabase
            .from('user_configs')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        let result;
        if (existingConfig) {
            // Atualizar registro existente
            result = await supabase
                .from('user_configs')
                .update({ api_key: newApiKey })
                .eq('user_id', userId)
                .select()
                .single();
        } else {
            // Criar novo registro
            result = await supabase
                .from('user_configs')
                .insert({
                    user_id: userId,
                    api_key: newApiKey
                })
                .select()
                .single();
        }

        if (result.error) {
            console.error('[API Key] Erro ao gerar:', result.error);

            // Verificar se é erro de unicidade (improvável mas possível)
            if (result.error.code === '23505') {
                return NextResponse.json(
                    { error: 'Conflito ao gerar API Key. Tente novamente.' },
                    { status: 409 }
                );
            }

            return NextResponse.json(
                { error: 'Erro ao gerar API Key' },
                { status: 500 }
            );
        }

        console.log('[API Key] ✅ Nova chave gerada para user:', userId);

        return NextResponse.json({
            success: true,
            api_key: newApiKey,
            message: 'API Key gerada com sucesso'
        });
    } catch (error: any) {
        console.error('[API Key] Erro:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
