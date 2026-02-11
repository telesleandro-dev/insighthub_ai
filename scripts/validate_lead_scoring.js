/**
 * Script de Validação de Score e IA
 * Este script simula o recebimento de webhooks para testar a lógica de pontuação.
 * 
 * Uso: node scripts/validate_lead_scoring.js <USER_ID> <EMAIL_TESTE> <STATUS>
 * Status: abandoned, refused, approved
 */

const axios = require('axios');

async function simulateWebhook(userId, email, status) {
    const url = `http://localhost:3000/api/webhook/unified?user_id=${userId}`;

    // Payload simulando Kiwify (um dos adaptadores suportados)
    const payload = {
        order_status: status === 'approved' ? 'paid' : (status === 'refused' ? 'refused' : 'abandoned'),
        customer: {
            full_name: 'Lead de Teste Validação',
            email: email,
            mobile: '5511999999999'
        },
        product: {
            product_name: 'Produto de Teste Score',
            product_id: 'prod_test_123'
        },
        order_id: 'ord_' + Math.random().toString(36).substr(2, 9),
        payment_method: 'credit_card'
    };

    console.log(`\n🚀 [Simulador] Enviando status "${status}" para ${email}...`);

    try {
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('✅ Resposta do Webhook:', response.data);
        console.log('\n--- PRÓXIMOS PASSOS ---');
        console.log('1. Verifique o Score no Dashboard do InsightHub.');
        console.log('2. Se Score >= 50, clique em "Mensagem Inteligente" para validar a IA Gemini.');
        console.log('3. Se Score < 50, clique em "Mensagem Inteligente" para validar o Fallback.');
    } catch (error) {
        console.error('❌ Erro na simulação:', error.response?.data || error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('ERRO: O servidor deve estar rodando (npm run dev) em localhost:3000');
        }
    }
}

const args = process.argv.slice(2);
if (args.length < 3) {
    console.log('Uso: node scripts/validate_lead_scoring.js <USER_ID> <EMAIL_TESTE> <STATUS>');
    console.log('Status sugeridos: abandoned, refused, approved');
    process.exit(1);
}

const [userId, email, status] = args;
simulateWebhook(userId, email, status);
