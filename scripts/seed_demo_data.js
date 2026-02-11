/**
 * Script para popular o sistema com dados de teste (Seeding)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ID do Usuário (conforme identificado em diagnósticos anteriores)
const USER_ID = 'c048be53-fff6-4446-a8b8-6abf79fce171';

const sampleLeads = [
    {
        name: 'Carlos Oliveira',
        email: 'carlos.oliveira@exemplo.com',
        score: 85,
        status: 'pending',
        value: 1200.00,
        platform: 'Hotmart',
        product: 'Curso Master de Vendas',
        tags: ['REINCIDENTE', 'ABANDONO_CARRINHO']
    },
    {
        name: 'Mariana Souza',
        email: 'mariana.souza@exemplo.com',
        score: 92,
        status: 'contacted',
        value: 2500.00,
        platform: 'Kiwify',
        product: 'Mentoria Exclusiva',
        tags: ['ALTO_VALOR', 'BOLETO_GERADO']
    },
    {
        name: 'Roberto Santos',
        email: 'roberto.santos@testemail.com',
        score: 45,
        status: 'pending',
        value: 150.00,
        platform: 'Hotmart',
        product: 'Ebook Iniciante',
        tags: []
    },
    {
        name: 'Ana Paula Lima',
        email: 'ana.lima@exemplo.com',
        score: 78,
        status: 'pending',
        value: 890.00,
        platform: 'Eduzz',
        product: 'Workshop de Design',
        tags: ['INTERESSE_ALTO']
    },
    {
        name: 'Juliana Mendes',
        email: 'juliana.mendes@exemplo.com',
        score: 95,
        status: 'converted',
        value: 1997.00,
        platform: 'Kiwify',
        product: 'Formação Completa IA',
        tags: ['CONVERTIDO_RECENTE']
    },
    {
        name: 'Fernando Costa',
        email: 'fernando.costa@exemplo.com',
        score: 30,
        status: 'pending',
        value: 47.00,
        platform: 'Hotmart',
        product: 'Guia Rápido PDF',
        tags: ['FRIO']
    },
    {
        name: 'Beatriz Rocha',
        email: 'beatriz.rocha@exemplo.com',
        score: 88,
        status: 'contacted',
        value: 3200.00,
        platform: 'Eduzz',
        product: 'Consultoria Premium',
        tags: ['MULTIFILIAL', 'VIP']
    }
];

async function seedData() {
    console.log('🚀 Iniciando seeding de dados...');

    for (const lead of sampleLeads) {
        console.log(`\nInserindo lead: ${lead.name}...`);

        // 1. Inserir ou atualizar leads_profiles
        // Os nomes das colunas são 'name' e 'email'
        const { data: profileData, error: profileError } = await supabase
            .from('leads_profiles')
            .upsert({
                user_id: USER_ID,
                name: lead.name,
                email: lead.email,
                lead_score: lead.score,
                service_status: lead.status,
                potential_value: lead.value,
                last_platform: lead.platform,
                behavior_tags: lead.tags,
                last_interaction_at: new Date().toISOString()
            }, { onConflict: 'email, user_id' })
            .select()
            .single();

        if (profileError) {
            console.error(`❌ Erro ao inserir perfil para ${lead.email}:`, profileError.message);
            console.error(`   Detalhes:`, profileError);
            continue;
        }

        // 2. Inserir evento de venda relacionado em sales_events
        // Os nomes das colunas são 'customer_name' e 'customer_email'
        const { error: eventError } = await supabase
            .from('sales_events')
            .insert({
                user_id: USER_ID,
                customer_name: lead.name,
                customer_email: lead.email,
                product_name: lead.product,
                external_product_id: lead.platform === 'Kiwify' ? 'kiw_123' : lead.platform === 'Hotmart' ? 'hot_456' : 'edu_789',
                value: lead.value,
                status: lead.status === 'converted' ? 'approved' : 'pending',
                platform_origin: lead.platform,
                status_abordagem: lead.status === 'pending' ? 'pendente' : lead.status === 'contacted' ? 'contatado' : 'finalizado',
                recovery_status: lead.status === 'converted' ? 'converted' : 'pending',
                created_at: new Date().toISOString(),
                lead_profile_id: profileData.id
            });

        if (eventError) {
            console.error(`❌ Erro ao inserir evento para ${lead.email}:`, eventError.message);
        } else {
            console.log(`✅ Lead e evento inseridos com sucesso.`);
        }
    }

    console.log('\n✨ Seeding concluído!');
}

seedData();
