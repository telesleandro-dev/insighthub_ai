const { createClient } = require('@supabase/supabase-js');

// Constants for direct testing (taken from .env.local)
const URL = 'https://kslrgyhcfkgbkbjimfay.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHJneWhjZmtnYmtiamltZmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU2NTY1MywiZXhwIjoyMDg0MTQxNjUzfQ.1IWguc9g3rYVTV-r83vECCxsJ6dRNRIpgbc1GI6OyAc';

const supabase = createClient(URL, SERVICE_KEY);

async function create(email, password, name, role) {
    console.log(`\n--- Attempting to create user: ${email} ---`);

    // Check if user exists first by listing
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existing = users.find(u => u.email === email);

    if (existing) {
        console.log(`Found existing user with ID: ${existing.id}. Updating password...`);
        const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
            password: password,
            user_metadata: { name, role }
        });
        if (error) console.error(`Failed to update: ${error.message}`);
        else console.log(`Successfully updated ${email}`);
    } else {
        console.log(`User not found. Creating new...`);
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role }
        });
        if (error) console.error(`Failed to create: ${error.message}`);
        else console.log(`Successfully created ${email} (ID: ${data.user.id})`);
    }
}

async function run() {
    await create('admin@insighthub.ai', 'admin123', 'Admin', 'admin');
    await create('user@insighthub.ai', 'user123', 'User', 'user');
    console.log('\n--- Done ---');
}

run();
