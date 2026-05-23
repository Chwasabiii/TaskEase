-- Harden RLS for session and subtask tables when they exist.
-- This file is safe to run even if the tables are not present.

do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relname = 'pomodoro_sessions' and n.nspname = 'public'
  ) then
    alter table public.pomodoro_sessions enable row level security;

    grant select, insert, update, delete on public.pomodoro_sessions to authenticated;

    drop policy if exists "pomodoro_sessions_user_access" on public.pomodoro_sessions;
    create policy "pomodoro_sessions_user_access"
    on public.pomodoro_sessions
    for select
    to authenticated
    using (user_id = auth.uid());

    drop policy if exists "pomodoro_sessions_user_insert" on public.pomodoro_sessions;
    create policy "pomodoro_sessions_user_insert"
    on public.pomodoro_sessions
    for insert
    to authenticated
    with check (user_id = auth.uid());

    drop policy if exists "pomodoro_sessions_user_update" on public.pomodoro_sessions;
    create policy "pomodoro_sessions_user_update"
    on public.pomodoro_sessions
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

    drop policy if exists "pomodoro_sessions_user_delete" on public.pomodoro_sessions;
    create policy "pomodoro_sessions_user_delete"
    on public.pomodoro_sessions
    for delete
    to authenticated
    using (user_id = auth.uid());
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relname = 'subtasks' and n.nspname = 'public'
  ) then
    alter table public.subtasks enable row level security;

    grant select, insert, update, delete on public.subtasks to authenticated;

    drop policy if exists "subtasks_task_access" on public.subtasks;
    create policy "subtasks_task_access"
    on public.subtasks
    for select
    to authenticated
    using (public.can_access_task(task_id));

    drop policy if exists "subtasks_task_insert_access" on public.subtasks;
    create policy "subtasks_task_insert_access"
    on public.subtasks
    for insert
    to authenticated
    with check (public.can_access_task(task_id));

    drop policy if exists "subtasks_task_update_access" on public.subtasks;
    create policy "subtasks_task_update_access"
    on public.subtasks
    for update
    to authenticated
    using (public.can_access_task(task_id))
    with check (public.can_access_task(task_id));

    drop policy if exists "subtasks_task_delete_access" on public.subtasks;
    create policy "subtasks_task_delete_access"
    on public.subtasks
    for delete
    to authenticated
    using (public.can_access_task(task_id));
  end if;
end
$$;

notify pgrst, 'reload schema';
