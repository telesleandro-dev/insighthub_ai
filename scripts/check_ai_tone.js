/**
 * 🔍 Script para verificar salvamento de Personalidade IA
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const USER_ID = 'c048be53-fff6-4446-a8b8-6abf79fce171';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAiTone() {
    console.log('\n🔍 VERIFICAÇÃO: Personalidade IA\n');
    console.log('='.repeat(70) + '\n');

    // 1. Verificar estrutura da tabela user_configs
    console.log('📋 1. Verificando estrutura da tabela user_configs...\n');

    const { data: configData, error: configError } = await supabase
        .from('user_configs')
        .select('*')
        .eq('user_id', USER_ID)
        .maybeSingle();

    if (configError) {
        console.error('❌ Erro ao buscar user_configs:', configError.message);
        console.log('\n💡 A coluna ai_tone pode não existir na tabela user_configs');
        console.log('   Execute a migration apropriada para adicionar a coluna\n');
        return;
    }

    console.log('✅ user_configs encontrado:');
    console.log(JSON.stringify(configData, null, 2));
    console.log('');

    // 2. Verificar se ai_tone está presente
    if (configData) {
        if ('ai_tone' in configData) {
            console.log(`✅ ai_tone existe: "${configData.ai_tone || 'null'}"`);
        } else {
            console.log('❌ ai_tone NÃO EXISTE na tabela user_configs!');
            console.log('💡 Solução: Adicionar coluna ai_tone à tabela user_configs\n');
        }
    } else {
        console.log('⚠️  Nenhum registro encontrado para este usuário');
    }

    // 3. Verificar user_settings (tabela antiga)
    console.log('\n📋 2. Verificando user_settings (tabela antiga)...\n');

    const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', USER_ID)
        .maybeSingle();

    if (settingsData) {
        console.log('ℹ️  user_settings encontrado:');
        console.log(JSON.stringify(settingsData, null, 2));
    } else {
        console.log('ℹ️  Nenhum registro em user_settings');
    }

    // 4. Teste de salvamento
    console.log('\n📋 3. Testando salvamento em user_configs...\n');

    const { error: upsertError } = await supabase
        .from('user_configs')
        .upsert({
            user_id: USER_ID,
            ai_tone: 'persuasivo',
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (upsertError) {
        console.error('❌ Erro ao fazer upsert:', upsertError.message);
        if (upsertError.message.includes('column')) {
            console.log('\n💡 DIAGNÓSTICO: Coluna ai_tone não existe em user_configs!');
            console.log('   Solução: Adicionar migration para criar coluna\n');
        }
    } else {
        console.log('✅ Upsert bem-sucedido!');

        // Verificar se salvou
        const { data: verificacao } = await supabase
            .from('user_configs')
            .select('ai_tone')
            .eq('user_id', USER_ID)
            .single();

        console.log(`✅ Valor salvo: "${verificacao?.ai_tone}"`);
    }

    console.log('\n' + '='.repeat(70) + '\n');
}

checkAiTone()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('\n💥 Erro:', err);
        process.exit(1);
    });
