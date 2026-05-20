-- Run this in Supabase SQL Editor to support profiles and easier collaboration.
-- Run it after supabase-task-policies.sql.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create unique index if not exists profiles_email_unique_idx
on public.profiles (lower(email))
where email is not null;

create table if not exists public.collaborators (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique (task_id, user_id)
);

create index if not exists collaborators_task_id_idx
on public.collaborators (task_id);

create index if not exists collaborators_user_id_idx
on public.collaborators (user_id);

create table if not exists public.profile_connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'ignored')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create index if not exists profile_connections_addressee_status_idx
on public.profile_connections (addressee_id, status, created_at desc);

create index if not exists profile_connections_requester_status_idx
on public.profile_connections (requester_id, status, created_at desc);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, full_name)
  values (
    new.id,
    lower(new.email),
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email,
      username = coalesce(public.profiles.username, excluded.username),
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

insert into public.profiles (id, email, username, full_name)
select
  users.id,
  lower(users.email),
  lower(users.email),
  coalesce(users.raw_user_meta_data->>'full_name', split_part(users.email, '@', 1))
from auth.users users
on conflict (id) do update
set email = excluded.email,
    username = coalesce(public.profiles.username, excluded.username),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    updated_at = now();

create or replace function public.is_task_owner(check_task_id uuid, check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tasks
    where id = check_task_id
      and user_id = check_user_id
  );
$$;

create or replace function public.is_task_editor(check_task_id uuid, check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_task_owner(check_task_id, check_user_id)
      or exists (
        select 1
        from public.collaborators
        where task_id = check_task_id
          and user_id = check_user_id
          and role in ('owner', 'editor')
      );
$$;

create or replace function public.is_task_collaborator(check_task_id uuid, check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.collaborators
    where task_id = check_task_id
      and user_id = check_user_id
  );
$$;

create or replace function public.can_access_task(check_task_id uuid, check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_task_owner(check_task_id, check_user_id)
      or public.is_task_collaborator(check_task_id, check_user_id);
$$;

alter table public.profiles enable row level security;
alter table public.collaborators enable row level security;
alter table public.profile_connections enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.collaborators to authenticated;
grant select, insert, update on public.profile_connections to authenticated;

grant execute on function public.is_task_owner(uuid, uuid) to authenticated;
grant execute on function public.is_task_editor(uuid, uuid) to authenticated;
grant execute on function public.is_task_collaborator(uuid, uuid) to authenticated;
grant execute on function public.can_access_task(uuid, uuid) to authenticated;

drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_insert_self" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;

create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "collaborators_select_task_access" on public.collaborators;
drop policy if exists "collaborators_insert_task_owner" on public.collaborators;
drop policy if exists "collaborators_update_task_owner" on public.collaborators;
drop policy if exists "collaborators_delete_task_owner_or_self" on public.collaborators;

create policy "collaborators_select_task_access"
on public.collaborators
for select
to authenticated
using (public.can_access_task(task_id));

create policy "collaborators_insert_task_owner"
on public.collaborators
for insert
to authenticated
with check (public.is_task_owner(task_id));

create policy "collaborators_update_task_owner"
on public.collaborators
for update
to authenticated
using (public.is_task_owner(task_id))
with check (public.is_task_owner(task_id));

create policy "collaborators_delete_task_owner_or_self"
on public.collaborators
for delete
to authenticated
using (public.is_task_owner(task_id) or user_id = auth.uid());

drop policy if exists "profile_connections_select_involved" on public.profile_connections;
drop policy if exists "profile_connections_select_accepted_public" on public.profile_connections;
drop policy if exists "profile_connections_insert_self" on public.profile_connections;
drop policy if exists "profile_connections_update_addressee" on public.profile_connections;

create policy "profile_connections_select_involved"
on public.profile_connections
for select
to authenticated
using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "profile_connections_select_accepted_public"
on public.profile_connections
for select
to authenticated
using (status = 'accepted');

create policy "profile_connections_insert_self"
on public.profile_connections
for insert
to authenticated
with check (requester_id = auth.uid() and status = 'pending');

create policy "profile_connections_update_addressee"
on public.profile_connections
for update
to authenticated
using (addressee_id = auth.uid())
with check (addressee_id = auth.uid() and status in ('accepted', 'ignored'));

drop policy if exists "tasks_select_collaboration_access" on public.tasks;
drop policy if exists "tasks_update_collaboration_editors" on public.tasks;

create policy "tasks_select_collaboration_access"
on public.tasks
for select
to authenticated
using (public.can_access_task(id));

create policy "tasks_update_collaboration_editors"
on public.tasks
for update
to authenticated
using (public.is_task_editor(id))
with check (public.is_task_editor(id));

drop function if exists public.invite_user_to_task(uuid, text, text);

create or replace function public.invite_user_to_task(
  p_task_id uuid,
  p_email text,
  p_role text default 'viewer'
)
returns table (
  collaborator_id uuid,
  user_id uuid,
  email text,
  full_name text,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile public.profiles;
  inserted_collaborator public.collaborators;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to add collaborators.';
  end if;

  if not public.is_task_owner(p_task_id, auth.uid()) then
    raise exception 'Only the task owner can add collaborators.';
  end if;

  if p_role not in ('editor', 'viewer') then
    raise exception 'Role must be editor or viewer.';
  end if;

  select *
  into target_profile
  from public.profiles
  where lower(public.profiles.email) = lower(trim(p_email))
     or lower(public.profiles.username) = lower(trim(p_email))
  limit 1;

  if target_profile.id is null then
    raise exception 'User not found. They must register for TaskEase first.';
  end if;

  if target_profile.id = auth.uid() then
    raise exception 'You already own this task.';
  end if;

  insert into public.collaborators (task_id, user_id, role)
  values (p_task_id, target_profile.id, p_role)
  on conflict (task_id, user_id) do update
  set role = excluded.role
  returning * into inserted_collaborator;

  return query
  select
    inserted_collaborator.id,
    target_profile.id,
    target_profile.email,
    target_profile.full_name,
    inserted_collaborator.role;
end;
$$;

grant execute on function public.invite_user_to_task(uuid, text, text) to authenticated;

drop function if exists public.join_task_by_invite_code(text);

create or replace function public.join_task_by_invite_code(invite_code text)
returns table (
  task_id uuid,
  title text,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_task public.tasks;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to join a task.';
  end if;

  select *
  into target_task
  from public.tasks
  where upper(substr(replace(id::text, '-', ''), 1, 8)) = upper(trim(invite_code))
  limit 1;

  if target_task.id is null then
    raise exception 'Invalid invite code. No task found.';
  end if;

  if target_task.user_id = auth.uid() then
    return query select target_task.id, target_task.title, 'You already own this task.';
    return;
  end if;

  insert into public.collaborators (task_id, user_id, role)
  values (target_task.id, auth.uid(), 'viewer')
  on conflict (task_id, user_id) do nothing;

  return query select target_task.id, target_task.title, 'Joined task successfully.';
end;
$$;

grant execute on function public.join_task_by_invite_code(text) to authenticated;

notify pgrst, 'reload schema';
