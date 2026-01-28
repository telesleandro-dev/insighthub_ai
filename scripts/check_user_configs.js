const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars (run with node --env-file=.env.local scripts/check_user_configs.js)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('Checking tables...');

    // Check user_configs
    const { data, error } = await supabase
        .from('user_configs')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error querying user_configs:', error);
        if (error.code === '42P01') {
            console.log('Table user_configs does NOT exist.');
        }
    } else {
        console.log('Table user_configs exists. Data sample:', data);
    }
}

listTables();
