const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) return;
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2 && !line.startsWith('#')) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
                process.env[key] = value;
            }
        });
    } catch (e) { }
}

loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(URL, SERVICE_KEY);

async function migrate() {
    console.log('--- Rescuing Leads for Admin ---');

    // 1. Get Admin ID
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const admin = users.find(u => u.email === 'admin@insighthub.ai');

    if (!admin) {
        console.error('Admin user not found!');
        return;
    }

    console.log(`Target Admin ID: ${admin.id}`);

    // 2. Update existing leads with ANY ID or NULL ID to this admin
    // This is safe for localhost debugging.
    const { data, error } = await supabase
        .from('sales_events')
        .update({ user_id: admin.id })
        .or(`user_id.is.null,user_id.eq.c048be53-fff6-4446-a8b8-6abf79fce171`);

    if (error) {
        console.error('Error migrating leads:', error.message);
    } else {
        console.log('Migration successful! Existing leads now belong to Admin.');
    }
}

migrate();
