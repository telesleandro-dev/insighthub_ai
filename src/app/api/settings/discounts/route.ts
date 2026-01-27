/**
 * API: Discount Settings
 * 
 * GET: Busca configurações de descontos
 * POST: Salva/atualiza configurações de descontos
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
            .from('user_discount_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('[API Discount] Erro ao buscar:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Retornar valores padrão se não existir
        const settings = data || {
            default_discount_percent: 10,
            coupon_code: 'RECUPERA10',
            coupon_validity_hours: 48,
            enabled: false
        };

        return NextResponse.json({ settings });

    } catch (error: any) {
        console.error('[API Discount] Erro:', error);
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
            .from('user_discount_settings')
            .upsert({
                user_id: userId,
                default_discount_percent: settings.default_discount_percent || 10,
                coupon_code: settings.coupon_code || 'RECUPERA10',
                coupon_validity_hours: settings.coupon_validity_hours || 48,
                enabled: settings.enabled !== undefined ? settings.enabled : false,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single();

        if (error) {
            console.error('[API Discount] Erro ao salvar:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, settings: data });

    } catch (error: any) {
        console.error('[API Discount] Erro:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
