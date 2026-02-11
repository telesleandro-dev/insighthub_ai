/**
 * Script para diagnosticar discrepância de taxa de conversão
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const USER_ID = process.env.TEST_USER_ID;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseConversionRate() {
    console.log('🔍 DIAGNÓSTICO: Taxa de Conversão\n');
    console.log('='.repeat(70) + '\n');

    // Buscar todos os leads
    const { data: allLeads } = await supabase
        .from('leads_profiles')
        .select('email, service_status, lead_score, created_at')
        .eq('user_id', USER_ID)
        .order('created_at', { ascending: false });

    // Buscar todos os eventos
    const { data: allEvents } = await supabase
        .from('sales_events')
        .select('customer_email, status, recovery_status, status_abordagem, value, created_at')
        .eq('user_id', USER_ID)
        .order('created_at', { ascending: false });

    console.log(`📊 Total de Leads: ${allLeads?.length || 0}`);
    console.log(`📊 Total de Eventos: ${allEvents?.length || 0}\n`);

    // Análise por service_status
    console.log('📈 LEADS POR SERVICE_STATUS:');
    const statusCounts = {};
    allLeads?.forEach(lead => {
        const status = lead.service_status || 'null';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    Object.keys(statusCounts).forEach(status => {
        console.log(`   ${status}: ${statusCounts[status]}`);
    });

    // Análise por recovery_status
    console.log('\n📈 EVENTOS POR RECOVERY_STATUS:');
    const recoveryCounts = {};
    allEvents?.forEach(event => {
        const status = event.recovery_status || 'null';
        recoveryCounts[status] = (recoveryCounts[status] || 0) + 1;
    });
    Object.keys(recoveryCounts).forEach(status => {
        console.log(`   ${status}: ${recoveryCounts[status]}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('🎯 CÁLCULO: DASHBOARD (DashboardView.tsx)');
    console.log('='.repeat(70) + '\n');

    // Simular lógica do Dashboard (com correção)
    const vendasRecuperadas = allEvents?.filter(e => e.recovery_status === 'converted') || [];
    const pendingLeads = allLeads?.filter(l => l.service_status === 'pending') || [];

    const totalLeadsGerenciaveis = pendingLeads.length + vendasRecuperadas.length;
    const taxaDashboard = totalLeadsGerenciaveis > 0
        ? (vendasRecuperadas.length / totalLeadsGerenciaveis) * 100
        : 0;

    console.log('📊 Vendas Recuperadas (recovery_status = converted):', vendasRecuperadas.length);
    console.log('📊 Leads Pending (service_status = pending):', pendingLeads.length);
    console.log('📊 Total Leads Gerenciáveis (pending + converted):', totalLeadsGerenciaveis);
    console.log('🎯 Taxa de Conversão Dashboard:', taxaDashboard.toFixed(1) + '%');

    console.log('\n' + '='.repeat(70));
    console.log('🎯 CÁLCULO: INTELIGÊNCIA DE VENDAS (InteligenciaLeadsView.tsx)');
    console.log('='.repeat(70) + '\n');

    // Simular lógica da Inteligência
    const convertedLeads = allLeads?.filter(l => l.service_status === 'converted') || [];
    const totalLeads = allLeads?.length || 0;
    const taxaInteligencia = totalLeads > 0
        ? (convertedLeads.length / totalLeads) * 100
        : 0;

    console.log('📊 Leads Convertidos (service_status = converted):', convertedLeads.length);
    console.log('📊 Total de Leads:', totalLeads);
    console.log('🎯 Taxa de Conversão Inteligência:', taxaInteligencia.toFixed(1) + '%');

    console.log('\n' + '='.repeat(70));
    console.log('⚠️  COMPARAÇÃO E DIAGNÓSTICO');
    console.log('='.repeat(70) + '\n');

    console.log(`Dashboard: ${taxaDashboard.toFixed(1)}%`);
    console.log(`Inteligência: ${taxaInteligencia.toFixed(1)}%`);
    console.log(`Diferença: ${Math.abs(taxaDashboard - taxaInteligencia).toFixed(1)}%\n`);

    if (Math.abs(taxaDashboard - taxaInteligencia) > 0.1) {
        console.log('❌ DISCREPÂNCIA DETECTADA!\n');
        console.log('🔍 CAUSA:');
        console.log('   Dashboard usa: (eventos converted / (leads pending + eventos converted))');
        console.log('   Inteligência usa: (leads converted / total leads)\n');
        console.log('💡 PROBLEMA:');
        console.log('   Dashboard olha EVENTOS (sales_events)');
        console.log('   Inteligência olha PERFIS DE LEAD (leads_profiles)');
        console.log('\n   Um lead pode ter múltiplos eventos!');
        console.log('   Ou um evento pode não ter atualizado o perfil corretamente.\n');
    } else {
        console.log('✅ Taxas estão alinhadas!\n');
    }

    // Detalhar leads convertidos
    console.log('📋 DETALHAMENTO DOS LEADS CONVERTIDOS:');
    convertedLeads?.forEach(lead => {
        const events = allEvents?.filter(e => e.customer_email === lead.email) || [];
        const convertedEvents = events.filter(e => e.recovery_status === 'converted');
        console.log(`\n   ${lead.email}`);
        console.log(`   - Total de eventos: ${events.length}`);
        console.log(`   - Eventos converted: ${convertedEvents.length}`);
        console.log(`   - Service status: ${lead.service_status}`);
    });

    console.log('\n' + '='.repeat(70) + '\n');
}

diagnoseConversionRate()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('💥 Erro:', err);
        process.exit(1);
    });
