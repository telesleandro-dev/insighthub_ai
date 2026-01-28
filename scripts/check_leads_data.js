const { createClient } = require('@supabase/supabase-js');

const URL = 'https://kslrgyhcfkgbkbjimfay.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHJneWhjZmtnYmtiamltZmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU2NTY1MywiZXhwIjoyMDg0MTQxNjUzfQ.1IWguc9g3rYVTV-r83vECCxsJ6dRNRIpgbc1GI6OyAc';

const supabase = createClient(URL, SERVICE_KEY);

async function checkLeads() {
    const { data, error } = await supabase.from('sales_events').select('id, user_id, customer_name').limit(10);
    if (error) {
        console.error('Error fetching leads:', error.message);
        return;
    }
    console.log('Sample leads in database:');
    console.log(JSON.stringify(data, null, 2));
}

checkLeads();
