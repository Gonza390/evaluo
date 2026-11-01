-- Capa independiente de Practicar: NO modifica materiales, resúmenes,
-- glosarios, flashcards ni los artefactos existentes.
-- Aplicar únicamente en un entorno de datos de prueba antes de producción.
create table if not exists public.student_material_practice_banks (
  material_id uuid not null references public.student_materials(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('unir','completar','casos','mixto','simulacro')),
  version smallint not null default 1 check (version > 0),
  source_fingerprint text not null,
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(material_id,mode,version)
);
create index if not exists practice_banks_user_idx on public.student_material_practice_banks(user_id);
alter table public.student_material_practice_banks enable row level security;
revoke all on public.student_material_practice_banks from anon;
grant select, insert, update, delete on public.student_material_practice_banks to authenticated;
drop policy if exists practice_banks_owner_select on public.student_material_practice_banks;
create policy practice_banks_owner_select on public.student_material_practice_banks for select to authenticated
  using ((select auth.uid())=user_id and exists (
    select 1 from public.student_materials sm where sm.id=material_id and sm.user_id=(select auth.uid())
  ));
drop policy if exists practice_banks_owner_insert on public.student_material_practice_banks;
create policy practice_banks_owner_insert on public.student_material_practice_banks for insert to authenticated
  with check ((select auth.uid())=user_id and exists (
    select 1 from public.student_materials sm where sm.id=material_id and sm.user_id=(select auth.uid())
  ));
drop policy if exists practice_banks_owner_update on public.student_material_practice_banks;
create policy practice_banks_owner_update on public.student_material_practice_banks for update to authenticated
  using ((select auth.uid())=user_id and exists (
    select 1 from public.student_materials sm where sm.id=material_id and sm.user_id=(select auth.uid())
  ))
  with check ((select auth.uid())=user_id and exists (
    select 1 from public.student_materials sm where sm.id=material_id and sm.user_id=(select auth.uid())
  ));
drop policy if exists practice_banks_owner_delete on public.student_material_practice_banks;
create policy practice_banks_owner_delete on public.student_material_practice_banks for delete to authenticated
  using ((select auth.uid())=user_id and exists (
    select 1 from public.student_materials sm where sm.id=material_id and sm.user_id=(select auth.uid())
  ));
