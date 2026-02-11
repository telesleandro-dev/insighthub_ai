-- ============================================================================
-- MIGRATION: Add API Key to User Configs
-- Data: 2026-02-11
-- Descrição: Adiciona coluna api_key na tabela user_configs para integração
--            com n8n e outras ferramentas externas via webhook autenticado.
-- ============================================================================

-- Adicionar coluna api_key à tabela user_configs
ALTER TABLE user_configs 
ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;

-- Comentário para documentação
COMMENT ON COLUMN user_configs.api_key IS 'API Key para integração com n8n e outras ferramentas externas. Formato: ih_[hash64chars]. Única por usuário.';

-- Índice para busca rápida e segurança
CREATE INDEX IF NOT EXISTS idx_user_configs_api_key ON user_configs(api_key) WHERE api_key IS NOT NULL;

-- Grant permissões (seguir padrão das outras colunas)
-- RLS já está ativo na tabela user_configs, então queries precisam de user_id match
