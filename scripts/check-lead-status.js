
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkLeadStatusGap() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const email = 'teste.sniper.18@insight-hub.ai';

    console.log(`🔍 Verificando status do lead: ${email}`);

    const { data: lead, error } = await supabase
        .from('leads_profiles')
        .select('email, service_status, converted_value, last_event_type, updated_at')
        .eq('email', email)
        .single();

    if (error) {
        console.error('❌ Erro ao buscar lead:', error.message);
        return;
    }

    console.log('📊 Dados do Lead após Webhook:');
    console.log(JSON.stringify(lead, null, 2));

    if (lead.service_status === 'converted' || lead.service_status === 'direct_sale') {
        console.log('✅ SUCESSO: O sistema recebeu a conversão automaticamente!');
    } else {
        console.log('❌ FALHA: O status continua como', lead.service_status);
    }
}

checkLeadStatusGap();
