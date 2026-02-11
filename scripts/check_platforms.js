
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlatforms() {
    console.log('--- Checking Supported Platforms ---');
    const { data, error } = await supabase.from('supported_platforms').select('*');
    if (error) console.error(error);
    else console.table(data);
}

checkPlatforms();
