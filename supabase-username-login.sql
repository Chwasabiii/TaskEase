-- Run this in Supabase SQL Editor to support username registration and login.

create unique index if not exists profiles_username_lower_unique_idx
on public.profiles (lower(username))
where username is not null and username <> '';

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
begin
  requested_username := coalesce(
    nullif(lower(regexp_replace(new.raw_user_meta_data->>'username', '^@+', '')), ''),
    split_part(lower(new.email), '@', 1)
  );

  insert into public.profiles (id, email, username, full_name)
  values (
    new.id,
    lower(new.email),
    requested_username,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email,
      username = coalesce(nullif(public.profiles.username, ''), excluded.username),
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

create or replace function public.resolve_login_email(login_identifier text)
returns text
language sql
security definer
set search_path = public
as $$
  select email
  from public.profiles
  where lower(email) = lower(trim(login_identifier))
     or lower(username) = lower(regexp_replace(trim(login_identifier), '^@+', ''))
  limit 1;
$$;

grant execute on function public.resolve_login_email(text) to anon, authenticated;

create or replace function public.is_username_available(requested_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    trim(requested_username) ~ '^[A-Za-z0-9._]{3,24}$'
    and not exists (
      select 1
      from public.profiles
      where lower(username) = lower(regexp_replace(trim(requested_username), '^@+', ''))
    );
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;
