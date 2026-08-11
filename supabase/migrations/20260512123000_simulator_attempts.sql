create table if not exists public.simulator_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  materia_id uuid not null references public.materias(id) on delete cascade,
  parcial integer not null,
  total_questions integer not null default 0,
  correct_answers integer not null default 0,
  wrong_answers integer not null default 0,
  answered_questions integer not null default 0,
  premium_only boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.simulator_attempt_wrong_questions (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.simulator_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  materia_id uuid not null references public.materias(id) on delete cascade,
  parcial integer not null,
  pregunta_id uuid not null references public.preguntas_banco(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists simulator_attempts_user_materia_created_idx
  on public.simulator_attempts(user_id, materia_id, parcial, created_at desc);

create index if not exists simulator_attempt_wrong_questions_attempt_idx
  on public.simulator_attempt_wrong_questions(attempt_id, pregunta_id);

alter table public.simulator_attempts enable row level security;
alter table public.simulator_attempt_wrong_questions enable row level security;

drop policy if exists simulator_attempts_select_own_or_admin on public.simulator_attempts;
drop policy if exists simulator_attempts_insert_own_or_admin on public.simulator_attempts;
drop policy if exists simulator_attempts_update_admin_only on public.simulator_attempts;
drop policy if exists simulator_attempts_delete_admin_only on public.simulator_attempts;

create policy simulator_attempts_select_own_or_admin
on public.simulator_attempts
for select
using (auth.uid() = user_id or exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
));

create policy simulator_attempts_insert_own_or_admin
on public.simulator_attempts
for insert
with check (auth.uid() = user_id or exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
));

create policy simulator_attempts_update_admin_only
on public.simulator_attempts
for update
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
));

create policy simulator_attempts_delete_admin_only
on public.simulator_attempts
for delete
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
));

drop policy if exists simulator_attempt_wrong_questions_select_own_or_admin on public.simulator_attempt_wrong_questions;
drop policy if exists simulator_attempt_wrong_questions_insert_own_or_admin on public.simulator_attempt_wrong_questions;
drop policy if exists simulator_attempt_wrong_questions_update_admin_only on public.simulator_attempt_wrong_questions;
drop policy if exists simulator_attempt_wrong_questions_delete_admin_only on public.simulator_attempt_wrong_questions;

create policy simulator_attempt_wrong_questions_select_own_or_admin
on public.simulator_attempt_wrong_questions
for select
using (auth.uid() = user_id or exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
));

create policy simulator_attempt_wrong_questions_insert_own_or_admin
on public.simulator_attempt_wrong_questions
for insert
with check (auth.uid() = user_id or exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
));

create policy simulator_attempt_wrong_questions_update_admin_only
on public.simulator_attempt_wrong_questions
for update
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
));

create policy simulator_attempt_wrong_questions_delete_admin_only
on public.simulator_attempt_wrong_questions
for delete
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
));
