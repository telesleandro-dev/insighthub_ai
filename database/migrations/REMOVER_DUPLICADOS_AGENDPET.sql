-- ============================================================================
-- SCRIPT: Remover Leads Duplicados (agendpet@gmail.com)
-- ============================================================================

-- 1. PRIMEIRO: Ver os leads duplicados para confirmar
SELECT 
  id,
  customer_name,
  customer_email,
  external_transaction_id,
  created_at,
  status,
  recovery_status
FROM sales_events
WHERE customer_email = 'agendpet@gmail.com'
ORDER BY created_at DESC;

-- ============================================================================
-- 2. Identificar duplicados (manter o MAIS ANTIGO)
-- ============================================================================

WITH duplicados AS (
  SELECT 
    id,
    customer_email,
    external_transaction_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY external_transaction_id 
      ORDER BY created_at ASC  -- Manter o primeiro
    ) as row_num
  FROM sales_events
  WHERE customer_email = 'agendpet@gmail.com'
    AND external_transaction_id IS NOT NULL
)
SELECT 
  id,
  customer_email,
  external_transaction_id,
  created_at,
  CASE 
    WHEN row_num = 1 THEN '✅ MANTER'
    ELSE '❌ DELETAR'
  END as acao
FROM duplicados
ORDER BY external_transaction_id, created_at;

-- ============================================================================
-- 3. DELETAR DUPLICADOS (manter só o primeiro de cada transaction_id)
-- ============================================================================

-- ⚠️ ATENÇÃO: Execute SOMENTE após revisar a query acima!

WITH duplicados AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY external_transaction_id 
      ORDER BY created_at ASC
    ) as row_num
  FROM sales_events
  WHERE customer_email = 'agendpet@gmail.com'
    AND external_transaction_id IS NOT NULL
)
DELETE FROM sales_events
WHERE id IN (
  SELECT id 
  FROM duplicados 
  WHERE row_num > 1
);

-- Ver resultado
SELECT COUNT(*) as total_restante
FROM sales_events
WHERE customer_email = 'agendpet@gmail.com';

-- ============================================================================
-- 4. ADICIONAR CONSTRAINT UNIQUE (prevenir duplicados futuros)
-- ============================================================================

-- Adicionar índice único em external_transaction_id + user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_external_transaction
ON sales_events(user_id, external_transaction_id)
WHERE external_transaction_id IS NOT NULL;

-- Comentário
COMMENT ON INDEX idx_unique_external_transaction IS 'Previne webhooks duplicados - único por user_id + external_transaction_id';

-- Verificar
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'sales_events'
  AND indexname = 'idx_unique_external_transaction';

-- ============================================================================
-- FIM
-- ============================================================================
