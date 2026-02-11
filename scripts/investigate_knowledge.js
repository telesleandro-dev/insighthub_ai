/**
 * 🔍 Script para investigar base de conhecimento vazia
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const USER_ID = 'c048be53-fff6-4446-a8b8-6abf79fce171';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateKnowledge() {
    console.log('\n🔍 INVESTIGAÇÃO: Base de Conhecimento Vazia\n');
    console.log('='.repeat(70) + '\n');
    console.log(`User ID: ${USER_ID}\n`);

    // 1. Verificar se tabela existe
    console.log('📋 1. Verificando tabela knowledge_files...\n');

    const { data: allFiles, error: allError, count } = await supabase
        .from('knowledge_files')
        .select('*', { count: 'exact' })
        .limit(5);

    console.log(`Total de registros na tabela: ${count || 0}`);

    if (allError) {
        console.error('❌ Erro ao acessar tabela:', allError.message);
        return;
    }

    // 2. Verificar arquivos do usuário específico
    console.log('\n📋 2. Buscando arquivos do usuário específico...\n');

    const { data: userFiles, error: userError } = await supabase
        .from('knowledge_files')
        .select('*')
        .eq('user_id', USER_ID);

    if (userError) {
        console.error('❌ Erro:', userError.message);
        return;
    }

    console.log(`Arquivos encontrados para este usuário: ${userFiles?.length || 0}\n`);

    if (userFiles && userFiles.length > 0) {
        console.log('📄 DETALHES DOS ARQUIVOS:');
        userFiles.forEach((file, idx) => {
            console.log(`\n${idx + 1}. ${file.file_name}`);
            console.log(`   - ID: ${file.id}`);
            console.log(`   - User ID: ${file.user_id}`);
            console.log(`   - Status: ${file.processing_status}`);
            console.log(`   - Produto: ${file.product_reference || 'N/A'}`);
            console.log(`   - Criado em: ${new Date(file.created_at).toLocaleString('pt-BR')}`);
            console.log(`   - Texto extraído: ${file.extracted_text ? `${file.extracted_text.length} chars` : 'VAZIO'}`);
        });
    } else {
        console.log('⚠️  NENHUM ARQUIVO ENCONTRADO PARA ESTE USUÁRIO!');
        console.log('\n💡 Possíveis causas:');
        console.log('   1. Upload não foi concluído');
        console.log('   2. ID do usuário está incorreto');
        console.log('   3. Arquivo foi deletado');
        console.log('   4. Problema no processamento do upload');
    }

    // 3. Ver exemplos de outros usuários (para entender estrutura)
    console.log('\n📋 3. Amostra de outros arquivos na tabela (para referência)...\n');

    if (allFiles && allFiles.length > 0) {
        console.log(`Mostrando ${Math.min(3, allFiles.length)} exemplo(s):\n`);
        allFiles.slice(0, 3).forEach((file, idx) => {
            console.log(`${idx + 1}. ${file.file_name} (user: ${file.user_id?.substring(0, 8)}...)`);
            console.log(`   Status: ${file.processing_status}`);
        });
    } else {
        console.log('⚠️  Tabela completamente vazia!');
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Investigação concluída!\n');
}

investigateKnowledge()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('\n💥 Erro:', err);
        process.exit(1);
    });
