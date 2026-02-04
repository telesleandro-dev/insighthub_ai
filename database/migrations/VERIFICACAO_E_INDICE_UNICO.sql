-- ============================================================================
-- PROTEÇÃO CONTRA DUPLICADOS - SEM ÍNDICE ÚNICO
-- ============================================================================

-- A proteção contra duplicados está no CÓDIGO (route.ts)
-- Não é possível criar índice único com DATE_TRUNC porque não é IMMUTABLE

-- ============================================================================
-- 1. VERIFICAÇÃO FINAL - Confirmar 0 duplicados
-- ============================================================================

SELECT 
  customer_email,
  customer_name,
  DATE_TRUNC('minute', created_at) as minuto,
  COUNT(*) as total
FROM sales_events
WHERE recovery_status IN ('eligible', 'pending')
GROUP BY customer_email, customer_name, DATE_TRUNC('minute', created_at)
HAVING COUNT(*) > 1;

-- Deve retornar 0 linhas!

-- ============================================================================
-- 2. VER TODOS OS LEADS ATUAIS
-- ============================================================================

SELECT 
  customer_name,
  customer_email,
  status,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as data_hora,
  status_abordagem,
  recovery_status
FROM sales_events
WHERE recovery_status IN ('eligible', 'pending')
ORDER BY customer_name, created_at;

-- ============================================================================
-- 3. CRIAR ÍNDICE SIMPLES (performance, não unicidade)
-- ============================================================================

-- Índice para acelerar verificação de duplicação no código
CREATE INDEX IF NOT EXISTS idx_sales_events_dedup_check
ON sales_events (user_id, external_transaction_id)
WHERE external_transaction_id IS NOT NULL;

COMMENT ON INDEX idx_sales_events_dedup_check IS 
'Índice para acelerar verificação de duplicação no webhook handler';

-- ============================================================================
-- 4. VERIFICAR ÍNDICES CRIADOS
-- ============================================================================

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'sales_events'
ORDER BY indexname;

-- ============================================================================
-- ✅ PROTEÇÃO COMPLETA:
-- - Código JavaScript verifica external_transaction_id antes de inserir
-- - Índice acelera a verificação
-- - Duplicados já foram limpos do banco
-- ============================================================================
