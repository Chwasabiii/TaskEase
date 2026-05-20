-- Run this in Supabase SQL Editor if the app says: column profiles.bio does not exist.

alter table public.profiles
add column if not exists bio text;

notify pgrst, 'reload schema';
