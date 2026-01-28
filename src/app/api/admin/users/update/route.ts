
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Admin
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // 2. Parse Body
        const { userId, name, role, insighthub_email, email } = await req.json();

        if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

        // 3. Update Profile
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
                name,
                role,
                insighthub_email,
                email // Update email in specific profile table reference
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        // Update Auth Data (Email and Metadata)
        const updateAttributes: any = {
            user_metadata: { name, role, insighthub_email }
        };

        // Only update email if provided and different
        if (email) {
            const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId);
            if (targetUser?.user?.email !== email) {
                updateAttributes.email = email;
                updateAttributes.email_confirm = true;
            }
        }

        await supabaseAdmin.auth.admin.updateUserById(userId, updateAttributes);

        return NextResponse.json({ message: 'User updated successfully' });

    } catch (error: any) {
        console.error('Update User Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
