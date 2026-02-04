-- 🔍 Investigar Tabela RECOVERY_STATUS

-- 1️⃣ Ver estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'recovery_status'
ORDER BY ordinal_position;

-- 2️⃣ Ver quantos registros existem
SELECT COUNT(*) as total_records FROM recovery_status;

-- 3️⃣ Ver dados (se houver)
SELECT * FROM recovery_status LIMIT 10;

-- 4️⃣ Verificar se é referenciada por outras tabelas
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (ccu.table_name = 'recovery_status' OR tc.table_name = 'recovery_status');
