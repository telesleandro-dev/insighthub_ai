
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create a Supabase client with the SERVICE ROLE key to manage users
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("CRITICAL: Supabase environment variables are missing!");
}

const supabaseAdmin = createClient(
    supabaseUrl || '',
    serviceRoleKey || ''
);

export async function POST(req: NextRequest) {
    try {
        // 0. Defensive check for configuration
        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({ error: 'Server configuration error: Missing API Keys' }, { status: 500 });
        }

        // 1. Check if the requester is an admin
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            console.error("Auth verification failed:", authError?.message);
            return NextResponse.json({ error: 'Acesso negado: Sessão inválida' }, { status: 401 });
        }

        // Check role in profiles
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado: Apenas administradores podem excluir usuários' }, { status: 403 });
        }

        // 2. Parse body
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
        }

        // Prevent deleting yourself
        if (userId === user.id) {
            return NextResponse.json({ error: 'Você não pode excluir sua própria conta root por aqui' }, { status: 400 });
        }

        console.log(`Iniciando exclusão do usuário: ${userId}`);

        // 3. Delete user from Auth (Cascade should handle profiles)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
            console.error("Supabase Delete Error:", deleteError.message);
            throw deleteError;
        }

        console.log("Usuário excluído com sucesso:", userId);
        return NextResponse.json({ message: 'Usuário excluído com sucesso' });

    } catch (error: any) {
        console.error('Delete User Exception:', error);
        return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 });
    }
}
