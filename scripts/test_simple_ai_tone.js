/**
 * Teste simples e direto de ai_tone
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const USER_ID = 'c048be53-fff6-4446-a8b8-6abf79fce171';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSimple() {
    console.log('\n🧪 TESTE SIMPLES: ai_tone\n');

    // 1. Buscar user_configs
    console.log('1. Buscando user_configs...');
    const { data, error } = await supabase
        .from('user_configs')
        .select('*')
        .eq('user_id', USER_ID)
        .maybeSingle();

    if (error) {
        console.log('\n❌ ERRO:', error.message);
        console.log('Detalhes:', JSON.stringify(error, null, 2));
        return;
    }

    console.log('\n✅ Dados encontrados:');
    console.log(JSON.stringify(data, null, 2));

    // 2. Verificar ai_tone
    if (data && 'ai_tone' in data) {
        console.log(`\n✅ ai_tone EXISTE: "${data.ai_tone}"`);
    } else {
        console.log('\n❌ ai_tone NÃO EXISTE!');
        console.log('Colunas presentes:', Object.keys(data || {}));
    }

    // 3. Testar salvamento
    console.log('\n2. Tentando salvar "persuasivo"...');
    const { error: saveError } = await supabase
        .from('user_configs')
        .upsert({
            user_id: USER_ID,
            ai_tone: 'persuasivo',
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (saveError) {
        console.log('\n❌ ERRO AO SALVAR:', saveError.message);
        console.log('Hint:', saveError.hint || 'N/A');
        console.log('Details:', saveError.details || 'N/A');
        console.log('\n🔍 Verifique se a migration foi executada no projeto CORRETO do Supabase!');
    } else {
        console.log('\n✅ Salvo com sucesso!');

        // Verificar
        const { data: check } = await supabase
            .from('user_configs')
            .select('ai_tone')
            .eq('user_id', USER_ID)
            .single();

        console.log(`✅ Confirmação: ai_tone = "${check?.ai_tone}"`);
    }
}

testSimple()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('\n💥 Erro fatal:', err.message);
        process.exit(1);
    });
