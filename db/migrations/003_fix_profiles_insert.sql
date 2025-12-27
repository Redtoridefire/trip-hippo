-- Fix for profiles table - allow inserts from auth trigger
-- Run this in Supabase SQL Editor

-- Allow the service role and auth triggers to insert profiles
create policy "Service role can insert profiles"
  on profiles for insert
  with check (true);

-- Also ensure users can insert their own profile if needed
create policy "Users can insert own profile"
  on profiles for insert
  with check (id = auth.uid());

-- Make sure the trigger function has the right permissions
-- This function runs when a new user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop and recreate the trigger to ensure it's properly attached
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Grant necessary permissions
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all on all functions in schema public to postgres, anon, authenticated, service_role;
