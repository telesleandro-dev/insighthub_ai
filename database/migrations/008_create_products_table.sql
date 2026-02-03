-- Add AI-rich fields to existing products table
-- This migration UPDATES the existing table, does NOT create a new one

-- Add description field (for AI context)
alter table products 
  add column if not exists description text;

-- Add target_audience field (for AI context)
alter table products 
  add column if not exists target_audience text;

-- Add price and currency if not exist
alter table products 
  add column if not exists price numeric(10,2);

alter table products 
  add column if not exists currency varchar(10) default 'BRL';

-- Ensure updated_at exists and has trigger
alter table products 
  add column if not exists updated_at timestamptz default now();

-- Create or replace the trigger for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_products_updated_at on products;

create trigger update_products_updated_at
  before update on products
  for each row
  execute function update_updated_at_column();

-- Ensure RLS is enabled (might already be)
alter table products enable row level security;

-- Note: Policies might already exist, but let's make sure service role can upsert
-- This is safe to run even if policy exists (will just error but not break anything)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'products' 
    and policyname = 'Service role can upsert products'
  ) then
    create policy "Service role can upsert products"
      on products for all
      using (true)
      with check (true);
  end if;
end $$;
