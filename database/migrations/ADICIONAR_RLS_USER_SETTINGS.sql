-- ============================================================================
-- ADICIONAR RLS EM user_settings (CRÍTICO - TEM API KEYS!)
-- ============================================================================

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Ver todas as tabelas e status RLS
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

-- Contar políticas por tabela
SELECT 
  tablename,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- RESULTADO ESPERADO:
-- Apenas 'supported_platforms' deve estar sem RLS (dados públicos)
-- Todas as outras devem ter RLS habilitado
-- ============================================================================
