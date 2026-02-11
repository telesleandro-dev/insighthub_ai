-- Migration: Adicionar coluna ai_tone à tabela user_configs
-- Data: 2026-02-10
-- Descrição: Consolida configuração de personalidade IA em user_configs

-- 1. Adicionar coluna ai_tone em user_configs
ALTER TABLE user_configs 
ADD COLUMN IF NOT EXISTS ai_tone VARCHAR(20) DEFAULT 'consultivo';

-- 2. Adicionar comentário na coluna
COMMENT ON COLUMN user_configs.ai_tone IS 'Tom de voz da IA: persuasivo, consultivo ou cordial';

-- 3. Migrar dados existentes de user_settings para user_configs (se existir user_settings)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN
        UPDATE user_configs uc
        SET ai_tone = us.ai_tone
        FROM user_settings us
        WHERE uc.user_id = us.user_id
        AND us.ai_tone IS NOT NULL;
        
        RAISE NOTICE 'Dados migrados de user_settings para user_configs';
    END IF;
END $$;

-- 4. Verificação final
SELECT 
    user_id,
    ai_tone,
    telegram_enabled,
    created_at
FROM user_configs
ORDER BY created_at DESC
LIMIT 5;
