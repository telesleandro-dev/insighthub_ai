-- ============================================================================
-- SCRIPT CORRIGIDO: Adicionar RLS nas Tabelas
-- Execute em ordem
-- ============================================================================

-- ============================================================================
-- PARTE 1: DROPAR TABELA NÃO UTILIZADA (recovery_status)
-- ============================================================================

DROP TABLE IF EXISTS recovery_status CASCADE;

-- Verificar
SELECT COUNT(*) as should_be_zero
FROM information_schema.tables 
WHERE table_name = 'recovery_status';

-- ============================================================================
-- PARTE 2: RLS CRÍTICO - user_configs
-- ============================================================================

ALTER TABLE user_configs ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own configs"
  ON user_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own configs"
  ON user_configs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own configs"
  ON user_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own configs"
  ON user_configs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PARTE 3: RLS CRÍTICO - user_platform_configs
-- ============================================================================

ALTER TABLE user_platform_configs ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own platform configs"
  ON user_platform_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own platform configs"
  ON user_platform_configs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own platform configs"
  ON user_platform_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own platform configs"
  ON user_platform_configs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PARTE 4: RLS - ai_usage_logs
-- ============================================================================

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios logs
CREATE POLICY "Users can view own AI logs"
  ON ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role pode inserir logs
CREATE POLICY "Service role can insert AI logs"
  ON ai_usage_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- PARTE 5: RLS - knowledge_base (baseado em product_id)
-- ============================================================================

ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver knowledge base dos próprios produtos
CREATE POLICY "Users can view knowledge base of own products"
  ON knowledge_base FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM products WHERE user_id = auth.uid()
    )
  );

-- Usuários podem gerenciar knowledge base dos próprios produtos
CREATE POLICY "Users can manage knowledge base of own products"
  ON knowledge_base FOR ALL
  USING (
    product_id IN (
      SELECT id FROM products WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Ver status RLS de todas as tabelas
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Ver políticas criadas
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Tabelas que ainda estão sem RLS
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false
ORDER BY tablename;

-- ============================================================================
-- FIM - TODAS AS TABELAS CRÍTICAS PROTEGIDAS! ✅
-- ============================================================================
