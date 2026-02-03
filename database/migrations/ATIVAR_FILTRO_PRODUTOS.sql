-- ========================================
-- ATIVAR FILTRO DE PRODUTOS
-- Execute este script no Supabase SQL Editor
-- ========================================

-- 1. Adicionar colunas se não existirem
ALTER TABLE inbox_messages
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE inbox_messages
  ADD COLUMN IF NOT EXISTS produto_identificado text;

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_inbox_messages_product_id 
  ON inbox_messages(product_id);

-- 3. Verificar se funcionou
SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_name = 'inbox_messages'
  AND column_name IN ('product_id', 'produto_identificado');

-- Deve retornar:
-- product_id          | uuid
-- produto_identificado| text

-- ✅ PRONTO! Agora o filtro vai funcionar.
