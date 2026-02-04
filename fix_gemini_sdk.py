# Atualizar para modelos VÁLIDOS do SDK @google/generative-ai v0.21

file_path = r"c:\Users\leandro.teles\Desktop\projetos\insighthub_ ai\src\app\api\ai\recuperar\route.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Localizar o array modelsToTry
import re

# Substituir array completo
old_pattern = r'const modelsToTry = \[([^\]]+)\];'
new_array = '''const modelsToTry = [
      "gemini-2.0-flash-exp",        // Experimental mais recente
      "gemini-pro",                   // Estável e confiável
      "gemini-1.5-flash",             // Rápido
      "gemini-1.5-pro"                // Mais capaz
    ];'''

content = re.sub(old_pattern, new_array, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Modelos atualizados para SDK @google/generative-ai!")
