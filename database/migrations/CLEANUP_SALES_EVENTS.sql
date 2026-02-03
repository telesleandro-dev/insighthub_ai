-- ⚠️ LIMPAR TABELA sales_events - USE COM CUIDADO! ⚠️
-- Este script apaga TODOS os registros da tabela sales_events

-- ===================================================================
-- Opção 1: Apagar TODOS os registros
-- ===================================================================
DELETE FROM sales_events;

-- ===================================================================
-- Opção 2: Apagar registros de um usuário específico
-- ===================================================================
-- DELETE FROM sales_events WHERE user_id = 'seu-uuid-aqui';

-- ===================================================================
-- Opção 3: Apagar registros de um produto específico
-- ===================================================================
-- DELETE FROM sales_events WHERE product_id = 'uuid-do-produto';

-- ===================================================================
-- Opção 4: Apagar registros antigos (exemplo: mais de 30 dias)
-- ===================================================================
-- DELETE FROM sales_events 
-- WHERE created_at < NOW() - INTERVAL '30 days';

-- ===================================================================
-- VERIFICAÇÃO - Execute após limpar
-- ===================================================================
SELECT COUNT(*) as total_registros FROM sales_events;

-- Esperado: 0 registros (se usou Opção 1)
