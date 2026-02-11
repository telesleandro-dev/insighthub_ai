
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

    if (error) console.error(error);
    else console.log(data);
}

// Also check constraints for leads_profiles
async function checkConstraints() {
    // This requires RPC if available or we can try to infer from error
    console.log('--- Tables ---');
    await listTables();
}

checkConstraints();
