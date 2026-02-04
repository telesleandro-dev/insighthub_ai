-- ============================================================================
-- DEBUG: Verificar autenticação do usuário específico
-- Execute no SQL Editor DO SUPABASE (aba SQL)
-- ============================================================================

-- 1. Ver usuário específico em auth.users
SELECT id, email, created_at
FROM auth.users
WHERE id = 'c048be53-fff6-4446-a8b8-6abf79fce171';

-- 2. Ver profile desse usuário
SELECT id, email, nome, insighthub_email
FROM profiles
WHERE id = 'c048be53-fff6-4446-a8b8-6abf79fce171';

-- 3. Testar INSERT direto (FORÇA o user_id - bypass RLS)
-- IMPORTANTE: Isso só funciona se você estiver como ADMIN no SQL Editor
INSERT INTO knowledge_files (
  user_id,
  file_name,
  file_path,
  file_size,
  file_type
)
VALUES (
  'c048be53-fff6-4446-a8b8-6abf79fce171'::uuid,
  'teste_manual.txt',
  'knowledge/c048be53-fff6-4446-a8b8-6abf79fce171/teste.txt',
  100,
  'text/plain'
)
RETURNING *;

-- Se isso FUNCIONAR, o problema é no frontend (client não está autenticado)
-- Se isso NÃO FUNCIONAR, o problema é nas policies ou na tabela

-- 4. Limpar teste
DELETE FROM knowledge_files WHERE file_name = 'teste_manual.txt';
