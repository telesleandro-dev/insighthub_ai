const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kslrgyhcfkgbkbjimfay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHJneWhjZmtnYmtiamltZmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU2NTY1MywiZXhwIjoyMDg0MTQxNjUzfQ.1IWguc9g3rYVTV-r83vECCxsJ6dRNRIpgbc1GI6OyAc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectUserIds() {
    console.log('--- COMPARAÇÃO DE USER_ID ---');
    const { data: events } = await supabase
        .from('sales_events')
        .select('id, user_id, status, customer_email');

    events.forEach(e => {
        console.log(`[${e.status}] ID: ${e.id} | User: ${e.user_id} | Email: ${e.customer_email}`);
    });
}

inspectUserIds();
