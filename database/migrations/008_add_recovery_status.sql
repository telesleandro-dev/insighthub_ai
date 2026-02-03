-- =====================================================
-- Migration: Adicionar Sistema de Recovery Status
-- =====================================================
-- Data: 2026-02-03
-- Objetivo: Diferenciar leads recuperáveis de PIX pendentes
-- =====================================================

-- 1. ADICIONAR COLUNA recovery_status
ALTER TABLE sales_events
ADD COLUMN IF NOT EXISTS recovery_status VARCHAR(50) DEFAULT 'eligible';

-- 2. ADICIONAR COLUNAS AUXILIARES
ALTER TABLE sales_events
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20),
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP WITH TIME ZONE;

-- 3. COMENTÁRIOS DAS COLUNAS
COMMENT ON COLUMN sales_events.recovery_status IS 
'Status de recuperação: eligible (recuperável), pending (aguardando), converted (convertido)';

COMMENT ON COLUMN sales_events.payment_method IS 
'Método de pagamento: pix, credit_card, boleto';

COMMENT ON COLUMN sales_events.converted_at IS 
'Data/hora em que o lead foi convertido (pagou)';

-- 4. CRIAR ÍNDICE PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_sales_events_recovery 
ON sales_events(user_id, recovery_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_events_email_product
ON sales_events(customer_email, product_id, created_at DESC);

-- 5. MIGRAR DADOS EXISTENTES
UPDATE sales_events
SET recovery_status = CASE
  -- Convertidos (pagos)
  WHEN status = 'paid' THEN 'converted'
  
  -- Pendentes (aguardando PIX)
  WHEN status = 'waiting_payment' THEN 'pending'
  
  -- Recuperáveis (recusados, abandonados)
  WHEN status = 'refused' THEN 'eligible'
  WHEN status = 'refunded' THEN 'eligible'
  WHEN status = 'chargeback' THEN 'eligible'
  
  -- Padrão: recuperável
  ELSE 'eligible'
END
WHERE recovery_status IS NULL OR recovery_status = 'eligible';

-- 6. VERIFICAR RESULTADO
SELECT 
  recovery_status,
  status,
  COUNT(*) as total
FROM sales_events
GROUP BY recovery_status, status
ORDER BY recovery_status, status;

-- =====================================================
-- ROLLBACK (se necessário)
-- =====================================================
-- DROP INDEX IF EXISTS idx_sales_events_recovery;
-- DROP INDEX IF EXISTS idx_sales_events_email_product;
-- ALTER TABLE sales_events DROP COLUMN IF EXISTS recovery_status;
-- ALTER TABLE sales_events DROP COLUMN IF EXISTS payment_method;
-- ALTER TABLE sales_events DROP COLUMN IF EXISTS converted_at;
