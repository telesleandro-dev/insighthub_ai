-- ============================================================================
-- SCRIPT CORRETO: Remover Duplicados REAIS
-- Critério: Mesmo email + created_at com diferença < 5 minutos
-- ============================================================================

-- 1. IDENTIFICAR duplicados verdadeiros (mesmo email, horário próximo)
WITH eventos_numerados AS (
  SELECT 
    id,
    customer_email,
    customer_name,
    status,
    value,
    external_transaction_id,
    created_at,
    status_abordagem,
    ROW_NUMBER() OVER (
      PARTITION BY 
        customer_email,
        DATE_TRUNC('minute', created_at),  -- Agrupa por minuto
        status,
        value
      ORDER BY created_at ASC  -- Mantém o primeiro
    ) as row_num
  FROM sales_events
  WHERE recovery_status = 'eligible'  -- Só leads recuperáveis
    OR recovery_status = 'pending'
)
SELECT 
  id,
  customer_email,
  customer_name,
  status,
  created_at,
  row_num,
  CASE 
    WHEN row_num = 1 THEN '✅ MANTER'
    ELSE '❌ DUPLICADO - DELETAR'
  END as acao
FROM eventos_numerados
WHERE row_num > 1  -- Mostrar só os duplicados
ORDER BY customer_email, created_at;

-- ============================================================================
-- 2. VER GRUPOS DE DUPLICADOS (revisar antes de deletar!)
-- ============================================================================

SELECT 
  customer_email,
  customer_name,
  DATE_TRUNC('minute', created_at) as minuto,
  COUNT(*) as total_no_mesmo_minuto,
  string_agg(id::text, ', ') as ids,
  MIN(created_at) as primeiro,
  MAX(created_at) as ultimo
FROM sales_events
WHERE recovery_status IN ('eligible', 'pending')
GROUP BY customer_email, customer_name, DATE_TRUNC('minute', created_at)
HAVING COUNT(*) > 1
ORDER BY total_no_mesmo_minuto DESC;

-- ============================================================================
-- 3. DELETAR DUPLICADOS (executar SOMENTE após revisar acima!)
-- ============================================================================

-- ⚠️ ATENÇÃO: Esta query vai DELETAR registros!
-- Execute a query #1 e #2 primeiro para confirmar!

WITH eventos_numerados AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY 
        customer_email,
        DATE_TRUNC('minute', created_at),
        status,
        value
      ORDER BY created_at ASC
    ) as row_num
  FROM sales_events
  WHERE recovery_status IN ('eligible', 'pending')
)
DELETE FROM sales_events
WHERE id IN (
  SELECT id 
  FROM eventos_numerados 
  WHERE row_num > 1
);

-- Ver resultado
SELECT 
  'Duplicados removidos!' as status,
  COUNT(*) as total_restante
FROM sales_events;

-- ============================================================================
-- 4. VERIFICAR SE AINDA HÁ DUPLICADOS
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
-- 5. Ver TODOS os leads de hoje para conferir
-- ============================================================================

SELECT 
  customer_name,
  customer_email,
  status,
  created_at,
  status_abordagem,
  recovery_status
FROM sales_events
WHERE created_at >= CURRENT_DATE
ORDER BY customer_email, created_at;

-- ============================================================================
-- FIM
-- ============================================================================
