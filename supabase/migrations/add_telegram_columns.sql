-- Migration: Adicionar colunas de Telegram na tabela user_configs
-- Execute este SQL no Supabase Studio: https://supabase.com/dashboard/project/kslrgyhcfkgbkbjimfay/editor

ALTER TABLE user_configs 
  ADD COLUMN IF NOT EXISTS telegram_token TEXT,
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
