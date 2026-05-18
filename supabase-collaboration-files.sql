-- Run this in Supabase SQL Editor to enable private file sharing per task.

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

grant execute on function public.is_task_owner(uuid, uuid) to authenticated;
grant execute on function public.is_task_collaborator(uuid, uuid) to authenticated;
grant execute on function public.can_access_task(uuid, uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('task-files', 'task-files', false, 52428800)
on conflict (id) do update
set public = false,
    file_size_limit = 52428800;

create table if not exists public.task_files (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  file_path text not null unique,
  file_type text,
  file_size bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  notes text not null default '',
  is_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checklist_item_files (
  id uuid primary key default gen_random_uuid(),
  checklist_item_id uuid not null references public.task_checklist_items(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  file_path text not null unique,
  file_type text,
  file_size bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists task_files_task_id_created_at_idx
on public.task_files (task_id, created_at desc);

create index if not exists task_checklist_items_task_id_created_at_idx
on public.task_checklist_items (task_id, created_at asc);

create index if not exists checklist_item_files_item_id_created_at_idx
on public.checklist_item_files (checklist_item_id, created_at desc);

alter table public.task_files enable row level security;
alter table public.task_checklist_items enable row level security;
alter table public.checklist_item_files enable row level security;

grant usage on schema public to authenticated;
grant select, insert, delete on public.task_files to authenticated;
grant select, insert, update, delete on public.task_checklist_items to authenticated;
grant select, insert, delete on public.checklist_item_files to authenticated;

drop policy if exists "task_files_select_task_access" on public.task_files;
drop policy if exists "task_files_insert_task_access" on public.task_files;
drop policy if exists "task_files_delete_owner_or_uploader" on public.task_files;

create policy "task_files_select_task_access"
on public.task_files
for select
to authenticated
using (public.can_access_task(task_id));

create policy "task_files_insert_task_access"
on public.task_files
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and public.can_access_task(task_id)
);

create policy "task_files_delete_owner_or_uploader"
on public.task_files
for delete
to authenticated
using (
  uploaded_by = auth.uid()
  or public.is_task_owner(task_id)
);

drop policy if exists "task_checklist_items_select_task_access" on public.task_checklist_items;
drop policy if exists "task_checklist_items_insert_task_access" on public.task_checklist_items;
drop policy if exists "task_checklist_items_update_task_access" on public.task_checklist_items;
drop policy if exists "task_checklist_items_delete_task_access" on public.task_checklist_items;

create policy "task_checklist_items_select_task_access"
on public.task_checklist_items
for select
to authenticated
using (public.can_access_task(task_id));

create policy "task_checklist_items_insert_task_access"
on public.task_checklist_items
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.can_access_task(task_id)
);

create policy "task_checklist_items_update_task_access"
on public.task_checklist_items
for update
to authenticated
using (public.can_access_task(task_id))
with check (public.can_access_task(task_id));

create policy "task_checklist_items_delete_task_access"
on public.task_checklist_items
for delete
to authenticated
using (
  created_by = auth.uid()
  or public.is_task_owner(task_id)
);

drop policy if exists "checklist_item_files_select_task_access" on public.checklist_item_files;
drop policy if exists "checklist_item_files_insert_task_access" on public.checklist_item_files;
drop policy if exists "checklist_item_files_delete_task_access" on public.checklist_item_files;

create policy "checklist_item_files_select_task_access"
on public.checklist_item_files
for select
to authenticated
using (public.can_access_task(task_id));

create policy "checklist_item_files_insert_task_access"
on public.checklist_item_files
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and public.can_access_task(task_id)
);

create policy "checklist_item_files_delete_task_access"
on public.checklist_item_files
for delete
to authenticated
using (
  uploaded_by = auth.uid()
  or public.is_task_owner(task_id)
);

drop function if exists public.create_task_file_metadata(uuid, text, text, text, bigint);

create or replace function public.create_task_file_metadata(
  p_task_id uuid,
  p_file_name text,
  p_file_path text,
  p_file_type text,
  p_file_size bigint
)
returns public.task_files
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_file public.task_files;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to upload files.';
  end if;

  if not public.can_access_task(p_task_id, auth.uid()) then
    raise exception 'You do not have access to this task.';
  end if;

  insert into public.task_files (
    task_id,
    uploaded_by,
    file_name,
    file_path,
    file_type,
    file_size
  )
  values (
    p_task_id,
    auth.uid(),
    p_file_name,
    p_file_path,
    p_file_type,
    p_file_size
  )
  returning * into inserted_file;

  return inserted_file;
end;
$$;

grant execute on function public.create_task_file_metadata(uuid, text, text, text, bigint)
to authenticated;

drop function if exists public.create_checklist_item(uuid, text, text);

create or replace function public.create_checklist_item(
  p_task_id uuid,
  p_title text,
  p_notes text default ''
)
returns public.task_checklist_items
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_item public.task_checklist_items;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to create checklist items.';
  end if;

  if not public.can_access_task(p_task_id, auth.uid()) then
    raise exception 'You do not have access to this task.';
  end if;

  insert into public.task_checklist_items (task_id, created_by, title, notes)
  values (p_task_id, auth.uid(), p_title, coalesce(p_notes, ''))
  returning * into inserted_item;

  return inserted_item;
end;
$$;

grant execute on function public.create_checklist_item(uuid, text, text)
to authenticated;

drop function if exists public.create_checklist_file_metadata(uuid, text, text, text, bigint);

create or replace function public.create_checklist_file_metadata(
  p_checklist_item_id uuid,
  p_file_name text,
  p_file_path text,
  p_file_type text,
  p_file_size bigint
)
returns public.checklist_item_files
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_item public.task_checklist_items;
  inserted_file public.checklist_item_files;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to upload checklist files.';
  end if;

  select *
  into parent_item
  from public.task_checklist_items
  where id = p_checklist_item_id;

  if parent_item.id is null then
    raise exception 'Checklist item not found.';
  end if;

  if not public.can_access_task(parent_item.task_id, auth.uid()) then
    raise exception 'You do not have access to this task.';
  end if;

  insert into public.checklist_item_files (
    checklist_item_id,
    task_id,
    uploaded_by,
    file_name,
    file_path,
    file_type,
    file_size
  )
  values (
    p_checklist_item_id,
    parent_item.task_id,
    auth.uid(),
    p_file_name,
    p_file_path,
    p_file_type,
    p_file_size
  )
  returning * into inserted_file;

  return inserted_file;
end;
$$;

grant execute on function public.create_checklist_file_metadata(uuid, text, text, text, bigint)
to authenticated;

drop policy if exists "task_files_storage_select" on storage.objects;
drop policy if exists "task_files_storage_insert" on storage.objects;
drop policy if exists "task_files_storage_update" on storage.objects;
drop policy if exists "task_files_storage_delete" on storage.objects;

create policy "task_files_storage_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'task-files'
  and public.can_access_task((storage.foldername(name))[1]::uuid)
);

create policy "task_files_storage_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'task-files'
);

create policy "task_files_storage_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'task-files'
  and public.can_access_task((storage.foldername(name))[1]::uuid)
)
with check (
  bucket_id = 'task-files'
  and public.can_access_task((storage.foldername(name))[1]::uuid)
);

create policy "task_files_storage_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'task-files'
  and public.can_access_task((storage.foldername(name))[1]::uuid)
);

notify pgrst, 'reload schema';
