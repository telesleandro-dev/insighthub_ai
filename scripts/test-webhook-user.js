
async function test() {
    try {
        const url = 'http://localhost:3000/api/webhook/unified?user_id=c048be53-fff6-4446-a8b8-6abf79fce171';
        console.log('Testing URL:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'insight@220591lts_hub_protecao_2026_!'
            },
            body: JSON.stringify({
                "source": "insighthub",
                "platform": "Kiwify",
                "name": "João Silva",
                "email": "joao@teste.com",
                "product_name": "Curso de Vendas",
                "value": 497.0,
                "status": "abandoned",
                "transaction_id": "TRS-224"
            })
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Body:', text);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

test();
