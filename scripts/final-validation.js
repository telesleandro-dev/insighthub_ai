
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function finalTest() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const email = 'teste.sniper.18@insight-hub.ai';
    const userId = process.env.TEST_USER_ID;
    const webhookSecret = process.env.WEBHOOK_SECRET;

    console.log(`📡 [Teste Final] Preparando lead antigo ${email} para conversão...`);

    // 1. Resetar Status para 'processed' (IA já rodou mas não foi contatado)
    // Isso deve bastar agora para contar ROI
    await supabase.from('leads_profiles').update({
        service_status: 'processed',
        converted_value: 0,
        last_event_type: 'abandoned'
    }).eq('email', email);

    console.log('📝 Passo 1: Lead resetado para "processed".');

    // 2. Disparar Webhook
    console.log('🚀 Passo 2: Disparando Webhook de Venda Aprovada...');
    const url = `http://localhost:3000/api/webhook/unified?user_id=${userId}`;
    const payload = {
        "order_id": "final_sim_" + Date.now(),
        "order_status": "approved",
        "store_id": "store_sniper_main",
        "customer": { "email": email },
        "Product": { "product_name": "Sniper Pro" },
        "order_amount": 15000 // R$ 150,00
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': webhookSecret },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('✅ Resposta:', JSON.stringify(data, null, 2));

    // 3. Verificar se virou 'converted' e se updated_at é agora
    const { data: lead } = await supabase
        .from('leads_profiles')
        .select('service_status, converted_value, updated_at')
        .eq('email', email)
        .single();

    console.log('📊 Estado no Banco:', JSON.stringify(lead, null, 2));

    if (lead.service_status === 'converted' && lead.converted_value === 150) {
        console.log('🎉 SUCESSO! A regra flexível de ROI funcionou.');
    } else {
        console.log('❌ FALHA na conversão do status.');
    }
}

finalTest();
