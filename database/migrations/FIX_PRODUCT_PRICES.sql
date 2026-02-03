-- ✅ SOLUÇÃO: Atualizar preço dos produtos "Example product"

-- Opção 1: Atualizar todos os produtos "Example product" com mesmo preço
UPDATE products
SET price = 197.00  -- AJUSTE O VALOR AQUI!
WHERE name = 'Example product'
  AND user_id = 'c048be53-fff6-4446-a8b8-6abf79fce171'
  AND price IS NULL;

-- Opção 2: Atualizar cada produto individualmente
UPDATE products
SET price = 197.00
WHERE id = 'dc89e393-43a4-409e-b88c-87279378adf8';  -- Primeiro produto

UPDATE products
SET price = 197.00
WHERE id = 'a93ffcb5-a26a-46b0-8bd6-78ce474d4c0a';  -- Segundo produto

-- ===================================================================
-- VERIFICAÇÃO
-- ===================================================================
SELECT id, name, price
FROM products
WHERE user_id = 'c048be53-fff6-4446-a8b8-6abf79fce171';

-- Resultado esperado:
-- Todos os produtos devem ter price preenchido (não NULL)

-- ===================================================================
-- IMPORTANTE: Reenviar Webhook de Teste
-- ===================================================================
-- Após atualizar os preços:
-- 1. Configure webhook da Kiwify
-- 2. Envie carrinho abandonado com "Example product"
-- 3. Agora o valor será buscado do banco e preenchido corretamente!
