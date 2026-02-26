-- Migration 018: Add lead_summary to leads_profiles
-- Objetivo: Armazenar a análise comportamental/dossiê gerado pela IA ou n8n.

ALTER TABLE public.leads_profiles 
ADD COLUMN IF NOT EXISTS lead_summary TEXT;

COMMENT ON COLUMN public.leads_profiles.lead_summary IS 'Dossiê/Análise comportamental do lead gerada pela IA ou automação externa.';
