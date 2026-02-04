-- 🔍 Descobrir estrutura real das tabelas para corrigir RLS

-- 1. Ver estrutura de knowledge_base
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'knowledge_base'
ORDER BY ordinal_position;

-- 2. Ver estrutura de ai_usage_logs
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'ai_usage_logs'
ORDER BY ordinal_position;

-- 3. Ver estrutura de user_configs
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_configs'
ORDER BY ordinal_position;

-- 4. Ver estrutura de user_platform_configs
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_platform_configs'
ORDER BY ordinal_position;
