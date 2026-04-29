create table if not exists public.premium_question_sets (
  id uuid primary key default gen_random_uuid(),
  materia_id uuid not null references public.materias(id) on delete cascade,
  parcial integer not null default 1,
  titulo text not null,
  source_exam_date date null,
  notes text null,
  is_active boolean not null default true,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.premium_questions (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.premium_question_sets(id) on delete cascade,
  enunciado text not null,
  opciones text[] not null,
  respuesta_correcta text not null,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists premium_question_sets_materia_parcial_idx
  on public.premium_question_sets(materia_id, parcial, is_active, created_at desc);
create index if not exists premium_questions_set_idx
  on public.premium_questions(set_id, orden);

alter table public.premium_question_sets enable row level security;
alter table public.premium_questions enable row level security;

drop policy if exists premium_sets_read_authenticated on public.premium_question_sets;
drop policy if exists premium_sets_write_admin on public.premium_question_sets;
drop policy if exists premium_questions_read_authenticated on public.premium_questions;
drop policy if exists premium_questions_write_admin on public.premium_questions;

create policy premium_sets_read_authenticated
on public.premium_question_sets
for select
to authenticated
using (true);

create policy premium_questions_read_authenticated
on public.premium_questions
for select
to authenticated
using (true);

create policy premium_sets_write_admin
on public.premium_question_sets
for all
to authenticated
using (
  coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy premium_questions_write_admin
on public.premium_questions
for all
to authenticated
using (
  coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
