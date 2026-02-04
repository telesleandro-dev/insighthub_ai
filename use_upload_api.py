# Script para usar API de upload em vez de INSERT direto

file_path = r"c:\Users\leandro.teles\Desktop\projetos\insighthub_ ai\src\components\views\ConfiguracoesView.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Encontrar e substituir o INSERT direto por chamada à API
old_block = """      // Salvar no banco
      const { data: insertedFile, error: dbError } = await supabase
        .from('knowledge_files')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type
        })
        .select()
        .single();

      if (dbError) throw dbError;"""

new_block = """      // Salvar no banco via API (bypass RLS temporariamente)
      const uploadResponse = await fetch('/api/knowledge/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fileName: file.name,
          filePath: filePath,
          fileSize: file.size,
          fileType: file.type
        })
      });

      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadResult.error);
      
      const insertedFile = uploadResult.file;"""

if old_block in content:
    content = content.replace(old_block, new_block)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Upload agora usa API (bypass RLS)!")
else:
    print("⚠️ Bloco não encontrado. Verifique manualmente.")
