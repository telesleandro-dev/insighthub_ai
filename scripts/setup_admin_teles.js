const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const defaultPassword = process.env.NEXT_PUBLIC_DEFAULT_USER_PASSWORD || 'insighthub_protecao_2026_!';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars (run with node --env-file=.env.local)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAdmin() {
    const email = 'teles.engmec@gmail.com';
    console.log(`\n--- Setting up user: ${email} ---`);

    // 1. Check Auth User
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existing = users.find(u => u.email === email);
    let userId;

    if (existing) {
        console.log(`User exists in Auth (ID: ${existing.id}). Updating to confirmed and setting password...`);
        const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
            password: defaultPassword,
            email_confirm: true,
            user_metadata: { name: 'Leandro Teles', role: 'admin' }
        });
        if (error) {
            console.error(`Failed to update Auth: ${error.message}`);
            return;
        }
        userId = existing.id;
        console.log('Auth updated successfully.');
    } else {
        console.log(`User not found in Auth. Creating new confirmed user...`);
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password: defaultPassword,
            email_confirm: true,
            user_metadata: { name: 'Leandro Teles', role: 'admin' }
        });
        if (error) {
            console.error(`Failed to create Auth: ${error.message}`);
            return;
        }
        userId = data.user.id;
        console.log(`User created successfully (ID: ${userId}).`);
    }

    // 2. Ensure Profile exists and is admin
    console.log(`Ensuring profile exists for ${userId}...`);
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            email: email,
            name: 'Leandro Teles',
            role: 'admin',
            insighthub_email: 'leandro.teles'
        }, { onConflict: 'id' });

    if (profileError) {
        console.error(`Failed to upsert profile: ${profileError.message}`);
    } else {
        console.log('Profile synchronized and set as admin.');
    }

    console.log('\n--- Done! You can now login with this email. ---');
}

setupAdmin();
