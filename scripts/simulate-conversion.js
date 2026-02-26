
async function simulateConversion() {
    const userId = 'c048be53-fff6-4446-a8b8-6abf79fce171';
    const webhookSecret = 'insight@220591lts_hub_protecao_2026_!';
    // Usando IP local para evitar problemas de DNS se houver
    const url = `http://localhost:3000/api/webhook/unified?user_id=${userId}`;

    const payload = {
        "order_status": "paid",
        "customer": {
            "first_name": "Lead Teste Sniper 18",
            "email": "teste.sniper.18@insight-hub.ai",
            "mobile": "551199999918"
        },
        "product": {
            "name": "Produto Sniper Premium",
            "id": "prod_sniper_99"
        },
        "payment": {
            "amount": 97.00,
            "method": "credit_card"
        },
        "order_id": "sim_order_" + Date.now()
    };

    console.log('🚀 Enviando simulação para:', url);

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
    } catch (error) {
        console.error('❌ Erro na simulação:', error.message);
    }
}

simulateConversion();
