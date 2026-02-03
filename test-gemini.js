// Script de debug para listar modelos disponíveis do Gemini
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = 'AIzaSyDfG4O3BcXSYt7gHNTIwwqRz0mTWkPMpIg';
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        console.log('🔍 Listando modelos disponíveis...\n');

        // Tenta listar modelos
        const models = await genAI.listModels();

        console.log('✅ Modelos disponíveis:');
        for await (const model of models) {
            console.log(`- ${model.name}`);
            console.log(`  Display Name: ${model.displayName}`);
            console.log(`  Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
            console.log('');
        }
    } catch (error) {
        console.error('❌ Erro ao listar modelos:', error.message);
    }
}

async function testModel(modelName) {
    try {
        console.log(`\n🧪 Testando modelo: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Responda apenas: OK');
        const response = await result.response;
        console.log(`✅ Funciona! Resposta: ${response.text()}`);
    } catch (error) {
        console.log(`❌ Falhou: ${error.message}`);
    }
}

async function main() {
    await listModels();

    console.log('\n='.repeat(60));
    console.log('🧪 Testando modelos comuns:\n');

    const modelsToTest = [
        'gemini-pro',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro',
        'models/gemini-pro',
    ];

    for (const modelName of modelsToTest) {
        await testModel(modelName);
    }
}

main();
