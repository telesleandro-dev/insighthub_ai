-- ============================================================================
-- SCRIPT: Limpar TODOS os Leads Duplicados do Banco
-- ============================================================================

-- 1. IDENTIFICAR TODOS OS DUPLICADOS (não só agendpet)
SELECT 
  external_transaction_id,
  COUNT(*) as total_duplicados,
  string_agg(id::text, ', ') as ids,
  MIN(created_at) as primeiro,
  MAX(created_at) as ultimo
FROM sales_events
WHERE external_transaction_id IS NOT NULL
GROUP BY external_transaction_id
HAVING COUNT(*) > 1
ORDER BY total_duplicados DESC;

-- ============================================================================
-- 2. VER DETALHES DOS DUPLICADOS
-- ============================================================================

WITH duplicados_grouped AS (
  SELECT 
    external_transaction_id,
    COUNT(*) as total
  FROM sales_events
  WHERE external_transaction_id IS NOT NULL
  GROUP BY external_transaction_id
  HAVING COUNT(*) > 1
)
SELECT 
  se.id,
  se.external_transaction_id,
  se.customer_email,
  se.customer_name,
  se.status,
  se.created_at,
  ROW_NUMBER() OVER (
    PARTITION BY se.external_transaction_id 
    ORDER BY se.created_at ASC
  ) as ordem
FROM sales_events se
INNER JOIN duplicados_grouped dg 
  ON se.external_transaction_id = dg.external_transaction_id
ORDER BY se.external_transaction_id, se.created_at;

-- ============================================================================
-- 3. REMOVER TODOS OS DUPLICADOS (manter apenas o PRIMEIRO de cada)
-- ============================================================================

-- ⚠️ ATENÇÃO: Revise a query acima antes de executar!
-- Esta query vai DELETAR os registros duplicados!

WITH duplicados AS (
  SELECT 
    id,
    external_transaction_id,
    ROW_NUMBER() OVER (
      PARTITION BY external_transaction_id 
      ORDER BY created_at ASC  -- Mantém o mais antigo
    ) as row_num
  FROM sales_events
  WHERE external_transaction_id IS NOT NULL
)
DELETE FROM sales_events
WHERE id IN (
  SELECT id 
  FROM duplicados 
  WHERE row_num > 1
);

-- Conferir quantos foram removidos
SELECT 
  'Duplicados removidos!' as status,
  COUNT(*) as total_restante
FROM sales_events;

-- ============================================================================
-- 4. VERIFICAR SE AINDA HÁ DUPLICADOS
-- ============================================================================

SELECT 
  external_transaction_id,
  COUNT(*) as total
FROM sales_events
WHERE external_transaction_id IS NOT NULL
GROUP BY external_transaction_id
HAVING COUNT(*) > 1;

-- Deve retornar 0 linhas!

-- ============================================================================
-- 5. AGORA SIM: CRIAR ÍNDICE ÚNICO
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_external_transaction
ON sales_events(user_id, external_transaction_id)
WHERE external_transaction_id IS NOT NULL;

COMMENT ON INDEX idx_unique_external_transaction IS 'Previne webhooks duplicados - único por user_id + external_transaction_id';

-- ============================================================================
-- 6. VERIFICAÇÃO FINAL
-- ============================================================================

-- Ver índice criado
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'sales_events'
  AND indexname = 'idx_unique_external_transaction';

-- Contar total de eventos
SELECT 
  COUNT(*) as total_eventos,
  COUNT(DISTINCT external_transaction_id) as transacoes_unicas
FROM sales_events
WHERE external_transaction_id IS NOT NULL;

-- ============================================================================
-- 🎯 RESULTADO ESPERADO:
-- - Todos os duplicados removidos
-- - Índice único criado com sucesso
-- - Webhooks futuros não poderão duplicar!
-- ============================================================================
