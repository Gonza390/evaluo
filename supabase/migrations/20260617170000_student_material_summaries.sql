create table if not exists public.student_material_chunks (
  id uuid primary key default gen_random_uuid(),
  student_material_id uuid not null references public.student_materials(id) on delete cascade,
  chunk_index integer not null,
  chunk_text text not null,
  created_at timestamptz not null default now(),
  unique (student_material_id, chunk_index)
);

create index if not exists student_material_chunks_material_idx
  on public.student_material_chunks(student_material_id, chunk_index);

create table if not exists public.student_material_summaries (
  id uuid primary key default gen_random_uuid(),
  student_material_id uuid not null unique references public.student_materials(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'ready', 'error')),
  summary_short text,
  key_points jsonb not null default '[]'::jsonb,
  summary_sections jsonb not null default '[]'::jsonb,
  source_chunks_count integer not null default 0,
  provider text,
  error_message text,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_material_summaries_material_idx
  on public.student_material_summaries(student_material_id);

create or replace function public.set_student_material_summaries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists student_material_summaries_set_updated_at on public.student_material_summaries;

create trigger student_material_summaries_set_updated_at
before update on public.student_material_summaries
for each row
execute function public.set_student_material_summaries_updated_at();

alter table public.student_material_chunks enable row level security;
alter table public.student_material_summaries enable row level security;

drop policy if exists student_material_chunks_select_own_or_admin on public.student_material_chunks;
create policy student_material_chunks_select_own_or_admin
on public.student_material_chunks
for select
using (
  exists (
    select 1
    from public.student_materials sm
    where sm.id = student_material_id
      and (
        sm.user_id = auth.uid()
        or public.current_user_is_admin()
      )
  )
);

drop policy if exists student_material_chunks_write_admin_only on public.student_material_chunks;
create policy student_material_chunks_write_admin_only
on public.student_material_chunks
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists student_material_summaries_select_visible_or_own on public.student_material_summaries;
create policy student_material_summaries_select_visible_or_own
on public.student_material_summaries
for select
using (
  exists (
    select 1
    from public.student_materials sm
    where sm.id = student_material_id
      and (
        sm.visibility = 'shared'
        or sm.user_id = auth.uid()
        or public.current_user_is_admin()
      )
  )
);

drop policy if exists student_material_summaries_write_admin_only on public.student_material_summaries;
create policy student_material_summaries_write_admin_only
on public.student_material_summaries
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());
