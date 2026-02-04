# Script para corrigir loading infinito de knowledge_files
# Adiciona try/finally para garantir que loading seja desativado

file_path = r"c:\Users\leandro.teles\Desktop\projetos\insighthub_ ai\src\components\views\ConfiguracoesView.tsx"

# Ler arquivo
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Código antigo
old_code = """  // Carregar arquivos da base de conhecimento
  useEffect(() => {
    const loadFiles = async () => {
      if (!user) return;
      setLoadingFiles(true);

      const { data, error } = await supabase
        .from('knowledge_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setKnowledgeFiles(data);
      }
      setLoadingFiles(false);
    };

    loadFiles();
  }, [user?.id]);"""

# Código novo
new_code = """  // Carregar arquivos da base de conhecimento
  useEffect(() => {
    const loadFiles = async () => {
      if (!user) return;
      
      setLoadingFiles(true);
      try {
        const { data, error } = await supabase
          .from('knowledge_files')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setKnowledgeFiles(data);
        } else if (error) {
          console.error('Erro ao carregar arquivos:', error);
          // Pode ser que a migration 013 ainda não foi executada
        }
      } catch (err) {
        console.error('Erro inesperado:', err);
      } finally {
        setLoadingFiles(false);
      }
    };

    loadFiles();
  }, [user?.id]);"""

# Substituir
if old_code in content:
    content = content.replace(old_code, new_code)
    
    # Escrever de volta
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Loading infinito corrigido!")
else:
    print("⚠️ Código não encontrado, tentando buscar pela função...")
    if "const loadFiles = async () =>" in content:
        print("Função encontrada, mas estrutura diferente. Verifique manualmente.")
    else:
        print("❌ Função não encontrada!")
