
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
    const { data, error } = await supabase.auth.admin.createUser({
        email: 'test@insighthub.ai',
        password: 'password123',
        email_confirm: true
    });

    if (error) {
        console.error('Error creating user:', error);
        // Try getting the user if already exists
        const { data: users } = await supabase.auth.admin.listUsers();
        if (users && users.users.length > 0) {
            console.log('User already exists, ID:', users.users[0].id);
            return users.users[0].id;
        }
        return null;
    }

    console.log('User created:', data.user.id);

    // Also insert into public.users if your app uses a separate table, 
    // but usually auth.users is distinct. 
    // Check if you have a public.users table trigger or need manual insert.
    // Based on previous logs, it seems you use specific user_id in leads_profiles.

    return data.user.id;
}

createTestUser();
