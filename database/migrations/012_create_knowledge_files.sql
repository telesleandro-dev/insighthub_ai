-- ============================================================================
-- Migration 012: Criar tabela knowledge_files
-- Para armazenar metadados de arquivos enviados pelos usuários
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product_id UUID REFERENCES products(id), -- Opcional: vincular a produto específico
  
  -- Metadados do arquivo
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE, -- Caminho no Supabase Storage
  file_size BIGINT NOT NULL, -- Tamanho em bytes
  file_type TEXT, -- MIME type (application/pdf, text/plain, etc)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_knowledge_files_user 
  ON knowledge_files(user_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_files_product 
  ON knowledge_files(product_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_files_created 
  ON knowledge_files(created_at DESC);

-- RLS Policies
ALTER TABLE knowledge_files ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios arquivos
CREATE POLICY "Users can view own knowledge files"
  ON knowledge_files FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem inserir seus próprios arquivos
CREATE POLICY "Users can insert own knowledge files"
  ON knowledge_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios arquivos
CREATE POLICY "Users can update own knowledge files"
  ON knowledge_files FOR UPDATE
  USING (auth.uid() = user_id);

-- Usuários podem deletar seus próprios arquivos
CREATE POLICY "Users can delete own knowledge files"
  ON knowledge_files FOR DELETE
  USING (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE knowledge_files IS 'Arquivos enviados pelos usuários para base de conhecimento';
COMMENT ON COLUMN knowledge_files.file_path IS 'Caminho completo no Supabase Storage bucket knowledge-base';
COMMENT ON COLUMN knowledge_files.file_size IS 'Tamanho do arquivo em bytes';

-- Verificar
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'knowledge_files'
ORDER BY ordinal_position;
