# Script para atualizar handleFileUpload em ConfiguracoesView.tsx
# Adiciona chamada à API de extração de texto

file_path = r"c:\Users\leandro.teles\Desktop\projetos\insighthub_ ai\src\components\views\ConfiguracoesView.tsx"

# Ler arquivo
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Código antigo (para encontrar)
old_code = """  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      // Upload para Storage
      const timestamp = Date.now();
      const filePath = `knowledge/${user.id}/${timestamp}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Salvar no banco
      const { error: dbError } = await supabase
        .from('knowledge_files')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type
        });

      if (dbError) throw dbError;

      alert('✅ Arquivo enviado com sucesso!');

      // Recarregar lista
      const { data } = await supabase
        .from('knowledge_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setKnowledgeFiles(data);

    } catch (error: any) {
      alert('❌ Erro: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };"""

# Código novo
new_code = """  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      // Upload para Storage
      const timestamp = Date.now();
      const filePath = `knowledge/${user.id}/${timestamp}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Salvar no banco
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

      if (dbError) throw dbError;

      alert('✅ Arquivo enviado! Processando texto...');

      // Processar extração de texto em background
      fetch('/api/knowledge/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: insertedFile.id,
          userId: user.id
        })
      }).then(res => {
        if (res.ok) {
          console.log('✅ Texto extraído com sucesso');
        } else {
          console.error('❌ Erro na extração de texto');
        }
      });

      // Recarregar lista
      const { data } = await supabase
        .from('knowledge_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setKnowledgeFiles(data);

    } catch (error: any) {
      alert('❌ Erro: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };"""

# Substituir
if old_code in content:
    content = content.replace(old_code, new_code)
    
    # Escrever de volta
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ handleFileUpload atualizado com extração de texto!")
else:
    print("⚠️ Código antigo não encontrado. Verificando variações...")
    # Tentar encontrar pela assinatura
    if "const handleFileUpload = async" in content:
        print("✅ Função encontrada, mas estrutura diferente.")
        print("Por favor, atualize manualmente usando UPDATE_HANDLE_FILE_UPLOAD.txt")
    else:
        print("❌ Função handleFileUpload não encontrada!")
