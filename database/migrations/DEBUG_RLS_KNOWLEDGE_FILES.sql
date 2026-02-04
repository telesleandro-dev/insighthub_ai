-- ============================================================================
-- DEBUG RLS: Verificar configuração de knowledge_files
-- ============================================================================

-- 1. Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'knowledge_files'
) as tabela_existe;

-- 2. Ver estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'knowledge_files'
ORDER BY ordinal_position;

-- 3. Verificar se RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename = 'knowledge_files';

-- 4. Listar todas as policies
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'knowledge_files';

-- 5. Ver seu user_id atual
SELECT auth.uid() as meu_user_id;

-- 6. Tentar ver quais arquivos você tem
SELECT id, file_name, user_id, created_at
FROM knowledge_files
LIMIT 5;

-- 7. Teste de INSERT (comentado - descomente para testar)
/*
INSERT INTO knowledge_files (
  user_id, 
  file_name, 
  file_path, 
  file_size, 
  file_type
)
VALUES (
  auth.uid(), 
  'teste_debug.txt', 
  'knowledge/debug/teste.txt', 
  100, 
  'text/plain'
)
RETURNING *;
*/

-- Se aparecer erro aqui, copie a mensagem completa
