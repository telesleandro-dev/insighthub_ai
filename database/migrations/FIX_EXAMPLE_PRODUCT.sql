-- ✅ SOLUÇÃO RÁPIDA: Atualizar "Example product" com preço R$ 69,90

-- 1. Ver todos os produtos "Example product"
SELECT id, name, external_id, price, platform
FROM products
WHERE name = 'Example product'
  AND user_id = 'c048be53-fff6-4446-a8b8-6abf79fce171';

-- 2. Atualizar TODOS os "Example product" com preço R$ 69,90
UPDATE products
SET price = 69.90
WHERE name = 'Example product'
  AND user_id = 'c048be53-fff6-4446-a8b8-6abf79fce171';

-- 3. Verificar resultado
SELECT id, name, price
FROM products
WHERE name = 'Example product'
  AND user_id = 'c048be53-fff6-4446-a8b8-6abf79fce171';

-- IMPORTANTE: Agora todos os webhooks de teste da Kiwify
-- que vierem com "Example product" terão preço R$ 69,90!

-- ===================================================================
-- ALTERNATIVA: Deletar produtos antigos "Example product" sem preço
-- ===================================================================

-- CUIDADO: Isso vai deletar sales_events associados também!
-- Só execute se tiver certeza

DELETE FROM products
WHERE name = 'Example product'
  AND price IS NULL
  AND user_id = 'c048be53-fff6-4446-a8b8-6abf79fce171';

-- Depois reenvie o webhook de teste
-- Ele vai criar um novo produto "Example product" sem preço
-- MAS o código vai buscar o preço de outro produto similar pelo nome
