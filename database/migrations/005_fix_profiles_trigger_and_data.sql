-- FIX SCRIPT: Ensure Profiles Table and Triggers are Correct
-- Run this ENTIRE script in the Supabase SQL Editor.

-- 1. Ensure Table Structure (Idempotent)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add columns if missing (safe to run multiple times)
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='role') then
        alter table public.profiles add column role text not null check (role in ('admin', 'user')) default 'user';
    end if;

    if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='insighthub_email') then
        alter table public.profiles add column insighthub_email text unique;
    end if;

    if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='name') then
        alter table public.profiles add column name text;
    end if;
end $$;

-- 2. Clean Up Old Triggers/Functions
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 3. Recreate Function with Explicit Search Path (Fixes common "relation not found" errors)
create or replace function public.handle_new_user() 
returns trigger 
security definer 
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, name, insighthub_email)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'insighthub_email'
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    name = excluded.name,
    insighthub_email = excluded.insighthub_email;
  return new;
end;
$$ language plpgsql;

-- 4. Recreate Trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Permissions (Just in case)
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on public.profiles to postgres, service_role;
grant select on public.profiles to anon, authenticated;
