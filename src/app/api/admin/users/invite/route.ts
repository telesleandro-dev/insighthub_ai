import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// We need the SERVICE_ROLE_KEY to perform admin actions (inviteUserByEmail)
// This key bypasses RLS, so we must be very careful with it.
// Ensure these environment variables are set in your .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("CRITICAL: Supabase environment variables are missing!");
}

const supabaseAdmin = createClient(
    supabaseUrl || '',
    serviceRoleKey || '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(req: NextRequest) {
    try {
        // 0. Defensive check for configuration
        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({ error: 'Server configuration error: Missing API Keys' }, { status: 500 });
        }

        // 1. Verify if the requester is an Admin
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            console.error("Auth verification failed:", userError?.message);
            return NextResponse.json({ error: 'Acesso negado: Sessão inválida' }, { status: 401 });
        }

        // Check Role
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

        if (profileError || profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado: Apenas administradores podem convidar usuários' }, { status: 403 });
        }

        // 2. Parse Request Body
        const body = await req.json();
        const { email, name, insighthub_email, role = 'user' } = body;

        if (!email || !insighthub_email) {
            return NextResponse.json({ error: 'E-mail e Handle InsightHub são obrigatórios' }, { status: 400 });
        }

        // Validate role
        if (role !== 'user' && role !== 'admin') {
            return NextResponse.json({ error: 'Role inválido. Use "user" ou "admin"' }, { status: 400 });
        }

        console.log(`Iniciando convite para: ${email} (${insighthub_email}) como ${role}`);

        // 3. Check if InsightHub Email is unique
        const { data: existingHandle, error: handleCheckError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('insighthub_email', insighthub_email)
            .maybeSingle();

        if (handleCheckError) {
            console.error("Database check error:", handleCheckError);
            return NextResponse.json({ error: 'Erro ao verificar disponibilidade do handle' }, { status: 500 });
        }

        if (existingHandle) {
            return NextResponse.json({ error: 'Este Identificador InsightHub já está em uso' }, { status: 409 });
        }

        // 4. Invite User via Supabase Auth
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
        console.log("Using Redirect URL:", `${siteUrl}/auth/callback?next=/definir-senha`);

        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                name,
                insighthub_email,
                role
            },
            redirectTo: `${siteUrl}/auth/callback?next=/definir-senha`
        });

        if (inviteError) {
            console.error("Supabase Invite Error:", inviteError.message);
            return NextResponse.json({ error: `Erro no convite: ${inviteError.message}` }, { status: 500 });
        }

        console.log("Convite enviado com sucesso para:", inviteData.user.id);
        return NextResponse.json({ success: true, userId: inviteData.user.id });

    } catch (err: any) {
        console.error("Invite Exception:", err);
        return NextResponse.json({ error: `Erro interno no servidor: ${err.message || 'Desconhecido'}` }, { status: 500 });
    }
}
