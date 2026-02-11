const { createClient } = require('@supabase/supabase-js');

// Hardcoded for reliability in this specific task context
const supabaseUrl = 'https://kslrgyhcfkgbkbjimfay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHJneWhjZmtnYmtiamltZmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU2NTY1MywiZXhwIjoyMDg0MTQxNjUzfQ.1IWguc9g3rYVTV-r83vECCxsJ6dRNRIpgbc1GI6OyAc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateContact() {
    console.log('📞 Simulando contato com Bruno Abandono...');

    const { data: lead, error } = await supabase
        .from('leads_profiles')
        .update({ service_status: 'contacted' })
        .eq('email', 'bruno.abandono@teste.com')
        .select()
        .single();

    if (error) {
        console.error('❌ Erro ao atualizar:', error.message);
    } else {
        console.log('✅ Status atualizado para CONTACTED!');
        console.log('Lead:', lead.name, '| Status:', lead.service_status);
    }
}

simulateContact();
