/**
 * Verificar estrutura da tabela user_configs
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableStructure() {
    console.log('\n📊 VERIFICAR ESTRUTURA DA TABELA\n');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('');

    // Query direto para ver estrutura
    const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: 'user_configs' })
        .catch(() => ({ data: null, error: { message: 'RPC não existe' } }));

    if (error || !data) {
        console.log('⚠️  RPC não disponível, tentando query alternativa...\n');

        // Tentar buscar 1 registro para ver colunas
        const { data: sample, error: sampleError } = await supabase
            .from('user_configs')
            .select('*')
            .limit(1)
            .maybeSingle();

        if (sampleError) {
            console.log('❌ Erro:', sampleError.message);
            return;
        }

        if (sample) {
            console.log('✅ Colunas encontradas na tabela user_configs:');
            Object.keys(sample).forEach(col => {
                console.log(`   - ${col}: ${typeof sample[col]} = ${JSON.stringify(sample[col])}`);
            });

            if ('ai_tone' in sample) {
                console.log('\n✅✅ COLUNA ai_tone EXISTE!');
            } else {
                console.log('\n❌❌ COLUNA ai_tone NÃO EXISTE!');
                console.log('\n💡 POSSÍVEIS CAUSAS:');
                console.log('   1. Migration executada em projeto ERRADO do Supabase');
                console.log('   2. Migration não foi executada com sucesso');
                console.log('   3. Cache do Supabase (aguardar alguns segundos)');
                console.log('\n🔧 SOLUÇÃO:');
                console.log('   Execute este SQL no Supabase Dashboard do projeto CORRETO:');
                console.log('   ALTER TABLE user_configs ADD COLUMN ai_tone VARCHAR(20) DEFAULT \'consultivo\';');
            }
        } else {
            console.log('⚠️  Nenhum registro na tabela. Criando um para testar...');

            const testUserId = 'test-' + Date.now();
            await supabase
                .from('user_configs')
                .insert({
                    user_id: testUserId,
                    telegram_enabled: false
                });

            console.log('✅ Registro de teste criado, execute novamente');
        }
    }
}

checkTableStructure()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Erro:', err.message);
        process.exit(1);
    });
