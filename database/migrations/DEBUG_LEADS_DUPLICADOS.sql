-- 🔍 Investigar Leads Duplicados - Rafael BC

-- 1. Buscar leads com email agendpet@gmail.com
SELECT 
  id,
  customer_name,
  customer_email,
  status,
  recovery_status,
  value,
  product_id,
  external_transaction_id,
  created_at,
  platform_origin
FROM sales_events
WHERE customer_email = 'agendpet@gmail.com'
ORDER BY created_at DESC;

-- 2. Verificar se há registros duplicados (mesmo external_transaction_id)
SELECT 
  external_transaction_id,
  COUNT(*) as total_duplicados,
  string_agg(id::text, ', ') as ids_duplicados,
  MIN(created_at) as primeiro_registro,
  MAX(created_at) as ultimo_registro
FROM sales_events
WHERE customer_email = 'agendpet@gmail.com'
GROUP BY external_transaction_id
HAVING COUNT(*) > 1;

-- 3. Ver TODOS os eventos de hoje para esse email
SELECT 
  id,
  customer_name,
  customer_email,
  status,
  value,
  external_transaction_id,
  created_at
FROM sales_events
WHERE customer_email = 'agendpet@gmail.com'
  AND created_at >= CURRENT_DATE
ORDER BY created_at DESC;

-- 4. Verificar se há constraint UNIQUE em external_transaction_id
SELECT
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'sales_events'::regclass
  AND contype = 'u';  -- unique constraints
