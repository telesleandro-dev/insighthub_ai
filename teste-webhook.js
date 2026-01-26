const axios = require('axios');

// CONFIGURAÇÕES DE TESTE
const URL_WEBHOOK = 'http://localhost:3000/api/webhook/kiwify';
const WEBHOOK_SECRET = 'insight@220591lts_hub_protecao_2026_!';

// SIMULAÇÃO DE PAYLOAD DA KIWIFY (Abandono de Carrinho)
const payloadSimulado = {
  product_name: "Curso InsightHub AI Gold",
  order_amount: 49700, // R$ 497,00
  status: "waiting_payment",
  Customer: {
    full_name: "Leandro Teste PM",
    email: "teste@insighthub.com",
    mobile: "5571999999999" // Coloque o seu número para testar o botão!
  }
};

async function enviarTeste() {
  console.log('🚀 Iniciando teste de Webhook...');

  try {
    const response = await axios.post(URL_WEBHOOK, payloadSimulado, {
      headers: {
        'Content-Type': 'application/json',
        'x-hub-token': WEBHOOK_SECRET // Valida a segurança que criamos
      }
    });

    console.log('✅ Status da Resposta:', response.status);
    console.log('🤖 Resposta da IA:', response.data.ai_analysis || 'Processado com sucesso!');
    console.log('\n📱 VERIFIQUE O SEU TELEGRAM!');

  } catch (error) {
    console.error('❌ Erro no Teste:', error.response?.data || error.message);
  }
}

enviarTeste();