/**
 * Script para diagnosticar diferença entre Dashboard e Inteligência
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const USER_ID = 'c048be53-fff6-4446-a8b8-6abf79fce171';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
    console.log('\n🔍 DIAGNÓSTICO: Dashboard vs Inteligência\n');
    console.log('='.repeat(70));

    // 1. INTELIGÊNCIA: Busca direta em leads_profiles
    console.log('\n📊 1. INTELIGÊNCIA DE VENDAS (leads_profiles)\n');

    const { data: leadsProfiles, error: lpError } = await supabase
        .from('leads_profiles')
        .select('*')
        .eq('user_id', USER_ID);

    if (lpError) {
        console.log('❌ Erro:', lpError.message);
        return;
    }

    console.log(`Total de leads_profiles: ${leadsProfiles.length}`);

    const quentes = leadsProfiles.filter(l =>
        l.lead_score >= 80 &&
        ['pending', 'contacted'].includes(l.service_status)
    );

    console.log(`Leads quentes (score >= 80 + pending/contacted): ${quentes.length}`);

    if (quentes.length > 0) {
        console.log('\nDetalhes dos leads quentes:');
        quentes.forEach(l => {
            console.log(`  - ${l.customer_name} (${l.customer_email})`);
            console.log(`    Score: ${l.lead_score}, Status: ${l.service_status}`);
            console.log(`    ID: ${l.id}`);
        });
    }

    // 2. DASHBOARD: Busca em sales_events com join
    console.log('\n\n📊 2. DASHBOARD (sales_events + lead_profile)\n');

    const { data: salesEvents, error: seError } = await supabase
        .from('sales_events')
        .select('*, lead_profile:leads_profiles(*)')
        .eq('user_id', USER_ID);

    if (seError) {
        console.log('❌ Erro:', seError.message);
        return;
    }

    console.log(`Total de sales_events: ${salesEvents.length}`);

    const eventsComProfile = salesEvents.filter(e => e.lead_profile);
    console.log(`Eventos COM lead_profile: ${eventsComProfile.length}`);
    console.log(`Eventos SEM lead_profile: ${salesEvents.length - eventsComProfile.length}`);

    // Aplicar filtro de 7 dias
    const now = new Date();
    const filtered7days = salesEvents.filter(e => {
        const eventDate = new Date(e.created_at);
        const diffDays = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    });

    console.log(`\nEventos nos últimos 7 dias: ${filtered7days.length}`);

    const comProfileNos7Dias = filtered7days.filter(e => e.lead_profile);
    console.log(`Destes, COM lead_profile: ${comProfileNos7Dias.length}`);

    // Criar set de leads únicos
    const uniqueLeads = Array.from(
        new Map(
            comProfileNos7Dias
                .filter(e => e.lead_profile)
                .map(e => [e.lead_profile.id, e.lead_profile])
        ).values()
    );

    console.log(`Leads únicos nos últimos 7 dias: ${uniqueLeads.length}`);

    const hotFromDashboard = uniqueLeads.filter(profile =>
        profile.lead_score >= 80 &&
        ['pending', 'contacted'].includes(profile.service_status)
    );

    console.log(`Leads quentes (Dashboard logic): ${hotFromDashboard.length}`);

    if (hotFromDashboard.length > 0) {
        console.log('\nDetalhes:');
        hotFromDashboard.forEach(l => {
            console.log(`  - ${l.customer_name} (${l.customer_email})`);
            console.log(`    Score: ${l.lead_score}, Status: ${l.service_status}`);
        });
    }

    // 3. COMPARAÇÃO
    console.log('\n\n📊 3. COMPARAÇÃO\n');
    console.log(`Inteligência: ${quentes.length} leads quentes`);
    console.log(`Dashboard:    ${hotFromDashboard.length} leads quentes`);

    if (quentes.length !== hotFromDashboard.length) {
        console.log('\n⚠️  DISCREPÂNCIA IDENTIFICADA!');
        console.log('\n💡 Possíveis causas:');
        console.log('   1. Dashboard filtra por período (7 dias default)');
        console.log('   2. Eventos sem lead_profile relacionado');
        console.log('   3. Lead foi criado há mais de 7 dias');

        // Verificar se o lead quente tem evento recente
        if (quentes.length > 0) {
            console.log('\n🔍 Verificando eventos do lead quente:');
            const leadId = quentes[0].id;
            const eventosDoLead = salesEvents.filter(e =>
                e.lead_profile && e.lead_profile.id === leadId
            );
            console.log(`   Eventos totais do lead: ${eventosDoLead.length}`);

            if (eventosDoLead.length > 0) {
                const maisRecente = eventosDoLead.sort((a, b) =>
                    new Date(b.created_at) - new Date(a.created_at)
                )[0];
                const diasAtras = Math.floor((now.getTime() - new Date(maisRecente.created_at).getTime()) / (1000 * 60 * 60 * 24));
                console.log(`   Evento mais recente: ${diasAtras} dias atrás`);
                console.log(`   Será filtrado com "7 days"? ${diasAtras > 7 ? 'SIM ❌' : 'NÃO ✅'}`);
            } else {
                console.log('   ❌ Lead NÃO tem eventos em sales_events!');
                console.log('   💡 SOLUÇÃO: Dashboard deve buscar diretamente de leads_profiles');
            }
        }
    } else {
        console.log('\n✅ Contagens ALINHADAS!');
    }

    console.log('\n' + '='.repeat(70) + '\n');
}

diagnose();
