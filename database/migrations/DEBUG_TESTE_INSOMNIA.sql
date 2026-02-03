-- 🔍 VERIFICAR SALES_EVENTS CRIADO PELO TESTE

-- Ver últimos sales_events (incluindo recovery_status)
SELECT 
  id,
  customer_name,
  customer_email,
  product_id,
  value,
  status,
  recovery_status,  -- ⬅️ IMPORTANTE!
  status_abordagem,
  created_at
FROM sales_events
WHERE user_id = 'c048be53-fff6-4446-a8b8-6abf79fce171'
ORDER BY created_at DESC
LIMIT 10;

-- Se aparecer "João da Silva" aqui:
-- ✅ Lead FOI criado
-- 
-- Verificar recovery_status:
-- - Se recovery_status = 'eligible' → Problema é no frontend
-- - Se recovery_status != 'eligible' → Problema é no webhook

-- Se NÃO aparecer "João da Silva":
-- ❌ Lead NÃO foi criado
-- Problema está no webhook ou no matching de produto
