-- ============================================================================
-- Migration 010: user_email_configs (SAFE - Verifica antes de criar)
-- ============================================================================

-- 1. Criar tabela se não existir
CREATE TABLE IF NOT EXISTS user_email_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  forwarding_email VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  total_emails_received INT DEFAULT 0,
  last_email_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_user_email_configs_user 
  ON user_email_configs(user_id);

CREATE INDEX IF NOT EXISTS idx_user_email_configs_forwarding 
  ON user_email_configs(forwarding_email);

-- 3. Ativar RLS
ALTER TABLE user_email_configs ENABLE ROW LEVEL SECURITY;

-- 4. Criar policies (DROP antes se já existir)
DROP POLICY IF EXISTS "Users can view own email config" ON user_email_configs;
CREATE POLICY "Users can view own email config"
  ON user_email_configs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own email config" ON user_email_configs;
CREATE POLICY "Users can insert own email config"
  ON user_email_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own email config" ON user_email_configs;
CREATE POLICY "Users can update own email config"
  ON user_email_configs FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Verificar resultado
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_email_configs'
ORDER BY ordinal_position;

-- Verificar policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_email_configs';
