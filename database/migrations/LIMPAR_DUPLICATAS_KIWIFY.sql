-- ============================================================================
-- SCRIPT CORRIGIDO: Limpar Duplicações Kiwify
-- ORDEM CORRETA: DELETE primeiro, UPDATE depois
-- ============================================================================

-- 1. Ver duplicatas atuais (antes da limpeza)
SELECT 
  id,
  customer_email,
  customer_name,
  customer_phone,
  external_transaction_id,
  created_at
FROM sales_events
WHERE customer_email = 'xacoxa7555@codgal.com'
ORDER BY created_at DESC;

-- ============================================================================
-- 2. LIMPAR CASO JULIETE (2 registros duplicados)
-- ============================================================================

-- Passo 1: DELETAR o registro INCOMPLETO (sem telefone e transaction_id)
DELETE FROM sales_events
WHERE id = '1281b7b0-d5b2-4cfc-85d9-0763e808e85f'
  AND customer_email = 'xacoxa7555@codgal.com';

-- Passo 2: Registro completo já existe, nada a fazer!
-- O registro 'a3617da4-6e77-4d16-abf5-acd67a81efa2' tem tudo preenchido

-- 3. Verificar resultado
SELECT 
  id,
  customer_name,
  customer_email,
  customer_phone,
  external_transaction_id,
  platform_metadata,
  created_at
FROM sales_events
WHERE customer_email = 'xacoxa7555@codgal.com'
ORDER BY created_at DESC;

-- ============================================================================
-- 4. LIMPEZA GERAL AUTOMÁTICA: Todos os duplicados dos últimos 7 dias
-- ============================================================================

-- Remove duplicatas mantendo o registro mais completo
WITH duplicates AS (
  SELECT 
    customer_email,
    product_id,
    status,
    DATE_TRUNC('minute', created_at) as created_minute
  FROM sales_events
  WHERE platform_origin = 'kiwify'
    AND created_at >= NOW() - INTERVAL '7 days'
  GROUP BY customer_email, product_id, status, DATE_TRUNC('minute', created_at)
  HAVING COUNT(*) > 1
),
ranked_records AS (
  SELECT 
    se.id,
    se.customer_email,
    se.product_id,
    se.status,
    DATE_TRUNC('minute', se.created_at) as created_minute,
    ROW_NUMBER() OVER (
      PARTITION BY se.customer_email, se.product_id, se.status, DATE_TRUNC('minute', se.created_at)
      ORDER BY 
        se.external_transaction_id IS NOT NULL DESC, -- Prioriza com transaction_id
        CHAR_LENGTH(COALESCE(se.customer_phone, '')) DESC, -- Prioriza com telefone
        (se.platform_metadata IS NOT NULL AND se.platform_metadata::text != '{}') DESC, -- Prioriza com metadata
        se.created_at DESC -- Mais recente
    ) as rank
  FROM sales_events se
  INNER JOIN duplicates d 
    ON se.customer_email = d.customer_email
    AND se.product_id = d.product_id
    AND se.status = d.status
    AND DATE_TRUNC('minute', se.created_at) = d.created_minute
  WHERE se.platform_origin = 'kiwify'
)
DELETE FROM sales_events
WHERE id IN (
  SELECT id 
  FROM ranked_records 
  WHERE rank > 1  -- Remove todos exceto o rank 1 (mais completo)
);

-- 5. Verificar se ainda há duplicatas
SELECT 
  customer_email,
  customer_name,
  status,
  COUNT(*) as total,
  STRING_AGG(id::text, '
') as ids
FROM sales_events
WHERE platform_origin = 'kiwify'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY customer_email, customer_name, status
HAVING COUNT(*) > 1;

-- ============================================================================
-- Deve retornar 0 linhas!
-- ============================================================================

-- 6. Estatísticas finais
SELECT 
  DATE(created_at) as data,
  COUNT(*) as total_vendas,
  COUNT(DISTINCT customer_email) as clientes_unicos
FROM sales_events
WHERE platform_origin = 'kiwify'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;
