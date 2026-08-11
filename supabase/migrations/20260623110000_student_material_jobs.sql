create table if not exists public.student_material_jobs (
  id uuid primary key default gen_random_uuid(),
  student_material_id uuid not null references public.student_materials(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'completed', 'failed')),
  attempts integer not null default 0,
  last_error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists student_material_jobs_status_created_idx
  on public.student_material_jobs(status, created_at asc);

create index if not exists student_material_jobs_material_idx
  on public.student_material_jobs(student_material_id, created_at desc);

alter table public.student_material_jobs enable row level security;

drop policy if exists student_material_jobs_select_own_or_admin on public.student_material_jobs;
create policy student_material_jobs_select_own_or_admin
on public.student_material_jobs
for select
using (
  exists (
    select 1
    from public.student_materials sm
    where sm.id = student_material_jobs.student_material_id
      and (
        sm.user_id = auth.uid()
        or public.current_user_is_admin()
      )
  )
);

drop policy if exists student_material_jobs_write_admin_only on public.student_material_jobs;
create policy student_material_jobs_write_admin_only
on public.student_material_jobs
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());
