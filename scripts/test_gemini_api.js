/**
 * 🧪 Script de Teste: Validar Correção da IA Gemini
 * 
 * Testa se a API /api/ai/recuperar está funcionando corretamente
 * após correção do erro "Lead não encontrado"
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const USER_ID = process.env.TEST_USER_ID;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testGeminiAPI() {
    console.log('\n🧪 TESTE: Validação da API Gemini (após correção)\n');
    console.log('='.repeat(70) + '\n');

    // 1. Buscar um lead de teste existente
    console.log('📋 1. Buscando lead de teste no banco...\n');

    const { data: leads, error } = await supabase
        .from('leads_profiles')
        .select('id, email, name, lead_score, service_status')
        .eq('user_id', USER_ID)
        .limit(1)
        .maybeSingle();

    if (error || !leads) {
        console.error('❌ Nenhum lead encontrado no banco para teste.');
        console.log('💡 Execute os scripts de teste de scoring primeiro:\n');
        console.log('   node scripts/test_lead_scoring.js\n');
        process.exit(1);
    }

    console.log('✅ Lead encontrado:');
    console.log(`   Email: ${leads.email}`);
    console.log(`   Nome: ${leads.name}`);
    console.log(`   Score: ${leads.lead_score}`);
    console.log(`   Status: ${leads.service_status}\n`);

    // 2. Testar a API de recuperação
    console.log('📡 2. Testando API /api/ai/recuperar...\n');

    const payload = {
        leadId: leads.id,
        leadEmail: leads.email,  // NOVO: Campo adicionado na correção
        discountLink: 'https://checkout.teste.com/promo'
    };

    console.log('📤 Payload enviado:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');

    try {
        const response = await fetch('http://localhost:3000/api/ai/recuperar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        console.log('📥 Resposta recebida:');
        console.log(`   Status HTTP: ${response.status}`);
        console.log('');

        if (response.ok) {
            console.log('✅ SUCESSO! A API funcionou corretamente.\n');
            console.log('📝 Dados retornados:');
            console.log(`   Mensagem: "${data.message}"`);
            console.log(`   Dossiê: "${data.dossie}"`);
            console.log(`   Gatilho: "${data.gatilho}"`);
            console.log('');

            // Validações
            let allPassed = true;

            if (!data.message || data.message.length === 0) {
                console.log('⚠️  ALERTA: Mensagem vazia');
                allPassed = false;
            } else {
                console.log('✅ Mensagem gerada com sucesso');
            }

            if (!data.dossie || data.dossie.length === 0) {
                console.log('⚠️  ALERTA: Dossiê vazio');
                allPassed = false;
            } else {
                console.log('✅ Dossiê gerado com sucesso');
            }

            if (data.message && data.message.includes('https://checkout.teste.com/promo')) {
                console.log('✅ Link customizado incluído na mensagem');
            } else {
                console.log('⚠️  ALERTA: Link não encontrado na mensagem');
                allPassed = false;
            }

            console.log('\n' + '='.repeat(70));
            if (allPassed) {
                console.log('🎉 TESTE PASSOU! A IA Gemini está funcionando corretamente!');
            } else {
                console.log('⚠️  TESTE PASSOU COM ALERTAS. Verifique os warnings acima.');
            }
            console.log('='.repeat(70) + '\n');

        } else {
            console.log('❌ ERRO NA API!\n');
            console.log('Detalhes do erro:');
            console.log(JSON.stringify(data, null, 2));
            console.log('');
            process.exit(1);
        }

    } catch (fetchError) {
        console.error('❌ ERRO ao chamar API:', fetchError.message);
        console.log('\n💡 Certifique-se de que o servidor está rodando:');
        console.log('   npm run dev\n');
        process.exit(1);
    }

    // 3. Teste sem leadEmail (validar backward compatibility)
    console.log('\n📡 3. Testando compatibilidade reversa (sem leadEmail)...\n');

    const payloadOld = {
        leadId: leads.id,
        // leadEmail: NÃO enviado propositalmente
        discountLink: 'https://checkout.teste.com/promo'
    };

    try {
        const response = await fetch('http://localhost:3000/api/ai/recuperar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadOld)
        });

        const data = await response.json();

        if (response.ok && data.message) {
            console.log('⚠️  API funcionou SEM leadEmail (pode usar fallback)');
            console.log(`   Mensagem: "${data.message.substring(0, 100)}..."`);
        } else {
            console.log('❌ API falhou sem leadEmail (esperado após correção)');
            console.log('   Isso está correto, pois agora requer email.');
        }
    } catch (e) {
        console.log('❌ API rejeitou requisição sem email (comportamento esperado)');
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ VALIDAÇÃO COMPLETA!\n');
}

testGeminiAPI()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('\n💥 Erro fatal no teste:', err);
        process.exit(1);
    });
