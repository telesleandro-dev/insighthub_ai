
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
    console.log('--- Inspecting Sales Events ---');
    const { data: events, error } = await supabase
        .from('sales_events')
        .select(`
            id, 
            customer_email, 
            value, 
            status, 
            recovery_status, 
            status_abordagem,
            created_at,
            user_id
        `)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) console.error('Error fetching events:', error);
    else console.table(events);

    console.log('--- Inspecting Leads Profiles ---');
    const { data: profiles, error: pError } = await supabase
        .from('leads_profiles')
        .select(`
            id, 
            email, 
            service_status, 
            lead_score, 
            updated_at
        `)
        .order('updated_at', { ascending: false })
        .limit(10);

    if (pError) console.error('Error fetching profiles:', pError);
    else console.table(profiles);
}

inspectData();
