const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kslrgyhcfkgbkbjimfay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHJneWhjZmtnYmtiamltZmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU2NTY1MywiZXhwIjoyMDg0MTQxNjUzfQ.1IWguc9g3rYVTV-r83vECCxsJ6dRNRIpgbc1GI6OyAc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectExact() {
    console.log('--- INSPEÇÃO EXATA ---');
    const { data: events, error } = await supabase
        .from('sales_events')
        .select('id, status, status_abordagem, recovery_status, customer_email')
        .eq('customer_email', 'bruno.abandono@teste.com');

    if (error) {
        console.error(error);
    } else {
        console.log(JSON.stringify(events, null, 2));
    }
}

inspectExact();
