-- Investigar estrutura de user_settings

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_settings'
ORDER BY ordinal_position;

-- Verificar quantos registros
SELECT COUNT(*) as total_records FROM user_settings;

-- Ver sample de dados (se houver)
SELECT * FROM user_settings LIMIT 5;
