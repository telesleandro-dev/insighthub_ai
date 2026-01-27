/**
 * API: Knowledge Base
 * 
 * GET: Lista itens da base de conhecimento
 * POST: Adiciona novo item
 * DELETE: Remove item
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('user_id');
        const type = searchParams.get('type'); // 'faq', 'objection', 'document'

        if (!userId) {
            return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        let query = supabase
            .from('user_knowledge_base')
            .select('*')
            .eq('user_id', userId);

        if (type) {
            query = query.eq('type', type);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('[API Knowledge] Erro ao buscar:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ items: data || [] });

    } catch (error: any) {
        console.error('[API Knowledge] Erro:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { userId, type, title, content, file_url } = await req.json();

        if (!userId || !type || !title || !content) {
            return NextResponse.json({
                error: 'userId, type, title e content são obrigatórios'
            }, { status: 400 });
        }

        if (!['faq', 'objection', 'document'].includes(type)) {
            return NextResponse.json({
                error: 'type deve ser: faq, objection ou document'
            }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from('user_knowledge_base')
            .insert({
                user_id: userId,
                type,
                title,
                content,
                file_url: file_url || null
            })
            .select()
            .single();

        if (error) {
            console.error('[API Knowledge] Erro ao criar:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, item: data });

    } catch (error: any) {
        console.error('[API Knowledge] Erro:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase
            .from('user_knowledge_base')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[API Knowledge] Erro ao deletar:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[API Knowledge] Erro:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
