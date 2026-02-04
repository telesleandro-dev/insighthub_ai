# Script para adicionar debug no handleFileUpload

file_path = r"c:\Users\leandro.teles\Desktop\projetos\insighthub_ ai\src\components\views\ConfiguracoesView.tsx"

# Ler arquivo
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Localizar e adicionar debug após upload bem-sucedido
old_line = "      if (uploadError) throw uploadError;"
new_code = """      if (uploadError) throw uploadError;

      // DEBUG: Verificar autenticação
      const { data: authData } = await supabase.auth.getUser();
      console.log('🔍 DEBUG AUTH:');
      console.log('User from hook:', user.id);
      console.log('Auth user:', authData.user?.id);
      console.log('Match:', user.id === authData.user?.id);
      console.log('Insert payload:', {
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type
      });"""

if old_line in content:
    content = content.replace(old_line, new_code)
    
    # Escrever de volta
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Debug adicionado ao handleFileUpload!")
else:
    print("⚠️ Linha não encontrada!")
