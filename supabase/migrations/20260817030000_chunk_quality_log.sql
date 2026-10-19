create table if not exists public.chunk_quality_log (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.student_materials(id) on delete cascade,
  chunk_index integer not null,
  score decimal(3,2) not null default 0,
  issues jsonb not null default '[]'::jsonb,
  suggested_action text not null default 'keep',
  evaluated_at timestamptz not null default now()
);

create index if not exists chunk_quality_log_material_idx
  on public.chunk_quality_log(material_id, chunk_index);

alter table public.chunk_quality_log enable row level security;

drop policy if exists chunk_quality_log_select_own_or_admin on public.chunk_quality_log;
create policy chunk_quality_log_select_own_or_admin
on public.chunk_quality_log
for select
using (
  exists (
    select 1
    from public.student_materials sm
    where sm.id = material_id
      and (
        sm.user_id = auth.uid()
        or public.current_user_is_admin()
      )
  )
);

drop policy if exists chunk_quality_log_write_admin_only on public.chunk_quality_log;
create policy chunk_quality_log_write_admin_only
on public.chunk_quality_log
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());
