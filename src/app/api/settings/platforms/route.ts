/**
 * API: Platforms Settings
 * 
 * GET: Lista todas as plataformas configuradas do usuário
 * POST: Salva/atualiza configurações de todas as plataformas
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Buscar configurações de todas as plataformas
        const { data: platforms, error } = await supabase
            .from('user_platform_configs')
            .select('*')
            .eq('user_id', userId)
            .order('platform');

        if (error) {
            console.error('[API Platforms] Erro ao buscar:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Garantir que todas as 4 plataformas existam
        const allPlatforms = ['kiwify', 'hotmart', 'eduzz', 'monetizze'];
        const existingPlatforms = platforms?.map(p => p.platform) || [];

        const platformsData = allPlatforms.map(platform => {
            const existing = platforms?.find(p => p.platform === platform);
            return existing || {
                platform,
                user_id: userId,
                api_key: null,
                api_secret: null,
                is_active: false,
                last_webhook_at: null,
                total_webhooks: 0,
                total_sales: 0,
                total_abandonments: 0
            };
        });

        return NextResponse.json({ platforms: platformsData });

    } catch (error: any) {
        console.error('[API Platforms] Erro:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { userId, platforms } = await req.json();

        if (!userId || !platforms) {
            return NextResponse.json({ error: 'userId e platforms são obrigatórios' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Salvar cada plataforma
        const results = [];
        for (const platform of platforms) {
            const { data, error } = await supabase
                .from('user_platform_configs')
                .upsert({
                    user_id: userId,
                    platform: platform.platform,
                    api_key: platform.api_key || null,
                    api_secret: platform.api_secret || null,
                    is_active: platform.is_active !== undefined ? platform.is_active : true,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,platform'
                })
                .select()
                .single();

            if (error) {
                console.error(`[API Platforms] Erro ao salvar ${platform.platform}:`, error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            results.push(data);
        }

        return NextResponse.json({ success: true, platforms: results });

    } catch (error: any) {
        console.error('[API Platforms] Erro:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
