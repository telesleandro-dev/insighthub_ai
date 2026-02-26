
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

        // 1. Verify Admin
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Falta cabeçalho de autorização' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            console.error("Auth verification failed:", authError?.message);
            return NextResponse.json({ error: 'Acesso negado: Sessão inválida' }, { status: 401 });
        }

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

        if (profile?.role !== 'admin') return NextResponse.json({ error: 'Acesso negado: Apenas administradores' }, { status: 403 });

        // 2. Parse Body
        let body;
        try {
            body = await req.json();
        } catch (parseError: any) {
            console.error('[API Admin Update] ❌ Erro ao parsear JSON:', parseError.message);
            return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
        }
        const { userId, name, role, email } = body;

        if (!userId) return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });

        console.log(`Iniciando atualização do usuário: ${userId}`);

        // 3. Update Profile
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
                name,
                role,
                email
            })
            .eq('id', userId);

        if (updateError) {
            console.error("Database Update Error:", updateError.message);
            throw updateError;
        }

        // Update Auth Data (Email and Metadata)
        const updateAttributes: any = {
            user_metadata: { name, role }
        };

        // Only update email if provided and different
        if (email) {
            const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId);
            if (targetUser?.user?.email !== email) {
                console.log(`Alterando e-mail de ${targetUser?.user?.email} para ${email}`);
                updateAttributes.email = email;
                updateAttributes.email_confirm = true;
            }
        }

        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateAttributes);

        if (authUpdateError) {
            console.error("Auth Update Error:", authUpdateError.message);
            throw authUpdateError;
        }

        console.log("Usuário atualizado com sucesso:", userId);
        return NextResponse.json({ message: 'Usuário atualizado com sucesso' });

    } catch (error: any) {
        console.error('Update User Exception:', error);
        return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 });
    }
}
