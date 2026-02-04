-- 🔍 VERIFICAR ÚLTIMO LEAD CRIADO APÓS CORREÇÃO

SELECT 
  id,
  customer_name,
  customer_email,
  product_id,
  value,
  status,  -- ⬅️ Deve ser 'abandoned' agora
  recovery_status,  -- ⬅️ Deve ser 'eligible' agora
  status_abordagem,
  created_at
FROM sales_events
WHERE user_id = 'c048be53-fff6-4446-a8b8-6abf79fce171'
ORDER BY created_at DESC
LIMIT 3;

-- RESULTADO ESPERADO para o lead de teste:
-- customer_name: "João da Silva" 
-- status: "abandoned" (NÃO mais "waiting_payment")
-- recovery_status: "eligible" (NÃO mais "pending")
-- value: "69.87"

-- Se ainda aparecer:
-- status: "waiting_payment" + recovery_status: "pending"
-- → Deploy ainda não completou (aguarde mais 1-2 min)

-- Se aparecer:
-- status: "abandoned" + recovery_status: "eligible"
-- → Lead está correto, problema pode ser no frontend (cache?)
