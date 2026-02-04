-- =====================================================
-- Migration: Adicionar coluna de data de recuperação
-- =====================================================
-- Objetivo: Registrar quando lead foi recuperado
-- =====================================================

-- 1. ADICIONAR COLUNA recovered_at
ALTER TABLE sales_events
ADD COLUMN IF NOT EXISTS recovered_at TIMESTAMP WITH TIME ZONE;

-- 2. COMENTÁRIO DA COLUNA
COMMENT ON COLUMN sales_events.recovered_at IS 
'Data/hora em que o lead foi marcado como recuperado';

-- 3. CRIAR ÍNDICE
CREATE INDEX IF NOT EXISTS idx_sales_events_recovered_at
ON sales_events(recovered_at)
WHERE recovered_at IS NOT NULL;

-- 4. PREENCHER recovered_at para leads já recuperados
-- (Usar created_at como fallback para dados antigos)
UPDATE sales_events
SET recovered_at = created_at
WHERE status_abordagem = 'recuperado'
  AND recovered_at IS NULL;

-- 5. VERIFICAR RESULTADO
SELECT 
  id,
  customer_name,
  status_abordagem,
  created_at,
  recovered_at
FROM sales_events
WHERE status_abordagem = 'recuperado'
ORDER BY recovered_at DESC
LIMIT 5;

-- =====================================================
-- PRONTO! ✅
-- =====================================================
