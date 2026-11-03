-- Persist completed practice modalities for a particular topic in a saved personal plan.
-- The client cannot insert completion markers: only the authenticated session endpoint
-- can do so after a practice session is saved.
create table if not exists public.student_personal_study_plan_practice_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.student_materials(id) on delete cascade,
  topic_index integer not null check (topic_index >= 0),
  mode text not null check (mode in ('flashcards','unir','completar','opciones','casos','mixto','simulacro')),
  completed_at timestamptz not null default now(),
  primary key (user_id,material_id,topic_index,mode)
);
create index if not exists student_plan_practice_progress_material_idx
  on public.student_personal_study_plan_practice_progress (user_id,material_id);
alter table public.student_personal_study_plan_practice_progress enable row level security;
revoke all on public.student_personal_study_plan_practice_progress from public, anon, authenticated;
grant select on public.student_personal_study_plan_practice_progress to authenticated;
create policy "Read own personal study practice progress"
  on public.student_personal_study_plan_practice_progress
  for select to authenticated using (user_id = (select auth.uid()));
