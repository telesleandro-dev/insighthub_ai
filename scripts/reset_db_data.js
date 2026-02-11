const { createClient } = require('@supabase/supabase-js');

// Hardcoded for reliability in this specific task context
const supabaseUrl = 'https://kslrgyhcfkgbkbjimfay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHJneWhjZmtnYmtiamltZmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU2NTY1MywiZXhwIjoyMDg0MTQxNjUzfQ.1IWguc9g3rYVTV-r83vECCxsJ6dRNRIpgbc1GI6OyAc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetDatabase() {
    console.log('🧹 Iniciando limpeza do banco de dados...');

    // 1. Limpar Logs de Webhoook
    const { error: errorLogs } = await supabase.from('webhooks_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errorLogs) console.error('Erro ao limpar webhooks_log:', errorLogs.message);
    else console.log('✅ webhooks_log limpo.');

    // 2. Limpar Eventos de Venda
    const { error: errorSales } = await supabase.from('sales_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errorSales) console.error('Erro ao limpar sales_events:', errorSales.message);
    else console.log('✅ sales_events limpo.');

    // 3. Limpar Perfis de Leads
    const { error: errorProfiles } = await supabase.from('leads_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (errorProfiles) console.error('Erro ao limpar leads_profiles:', errorProfiles.message);
    else console.log('✅ leads_profiles limpo.');

    console.log('✨ Base de dados limpa com sucesso!');
}

resetDatabase();
