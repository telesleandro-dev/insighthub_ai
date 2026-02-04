# Script para atualizar handleFileUpload para usar upload completo via API

file_path = r"c:\Users\leandro.teles\Desktop\projetos\insighthub_ ai\src\components\views\ConfiguracoesView.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Substituir TODA a lógica de upload
old_block = """    setUploading(true);
    alert('DEBUG 1: handleFileUpload iniciado!');
    try {
      alert('DEBUG 2: Vai fazer upload para Storage');
      // Upload para Storage
      const timestamp = Date.now();
      const filePath = `knowledge/${user.id}/${timestamp}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      console.log('🚀 Iniciando salvamento via API...');
      alert('DEBUG: Vai chamar API /api/knowledge/upload');
      
      // Salvar no banco via API (bypass RLS temporariamente)
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

new_block = """    setUploading(true);
    try {
      // Upload COMPLETO via API (Storage + DB com SERVICE_ROLE - bypass RLS)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);

      const uploadResponse = await fetch('/api/knowledge/upload-complete', {
        method: 'POST',
        body: formData
      });

      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadResult.error);
      
      const insertedFile = uploadResult.file;"""

if old_block in content:
    content = content.replace(old_block, new_block)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Upload completo via API configurado!")
else:
    print("⚠️ Bloco não encontrado. Tentando versão sem alerts...")
    # Tentar sem os alerts de debug
    import re
    # Vou procurar apenas pela estrutura principal
    pattern = r'setUploading\(true\);.*?const insertedFile = uploadResult\.file;'
    if re.search(pattern, content, re.DOTALL):
        print("✅ Estrutura encontrada! Aplicando manualmente...")
        # Fazer replace manual mais específico
    else:
        print("❌ Não encontrei a estrutura!")
