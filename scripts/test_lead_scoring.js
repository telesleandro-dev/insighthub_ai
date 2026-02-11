/**
 * 🧪 Script de Teste - Lead Scoring & ROI Puro
 * 
 * Testa os cenários críticos do sistema InsightHub AI:
 * - Lead Novo em Limbo (waiting_payment - deve ser ignorado)
 * - Lead de Alta Intenção (refused - score +40)
 * - Lead de Abandono (abandoned - score +20)
 * - ROI Puro (contacted → paid = ROI válido)
 * - Venda Orgânica (pending → paid = ROI inválido)
 * 
 * @author Leandro Teles
 * @date 09/02/2026
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// ========================================
// CONFIGURAÇÃO
// ========================================

const WEBHOOK_URL = 'http://localhost:3000/api/webhook/unified';
const USER_ID = process.env.TEST_USER_ID || 'seu-user-id-aqui'; // ← Configure seu user_id real

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ========================================
// UTILIDADES
// ========================================

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
    log('📤', `Enviando webhook para: ${url}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        log('❌', `Erro na requisição (${response.status})`, data);
        return { success: false, data };
    }

    log('✅', 'Webhook processado', data);
    return { success: true, data };
}

async function checkLeadProfile(email) {
    const { data, error } = await supabase
        .from('leads_profiles')
        .select('*')
        .eq('user_id', USER_ID)
        .eq('email', email)
        .maybeSingle();

    if (error) {
        log('❌', `Erro ao buscar perfil: ${error.message}`);
        return null;
    }

    return data;
}

async function checkSalesEvents(email) {
    const { data, error } = await supabase
        .from('sales_events')
        .select('*')
        .eq('user_id', USER_ID)
        .eq('customer_email', email)
        .order('created_at', { ascending: false });

    if (error) {
        log('❌', `Erro ao buscar eventos: ${error.message}`);
        return [];
    }

    return data || [];
}

async function updateServiceStatus(email, newStatus) {
    log('🔧', `Atualizando status para: ${newStatus}`);

    const { error } = await supabase
        .from('leads_profiles')
        .update({ service_status: newStatus })
        .eq('user_id', USER_ID)
        .eq('email', email);

    if (error) {
        log('❌', `Erro ao atualizar status: ${error.message}`);
        return false;
    }

    log('✅', 'Status atualizado com sucesso');
    return true;
}

async function cleanup(email) {
    log('🧹', `Limpando dados de teste para: ${email}`);

    await supabase.from('sales_events').delete().eq('customer_email', email).eq('user_id', USER_ID);
    await supabase.from('leads_profiles').delete().eq('email', email).eq('user_id', USER_ID);

    log('✅', 'Limpeza concluída');
}

// ========================================
// CENÁRIOS DE TESTE
// ========================================

async function testScenario1_LeadNovoLimbo() {
    log('🧪', '='.repeat(60));
    log('🎯', 'CENÁRIO 1: Lead Novo em Limbo (waiting_payment)');
    log('📝', 'Expectativa: Lead NÃO deve ser criado');
    log('🧪', '='.repeat(60));

    const email = 'lead_limbo@teste.com';
    await cleanup(email);
    await sleep(500);

    // Enviar waiting_payment para lead inexistente
    const payload = {
        source: 'insighthub',
        email: email,
        name: 'Lead Limbo',
        phone: '11999999001',
        status: 'waiting_payment',
        product_name: 'Produto Teste Limbo',
        value: 97.00,
        platform: 'kiwify'
    };

    await sendWebhook(payload);
    await sleep(1000);

    // Verificar se lead foi criado (NÃO DEVERIA)
    const profile = await checkLeadProfile(email);

    if (!profile) {
        log('✅', 'PASSOU: Lead não foi criado (comportamento correto)');
        return true;
    } else {
        log('❌', 'FALHOU: Lead foi criado (comportamento incorreto)', profile);
        return false;
    }
}

async function testScenario2_LeadAltaIntencao() {
    log('🧪', '='.repeat(60));
    log('🎯', 'CENÁRIO 2: Lead de Alta Intenção (refused)');
    log('📝', 'Expectativa: Score +40, Status = pending');
    log('🧪', '='.repeat(60));

    const email = 'lead_refused@teste.com';
    await cleanup(email);
    await sleep(500);

    // Enviar refused
    const payload = {
        source: 'insighthub',
        email: email,
        name: 'Lead Recusado',
        phone: '11999999002',
        status: 'refused',
        product_name: 'Produto Teste Refused',
        value: 197.00,
        platform: 'kiwify'
    };

    await sendWebhook(payload);
    await sleep(1000);

    // Verificar perfil
    const profile = await checkLeadProfile(email);

    if (!profile) {
        log('❌', 'FALHOU: Lead não foi criado');
        return false;
    }

    log('📊', 'Perfil criado:', {
        score: profile.lead_score,
        status: profile.service_status,
        tags: profile.behavior_tags
    });

    // Validações
    const scoreCorreto = profile.lead_score === 40;
    const statusCorreto = profile.service_status === 'pending';
    const temTagErro = profile.behavior_tags?.includes('ERRO_TECNICO');

    if (scoreCorreto && statusCorreto) {
        log('✅', 'PASSOU: Score = 40, Status = pending');
        return true;
    } else {
        log('❌', 'FALHOU: Valores incorretos', {
            esperado: { score: 40, status: 'pending' },
            recebido: { score: profile.lead_score, status: profile.service_status }
        });
        return false;
    }
}

async function testScenario3_LeadAbandono() {
    log('🧪', '='.repeat(60));
    log('🎯', 'CENÁRIO 3: Lead de Abandono (abandoned)');
    log('📝', 'Expectativa: Score +20, Status = pending');
    log('🧪', '='.repeat(60));

    const email = 'lead_abandoned@teste.com';
    await cleanup(email);
    await sleep(500);

    // Enviar abandoned
    const payload = {
        source: 'insighthub',
        email: email,
        name: 'Lead Abandonado',
        phone: '11999999003',
        status: 'abandoned',
        product_name: 'Produto Teste Abandoned',
        value: 297.00,
        platform: 'kiwify'
    };

    await sendWebhook(payload);
    await sleep(1000);

    // Verificar perfil
    const profile = await checkLeadProfile(email);

    if (!profile) {
        log('❌', 'FALHOU: Lead não foi criado');
        return false;
    }

    log('📊', 'Perfil criado:', {
        score: profile.lead_score,
        status: profile.service_status
    });

    // Validações
    const scoreCorreto = profile.lead_score === 20;
    const statusCorreto = profile.service_status === 'pending';

    if (scoreCorreto && statusCorreto) {
        log('✅', 'PASSOU: Score = 20, Status = pending');
        return true;
    } else {
        log('❌', 'FALHOU: Valores incorretos', {
            esperado: { score: 20, status: 'pending' },
            recebido: { score: profile.lead_score, status: profile.service_status }
        });
        return false;
    }
}

async function testScenario4_ROIPuro() {
    log('🧪', '='.repeat(60));
    log('🎯', 'CENÁRIO 4: ROI Puro (contacted → paid)');
    log('📝', 'Expectativa: recovery_status = converted, valor em sales_events');
    log('🧪', '='.repeat(60));

    const email = 'lead_roi@teste.com';
    await cleanup(email);
    await sleep(500);

    // 1. Criar lead com refused
    log('📤', 'Passo 1: Criar lead com refused');
    await sendWebhook({
        source: 'insighthub',
        email: email,
        name: 'Lead ROI',
        phone: '11999999004',
        status: 'refused',
        product_name: 'Produto ROI Test',
        value: 497.00,
        platform: 'kiwify'
    });
    await sleep(1000);

    // 2. Simular clique no WhatsApp (mudar para contacted)
    log('📞', 'Passo 2: Simulando clique no WhatsApp (contacted)');
    await updateServiceStatus(email, 'contacted');
    await sleep(500);

    // 3. Enviar paid
    log('💰', 'Passo 3: Enviar webhook de venda (paid)');
    await sendWebhook({
        source: 'insighthub',
        email: email,
        name: 'Lead ROI',
        phone: '11999999004',
        status: 'paid',
        product_name: 'Produto ROI Test',
        value: 497.00,
        platform: 'kiwify'
    });
    await sleep(1000);

    // 4. Verificar eventos
    const events = await checkSalesEvents(email);
    const paidEvent = events.find(e => e.status === 'paid');

    if (!paidEvent) {
        log('❌', 'FALHOU: Evento de venda não encontrado');
        return false;
    }

    log('📊', 'Evento de venda:', {
        recovery_status: paidEvent.recovery_status,
        status_abordagem: paidEvent.status_abordagem,
        value: paidEvent.value
    });

    // Validações
    const roiValido = paidEvent.recovery_status === 'converted';
    const valorCorreto = parseFloat(paidEvent.value) === 497.00;

    if (roiValido && valorCorreto) {
        log('✅', 'PASSOU: ROI válido, venda contabilizada');
        return true;
    } else {
        log('❌', 'FALHOU: ROI não foi validado corretamente', {
            esperado: { recovery_status: 'converted', value: 497.00 },
            recebido: { recovery_status: paidEvent.recovery_status, value: paidEvent.value }
        });
        return false;
    }
}

async function testScenario5_VendaOrganica() {
    log('🧪', '='.repeat(60));
    log('🎯', 'CENÁRIO 5: Venda Orgânica (pending → paid)');
    log('📝', 'Expectativa: recovery_status = organic, NÃO conta no ROI');
    log('🧪', '='.repeat(60));

    const email = 'lead_organico@teste.com';
    await cleanup(email);
    await sleep(500);

    // 1. Criar lead com refused (MAS NÃO CONTATAR)
    log('📤', 'Passo 1: Criar lead com refused');
    await sendWebhook({
        source: 'insighthub',
        email: email,
        name: 'Lead Orgânico',
        phone: '11999999005',
        status: 'refused',
        product_name: 'Produto Orgânico Test',
        value: 397.00,
        platform: 'kiwify'
    });
    await sleep(1000);

    // 2. Verificar que status é pending (NÃO contacted)
    const profile = await checkLeadProfile(email);
    log('📊', `Status atual: ${profile?.service_status}`);

    // 3. Enviar paid SEM ter contatado
    log('💰', 'Passo 2: Enviar webhook de venda (paid) sem ter contatado');
    await sendWebhook({
        source: 'insighthub',
        email: email,
        name: 'Lead Orgânico',
        phone: '11999999005',
        status: 'paid',
        product_name: 'Produto Orgânico Test',
        value: 397.00,
        platform: 'kiwify'
    });
    await sleep(1000);

    // 4. Verificar eventos
    const events = await checkSalesEvents(email);
    const paidEvent = events.find(e => e.status === 'paid');

    if (!paidEvent) {
        log('❌', 'FALHOU: Evento de venda não encontrado');
        return false;
    }

    log('📊', 'Evento de venda:', {
        recovery_status: paidEvent.recovery_status,
        status_abordagem: paidEvent.status_abordagem,
        value: paidEvent.value
    });

    // Validações
    const roiInvalido = paidEvent.recovery_status === 'organic';
    const valorCorreto = parseFloat(paidEvent.value) === 397.00;

    if (roiInvalido && valorCorreto) {
        log('✅', 'PASSOU: Venda marcada como orgânica (NÃO conta no ROI)');
        return true;
    } else {
        log('❌', 'FALHOU: Venda não foi marcada como orgânica', {
            esperado: { recovery_status: 'organic', value: 397.00 },
            recebido: { recovery_status: paidEvent.recovery_status, value: paidEvent.value }
        });
        return false;
    }
}

// ========================================
// EXECUTOR PRINCIPAL
// ========================================

async function runAllTests() {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║     🧪 INSIGHTHUB AI - TESTES DE LEAD SCORING & ROI      ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('\n');

    // Validações iniciais
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        log('❌', 'ERRO: NEXT_PUBLIC_SUPABASE_URL não configurada');
        process.exit(1);
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        log('❌', 'ERRO: SUPABASE_SERVICE_ROLE_KEY não configurada');
        process.exit(1);
    }

    if (USER_ID === 'seu-user-id-aqui') {
        log('❌', 'ERRO: Configure a variável TEST_USER_ID no .env.local');
        log('💡', 'Exemplo: TEST_USER_ID=dfe126ac-0bb0-46d9-9d4a-938a22044a4f');
        process.exit(1);
    }

    log('🏃', `Executando testes para USER_ID: ${USER_ID}`);
    log('🌐', `Webhook URL: ${WEBHOOK_URL}`);
    console.log('\n');

    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };

    // Executar cenários
    const scenarios = [
        { name: 'Lead Novo em Limbo', fn: testScenario1_LeadNovoLimbo },
        { name: 'Lead de Alta Intenção', fn: testScenario2_LeadAltaIntencao },
        { name: 'Lead de Abandono', fn: testScenario3_LeadAbandono },
        { name: 'ROI Puro', fn: testScenario4_ROIPuro },
        { name: 'Venda Orgânica', fn: testScenario5_VendaOrganica }
    ];

    for (const scenario of scenarios) {
        results.total++;
        try {
            const passed = await scenario.fn();
            if (passed) {
                results.passed++;
            } else {
                results.failed++;
            }
        } catch (error) {
            log('💥', `ERRO CRÍTICO no cenário "${scenario.name}":`, error.message);
            results.failed++;
        }
        await sleep(2000); // Pausa entre cenários
    }

    // Relatório final
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║                   📊 RELATÓRIO FINAL                      ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('\n');
    log('📈', `Total de Testes: ${results.total}`);
    log('✅', `Aprovados: ${results.passed}`);
    log('❌', `Reprovados: ${results.failed}`);

    const successRate = ((results.passed / results.total) * 100).toFixed(1);
    log('🎯', `Taxa de Sucesso: ${successRate}%`);

    console.log('\n');
    if (results.failed === 0) {
        console.log('🎉 TODOS OS TESTES PASSARAM! Sistema funcionando corretamente!');
    } else {
        console.log('⚠️  ALGUNS TESTES FALHARAM. Revise os logs acima.');
    }
    console.log('\n');
}

// Executar
runAllTests()
    .then(() => process.exit(0))
    .catch(error => {
        log('💥', 'ERRO FATAL:', error);
        process.exit(1);
    });
