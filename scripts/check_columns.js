/**
 * Script para verificar colunas de uma tabela
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkColumns() {
    const { data, error } = await supabase
        .from('leads_profiles')
        .select()
        .limit(1);

    if (error) {
        console.error('❌ Erro:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('✅ Colunas encontradas:', Object.keys(data[0]));
    } else {
        console.log('⚠️ Tabela vazia ou sem colunas.');
    }
}

checkColumns();
