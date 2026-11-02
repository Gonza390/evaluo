-- One active personal study plan per authenticated user. Existing material progress is reused.
create table if not exists public.student_personal_study_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  exam_date date not null,
  daily_minutes integer not null check (daily_minutes between 15 and 240),
  material_ids uuid[] not null,
  preferences text[] not null default '{}',
  schedule jsonb not null default '[]'::jsonb check (jsonb_typeof(schedule) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personal_plan_at_least_one_material check (cardinality(material_ids) between 1 and 20)
);
alter table public.student_personal_study_plans enable row level security;
revoke all on public.student_personal_study_plans from public, anon;
grant select, insert, update, delete on public.student_personal_study_plans to authenticated;
create policy "Study plans select own" on public.student_personal_study_plans
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Study plans insert own" on public.student_personal_study_plans
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Study plans update own" on public.student_personal_study_plans
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Study plans delete own" on public.student_personal_study_plans
  for delete to authenticated using (user_id = (select auth.uid()));
