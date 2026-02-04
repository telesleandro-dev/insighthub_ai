-- ============================================================================
-- Migration 011: produto_identificado (SAFE)
-- ============================================================================

-- Adicionar coluna se não existir
ALTER TABLE inbox_messages
ADD COLUMN IF NOT EXISTS produto_identificado TEXT;

-- Verificar
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'inbox_messages'
  AND column_name = 'produto_identificado';
