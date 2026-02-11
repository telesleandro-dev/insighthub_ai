/**
 * Script para diagnosticar Pipeline e Leads Quentes
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const USER_ID = 'c048be53-fff6-4446-a8b8-6abf79fce171';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
    console.log('\n🔍 DIAGNÓSTICO: Pipeline e Leads Quentes\n');
    console.log('='.repeat(70));

    // Buscar sales_events
    const { data: events, error } = await supabase
        .from('sales_events')
        .select('*, lead_profile:leads_profiles(id, lead_score, service_status, customer_name)')
        .eq('user_id', USER_ID);

    if (error) {
        console.log('❌ Erro:', error.message);
        return;
    }

    console.log(`\nTotal de eventos: ${events.length}\n`);

    // Filtrar últimos 7 dias
    const now = new Date();
    const filtered7days = events.filter(e => {
        const eventDate = new Date(e.created_at);
        const diffDays = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    });

    console.log(`Eventos últimos 7 dias: ${filtered7days.length}\n`);

    // Status de sucesso
    const successStatuses = ['paid', 'pix_generated', 'completed', 'approved'];

    // ============================================
    // PROBLEMA 1: PIPELINE (Ação Necessária)
    // ============================================
    console.log('📊 PROBLEMA 1: PIPELINE (Ação Necessária)\n');

    // LÓGICA ATUAL DO DASHBOARD (linha 126-131)
    const pipelineDashboard = filtered7days.filter(e => {
        const isConverted = successStatuses.includes(e.status?.toLowerCase());
        const isRecovered = e.recovery_status === 'converted';
        const isPending = (e.status_abordagem || 'pendente') === 'pendente';
        return !isConverted && !isRecovered && isPending;
    });

    const valorPipelineDashboard = pipelineDashboard.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

    console.log(`Dashboard (lógica atual):`);
    console.log(`  Filtro: !converted && !recovered && pending`);
    console.log(`  Eventos: ${pipelineDashboard.length}`);
    console.log(`  Valor total: R$ ${valorPipelineDashboard.toFixed(2)}`);

    // LÓGICA CORRIGIDA (deve contar apenas NÃO convertidos)
    const pipelineCorreto = filtered7days.filter(e => {
        const isConverted = successStatuses.includes(e.status?.toLowerCase());
        const isRecovered = e.recovery_status === 'converted';
        return !isConverted && !isRecovered;
    });

    const valorPipelineCorreto = pipelineCorreto.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

    console.log(`\nCorrigido (sem filtro de pending):`);
    console.log(`  Filtro: !converted && !recovered`);
    console.log(`  Eventos: ${pipelineCorreto.length}`);
    console.log(`  Valor total: R$ ${valorPipelineCorreto.toFixed(2)}`);

    console.log(`\n⚠️  Diferença: R$ ${(valorPipelineDashboard - valorPipelineCorreto).toFixed(2)}`);

    // ============================================
    // PROBLEMA 2: LEADS QUENTES
    // ============================================
    console.log('\n\n📊 PROBLEMA 2: LEADS QUENTES\n');

    // LÓGICA ATUAL (quebrada - tenta acessar .id e .service_status)
    console.log('Dashboard (lógica atual QUEBRADA):');
    console.log('  Tenta criar uniqueLeadProfiles usando .id e .service_status');
    console.log('  Mas SELECT só retorna lead_score!');
    console.log('  Resultado: ERRO ou 0\n');

    // INTELIGÊNCIA DE VENDAS
    const { data: leadsProfiles } = await supabase
        .from('leads_profiles')
        .select('*')
        .eq('user_id', USER_ID);

    const quentes = leadsProfiles.filter(l =>
        l.lead_score >= 80 &&
        ['pending', 'contacted'].includes(l.service_status)
    );

    console.log(`Inteligência (direto em leads_profiles):`);
    console.log(`  Leads quentes: ${quentes.length}`);
    if (quentes.length > 0) {
        quentes.forEach(l => {
            console.log(`    - ${l.customer_name}: Score ${l.lead_score}, Status: ${l.service_status}`);
        });
    }

    // SOLUÇÃO PROPOSTA
    console.log(`\n💡 SOLUÇÃO:`);
    console.log(`  1. Manter SELECT simples: lead_profile:leads_profiles(lead_score)`);
    console.log(`  2. Usar filtro simples: e.lead_profile && e.lead_score >= 80`);
    console.log(`  3. NÃO tentar acessar .id ou .service_status (não estão no SELECT)`);

    console.log('\n' + '='.repeat(70) + '\n');
}

diagnose();
