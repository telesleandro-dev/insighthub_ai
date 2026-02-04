-- ============================================================================
-- SCRIPT: Criar registro de email config manualmente (FIX Loading)
-- ============================================================================

-- 1. Ver seu user_id
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 2. Copie o user_id acima e substitua abaixo

-- 3. Criar registro (substitua SEU-USER-ID)
INSERT INTO user_email_configs (
  user_id,
  forwarding_email,
  is_active,
  total_emails_received
)
VALUES (
  'SEU-USER-ID-AQUI',  -- ← COLAR SEU ID AQUI
  'aguardando-cloudmailin@pending.com',
  true,
  0
)
ON CONFLICT (user_id) DO NOTHING;

-- 4. Verificar se foi criado
SELECT 
  id,
  user_id,
  forwarding_email,
  is_active,
  total_emails_received,
  created_at
FROM user_email_configs;

-- ============================================================================
-- Deve retornar 1 linha com seu email config!
-- Depois disso, recarregue a página em Configurações → Tab EMAIL
-- ============================================================================
