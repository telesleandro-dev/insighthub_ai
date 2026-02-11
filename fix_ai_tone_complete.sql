-- SOLUÇÃO COMPLETA: Resetar cache e adicionar RLS para user_configs.ai_tone

-- ========================================
-- 1. RESETAR SCHEMA CACHE (IMPORTANTE!)
-- ========================================
-- Este comando força o Supabase a recarregar a estrutura da tabela
NOTIFY pgrst, 'reload schema';

-- ========================================
-- 2. VERIFICAR SE COLUNA EXISTE
-- ========================================
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_configs'
  AND column_name = 'ai_tone';
-- Se retornar vazio, execute novamente o ALTER TABLE abaixo:

-- ========================================
-- 3. ADICIONAR COLUNA (se não existir)
-- ========================================
ALTER TABLE user_configs 
ADD COLUMN IF NOT EXISTS ai_tone VARCHAR(20) DEFAULT 'consultivo';

-- ========================================
-- 4. VERIFICAR RLS ATUAL
-- ========================================
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_configs';

-- ========================================
-- 5. ADICIONAR/ATUALIZAR POLÍTICAS RLS
-- ========================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários podem atualizar próprias configs" ON user_configs;
DROP POLICY IF EXISTS "Usuários podem inserir próprias configs" ON user_configs;
DROP POLICY IF EXISTS "Usuários podem ler próprias configs" ON user_configs;

-- Política de SELECT (leitura)
CREATE POLICY "Users can read own configs"
ON user_configs
FOR SELECT
USING (auth.uid() = user_id);

-- Política de INSERT (criação)
CREATE POLICY "Users can insert own configs"
ON user_configs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política de UPDATE (atualização)
CREATE POLICY "Users can update own configs"
ON user_configs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 6. ATIVAR RLS (se não estiver ativo)
-- ========================================
ALTER TABLE user_configs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 7. RESETAR CACHE NOVAMENTE
-- ========================================
NOTIFY pgrst, 'reload schema';

-- ========================================
-- 8. TESTE FINAL
-- ========================================
-- Teste manual (ajuste user_id se necessário):
/*
INSERT INTO user_configs (user_id, ai_tone, telegram_enabled)
VALUES ('c048be53-fff6-4446-a8b8-6abf79fce171', 'persuasivo', true)
ON CONFLICT (user_id) 
DO UPDATE SET 
    ai_tone = EXCLUDED.ai_tone,
    updated_at = NOW()
RETURNING *;
*/

SELECT 'Setup completo! Teste no frontend agora.' AS status;
