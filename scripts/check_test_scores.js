/**
 * Script para verificar scores dos leads de teste
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const USER_ID = process.env.TEST_USER_ID;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkScores() {
    console.log('🔍 Verificando scores dos leads de teste...\n');

    const { data, error } = await supabase
        .from('leads_profiles')
        .select('email, name, lead_score, service_status, behavior_tags, last_event_type, created_at, last_interaction_at')
        .eq('user_id', USER_ID)
        .ilike('email', '%@teste.com')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Erro:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('⚠️  Nenhum lead de teste encontrado');
        return;
    }

    console.log(`📊 Total de leads de teste: ${data.length}\n`);

    data.forEach((lead, index) => {
        console.log(`${index + 1}. ${lead.email}`);
        console.log(`   Nome: ${lead.name}`);
        console.log(`   Score: ${lead.lead_score} pontos`);
        console.log(`   Status: ${lead.service_status}`);
        console.log(`   Último evento: ${lead.last_event_type}`);
        console.log(`   Tags: ${JSON.stringify(lead.behavior_tags)}`);
        console.log(`   Criado em: ${lead.created_at}`);
        console.log(`   Última interação: ${lead.last_interaction_at}`);
        console.log('');
    });

    // Análise
    const scoresAltos = data.filter(l => l.lead_score >= 40);
    const scoresMedios = data.filter(l => l.lead_score >= 20 && l.lead_score < 40);
    const scoresBaixos = data.filter(l => l.lead_score < 20);

    console.log('📈 ANÁLISE:');
    console.log(`   Scores Altos (≥40): ${scoresAltos.length}`);
    console.log(`   Scores Médios (20-39): ${scoresMedios.length}`);
    console.log(`   Scores Baixos (<20): ${scoresBaixos.length}`);
}

checkScores()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('💥 Erro:', err);
        process.exit(1);
    });
