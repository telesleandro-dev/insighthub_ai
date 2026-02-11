/**
 * 🔄 Script para reprocessar PDF que falhou
 * 
 * Força reprocessamento do arquivo PDF que estava com status 'failed'
 */

require('dotenv').config({ path: '.env.local' });

const FILE_ID = '04554d35-1d24-4b39-b133-88779101ca84';
const USER_ID = 'c048be53-fff6-4446-a8b8-6abf79fce171';

async function retryPDF() {
    console.log('\n🔄 REPROCESSAMENTO DE PDF\n');
    console.log('='.repeat(70) + '\n');
    console.log(`Arquivo ID: ${FILE_ID}`);
    console.log(`User ID: ${USER_ID}\n`);

    console.log('📡 Chamando endpoint de extração...\n');

    try {
        const response = await fetch('http://localhost:3000/api/knowledge/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileId: FILE_ID,
                userId: USER_ID
            })
        });

        const result = await response.json();

        console.log('📥 Resposta recebida:\n');
        console.log(`Status HTTP: ${response.status}`);
        console.log('');

        if (response.ok) {
            console.log('✅ SUCESSO! PDF reprocessado.\n');
            console.log('📊 Detalhes:');
            console.log(`   - Caracteres extraídos: ${result.extractedLength || 'N/A'}`);
            console.log(`   - Preview: ${result.preview || 'N/A'}`);
            console.log('');
            console.log('💡 Agora a IA pode usar esse conhecimento!');
        } else {
            console.log('❌ ERRO no reprocessamento:\n');
            console.log(JSON.stringify(result, null, 2));
            console.log('\n💡 Possíveis causas:');
            console.log('   - PDF corrompido ou protegido por senha');
            console.log('   - PDF contém apenas imagens (precisa OCR)');
            console.log('   - Arquivo não encontrado no storage');
        }

        console.log('\n' + '='.repeat(70) + '\n');

    } catch (error) {
        console.error('💥 Erro ao chamar API:', error.message);
        console.log('\n💡 Certifique-se de que o servidor está rodando:');
        console.log('   npm run dev\n');
    }
}

retryPDF()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Erro fatal:', err);
        process.exit(1);
    });
