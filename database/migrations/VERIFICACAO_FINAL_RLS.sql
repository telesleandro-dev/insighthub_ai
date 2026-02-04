-- ============================================================================
-- VERIFICAÇÃO FINAL DO BANCO DE DADOS
-- ============================================================================

-- 1. Ver TODAS as tabelas e status RLS
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ Protegida'
    ELSE '⚠️ Sem RLS'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Contar políticas por tabela
SELECT 
  tablename,
  COUNT(*) as total_policies,
  string_agg(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 3. Tabelas SEM RLS (deve ser só supported_platforms)
SELECT 
  tablename,
  '⚠️ SEM PROTEÇÃO' as warning
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false
ORDER BY tablename;

-- 4. Verificar se recovery_status foi removida
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Tabela recovery_status removida com sucesso'
    ELSE '⚠️ Tabela recovery_status ainda existe!'
  END as status
FROM information_schema.tables 
WHERE table_name = 'recovery_status';

-- ============================================================================
-- RESULTADO ESPERADO:
-- - Apenas 'supported_platforms' sem RLS
-- - recovery_status não existe mais
-- - Todas as tabelas de usuário protegidas
-- ============================================================================
