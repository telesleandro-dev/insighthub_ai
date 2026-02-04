-- 🔍 INVESTIGAR: O que realmente está duplicado?

-- 1. Ver TODOS os Rafael BC
SELECT 
  id,
  customer_name,
  customer_email,
  status,
  value,
  external_transaction_id,
  created_at,
  status_abordagem
FROM sales_events
WHERE customer_name ILIKE '%Rafael%BC%'
   OR customer_email = 'agendpet@gmail.com'
ORDER BY created_at DESC;

-- 2. Ver TODAS as Camila de Souza
SELECT 
  id,
  customer_name,
  customer_email,
  status,
  value,
  external_transaction_id,
  created_at
FROM sales_events
WHERE customer_name ILIKE '%Camila%Souza%'
   OR customer_email ILIKE '%joycegs44b%'
ORDER BY created_at DESC;

-- 3. Identificar VERDADEIROS duplicados (mesmo email + hora próxima)
WITH eventos_agrupados AS (
  SELECT 
    *,
    LAG(created_at) OVER (PARTITION BY customer_email ORDER BY created_at) as created_at_anterior,
    EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (PARTITION BY customer_email ORDER BY created_at))) as segundos_diferenca
  FROM sales_events
  WHERE created_at >= '2026-02-04'  -- Só hoje
)
SELECT 
  id,
  customer_name,
  customer_email,
  status,
  created_at,
  created_at_anterior,
  segundos_diferenca,
  CASE 
    WHEN segundos_diferenca < 10 THEN '🚨 DUPLICADO (< 10s)'
    WHEN segundos_diferenca < 60 THEN '⚠️ SUSPEITO (< 1min)'
    ELSE '✅ OK'
  END as analise
FROM eventos_agrupados
WHERE segundos_diferenca IS NOT NULL
ORDER BY customer_email, created_at;

-- 4. Ver se external_transaction_id é NULL (carrinhos abandonados)
SELECT 
  customer_email,
  customer_name,
  external_transaction_id,
  status,
  created_at,
  CASE 
    WHEN external_transaction_id IS NULL THEN '⚠️ SEM TRANSACTION ID'
    ELSE '✅ TEM ID'
  END as tem_id
FROM sales_events
WHERE created_at >= '2026-02-04'
ORDER BY customer_email, created_at;
