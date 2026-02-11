
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDB() {
    console.log('--- Setting up DB for Testing ---');

    // 1. Check if public.users exists, if not create it (simplest version)
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY REFERENCES auth.users(id),
            email TEXT,
            name TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { sql_query: createUsersTable });
    if (createError) console.log('Create Table Error (might be permission or prohibited):', createError);
    else console.log('Checked/Created public.users');

    // 2. Insert User
    const userId = 'dfe126ac-0bb0-46d9-9d4a-938a22044a4f';
    const email = 'test_setup@insighthub.ai';

    // Ensure Auth User
    const { data: createAuthData, error: createAuthError } = await supabase.auth.admin.createUser({
        uid: userId, // Some providers allow specifying ID
        email: email,
        password: 'password123',
        email_confirm: true
    });

    if (createAuthError) console.log('Create Auth User Error:', createAuthError.message);
    else console.log('Auth User Created/Exists:', createAuthData.user?.id);

    // Insert into Public Users (using direct insert)
    const { error: insertError } = await supabase.from('users').upsert({
        id: userId,
        email: email,
        name: 'Test Setup User'
    });

    if (insertError) console.log('Insert User Error:', insertError);
    else console.log('User Inserted into public.users');

    // VERIFY
    console.log('--- Verifying ---');
    const { data: publicUser } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    console.log('Public User Exists:', !!publicUser);

    // Check Auth User via Admin API
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError) console.log('Auth User Error:', authError.message);
    else console.log('Auth User Exists:', !!authUser.user);

}

setupDB();
