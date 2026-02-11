-- Migration 017: Create Leads Profiles (Lead Intelligence Engine)
-- Objetivo: Consolidar eventos de venda por lead e calcular score/tags.

-- 1. Criar a tabela de perfis de leads
CREATE TABLE IF NOT EXISTS public.leads_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    
    -- Estatísticas Consolidadas
    total_events INTEGER DEFAULT 0,
    lead_score INTEGER DEFAULT 0,
    behavior_tags TEXT[] DEFAULT '{}',
    product_history JSONB DEFAULT '[]'::jsonb,
    last_event_type TEXT,
    
    -- Controle de Tempo (Time Decay)
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Unicidade por usuário e email
    UNIQUE(user_id, email),

    -- Financeiro e Status de Serviço
    potential_value NUMERIC(10,2) DEFAULT 0,
    converted_value NUMERIC(10,2) DEFAULT 0,
    service_status TEXT DEFAULT 'pending',
    last_platform TEXT
);

-- 2. Adicionar lead_profile_id à tabela sales_events para rastreabilidade
ALTER TABLE public.sales_events ADD COLUMN IF NOT EXISTS lead_profile_id UUID REFERENCES public.leads_profiles(id) ON DELETE SET NULL;

-- 3. Habilitar RLS
ALTER TABLE public.leads_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de RLS
DROP POLICY IF EXISTS "Users can view their own lead profiles" ON public.leads_profiles;
CREATE POLICY "Users can view their own lead profiles" 
ON public.leads_profiles FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own lead profiles" ON public.leads_profiles;
CREATE POLICY "Users can manage their own lead profiles" 
ON public.leads_profiles FOR ALL 
USING (auth.uid() = user_id);

-- 5. Garantir permissões para o service_role
GRANT ALL ON public.leads_profiles TO service_role;

-- 6. Criar índice para busca rápida por email
CREATE INDEX IF NOT EXISTS idx_leads_profiles_email ON public.leads_profiles(email);
CREATE INDEX IF NOT EXISTS idx_leads_profiles_user_email ON public.leads_profiles(user_id, email);
