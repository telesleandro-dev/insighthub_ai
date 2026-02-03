-- Verificar se as colunas product_id e produto_identificado existem
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'inbox_messages'
  AND column_name IN ('product_id', 'produto_identificado');

-- Se retornar vazio, as colunas NÃO existem
-- Execute a migration 009 abaixo:

-- ========================================
-- MIGRATION 009: Add Product to Inbox
-- ========================================

-- Add product relationship to inbox_messages
ALTER TABLE inbox_messages
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products(id) ON DELETE SET NULL;

-- Index for faster filtering by product
CREATE INDEX IF NOT EXISTS idx_inbox_messages_product_id ON inbox_messages(product_id);

-- Add AI-identified product name (fallback)
ALTER TABLE inbox_messages
  ADD COLUMN IF NOT EXISTS produto_identificado text;

-- Verificar novamente após executar
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'inbox_messages'
  AND column_name IN ('product_id', 'produto_identificado');

-- Deve retornar 2 linhas agora!
