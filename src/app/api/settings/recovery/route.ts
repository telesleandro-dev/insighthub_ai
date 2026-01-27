/**
 * API: Recovery Settings
 * 
 * GET: Busca configurações de recuperação automática
 * POST: Salva/atualiza configurações de recuperação
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

        const { data, error } = await supabase
            .from('user_recovery_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('[API Recovery] Erro ao buscar:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Retornar valores padrão se não existir
        const settings = data || {
            ai_tone: 'consultivo',
            wait_time_minutes: 60,
            max_attempts: 3,
            retry_interval_hours: 24,
            work_start_hour: 8,
            work_end_hour: 22,
            enabled: true
        };

        return NextResponse.json({ settings });

    } catch (error: any) {
        console.error('[API Recovery] Erro:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { userId, settings } = await req.json();

        if (!userId || !settings) {
            return NextResponse.json({ error: 'userId e settings são obrigatórios' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('user_recovery_settings')
            .upsert({
                user_id: userId,
                ai_tone: settings.ai_tone || 'consultivo',
                wait_time_minutes: settings.wait_time_minutes || 60,
                max_attempts: settings.max_attempts || 3,
                retry_interval_hours: settings.retry_interval_hours || 24,
                work_start_hour: settings.work_start_hour || 8,
                work_end_hour: settings.work_end_hour || 22,
                enabled: settings.enabled !== undefined ? settings.enabled : true,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single();

        if (error) {
            console.error('[API Recovery] Erro ao salvar:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, settings: data });

    } catch (error: any) {
        console.error('[API Recovery] Erro:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
