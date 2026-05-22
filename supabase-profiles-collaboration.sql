-- Run this in Supabase SQL Editor to support profiles and easier collaboration.
-- Run it after supabase-task-policies.sql.

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text unique,
    username text unique,
    full_name text,
    avatar_url text,
    cover_url text,
    bio text,
    profile_status text default 'Available',
    location text,
    role_title text,
    school_work text,
    interests text,
    website_url text,
    show_bio boolean not null default true,
    show_friends boolean not null default true,
    show_stats boolean not null default true,
    is_discoverable boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  alter table public.profiles add column if not exists email text;
  alter table public.profiles add column if not exists username text;
  alter table public.profiles add column if not exists full_name text;
  alter table public.profiles add column if not exists avatar_url text;
  alter table public.profiles add column if not exists cover_url text;
  alter table public.profiles add column if not exists bio text;
  alter table public.profiles add column if not exists profile_status text default 'Available';
  alter table public.profiles add column if not exists location text;
  alter table public.profiles add column if not exists role_title text;
  alter table public.profiles add column if not exists school_work text;
  alter table public.profiles add column if not exists interests text;
  alter table public.profiles add column if not exists website_url text;
  alter table public.profiles add column if not exists show_bio boolean not null default true;
  alter table public.profiles add column if not exists show_friends boolean not null default true;
  alter table public.profiles add column if not exists show_stats boolean not null default true;
  alter table public.profiles add column if not exists is_discoverable boolean not null default true;
  alter table public.profiles add column if not exists created_at timestamptz not null default now();
  alter table public.profiles add column if not exists updated_at timestamptz not null default now();

  insert into storage.buckets (id, name, public)
  values ('profile-media', 'profile-media', true)
  on conflict (id) do update set public = true;

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

  create table if not exists public.task_invites (
    id uuid primary key default gen_random_uuid(),
    task_id uuid not null references public.tasks(id) on delete cascade,
    created_by uuid not null references public.profiles(id) on delete cascade,
    token_hash bytea not null unique,
    expires_at timestamptz not null default (now() + interval '7 days'),
    max_uses integer not null default 20 check (max_uses > 0),
    use_count integer not null default 0 check (use_count >= 0),
    revoked_at timestamptz,
    created_at timestamptz not null default now()
  );

  create index if not exists task_invites_task_id_idx
  on public.task_invites (task_id);

  create index if not exists task_invites_valid_idx
  on public.task_invites (expires_at, revoked_at)
  where revoked_at is null;

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

  create or replace function public.are_profiles_connected(profile_a uuid, profile_b uuid default auth.uid())
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select exists (
      select 1
      from public.profile_connections
      where status = 'accepted'
        and (
          (requester_id = profile_a and addressee_id = profile_b)
          or
          (requester_id = profile_b and addressee_id = profile_a)
        )
    );
  $$;

  alter table public.profiles enable row level security;
  alter table public.collaborators enable row level security;
  alter table public.task_invites enable row level security;
  alter table public.profile_connections enable row level security;

  grant usage on schema public to authenticated;
  grant select, insert, update on public.profiles to authenticated;
  grant select on public.collaborators to authenticated;
  revoke insert, update, delete on public.collaborators from authenticated;
  revoke all on public.task_invites from anon, authenticated;
  grant select, insert, update, delete on public.profile_connections to authenticated;

  grant execute on function public.is_task_owner(uuid, uuid) to authenticated;
  grant execute on function public.is_task_editor(uuid, uuid) to authenticated;
  grant execute on function public.is_task_collaborator(uuid, uuid) to authenticated;
  grant execute on function public.can_access_task(uuid, uuid) to authenticated;
  grant execute on function public.are_profiles_connected(uuid, uuid) to authenticated;

  drop policy if exists "profiles_select_authenticated" on public.profiles;
  drop policy if exists "profiles_insert_self" on public.profiles;
  drop policy if exists "profiles_update_self" on public.profiles;

  create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or is_discoverable = true or public.are_profiles_connected(id));

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

  drop policy if exists "profile_media_select_public" on storage.objects;
  drop policy if exists "profile_media_insert_self" on storage.objects;
  drop policy if exists "profile_media_update_self" on storage.objects;
  drop policy if exists "profile_media_delete_self" on storage.objects;

  create policy "profile_media_select_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'profile-media');

  create policy "profile_media_insert_self"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);

  create policy "profile_media_update_self"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);

  create policy "profile_media_delete_self"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);

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
  drop policy if exists "profile_connections_delete_involved" on public.profile_connections;

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

  create policy "profile_connections_delete_involved"
  on public.profile_connections
  for delete
  to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

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

  drop function if exists public.update_task_collaborator_role(uuid, text);

  create or replace function public.update_task_collaborator_role(
    p_collaborator_id uuid,
    p_role text
  )
  returns public.collaborators
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    target_collaborator public.collaborators;
    updated_collaborator public.collaborators;
  begin
    if auth.uid() is null then
      raise exception 'You must be signed in to update collaborators.';
    end if;

    if p_role not in ('editor', 'viewer') then
      raise exception 'Role must be editor or viewer.';
    end if;

    select *
    into target_collaborator
    from public.collaborators
    where id = p_collaborator_id;

    if target_collaborator.id is null then
      raise exception 'Collaborator not found.';
    end if;

    if target_collaborator.role = 'owner' then
      raise exception 'The task leader role cannot be changed.';
    end if;

    if not public.is_task_owner(target_collaborator.task_id, auth.uid()) then
      raise exception 'Only the task leader can update collaborator roles.';
    end if;

    update public.collaborators
    set role = p_role
    where id = p_collaborator_id
    returning * into updated_collaborator;

    return updated_collaborator;
  end;
  $$;

  grant execute on function public.update_task_collaborator_role(uuid, text) to authenticated;

  drop function if exists public.remove_task_collaborator(uuid);

  create or replace function public.remove_task_collaborator(
    p_collaborator_id uuid
  )
  returns uuid
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    target_collaborator public.collaborators;
  begin
    if auth.uid() is null then
      raise exception 'You must be signed in to remove collaborators.';
    end if;

    select *
    into target_collaborator
    from public.collaborators
    where id = p_collaborator_id;

    if target_collaborator.id is null then
      raise exception 'Collaborator not found.';
    end if;

    if target_collaborator.role = 'owner' then
      raise exception 'The task leader cannot be removed from the team.';
    end if;

    if target_collaborator.user_id <> auth.uid()
      and not public.is_task_owner(target_collaborator.task_id, auth.uid()) then
      raise exception 'Only the task leader or that collaborator can remove this member.';
    end if;

    delete from public.collaborators
    where id = p_collaborator_id;

    return p_collaborator_id;
  end;
  $$;

  grant execute on function public.remove_task_collaborator(uuid) to authenticated;

  drop function if exists public.create_task_invite(uuid, integer, integer);

  create or replace function public.create_task_invite(
    p_task_id uuid,
    p_expires_in_hours integer default 168,
    p_max_uses integer default 20
  )
  returns table (
    invite_code text,
    expires_at timestamptz,
    max_uses integer
  )
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    raw_code text;
    expires_at_value timestamptz;
  begin
    if auth.uid() is null then
      raise exception 'You must be signed in to create invites.';
    end if;

    if not public.is_task_owner(p_task_id, auth.uid()) then
      raise exception 'Only the task leader can create invite codes.';
    end if;

    if p_expires_in_hours is null or p_expires_in_hours < 1 or p_expires_in_hours > 720 then
      raise exception 'Invite expiration must be between 1 and 720 hours.';
    end if;

    if p_max_uses is null or p_max_uses < 1 or p_max_uses > 100 then
      raise exception 'Invite max uses must be between 1 and 100.';
    end if;

    raw_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 12));
    expires_at_value := now() + make_interval(hours => p_expires_in_hours);

    insert into public.task_invites (
      task_id,
      created_by,
      token_hash,
      expires_at,
      max_uses
    )
    values (
      p_task_id,
      auth.uid(),
      convert_to(raw_code, 'UTF8'),
      expires_at_value,
      p_max_uses
    );

    return query select raw_code, expires_at_value, p_max_uses;
  end;
  $$;

  grant execute on function public.create_task_invite(uuid, integer, integer) to authenticated;

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
    target_invite public.task_invites;
    normalized_code text;
  begin
    if auth.uid() is null then
      raise exception 'You must be signed in to join a task.';
    end if;

    normalized_code := upper(regexp_replace(trim(invite_code), '[^A-Z0-9]', '', 'g'));

    if length(normalized_code) < 10 then
      raise exception 'Invalid invite code.';
    end if;

    select *
    into target_invite
    from public.task_invites
    where token_hash = convert_to(normalized_code, 'UTF8')
      and revoked_at is null
      and expires_at > now()
      and use_count < max_uses
    limit 1;

    if target_invite.id is null then
      raise exception 'Invalid or expired invite code.';
    end if;

    select *
    into target_task
    from public.tasks
    where id = target_invite.task_id;

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

    update public.task_invites
    set use_count = use_count + 1
    where id = target_invite.id;

    return query select target_task.id, target_task.title, 'Joined task successfully.';
  end;
  $$;

  grant execute on function public.join_task_by_invite_code(text) to authenticated;

  create table if not exists public.comments (
    id uuid primary key default gen_random_uuid(),
    task_id uuid not null references public.tasks(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    content text not null,
    created_at timestamptz not null default now()
  );

  alter table public.comments add column if not exists task_id uuid;
  alter table public.comments add column if not exists user_id uuid;
  alter table public.comments add column if not exists content text;
  alter table public.comments add column if not exists created_at timestamptz not null default now();

  do $$
  begin
    if not exists (
      select 1 from pg_constraint where conname = 'comments_task_id_fkey'
    ) then
      alter table public.comments
      add constraint comments_task_id_fkey
      foreign key (task_id) references public.tasks(id) on delete cascade not valid;
    end if;

    if not exists (
      select 1 from pg_constraint where conname = 'comments_user_id_fkey'
    ) then
      alter table public.comments
      add constraint comments_user_id_fkey
      foreign key (user_id) references public.profiles(id) on delete cascade not valid;
    end if;
  end $$;

  create index if not exists comments_task_id_created_at_idx
  on public.comments (task_id, created_at asc);

  alter table public.comments enable row level security;
  alter table public.comments replica identity full;

  grant select on public.comments to authenticated;
  revoke insert, update, delete on public.comments from authenticated;

  drop policy if exists "comments_select_task_access" on public.comments;
  drop policy if exists "comments_insert_task_access" on public.comments;
  drop policy if exists "comments_delete_own_or_owner" on public.comments;

  create policy "comments_select_task_access"
  on public.comments
  for select
  to authenticated
  using (public.can_access_task(task_id));

  create policy "comments_insert_task_access"
  on public.comments
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.can_access_task(task_id)
  );

  create policy "comments_delete_own_or_owner"
  on public.comments
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_task_owner(task_id)
  );

  drop function if exists public.create_task_comment(uuid, text);

  create or replace function public.create_task_comment(
    p_task_id uuid,
    p_content text
  )
  returns public.comments
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    inserted_comment public.comments;
  begin
    if auth.uid() is null then
      raise exception 'You must be signed in to comment.';
    end if;

    if nullif(trim(p_content), '') is null then
      raise exception 'Comment cannot be empty.';
    end if;

    if not public.can_access_task(p_task_id, auth.uid()) then
      raise exception 'You do not have access to this task.';
    end if;

    insert into public.comments (task_id, user_id, content)
    values (p_task_id, auth.uid(), trim(p_content))
    returning * into inserted_comment;

    return inserted_comment;
  end;
  $$;

  grant execute on function public.create_task_comment(uuid, text) to authenticated;

  drop function if exists public.list_task_comments(uuid);

  create or replace function public.list_task_comments(
    p_task_id uuid
  )
  returns table (
    id uuid,
    task_id uuid,
    user_id uuid,
    content text,
    created_at timestamptz,
    profile_id uuid,
    full_name text,
    avatar_url text
  )
  language plpgsql
  security definer
  set search_path = public
  as $$
  begin
    if auth.uid() is null then
      raise exception 'You must be signed in to view comments.';
    end if;

    if not public.can_access_task(p_task_id, auth.uid()) then
      raise exception 'You do not have access to this task.';
    end if;

    return query
    select
      comments.id,
      comments.task_id,
      comments.user_id,
      comments.content,
      comments.created_at,
      profiles.id,
      profiles.full_name,
      profiles.avatar_url
    from public.comments comments
    left join public.profiles profiles on profiles.id = comments.user_id
    where comments.task_id = p_task_id
    order by comments.created_at asc;
  end;
  $$;

  grant execute on function public.list_task_comments(uuid) to authenticated;

  drop function if exists public.delete_task_comment(uuid);

  create or replace function public.delete_task_comment(
    p_comment_id uuid
  )
  returns uuid
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    target_comment public.comments;
  begin
    if auth.uid() is null then
      raise exception 'You must be signed in to delete comments.';
    end if;

    select *
    into target_comment
    from public.comments
    where id = p_comment_id;

    if target_comment.id is null then
      raise exception 'Comment not found.';
    end if;

    if target_comment.user_id <> auth.uid()
      and not public.is_task_owner(target_comment.task_id, auth.uid()) then
      raise exception 'You can only delete your own comments.';
    end if;

    delete from public.comments
    where id = p_comment_id;

    return p_comment_id;
  end;
  $$;

  grant execute on function public.delete_task_comment(uuid) to authenticated;

  create or replace function public.sync_task_owner_collaborator()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $$
  begin
    insert into public.collaborators (task_id, user_id, role)
    values (new.id, new.user_id, 'owner')
    on conflict (task_id, user_id) do update
    set role = 'owner';

    return new;
  end;
  $$;

  drop trigger if exists sync_task_owner_collaborator_on_task on public.tasks;
  create trigger sync_task_owner_collaborator_on_task
  after insert or update of user_id on public.tasks
  for each row execute function public.sync_task_owner_collaborator();

  insert into public.collaborators (task_id, user_id, role)
  select id, user_id, 'owner'
  from public.tasks
  on conflict (task_id, user_id) do update
  set role = 'owner';

  do $$
  begin
    alter publication supabase_realtime add table public.comments;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end $$;

  revoke execute on function public.invite_user_to_task(uuid, text, text) from public, anon;
  revoke execute on function public.create_task_invite(uuid, integer, integer) from public, anon;
  revoke execute on function public.join_task_by_invite_code(text) from public, anon;
  revoke execute on function public.update_task_collaborator_role(uuid, text) from public, anon;
  revoke execute on function public.remove_task_collaborator(uuid) from public, anon;
  revoke execute on function public.create_task_comment(uuid, text) from public, anon;
  revoke execute on function public.list_task_comments(uuid) from public, anon;
  revoke execute on function public.delete_task_comment(uuid) from public, anon;

  grant execute on function public.invite_user_to_task(uuid, text, text) to authenticated;
  grant execute on function public.create_task_invite(uuid, integer, integer) to authenticated;
  grant execute on function public.join_task_by_invite_code(text) to authenticated;
  grant execute on function public.update_task_collaborator_role(uuid, text) to authenticated;
  grant execute on function public.remove_task_collaborator(uuid) to authenticated;
  grant execute on function public.create_task_comment(uuid, text) to authenticated;
  grant execute on function public.list_task_comments(uuid) to authenticated;
  grant execute on function public.delete_task_comment(uuid) to authenticated;

  notify pgrst, 'reload schema';
