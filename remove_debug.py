# Remover alerts de debug do ConfiguracoesView

file_path = r"c:\Users\leandro.teles\Desktop\projetos\insighthub_ ai\src\components\views\ConfiguracoesView.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remover os 3 alerts de debug
content = content.replace("    alert('DEBUG 1: handleFileUpload iniciado!');\r\n", "")
content = content.replace("      alert('DEBUG 2: Vai fazer upload para Storage');\r\n", "")
content = content.replace("      console.log('🚀 Iniciando salvamento via API...');\r\n      alert('DEBUG: Vai chamar API /api/knowledge/upload');\r\n      \r\n", "")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Alerts de debug removidos!")
