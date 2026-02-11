const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kslrgyhcfkgbkbjimfay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHJneWhjZmtnYmtiamltZmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU2NTY1MywiZXhwIjoyMDg0MTQxNjUzfQ.1IWguc9g3rYVTV-r83vECCxsJ6dRNRIpgbc1GI6OyAc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectExactV2() {
    console.log('--- INSPEÇÃO EXATA V2 ---');
    const { data: events, error } = await supabase
        .from('sales_events')
        .select('*')
        .eq('customer_email', 'bruno.abandono@teste.com');

    if (error) {
        console.error(error);
    } else {
        events.forEach(e => {
            console.log(`ID: ${e.id}`);
            console.log(`  User: ${e.user_id}`);
            console.log(`  Email: "${e.customer_email}"`);
            console.log(`  Status: ${e.status}`);
            console.log(`  Abordagem: ${e.status_abordagem}`);
            console.log(`  Recovery: ${e.recovery_status}`);
            console.log('---------------------------');
        });
    }
}

inspectExactV2();
