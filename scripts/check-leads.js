
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const userId = process.env.TEST_USER_ID;

async function check() {
    const { data } = await supabase.from('leads_profiles').select('email, service_status, last_event_type').eq('user_id', userId).order('email');
    console.log('EMAIL'.padEnd(35), 'SERVICE_STATUS'.padEnd(15), 'LAST_EVENT_TYPE');
    data.forEach(d => {
        console.log(d.email.padEnd(35), d.service_status.padEnd(15), d.last_event_type);
    });
}
check();
