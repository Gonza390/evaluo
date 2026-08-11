alter table if exists public.profiles
  add column if not exists role text default 'student',
  add column if not exists last_subject_id uuid null,
  add column if not exists last_subject_name text null,
  add column if not exists active_subjects jsonb not null default '[]'::jsonb,
  add column if not exists finished_subjects jsonb not null default '[]'::jsonb,
  add column if not exists dashboard_analytics jsonb not null default '{"subjectsCompleted":0,"lastUpdatedAt":null}'::jsonb;

update public.profiles
set role = coalesce(role, 'student')
where role is null;

alter table if exists public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'student'));
