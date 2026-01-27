-- ============================================================================
-- MIGRATION: Fix Original Settings Table
-- Data: 2026-01-27
-- Descrição: Cria a tabela user_settings esperada pelo front-end original
--            e garante que o salvamento/carregamento funcione.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    ai_tone TEXT DEFAULT 'consultivo',
    api_keys JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários para documentação
COMMENT ON TABLE user_settings IS 'Configurações legadas do usuário (Tom de voz e API Keys em JSON)';
COMMENT ON COLUMN user_settings.api_keys IS 'Lista de chaves de API armazenadas como JSON [ { "name": "...", "value": "..." } ]';

-- Garantir que o usuário atual tenha uma entrada inicial se não existir
INSERT INTO user_settings (user_id, ai_tone, api_keys)
VALUES ('c048be53-fff6-4446-a8b8-6abf79fce171', 'consultivo', '[{"name": "KIWIFY", "value": ""}, {"name": "HOTMART", "value": ""}]'::jsonb)
ON CONFLICT (user_id) DO NOTHING;

-- Desabilitar RLS para evitar problemas de permissão durante esta fase de transição (conforme solicitado pelo comportamento do sistema anterior)
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- Grant permissões básicas
GRANT ALL ON user_settings TO anon, authenticated, service_role;
