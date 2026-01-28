-- SCRIPT DE CORREÇÃO E PERMISSÕES (Seguro para rodar mesmo se tabelas existirem)

-- 1. Criar webhooks_log se não existir (Essencial para DEBUG)
CREATE TABLE IF NOT EXISTS public.webhooks_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    platform text NOT NULL,
    status text NOT NULL CHECK (status IN ('received', 'processed', 'error')),
    payload jsonb,
    error_message text,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Garantir que RLS está ativo
ALTER TABLE public.webhooks_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_events ENABLE ROW LEVEL SECURITY;

-- 3. PERMISSÕES CRÍTICAS (Isso geralmente é o que falta)
-- Garante que a API (service_role) possa escrever nessas tabelas
GRANT ALL ON public.webhooks_log TO service_role;
GRANT ALL ON public.sales_events TO service_role;
GRANT ALL ON public.products TO service_role;

-- 4. Policies para o Service Role (Caso o GRANT não seja suficiente em alguns setups)
-- Permite que o servidor insira logs sem restrição de usuário logado
CREATE POLICY "Service Role pode fazer tudo em webhooks_log" 
ON public.webhooks_log
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service Role pode fazer tudo em sales_events" 
ON public.sales_events
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 5. Policy de Visualização para você (Dono do dado)
-- Removemos policy antiga para evitar conflito antes de recriar
DROP POLICY IF EXISTS "Users can view their own webhook logs" ON public.webhooks_log;
CREATE POLICY "Users can view their own webhook logs" 
ON public.webhooks_log FOR SELECT 
USING (auth.uid() = user_id);
