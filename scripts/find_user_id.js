
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

async function findUser() {
    console.log('Searching for test_setup@insighthub.ai...');

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('List Users Error:', error.message);
        return;
    }

    const targetEmail = 'test_setup@insighthub.ai';
    const found = users.find(u => u.email === targetEmail);

    if (found) {
        require('fs').writeFileSync('user_id.txt', found.id);
        console.log('ID saved to user_id.txt');
    } else {
        console.log('❌ User NOT found in list.');
        // Print first 5 users to see format
        console.log('First 5 users:', users.slice(0, 5).map(u => ({ email: u.email, id: u.id })));
    }
}

findUser();
