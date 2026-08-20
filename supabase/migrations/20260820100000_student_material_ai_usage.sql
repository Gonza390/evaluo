create table if not exists public.student_material_ai_usage (
  id uuid primary key default gen_random_uuid(),
  student_material_id uuid not null references public.student_materials(id) on delete cascade,
  user_id uuid,
  provider text not null,
  model text not null,
  operation text not null check (operation in ('summary_map', 'summary_reduce', 'summary_pdf', 'summary_vision', 'glossary', 'glossary_pdf', 'glossary_vision', 'chunk_evaluation')),
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_material_ai_usage_material_created_idx
  on public.student_material_ai_usage(student_material_id, created_at);

create index if not exists student_material_ai_usage_user_created_idx
  on public.student_material_ai_usage(user_id, created_at);

create or replace function public.set_student_material_ai_usage_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists student_material_ai_usage_set_updated_at on public.student_material_ai_usage;

create trigger student_material_ai_usage_set_updated_at
before update on public.student_material_ai_usage
for each row
execute function public.set_student_material_ai_usage_updated_at();

alter table public.student_material_ai_usage enable row level security;

drop policy if exists student_material_ai_usage_select_visible_or_own on public.student_material_ai_usage;
create policy student_material_ai_usage_select_visible_or_own
on public.student_material_ai_usage
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

drop policy if exists student_material_ai_usage_write_admin_only on public.student_material_ai_usage;
create policy student_material_ai_usage_write_admin_only
on public.student_material_ai_usage
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());
