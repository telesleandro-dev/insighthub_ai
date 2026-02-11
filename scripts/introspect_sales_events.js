
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('Inspecting sales_events...');
    const { data, error } = await supabase.from('sales_events').select('*').limit(1);
    if (error) console.log('Error:', error);
    else if (data && data.length > 0) console.log('Columns:', Object.keys(data[0]));
    else console.log('Table empty or no columns returned');
}

inspect();
