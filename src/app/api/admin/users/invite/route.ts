import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// We need the SERVICE_ROLE_KEY to perform admin actions (inviteUserByEmail)
// This key bypasses RLS, so we must be very careful with it.
// Ensure these environment variables are set in your .env.local
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(req: NextRequest) {
    try {
        // 1. Verify if the requester is an Admin
        // We can't trust the client-side session fully here for high-privilege actions without double-checking.
        // However, since we are using the SERVICE_ROLE_KEY, we are already "God Mode".
        // Ideally, we should parse the user's JWT from the request headers to check their role.
        // For MVP simplicty: We assume middleware protects this route or we do a quick check if possible.

        // BETTER APPROACH: Use the standard client to get the user, then check their role in the DB.
        // But inviteUserByEmail REQUIRES service_role. 
        // So the pattern is: 
        //   a) Get current user from request header (Authorization: Bearer <token>)
        //   b) Check if that user has role='admin' in public.profiles
        //   c) If yes, proceed with supabaseAdmin.

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        // Check Role
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
        }

        // 2. Parse Request Body
        const { email, name, insighthub_email } = await req.json();

        if (!email || !insighthub_email) {
            return NextResponse.json({ error: 'Email and InsightHub Handle are required' }, { status: 400 });
        }

        // 3. Check if InsightHub Email is unique
        const { data: existingHandle } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('insighthub_email', insighthub_email)
            .single();

        if (existingHandle) {
            return NextResponse.json({ error: 'Identifier already in use' }, { status: 409 });
        }

        // 4. Invite User via Supabase Auth
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                name,
                insighthub_email,
                role: 'user' // Default to 'user' role
            },
            redirectTo: `${new URL(req.url).origin}/definir-senha` // Redirect to password set page
        });

        if (inviteError) {
            return NextResponse.json({ error: inviteError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, userId: inviteData.user.id });

    } catch (err: any) {
        console.error("Invite Error:", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
