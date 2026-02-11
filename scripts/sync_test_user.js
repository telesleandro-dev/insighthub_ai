
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncUser() {
    const userId = '90d0d014-e2ea-499f8-9fb1-d17b662fa43f';
    const email = 'test@insighthub.ai';

    // Insert into public.users
    const { error } = await supabase.from('users').insert({
        id: userId,
        email: email,
        name: 'Test User',
        role: 'admin' // Adjust as per your schema
    });

    if (error) {
        console.error('Error syncing user:', error);
    } else {
        console.log('User synced to public.users');
    }
}

syncUser();
