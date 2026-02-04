-- ============================================================================
-- VERIFICAR SE MIGRATION 013 FOI EXECUTADA
-- Execute para ver se as colunas extracted_text existem
-- ============================================================================

-- Verificar estrutura da tabela knowledge_files
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'knowledge_files'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Se extracted_text NÃO aparecer, execute a migration 013:
-- database/migrations/013_add_extracted_text_knowledge.sql
