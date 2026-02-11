/**
 * Diagnóstico FINAL - Ver colunas de user_configs
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function final() {
    console.log('\n🔍 DIAGNÓSTICO FINAL\n');
    console.log('Projeto Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('');

    const { data, error } = await supabase
        .from('user_configs')
        .select('*')
        .limit(1)
        .maybeSingle();

    if (error) {
        console.log('❌ Erro:', error.message);
        return;
    }

    if (!data) {
        console.log('⚠️  Tabela vazia');
        return;
    }

    const colunas = Object.keys(data);

    console.log('📋 COLUNAS ENCONTRADAS:');
    colunas.forEach(col => console.log(`   ✓ ${col}`));

    console.log('');

    if (colunas.includes('ai_tone')) {
        console.log('✅✅ COLUNA ai_tone EXISTE!\n');
        console.log('🎉 Migration funcionou!');
    } else {
        console.log('❌❌ COLUNA ai_tone NÃO EXISTE!\n');
        console.log('💡 A migration NÃO foi executada (ou foi no projeto errado).');
        console.log('');
        console.log('🔧 EXECUTE ESTE SQL NO SUPABASE:');
        console.log('----------------------------------------');
        console.log('ALTER TABLE user_configs');
        console.log("ADD COLUMN ai_tone VARCHAR(20) DEFAULT 'consultivo';");
        console.log('----------------------------------------');
    }
}

final();
