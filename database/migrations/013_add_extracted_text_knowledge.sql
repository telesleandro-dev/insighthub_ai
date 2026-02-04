-- ============================================================================
-- Migration 013: Adicionar extracted_text à knowledge_files
-- Para armazenar texto extraído de PDFs, DOCs e TXTs
-- ============================================================================

-- Adicionar coluna para texto extraído
ALTER TABLE knowledge_files
ADD COLUMN IF NOT EXISTS extracted_text TEXT;

-- Adicionar coluna para status de processamento
ALTER TABLE knowledge_files
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending';
-- Status: pending, processing, completed, failed

-- Adicionar coluna para erro (se houver)
ALTER TABLE knowledge_files
ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- Índice para busca de texto (opcional, para futura busca full-text)
CREATE INDEX IF NOT EXISTS idx_knowledge_files_extracted_text
  ON knowledge_files USING gin(to_tsvector('portuguese', extracted_text));

-- Comentários
COMMENT ON COLUMN knowledge_files.extracted_text IS 'Texto extraído do arquivo para uso pela IA';
COMMENT ON COLUMN knowledge_files.processing_status IS 'Status do processamento: pending, processing, completed, failed';
COMMENT ON COLUMN knowledge_files.processing_error IS 'Mensagem de erro caso processamento falhe';

-- Verificar estrutura atualizada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'knowledge_files'
ORDER BY ordinal_position;
