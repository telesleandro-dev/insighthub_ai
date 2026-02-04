# Corrigir modelos Gemini para nomes OFICIAIS v1beta

file_path = r"c:\Users\leandro.teles\Desktop\projetos\insighthub_ ai\src\app\api\ai\recuperar\route.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Lista antiga
old_models = '''    // Lista de modelos para tentativa (Fallback em Cascata para evitar 429)
    const modelsToTry = [
      "gemini-1.5-flash",      // Mais rápido e barato
      "gemini-1.5-pro-latest", // Mais capaz
      "gemini-pro"             // Fallback final
    ];'''

# Lista CORRETA com nomes oficiais v1beta
new_models = '''    // Lista de modelos para tentativa (nomes OFICIAIS da API v1beta)
    const modelsToTry = [
      "gemini-1.5-flash-002",     // Mais rápido
      "gemini-1.5-flash-001",     // Fallback flash
      "gemini-1.5-pro-002",       // Mais capaz
      "gemini-1.5-pro-001"        // Fallback pro
    ];'''

if old_models in content:
    content = content.replace(old_models, new_models)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Modelos corrigidos para nomes oficiais v1beta!")
else:
    print("⚠️ Tentando buscar manualmente...")
    # Buscar pela linha const modelsToTry
    if 'const modelsToTry' in content:
        import re
        # Substituir todo o array
        pattern = r'const modelsToTry = \[([^\]]+)\];'
        replacement = '''const modelsToTry = [
      "gemini-1.5-flash-002",     // Mais rápido
      "gemini-1.5-flash-001",     // Fallback flash
      "gemini-1.5-pro-002",       // Mais capaz
      "gemini-1.5-pro-001"        // Fallback pro
    ];'''
        content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ Modelos corrigidos (regex)!")
    else:
        print("❌ Não encontrei modelsToTry!")
