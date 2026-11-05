\set ON_ERROR_STOP on
-- CI-only: model the browser REST identity/RLS contract over the fixture schema.
-- These grants and auth.uid stub are NEVER part of production migrations.
create or replace function auth.uid() returns uuid
language sql stable set search_path = ''
as $$ select nullif((pg_catalog.current_setting('request.jwt.claims', true)::jsonb ->> 'sub'), '')::uuid $$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on public.student_materials to authenticated;
alter table public.student_materials enable row level security;
create policy qa_student_material_owner on public.student_materials
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Existing plan permissive policies are inherited from the fixture.
-- New RESTRICTIVE policies installed by Free V2 must deny direct writes.
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000006');
insert into public.profiles(id) values ('00000000-0000-4000-8000-000000000006');
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000007');
insert into public.profiles(id) values ('00000000-0000-4000-8000-000000000007');
