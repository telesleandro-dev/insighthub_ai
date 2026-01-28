
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { leadId, status } = await req.json();

        if (!leadId || !status) {
            return NextResponse.json({ error: 'leadId e status são obrigatórios' }, { status: 400 });
        }

        // Usa a Service Role Key para ignorar RLS e ter permissão total
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase
            .from('sales_events')
            .update({ status_abordagem: status })
            .eq('id', leadId)
            .select();

        if (error) {
            console.error("❌ Erro no Update (API):", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data || data.length === 0) {
            console.error("❌ Erro: Lead não encontrado ou não atualizado.");
            return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
