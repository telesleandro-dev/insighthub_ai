
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function runTest() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const email = 'teste.sniper.18@insight-hub.ai';
    const userId = process.env.TEST_USER_ID;
    const webhookSecret = process.env.WEBHOOK_SECRET;

    console.log(`📡 Iniciando teste nativo para ${email}...`);

    // 1. Marcar como "contacted"
    console.log('📝 Passo 1: Marcando lead como "contacted"...');
    const { error: updateError } = await supabase
        .from('leads_profiles')
        .update({ service_status: 'contacted' })
        .eq('email', email);

    if (updateError) {
        console.error('❌ Erro no Passo 1:', updateError.message);
        return;
    }

    // 2. Disparar Webhook usando global fetch
    console.log('🚀 Passo 2: Disparando Webhook de Venda Aprovada...');
    const url = `http://localhost:3000/api/webhook/unified?user_id=${userId}`;
    const payload = {
        "order_id": "sim_order_" + Date.now(),
        "order_status": "paid",
        "store_id": "store_sniper_main",
        "customer": {
            "email": email,
            "first_name": "Lead Teste Sniper 18",
            "mobile": "551199999918"
        },
        "Product": {
            "product_id": "prod_1",
            "product_name": "Produto Sniper Premium"
        },
        "order_amount": 9700
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': webhookSecret
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('✅ Resposta do Webhook:', JSON.stringify(data, null, 2));

        // 3. Verificar status final
        console.log('🔍 Passo 3: Verificando status final no banco...');
        const { data: lead } = await supabase
            .from('leads_profiles')
            .select('service_status, converted_value')
            .eq('email', email)
            .single();

        console.log('📊 Dados no Banco:', JSON.stringify(lead, null, 2));

        if (lead.service_status === 'converted') {
            console.log('🎉 SUCESSO! Conversão automática validada.');
        } else {
            console.log('⚠️ Status resultante:', lead.service_status);
        }

    } catch (error) {
        console.error('❌ Erro no processamento:', error.message);
    }
}

runTest();
