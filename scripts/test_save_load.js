/**
 * Teste de SALVAMENTO e CARREGAMENTO de ai_tone
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const USER_ID = 'c048be53-fff6-4446-a8b8-6abf79fce171';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSaveLoad() {
    console.log('\n🧪 TESTE: Salvar e Carregar ai_tone\n');

    // 1. Ver valor atual
    console.log('1. Valor ANTES do teste:');
    const { data: before } = await supabase
        .from('user_configs')
        .select('ai_tone')
        .eq('user_id', USER_ID)
        .maybeSingle();

    console.log(`   ai_tone = "${before?.ai_tone || 'NULL'}"`);

    // 2. Salvar "persuasivo"
    console.log('\n2. Salvando "persuasivo"...');
    const { error: saveError } = await supabase
        .from('user_configs')
        .upsert({
            user_id: USER_ID,
            ai_tone: 'persuasivo',
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (saveError) {
        console.log('   ❌ Erro ao salvar:', saveError.message);
        return;
    }
    console.log('   ✅ Salvo!');

    // 3. Carregar novamente
    console.log('\n3. Carregando novamente...');
    const { data: after } = await supabase
        .from('user_configs')
        .select('ai_tone')
        .eq('user_id', USER_ID)
        .single();

    console.log(`   ai_tone = "${after?.ai_tone}"`);

    if (after?.ai_tone === 'persuasivo') {
        console.log('\n✅✅ TESTE PASSOU! Salvamento funciona!');
        console.log('\n💡 Se o problema persiste no sistema:');
        console.log('   - Limpe o cache do navegador (Ctrl+Shift+R)');
        console.log('   - Verifique console do navegador por erros');
        console.log('   - Verifique se user_id está correto no frontend');
    } else {
        console.log('\n❌ TESTE FALHOU! Valor não salvou corretamente');
    }

    // 4. Restaurar valor original
    if (before?.ai_tone) {
        console.log(`\n4. Restaurando valor original ("${before.ai_tone}")...`);
        await supabase
            .from('user_configs')
            .update({ ai_tone: before.ai_tone })
            .eq('user_id', USER_ID);
        console.log('   ✅ Restaurado!');
    }
}

testSaveLoad();
