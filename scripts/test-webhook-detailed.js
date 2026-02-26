
const http = require('http');

const data = JSON.stringify({
    "source": "insighthub",
    "platform": "Kiwify",
    "name": "João Silva",
    "email": "joao@teste.com",
    "product_name": "Curso de Vendas",
    "value": 497.0,
    "status": "abandoned",
    "transaction_id": "TRS-224"
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/webhook/unified?user_id=c048be53-fff6-4446-a8b8-6abf79fce171',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'insight@220591lts_hub_protecao_2026_!',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`Body: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
