const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local manually since we are not using dotenv package
// and we want this to be dependency-free besides supabase-js
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) {
            console.warn('⚠️ .env.local not found. Ensuring environment variables are set manually.');
            return;
        }
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2 && !line.startsWith('#')) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/^"|"$/g, ''); // Remove quotes
                process.env[key] = value;
            }
        });
    } catch (e) {
        console.error('Error loading .env.local:', e);
    }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createUser(email, password, name, role, handle) {
    console.log(`\nCreating user: ${email} (${role})...`);

    // 1. Check if user exists
    // We can't easily "get by email" with admin API in all versions without listing, 
    // but let's try to just create and handle error.

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role, insighthub_email: handle }
    });

    if (error) {
        console.log(`ℹ️ User creation note: ${error.message}`);
        // If user exists, we might need to update metadata.
        if (error.message.includes('already registered')) {
            console.log(`   User already exists. Attempting to update profile/metadata...`);
            // We need the ID. List users to find it.
            const { data: listData } = await supabase.auth.admin.listUsers();
            const existingUser = listData.users.find(u => u.email === email);

            if (existingUser) {
                // Update Auth Metadata AND Password to ensure sync
                await supabase.auth.admin.updateUserById(existingUser.id, {
                    password: password,
                    user_metadata: { name, role, insighthub_email: handle }
                });

                // Upsert Profile (in case trigger didn't fire or data is stale)
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: existingUser.id,
                        email: email,
                        name: name,
                        role: role,
                        insighthub_email: handle
                    });

                if (profileError) console.error(`   ❌ Profile update failed: ${profileError.message}`);
                else console.log(`   ✅ User profile updated successfully.`);

                return existingUser;
            }
        }
        return null;
    }

    console.log(`✅ User created: ${data.user.id}`);
    return data.user;
}

async function main() {
    console.log('🚀 Starting User Seeding...');

    // 1. Create Admin
    await createUser(
        'admin@insighthub.ai',
        'admin123',
        'Administrador Principal',
        'admin',
        'admin@insighthubai.com'
    );

    // 2. Create Common User
    await createUser(
        'user@insighthub.ai',
        'user123',
        'Usuário Teste',
        'user',
        'teste@insighthubai.com'
    );

    console.log('\n✨ Seeding completed!');
    console.log('------------------------------------------------');
    console.log('Credentials:');
    console.log('Admin: admin@insighthub.ai / admin123');
    console.log('User:  user@insighthub.ai  / user123');
    console.log('------------------------------------------------');
}

main();
