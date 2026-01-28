-- Script para corrigir nomes de produtos que estão como "Produto Desconhecido"
-- Execute isso no SQL Editor do Supabase

-- 1. Ver quais produtos estão com nome genérico
SELECT id, external_id, name, platform, user_id 
FROM products 
WHERE name IN ('Produto Desconhecido', 'Produto Não Localizado');

-- 2. Para corrigir, você precisará buscar na tabela sales_events o platform_metadata
-- que tem as informações originais do webhook da Kiwify
-- Por enquanto, vou criar uma query que você pode ajustar manualmente:

-- Exemplo de correção manual (substitua os valores):
-- UPDATE products 
-- SET name = 'A Bíblia Negra da Sedução e Poder'
-- WHERE external_id = '39d44200-ce1d-11ef-8947-f71889bde439' 
-- AND platform = 'kiwify';
