const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kslrgyhcfkgbkbjimfay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHJneWhjZmtnYmtiamltZmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU2NTY1MywiZXhwIjoyMDg0MTQxNjUzfQ.1IWguc9g3rYVTV-r83vECCxsJ6dRNRIpgbc1GI6OyAc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectFinal() {
    console.log('--- INSPEÇÃO FINAL DE CORREÇÃO ---');
    const email = 'bruno.abandono@teste.com';

    // 1. Pegar User ID da config do usuário (simulando webhook)
    // O usuário que estamos usando é o que o webhook recebe via URL params
    const { data: config } = await supabase.from('user_configs').select('user_id').limit(1).single();
    const userId = config.user_id;

    console.log(`Config User ID: ${userId}`);

    // 2. Ver todos eventos desse email
    const { data: events } = await supabase
        .from('sales_events')
        .select('id, user_id, customer_email, status, recovery_status, status_abordagem');

    console.log('\nTodos Eventos no Banco:');
    events.forEach(e => {
        const matchesUser = e.user_id === userId;
        const matchesEmail = e.customer_email.trim().toLowerCase() === email.toLowerCase();
        console.log(`- ID: ${e.id}`);
        console.log(`  Status: ${e.status} | Abordagem: ${e.status_abordagem} | RecStatus: ${e.recovery_status}`);
        console.log(`  User: ${e.user_id} (Match: ${matchesUser})`);
        console.log(`  Email: "${e.customer_email}" (Match: ${matchesEmail})`);
    });
}

inspectFinal();
