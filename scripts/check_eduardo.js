
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEduardoEvents() {
    console.log('--- Checking Events for Eduardo ---');

    // We search by email 'edu@cartao.com' as per user report
    const email = 'edu@cartao.com';

    // 1. Check Profile
    const { data: profile } = await supabase.from('leads_profiles').select('*').eq('email', email).maybeSingle();
    console.log('Profile:', JSON.stringify(profile, null, 2));

    // 2. Check Events
    const { data: events } = await supabase.from('sales_events')
        .select('id, status, value, recovery_status, status_abordagem, external_transaction_id, created_at')
        .eq('customer_email', email)
        .order('created_at', { ascending: true });

    if (events && events.length > 0) {
        console.log('Events:', JSON.stringify(events, null, 2));
    } else {
        console.log('No Sales Events found for this email.');
    }
}

checkEduardoEvents();
