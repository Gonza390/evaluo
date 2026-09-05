alter table public.universidades
  add column if not exists approval_status text not null default 'approved',
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists city text;

update public.universidades
set approval_status = 'approved'
where approval_status is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'universidades_approval_status_check'
      and conrelid = 'public.universidades'::regclass
  ) then
    alter table public.universidades
      add constraint universidades_approval_status_check
      check (approval_status in ('approved', 'pending', 'rejected'));
  end if;
end $$;

create index if not exists universidades_approval_owner_idx
  on public.universidades (approval_status, owner_user_id);

drop policy if exists universidades_read_public on public.universidades;
drop policy if exists universidades_read_approved_or_own_pending on public.universidades;

create policy universidades_read_approved_or_own_pending
  on public.universidades
  for select
  using (
    approval_status = 'approved'
    or owner_user_id = auth.uid()
    or public.current_user_is_admin()
  );
