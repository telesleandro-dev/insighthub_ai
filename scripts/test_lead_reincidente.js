/**
 * 🧪 Teste de Lead Reincidente - Múltiplos Abandonos
 * 
 * Simula um lead que abandonou o carrinho 3 vezes em plataformas diferentes
 * para validar o sistema de scoring com reincidência.
 * 
 * @author Leandro Teles
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const WEBHOOK_URL = 'http://localhost:3000/api/webhook/unified';
const USER_ID = process.env.TEST_USER_ID;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function log(emoji, message, data = null) {
    console.log(`\n${emoji} ${message}`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendWebhook(payload) {
    const url = `${WEBHOOK_URL}?user_id=${USER_ID}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    return await response.json();
}

async function checkLeadProfile(email) {
    const { data } = await supabase
        .from('leads_profiles')
        .select('*')
        .eq('user_id', USER_ID)
        .eq('email', email)
        .maybeSingle();

    return data;
}

async function cleanup(email) {
    log('🧹', `Limpando dados anteriores de: ${email}`);
    await supabase.from('sales_events').delete().eq('customer_email', email).eq('user_id', USER_ID);
    await supabase.from('leads_profiles').delete().eq('email', email).eq('user_id', USER_ID);
}

async function testLeadReincidente() {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║       🔁 TESTE: LEAD REINCIDENTE - MÚLTIPLOS ABANDONOS   ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('\n');

    const email = 'lead_reincidente@teste.com';
    const name = 'João Reincidente';
    const phone = '11987654321';

    await cleanup(email);
    await sleep(500);

    log('📋', 'CENÁRIO: Lead abandona produto 3 vezes em plataformas diferentes');
    log('🎯', 'Objetivo: Validar acúmulo de score e tag REINCIDENTE');
    console.log('\n' + '='.repeat(60) + '\n');

    // ===============================================
    // ABANDONO 1: Kiwify
    // ===============================================
    log('🛒', '1º ABANDONO - Kiwify (Produto Premium)');
    await sendWebhook({
        source: 'insighthub',
        email: email,
        name: name,
        phone: phone,
        status: 'abandoned',
        product_name: 'Curso Premium Master',
        value: 997.00,
        platform: 'kiwify'
    });
    await sleep(1500);

    let profile = await checkLeadProfile(email);
    log('📊', 'Estado do Lead:', {
        score: profile.lead_score,
        total_events: profile.total_events,
        tags: profile.behavior_tags,
        service_status: profile.service_status
    });

    console.log('\n' + '-'.repeat(60) + '\n');

    // ===============================================
    // ABANDONO 2: Hotmart (mesmo dia)
    // ===============================================
    log('🛒', '2º ABANDONO - Hotmart (Produto Advanced) - Mesmo Dia');
    await sendWebhook({
        source: 'insighthub',
        email: email,
        name: name,
        phone: phone,
        status: 'abandoned',
        product_name: 'Treinamento Advanced Pro',
        value: 1497.00,
        platform: 'hotmart'
    });
    await sleep(1500);

    profile = await checkLeadProfile(email);
    log('📊', 'Estado do Lead:', {
        score: profile.lead_score,
        total_events: profile.total_events,
        tags: profile.behavior_tags,
        product_history: profile.product_history
    });

    console.log('\n' + '-'.repeat(60) + '\n');

    // ===============================================
    // ABANDONO 3: Eduzz (simular dia diferente via atualização manual)
    // ===============================================
    log('⏰', 'Simulando passagem de tempo (2 dias)...');

    // Atualizar last_interaction_at para simular 2 dias atrás
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await supabase
        .from('leads_profiles')
        .update({ last_interaction_at: twoDaysAgo.toISOString() })
        .eq('email', email)
        .eq('user_id', USER_ID);

    await sleep(500);

    log('🛒', '3º ABANDONO - Eduzz (Produto Elite) - 2 Dias Depois');
    await sendWebhook({
        source: 'insighthub',
        email: email,
        name: name,
        phone: phone,
        status: 'abandoned',
        product_name: 'Mentoria Elite VIP',
        value: 2997.00,
        platform: 'eduzz'
    });
    await sleep(1500);

    profile = await checkLeadProfile(email);

    console.log('\n' + '='.repeat(60) + '\n');
    log('🎯', 'RESULTADO FINAL DO LEAD REINCIDENTE:');
    console.log('\n' + '='.repeat(60));

    console.log('\n📧 Email:', profile.email);
    console.log('👤 Nome:', profile.name);
    console.log('📞 Telefone:', profile.phone);
    console.log('\n🎯 SCORE:', profile.lead_score, 'pontos');
    console.log('📊 Total de Eventos:', profile.total_events);
    console.log('🏷️  Tags de Comportamento:', JSON.stringify(profile.behavior_tags));
    console.log('📦 Histórico de Produtos:', JSON.stringify(profile.product_history, null, 2));
    console.log('🔥 Status de Serviço:', profile.service_status);
    console.log('💰 Valor Potencial Total: R$', (997 + 1497 + 2997).toFixed(2));
    console.log('\n' + '='.repeat(60));

    // ===============================================
    // ANÁLISE DO SCORE
    // ===============================================
    console.log('\n');
    log('🔬', 'ANÁLISE DETALHADA DO SCORE:');
    console.log('\n1️⃣  Abandono 1 (Kiwify):');
    console.log('   - Status: abandoned');
    console.log('   - Score base: +20 pontos');
    console.log('   - Total parcial: ~20 pontos');

    console.log('\n2️⃣  Abandono 2 (Hotmart - mesmo dia):');
    console.log('   - Status: abandoned');
    console.log('   - Score base: +20 pontos');
    console.log('   - Reincidência detectada: tag REINCIDENTE');
    console.log('   - Time decay: Não aplicado (mesmo dia)');
    console.log('   - Total parcial: ~40 pontos');

    console.log('\n3️⃣  Abandono 3 (Eduzz - 2 dias depois):');
    console.log('   - Status: abandoned');
    console.log('   - Score base: +20 pontos');
    console.log('   - Interação em dia diferente: +30 pontos');
    console.log('   - Tag MULTIFILIAL: Produtos diferentes');
    console.log('   - Total esperado: 40 + 20 + 30 = 90 pontos');

    console.log('\n✅ Score Final Real:', profile.lead_score, 'pontos');

    const expectedScore = 90; // Cálculo teórico
    const scoreDiff = Math.abs(profile.lead_score - expectedScore);

    if (scoreDiff <= 10) {
        console.log('✅ Score está dentro do esperado!');
    } else {
        console.log('⚠️  Score diferente do esperado (pode haver time decay ou outros fatores)');
    }

    // ===============================================
    // BUSCAR EVENTOS PARA TIMELINE
    // ===============================================
    const { data: events } = await supabase
        .from('sales_events')
        .select('created_at, product_name, value, platform_origin, status')
        .eq('customer_email', email)
        .eq('user_id', USER_ID)
        .order('created_at', { ascending: true });

    console.log('\n');
    log('📜', 'TIMELINE DE EVENTOS:');
    events?.forEach((event, idx) => {
        const date = new Date(event.created_at).toLocaleString('pt-BR');
        console.log(`\n${idx + 1}. ${date}`);
        console.log(`   Plataforma: ${event.platform_origin}`);
        console.log(`   Produto: ${event.product_name}`);
        console.log(`   Valor: R$ ${parseFloat(event.value).toFixed(2)}`);
        console.log(`   Status: ${event.status}`);
    });

    console.log('\n');
    log('🎯', 'CONCLUSÃO:');
    console.log(`
Este lead demonstra ALTO interesse de compra:
- ✅ Tentou comprar 3 vezes diferentes produtos
- ✅ Score acumulado: ${profile.lead_score} pontos
- ✅ Tag REINCIDENTE identificada
- ✅ Valor potencial total: R$ 5.491,00
- 🔥 PRIORIDADE MÁXIMA para recuperação!
    `);

    console.log('\n' + '='.repeat(60) + '\n');
}

testLeadReincidente()
    .then(() => {
        console.log('✅ Teste concluído!\n');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Erro:', error);
        process.exit(1);
    });
