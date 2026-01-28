-- Tabela de Logs de Webhook (Para auditoria)
CREATE TABLE IF NOT EXISTS public.webhooks_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    platform text NOT NULL,
    status text NOT NULL CHECK (status IN ('received', 'processed', 'error')),
    payload jsonb,
    error_message text,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabela de Configurações de Plataforma do Usuário
-- (Onde guardaremos as API Keys e Webhook Secrets de cada usuário para cada plataforma)
CREATE TABLE IF NOT EXISTS public.user_platform_configs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    platform_name text NOT NULL, -- 'kiwify', 'hotmart', 'eduzz', 'monetizze'
    api_key text, -- Opcional, dependendo da plataforma
    webhook_secret text, -- Para validar a assinatura (HMAC)
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, platform_name)
);

-- Tabela de Eventos de Venda (Unificada)
CREATE TABLE IF NOT EXISTS public.sales_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id),
    
    -- Dados do Cliente
    customer_name text,
    customer_email text,
    customer_phone text,
    
    -- Dados da Transação
    status text NOT NULL, -- 'paid', 'waiting_payment', 'refunded', 'chargedback'
    value numeric(10,2) NOT NULL,
    currency text DEFAULT 'BRL',
    
    -- Metadados
    platform_origin text NOT NULL,
    external_transaction_id text,
    platform_metadata jsonb,
    
    -- Controle de Abordagem (Funil de Recuperação)
    status_abordagem text DEFAULT 'pendente', -- 'pendente', 'em_andamento', 'recuperado', 'perdido'
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Políticas de Segurança)
ALTER TABLE public.webhooks_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_platform_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_events ENABLE ROW LEVEL SECURITY;

-- Policy: Webhooks Log (Apenas leitura para o dono ou Service Role)
CREATE POLICY "Users can view their own webhook logs" 
ON public.webhooks_log FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Platform Configs (CRUD para dono)
CREATE POLICY "Users can manage their own platform configs" 
ON public.user_platform_configs FOR ALL 
USING (auth.uid() = user_id);

-- Policy: Sales Events (Leitura para dono)
CREATE POLICY "Users can view their own sales" 
ON public.sales_events FOR SELECT 
USING (auth.uid() = user_id);

-- Permissões para Service Role (API Routes)
GRANT ALL ON public.webhooks_log TO service_role;
GRANT ALL ON public.user_platform_configs TO service_role;
GRANT ALL ON public.sales_events TO service_role;
