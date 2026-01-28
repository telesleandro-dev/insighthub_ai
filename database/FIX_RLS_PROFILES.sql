-- CORREÇÃO URGENTE: Row Level Security bloqueando leitura de perfis
-- Execute este script no SQL Editor do Supabase

-- 1. Desabilitar RLS temporariamente para diagnóstico
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Ou criar uma política permissiva para usuários autenticados
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Permitir leitura de perfis" ON public.profiles;

CREATE POLICY "Authenticated users can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 3. Garantir que a coluna email não seja NULL
UPDATE public.profiles 
SET email = (SELECT email FROM auth.users WHERE auth.users.id = profiles.id)
WHERE email IS NULL;

-- 4. Re-habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
