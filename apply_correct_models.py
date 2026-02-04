# Aplicar modelos Gemini CORRETOS obtidos da API oficial

file_path = r"c:\Users\leandro.teles\Desktop\projetos\insighthub_ ai\src\app\api\ai\recuperar\route.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Modelos antigos (incorretos)
old_models = '''    // Lista de modelos válidos para @google/generative-ai SDK
    const modelsToTry = [
      "gemini-2.0-flash-exp",
      "gemini-pro",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ];'''

# Modelos novos (VÁLIDOS - obtidos da API REST)
new_models = '''    // Lista de modelos válidos (obtidos da API Gemini v1beta)
    const modelsToTry = [
      "gemini-2.5-flash",       // Mais rápido e moderno (June 2025)
      "gemini-flash-latest",    // Sempre atualizado automaticamente
      "gemini-2.0-flash",       // Estável e confiável
      "gemini-pro-latest"       // Mais capaz, sempre atualizado
    ];'''

if old_models in content:
    content = content.replace(old_models, new_models)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Modelos Gemini CORRETOS aplicados!")
    print("Modelos válidos:")
    print("  - gemini-2.5-flash")
    print("  - gemini-flash-latest")
    print("  - gemini-2.0-flash")
    print("  - gemini-pro-latest")
else:
    print("⚠️ Modelos não encontrados. Tentando regex...")
    import re
    pattern = r'const modelsToTry = \[[^\]]+\];'
    replacement = '''const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-2.0-flash",
      "gemini-pro-latest"
    ];'''
    
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Modelos aplicados via regex!")
