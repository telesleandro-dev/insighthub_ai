-- ============================================================================
-- Migration 014: Lead Intelligence Fields
-- Objetivo: Suportar segmentação avançada e inteligência de leads
-- ============================================================================

-- 1. Adicionar colunas à tabela sales_events
ALTER TABLE public.sales_events
ADD COLUMN IF NOT EXISTS lead_source TEXT,
ADD COLUMN IF NOT EXISTS lead_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS lead_notes TEXT;

-- 2. Adicionar comentários para documentação
COMMENT ON COLUMN public.sales_events.lead_source IS 'Fonte de origem do lead (ex: instagram, typeform, make)';
COMMENT ON COLUMN public.sales_events.lead_tags IS 'Tags de segmentação para o lead';
COMMENT ON COLUMN public.sales_events.lead_notes IS 'Observações ou dados contextuais do lead';

-- 3. Criar índices para performance de filtragem
CREATE INDEX IF NOT EXISTS idx_sales_events_lead_source ON public.sales_events(lead_source);
CREATE INDEX IF NOT EXISTS idx_sales_events_lead_tags ON public.sales_events USING GIN (lead_tags);

-- 4. Notificar sucesso
DO $$ 
BEGIN 
    RAISE NOTICE 'Campos de inteligência de leads adicionados com sucesso.';
END $$;
