-- Script para verificar RLS e constraints em user_configs
-- Execute no Supabase SQL Editor

-- 1. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_configs';

-- 2. Verificar constraints
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    CASE con.contype
        WHEN 'c' THEN 'CHECK'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'x' THEN 'EXCLUSION'
    END AS tipo,
    pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'user_configs';

-- 3. Verificar se RLS está ativo
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'user_configs';

-- 4. Tentar insert direto para ver erro
-- DESCOMENTE e ajuste user_id se necessário:
-- INSERT INTO user_configs (user_id, ai_tone, telegram_enabled)
-- VALUES ('c048be53-fff6-4446-a8b8-6abf79fce171', 'persuasivo', true)
-- ON CONFLICT (user_id) DO UPDATE 
-- SET ai_tone = 'persuasivo', updated_at = NOW();
