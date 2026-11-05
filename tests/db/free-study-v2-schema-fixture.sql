\set ON_ERROR_STOP on
-- Minimal, disposable PostgreSQL 17 representation of the existing public schema.
-- No production data or secrets are used.
create schema auth;
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create table auth.users (id uuid primary key);
create table public.profiles (
  id uuid primary key references auth.users(id),
  student_material_uploads_unlimited boolean not null default false
);
create table public.student_materials (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  processing_status text not null,
  created_at timestamptz not null default now()
);
create table public.subscription_plans (
  id uuid primary key,
  code text not null unique
);
create table public.user_subscriptions (
  user_id uuid not null references auth.users(id),
  plan_id uuid not null references public.subscription_plans(id),
  status text not null,
  expires_at timestamptz
);
create table public.student_personal_study_plans (
  user_id uuid primary key references auth.users(id),
  exam_date date,
  daily_minutes integer,
  material_ids uuid[],
  preferences text[],
  schedule jsonb,
  updated_at timestamptz default now()
);
alter table public.student_personal_study_plans enable row level security;
grant usage on schema public to authenticated, service_role;
grant select,insert,update,delete on public.student_personal_study_plans to authenticated;
create policy "existing-plan-select" on public.student_personal_study_plans
  for select to authenticated using (true);
create policy "existing-plan-insert" on public.student_personal_study_plans
  for insert to authenticated with check (true);
create policy "existing-plan-update" on public.student_personal_study_plans
  for update to authenticated using (true) with check (true);
create policy "existing-plan-delete" on public.student_personal_study_plans
  for delete to authenticated using (true);
grant select,insert,update,delete on public.student_materials to service_role;
grant select on public.profiles,public.user_subscriptions,public.subscription_plans
  to service_role;
insert into auth.users(id) values
 ('00000000-0000-4000-8000-000000000001'),
 ('00000000-0000-4000-8000-000000000002'),
 ('00000000-0000-4000-8000-000000000003'),
 ('00000000-0000-4000-8000-000000000004'),
 ('00000000-0000-4000-8000-000000000005');
insert into public.profiles(id) select id from auth.users;
insert into public.subscription_plans(id,code) values
 ('10000000-0000-4000-8000-000000000001','premium');
insert into public.user_subscriptions(user_id,plan_id,status,expires_at)
values ('00000000-0000-4000-8000-000000000004',
        '10000000-0000-4000-8000-000000000001','active',now()+interval '30 days');
-- Historial real anterior al lanzamiento: NO debe consumir cupos nuevos.
insert into public.student_materials(id,user_id,processing_status) values
 ('20000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001','ready'),
 ('40000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000004','ready'),
 ('40000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000004','ready'),
 ('40000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004','ready');
-- También se conserva el plan de estudio anterior y se regala un cupo nuevo.
insert into public.student_personal_study_plans
 (user_id,exam_date,daily_minutes,material_ids,preferences,schedule)
values
 ('00000000-0000-4000-8000-000000000001',
  current_date+8,30,
  array['20000000-0000-4000-8000-000000000001']::uuid[],
  array['practicar']::text[],'[]'::jsonb);
