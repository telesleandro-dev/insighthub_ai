-- ⚠️ SCRIPT DE LIMPEZA DE DADOS - USE COM CUIDADO! ⚠️
-- Este script limpa TODOS os dados de emails e produtos
-- MAS preserva as tabelas de autenticação (users, profiles)

-- ===================================================================
-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- ===================================================================

-- 1. Limpar emails recebidos (inbox_messages)
DELETE FROM inbox_messages;

-- 2. Limpar produtos
DELETE FROM products;

-- 3. Resetar sequências (se houver auto-increment)
-- (Não necessário para UUID, mas útil se tiver IDs numéricos no futuro)

-- ===================================================================
-- VERIFICAÇÃO - Execute após limpar para confirmar
-- ===================================================================

-- Ver contagem de registros
SELECT 
  'inbox_messages' as tabela, 
  COUNT(*) as total_registros 
FROM inbox_messages

UNION ALL

SELECT 
  'products' as tabela, 
  COUNT(*) as total_registros 
FROM products

UNION ALL

SELECT 
  'profiles' as tabela, 
  COUNT(*) as total_registros 
FROM profiles;

-- ===================================================================
-- ESPERADO APÓS LIMPEZA:
-- inbox_messages:  0 registros
-- products:        0 registros  
-- profiles:        [DEVE MANTER SEUS USUÁRIOS]
-- ===================================================================

-- ⚠️ OBSERVAÇÕES IMPORTANTES:
--
-- 1. Este script NÃO afeta:
--    - Tabela 'profiles' (usuários do sistema)
--    - Tabela 'auth.users' (autenticação Supabase)
--    - Outras tabelas de configuração
--
-- 2. Este script limpa TUDO de:
--    - Emails recebidos (inbox_messages)
--    - Produtos cadastrados (products)
--
-- 3. BACKUP: Considere fazer um backup antes se tiver dados importantes!
--
-- 4. Para limpar apenas de um usuário específico:
--    DELETE FROM inbox_messages WHERE user_id = 'uuid-do-usuario';
--    DELETE FROM products WHERE user_id = 'uuid-do-usuario';
