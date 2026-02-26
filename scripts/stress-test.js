
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userId = process.env.TEST_USER_ID || 'c048be53-fff6-4446-a8b8-6abf79fce171';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function stressTest() {
    console.log('🧹 Iniciando Limpeza Geral...');

    // Limpar tabelas (Filtra por user_id para segurança, mas o usuário pediu limpeza geral)
    await supabase.from('webhooks_log').delete().eq('user_id', userId);
    await supabase.from('sales_events').delete().eq('user_id', userId);
    await supabase.from('leads_profiles').delete().eq('user_id', userId);

    console.log('✅ Base limpa.');

    const products = [
        { name: 'Curso de Persuasão', value: 497 },
        { name: 'Mentoria Sniper Elite', value: 2000 },
        { name: 'Ebook Scripts de Venda', value: 97 },
        { name: 'Workshop IA para Vendas', ordered: 1500 }
    ];

    const statuses = ['abandoned', 'refused', 'waiting_payment'];
    const leads = [];

    console.log('🚀 Gerando 20 leads de teste...');

    for (let i = 1; i <= 20; i++) {
        const status = statuses[i % statuses.length];
        const isProcessed = i > 10 && status !== 'waiting_payment'; // Somente se for falha real para ser processado
        const product = products[i % products.length];
        const email = `teste.sniper.${i}@insight-hub.ai`;
        const score = Math.floor(Math.random() * 100);

        // Variação de tempo (cada lead 5 min mais novo que o anterior)
        const date = new Date(Date.now() - (i * 5 * 60 * 1000));

        leads.push({
            user_id: userId,
            email: email,
            name: `Lead Teste Sniper ${i}`,
            phone: `551199999${i.toString().padStart(2, '0')}`,
            lead_score: score,
            service_status: isProcessed ? 'processed' : 'pending',
            lead_summary: isProcessed ? `🤖 DOSSIÊ SNIPER: Este é o lead número ${i}. Identificamos alta intenção de compra para o produto ${product.name}. Status na plataforma: ${status}.` : null,
            potential_value: product.value || 997,
            last_event_type: status,
            total_events: Math.floor(Math.random() * 3) + 1,
            created_at: date.toISOString(),
            updated_at: date.toISOString(),
            last_interaction_at: date.toISOString(),
            behavior_tags: score > 80 ? ['ALTA_INTENCAO', 'QUENTE'] : ['AVALIACAO'],
            product_history: [product.name]
        });
    }

    const { error } = await supabase.from('leads_profiles').insert(leads);

    if (error) {
        console.error('❌ Erro ao inserir leads:', error.message);
    } else {
        console.log('✨ 20 leads inseridos com sucesso!');
        console.log('📊 10 LEADS PENDENTES (Invisíveis)');
        console.log('📊 10 LEADS PROCESSADOS (Visíveis na tela)');
    }
}

stressTest();
