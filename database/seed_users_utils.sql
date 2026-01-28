-- Seed Script for Initial Users
-- Ensure you replace these with your desired initial passwords if running manually, 
-- or let the Auth service handle it via Invite/SignUp.

-- For this seed script, we simulate the creation of the users in `auth.users`
-- Note: In a real Supabase environment, you would use the API or Dashboard to create users.
-- This SQL script is mainly to populate `profiles` if `auth.users` entries already exist, 
-- OR to guide manual creation.

-- !!! IMPORTANT !!!
-- Since I cannot insert directly into `auth.users` securely via SQL in all Supabase setups 
-- (due to hashing requirements), this script focuses on the `profiles` logic.
-- The actual users should be created via the Supabase Dashboard or API.

-- LOGIC:
-- 1. Create a function to be called manually that promotes a user to ADMIN.
-- 2. Create a function to set a user's InsightHub email.

-- Function to promote a user to admin by email
create or replace function public.promote_to_admin(user_email text)
returns void as $$
begin
  update public.profiles
  set role = 'admin'
  where email = user_email;
end;
$$ language plpgsql security definer;

-- Function to set insighthub email
create or replace function public.set_insighthub_handle(user_email text, handle text)
returns void as $$
begin
  update public.profiles
  set insighthub_email = handle
  where email = user_email;
end;
$$ language plpgsql security definer;
