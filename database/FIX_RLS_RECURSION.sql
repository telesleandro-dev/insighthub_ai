-- =====================================================
-- CORREÇÃO CRÍTICA: Recursão Infinita em RLS
-- =====================================================
-- Execute este script COMPLETO no SQL Editor do Supabase
-- Ele corrige o erro "infinite recursion detected in policy"

-- 1. Remover TODAS as políticas antigas (que causam recursão)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own name" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Permitir leitura de perfis" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.profiles;

-- 2. Criar políticas SIMPLES sem recursão
-- Política 1: Qualquer usuário autenticado pode ler seu próprio perfil
CREATE POLICY "Enable read access for authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Política 2: Qualquer usuário autenticado pode atualizar seu próprio perfil
CREATE POLICY "Enable update for users based on user_id"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Garantir que RLS está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Verificar se todos os perfis têm email preenchido
UPDATE public.profiles 
SET email = (SELECT email FROM auth.users WHERE auth.users.id = profiles.id)
WHERE email IS NULL;

-- 5. Garantir permissões básicas
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
