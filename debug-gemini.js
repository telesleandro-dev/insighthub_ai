const fs = require('fs');
const path = require('path');

async function checkAvailableModels() {
    console.log("🔍 Consultando lista de modelos disponíveis na API Google...");

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

    // 2. Fetch REST direto para listar modelos
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            const modelsList = data.models
                .filter(m => m.supportedGenerationMethods.includes("generateContent"))
                .map(m => `   - ${m.name.replace('models/', '')} (${m.displayName})`)
                .join('\n');

            console.log("\n✅ API ONLINE! Modelos disponíveis:");
            console.log(modelsList);

            fs.writeFileSync(path.resolve(__dirname, 'models_utf8.txt'), modelsList, 'utf8');
            console.log("\n💾 Lista salva em models_utf8.txt");

        } else {
            console.error(`\n❌ ERRO NA API (${response.status}):`);
            const errLog = JSON.stringify(data, null, 2);
            console.error(errLog);
            fs.writeFileSync(path.resolve(__dirname, 'models_utf8.txt'), `ERRO ${response.status}: ${errLog}`, 'utf8');

            if (data.error && data.error.message && data.error.message.includes("API has not been used in project")) {
                console.log("\n🚨 CAUSA PROVÁVEL: A API 'Generative Language API' não está ativada no Google Cloud Console.");
            }
        }

    } catch (error) {
        console.error("❌ Erro de rede:", error.message);
    }
}

checkAvailableModels();
