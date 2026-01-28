-- ===============================================
-- SCRIPT DE REPARO NUCLEAR (InsightHub AI)
-- ===============================================
-- Este script força a criação das colunas caso elas não existam e limpa gatilhos.
-- Execute este script COMPLETO no "SQL Editor" do seu painel Supabase.

-- 1. Garantir que a tabela base existe
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY
);

-- 2. Adicionar/Corrigir colunas com DO blocks (Mais seguro)
DO $$ 
BEGIN
    -- Coluna EMAIL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email text UNIQUE;
    END IF;

    -- Coluna ROLE
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user';
    END IF;

    -- Coluna INSIGHTHUB_EMAIL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='insighthub_email') THEN
        ALTER TABLE public.profiles ADD COLUMN insighthub_email text UNIQUE;
    END IF;

    -- Coluna NAME
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='name') THEN
        ALTER TABLE public.profiles ADD COLUMN name text;
    END IF;

    -- Coluna CREATED_AT
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;
END $$;

-- 3. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Limpar gatilhos e funções antigas para reconstrução limpa
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 5. Criar a função de gatilho com SEARCH PATH explícito
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, name, insighthub_email)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'insighthub_email'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    insighthub_email = EXCLUDED.insighthub_email;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 6. Recriar o gatilho na tabela auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Inserir manualmente o Admin e o Usuário de Teste na tabela de profiles
-- (Busca pelo e-mail no Auth e insere no profiles se existir)
INSERT INTO public.profiles (id, email, role, name, insighthub_email)
SELECT id, email, 'admin', 'Administrador Principal', 'admin@insighthubai.com'
FROM auth.users
WHERE email = 'admin@insighthub.ai'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

INSERT INTO public.profiles (id, email, role, name, insighthub_email)
SELECT id, email, 'user', 'Usuário Teste', 'teste@insighthubai.com'
FROM auth.users
WHERE email = 'user@insighthub.ai'
ON CONFLICT (id) DO UPDATE SET role = 'user';

-- 8. Reset de Políticas (Garantir acesso do app)
DROP POLICY IF EXISTS "Permitir leitura de perfis" ON public.profiles;
CREATE POLICY "Permitir leitura de perfis" 
  ON public.profiles FOR SELECT 
  USING (true); 

-- 9. Conceder permissões para o sistema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT ON public.profiles TO anon, authenticated;
