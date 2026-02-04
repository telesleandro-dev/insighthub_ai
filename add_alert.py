# Script para adicionar alert de debug

file_path = r"c:\Users\leandro.teles\Desktop\projetos\insighthub_ ai\src\components\views\ConfiguracoesView.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Adicionar alert ANTES da chamada à API
old_line = "      // Salvar no banco via API (bypass RLS temporariamente)"
new_code = """      console.log('🚀 Iniciando salvamento via API...');
      alert('DEBUG: Vai chamar API /api/knowledge/upload');
      
      // Salvar no banco via API (bypass RLS temporariamente)"""

if old_line in content:
    content = content.replace(old_line, new_code)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Alert de debug adicionado!")
else:
    print("⚠️ Linha não encontrada!")
