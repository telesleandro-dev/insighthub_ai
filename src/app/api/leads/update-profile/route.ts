
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * API: Update Lead Profile (Enrichment Endpoint)
 * 
 * Objetivo: Permitir que o n8n ou outros sistemas de IA atualizem o dossiê do lead
 * e alterem o service_status para 'processed', tornando-o visível no frontend.
 */
export async function POST(req: Request) {
    try {
        // Aceita API key via header OU query parameter (compatibilidade com n8n)
        const { searchParams } = new URL(req.url);
        const apiKey = req.headers.get('x-api-key') || searchParams.get('api_key');
        const systemSecret = process.env.WEBHOOK_SECRET;

        // 1. Validação de Segurança Básica (Master Key)
        if (!apiKey || apiKey.trim() !== (systemSecret || '').trim()) {
            console.log(`[UpdateProfile] [DEBUG] Auth fail: Header size: ${apiKey?.trim().length}, Env size: ${systemSecret?.trim().length}`);
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        let body;
        try {
            body = await req.json();
        } catch (e) {
            return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
        }

        const { email, user_id, service_status, lead_summary } = body;

        if (!email || !user_id) {
            return NextResponse.json({ error: 'email e user_id são obrigatórios' }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 2. Verificar Status Atual para evitar Updates Redundantes (Prevenção de Loop)
        const { data: currentLead } = await supabase
            .from('leads_profiles')
            .select('service_status, lead_summary')
            .eq('user_id', user_id)
            .eq('email', email.toLowerCase().trim())
            .maybeSingle();

        const isSameStatus = !service_status || currentLead?.service_status === service_status;
        const isSameSummary = !lead_summary || currentLead?.lead_summary === lead_summary;

        if (currentLead && isSameStatus && isSameSummary) {
            console.log(`ℹ️ [Update Profile] Lead ${email} já está atualizado. Ignorando update redundante.`);
            return NextResponse.json({
                success: true,
                message: 'Os dados já estão atualizados.',
                status: currentLead.service_status
            });
        }

        // 3. Preparar Update
        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        if (service_status) updateData.service_status = service_status;
        if (lead_summary) updateData.lead_summary = lead_summary;

        // 4. Executar Update no Perfil
        const { data, error } = await supabase
            .from('leads_profiles')
            .update(updateData)
            .eq('user_id', user_id)
            .eq('email', email.toLowerCase().trim())
            .select();

        if (error) {
            console.error('[Update Profile] Erro:', error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'Lead não encontrado para este usuário.' }, { status: 404 });
        }

        console.log(`[Update Profile] Lead ${email} atualizado com sucesso para status: ${service_status}`);

        return NextResponse.json({
            success: true,
            message: 'Perfil enriquecido com sucesso.',
            status: service_status
        });

    } catch (error: any) {
        console.error('[Update Profile] Erro crítico:', error.message);
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}
