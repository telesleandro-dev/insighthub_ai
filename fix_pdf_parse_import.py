# Corrigir import do pdf-parse

file_path = r"c:\Users\leandro.teles\Desktop\projetos\insighthub_ ai\src\app\api\knowledge\extract\route.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Substituir linha do pdf-parse
old_line = "const pdf = require('pdf-parse');"
new_line = "const pdf = require('pdf-parse').default || require('pdf-parse');"

if old_line in content:
    content = content.replace(old_line, new_line)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Import do pdf-parse corrigido!")
    print("Novo código:")
    print(new_line)
else:
    print("⚠️ Linha não encontrada!")
    print("Verificando alternativas...")
