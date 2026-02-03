import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
        return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ products: data || [] });
    } catch (error: any) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { user_id, external_id, name, description, target_audience, price } = body;

        if (!user_id || !external_id || !name) {
            return NextResponse.json(
                { error: 'user_id, external_id and name are required' },
                { status: 400 }
            );
        }

        // Upsert: insert or update if external_id already exists for this user
        const { data, error } = await supabase
            .from('products')
            .upsert(
                {
                    user_id,
                    external_id,
                    name,
                    description,
                    target_audience,
                    price,
                    platform: 'manual', // Valor padrão para cadastro manual
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'user_id,external_id', // Use unique constraint
                    ignoreDuplicates: false, // Update existing record
                }
            )
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, product: data }, { status: 200 });
    } catch (error: any) {
        console.error('Error upserting product:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, user_id, name, description, target_audience, price } = body;

        if (!id || !user_id) {
            return NextResponse.json({ error: 'id and user_id required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('products')
            .update({ name, description, target_audience, price })
            .eq('id', id)
            .eq('user_id', user_id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, product: data });
    } catch (error: any) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('user_id');

    if (!id || !userId) {
        return NextResponse.json({ error: 'id and user_id required' }, { status: 400 });
    }

    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
