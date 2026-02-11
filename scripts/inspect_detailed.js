const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kslrgyhcfkgbkbjimfay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHJneWhjZmtnYmtiamltZmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU2NTY1MywiZXhwIjoyMDg0MTQxNjUzfQ.1IWguc9g3rYVTV-r83vECCxsJ6dRNRIpgbc1GI6OyAc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectFull() {
    console.log('--- INSPEÇÃO DETALHADA ---');
    const email = 'bruno.abandono@teste.com';

    // 1. Ver Perfil
    const { data: profile } = await supabase
        .from('leads_profiles')
        .select('*')
        .eq('email', email)
        .single();

    console.log('\n--- PERFIL ---');
    console.log(profile);

    // 2. Ver Eventos
    const { data: events } = await supabase
        .from('sales_events')
        .select('*')
        .eq('customer_email', email)
        .order('created_at', { ascending: false });

    console.log('\n--- EVENTOS ---');
    console.log(JSON.stringify(events, null, 2));

    // 3. Ver Logs Recentes para ver se houve erro no cleanup
    const { data: logs } = await supabase
        .from('webhooks_log')
        .select('*')
        .eq('user_id', profile?.user_id)
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('\n--- LOGS RECENTES ---');
    console.log(JSON.stringify(logs, null, 2));
}

inspectFull();
