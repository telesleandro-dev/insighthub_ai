const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

async function testGeneration() {
    console.log("🔍 Iniciando teste de GERAÇÃO com Gemini 2.0 Flash...");

    // 1. Ler API Key
    let apiKey = '';
    try {
        const envPath = path.resolve(__dirname, '.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GEMINI_API_KEY=(.+)/);
        if (match && match[1]) {
            apiKey = match[1].trim();
        } else {
            console.error("❌ Key não encontrada.");
            process.exit(1);
        }
    } catch (err) {
        console.error("❌ Erro ao ler .env.local");
        process.exit(1);
    }

    // 2. Inicializar SDK com gemini-2.0-flash
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash"
    });

    try {
        console.log("🚀 Enviando prompt: 'Diga Olá Mundo'...");
        const result = await model.generateContent("Diga 'Olá Mundo' em português.");
        const response = await result.response;
        const text = response.text();

        console.log("\n✅ SUCESSO! A IA respondeu:");
        console.log("--------------------------------------------------");
        console.log(text);
        console.log("--------------------------------------------------");

    } catch (error) {
        console.error("\n❌ ERRO NA GERAÇÃO:");
        console.error(error);
    }
}

testGeneration();
