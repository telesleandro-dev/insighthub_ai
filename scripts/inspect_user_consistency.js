const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kslrgyhcfkgbkbjimfay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHJneWhjZmtnYmtiamltZmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU2NTY1MywiZXhwIjoyMDg0MTQxNjUzfQ.1IWguc9g3rYVTV-r83vECCxsJ6dRNRIpgbc1GI6OyAc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectUserConsistency() {
    console.log('--- CONSISTÊNCIA DE USER_ID ---');

    // 1. Pegar User ID da config
    const { data: config } = await supabase.from('user_configs').select('user_id').limit(1).single();
    const configUserId = config.user_id;
    console.log(`Config User ID: ${configUserId}`);

    // 2. Ver eventos do Bruno
    const { data: events } = await supabase
        .from('sales_events')
        .select('id, user_id, status, status_abordagem, recovery_status')
        .eq('customer_email', 'bruno.abandono@teste.com');

    console.log(`Encontrados ${events.length} eventos para o Bruno.`);

    events.forEach(e => {
        const match = e.user_id === configUserId;
        console.log(`[${e.status}] ID: ${e.id}`);
        console.log(`  User: ${e.user_id} | Match: ${match}`);
        console.log(`  Abordagem: ${e.status_abordagem} | Rec: ${e.recovery_status}`);
    });
}

inspectUserConsistency();
