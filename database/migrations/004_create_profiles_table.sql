-- Create a table for public profiles (extends auth.users)
-- Create table if not exists (minimal structure first)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Forcefully add missing columns if table already exists (Idempotent)
-- This ensures that even if 'profiles' existed without 'role', it gets added now.

alter table public.profiles 
  add column if not exists role text not null check (role in ('admin', 'user')) default 'user';

alter table public.profiles 
  add column if not exists insighthub_email text unique;

alter table public.profiles 
  add column if not exists name text;

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Policies
-- We drop policies first to ensure idempotency (in case they already exist with same name)

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" 
  on public.profiles for select 
  using ( auth.uid() = id );

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" 
  on public.profiles for select 
  using ( 
    auth.uid() in ( select id from public.profiles where role = 'admin' )
  );

drop policy if exists "Users can update own name" on public.profiles;
create policy "Users can update own name" 
  on public.profiles for update 
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles" 
  on public.profiles for update 
  using ( 
    auth.uid() in ( select id from public.profiles where role = 'admin' )
  );

-- Function to handle new user signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, role, name, insighthub_email)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'role', 'user'), -- Allow metadata to override buffer
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'insighthub_email'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger
-- Drop trigger first to avoid error if it exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
