-- ============================================================================
-- FIX RLS: Recriar políticas de knowledge_files
-- Resolve erro "violates row-level security policy"
-- ============================================================================

-- 1. Dropar policies antigas (se existirem)
DROP POLICY IF EXISTS "Users can view own knowledge files" ON knowledge_files;
DROP POLICY IF EXISTS "Users can insert own knowledge files" ON knowledge_files;
DROP POLICY IF EXISTS "Users can update own knowledge files" ON knowledge_files;
DROP POLICY IF EXISTS "Users can delete own knowledge files" ON knowledge_files;

-- 2. Garantir que RLS está habilitado
ALTER TABLE knowledge_files ENABLE ROW LEVEL SECURITY;

-- 3. Recriar policies
CREATE POLICY "Users can view own knowledge files"
  ON knowledge_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own knowledge files"
  ON knowledge_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge files"
  ON knowledge_files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own knowledge files"
  ON knowledge_files FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Verificar policies criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'knowledge_files'
ORDER BY policyname;

-- 5. Testar INSERT (substitua pelo seu user_id real)
-- SELECT auth.uid(); -- Ver seu user_id atual
-- INSERT INTO knowledge_files (user_id, file_name, file_path, file_size, file_type)
-- VALUES (auth.uid(), 'teste.pdf', 'knowledge/test/teste.pdf', 1024, 'application/pdf');
