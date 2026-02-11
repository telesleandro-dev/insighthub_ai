
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuth() {
    console.log('Checking Auth User...');
    const userId = '90d0d014-e2ea-499f-9fb1-d17b662fa43f';

    const { data, error } = await supabase.auth.admin.getUserById(userId);

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('User Found:', data.user ? data.user.id : 'No User');
    }
}

checkAuth();
