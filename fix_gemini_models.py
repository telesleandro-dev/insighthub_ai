# Atualizar lista de modelos Gemini para versões válidas

file_path = r"c:\Users\leandro.teles\Desktop\projetos\insighthub_ ai\src\app\api\ai\recuperar\route.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Lista antiga de modelos (com nomes incorretos/inexistentes)
old_models = '''    // Lista de modelos para tentativa (Fallback em Cascata para evitar 429)
    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite-preview-02-05",
      "gemini-1.5-pro",
      "gemini-1.5-flash-latest"
    ];'''

# Lista nova de modelos (nomes corretos e válidos)
new_models = '''    // Lista de modelos para tentativa (Fallback em Cascata para evitar 429)
    const modelsToTry = [
      "gemini-1.5-flash",      // Mais rápido e barato
      "gemini-1.5-pro-latest", // Mais capaz
      "gemini-pro"             // Fallback final
    ];'''

if old_models in content:
    content = content.replace(old_models, new_models)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Lista de modelos Gemini atualizada!")
else:
    print("⚠️ Lista de modelos não encontrada!")
