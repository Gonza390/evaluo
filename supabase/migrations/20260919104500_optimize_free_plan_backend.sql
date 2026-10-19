-- Free-plan efficiency: reduce hot-query work and avoid per-row RLS auth evaluation.

create index if not exists idx_preguntas_banco_public_materia_parcial_created
  on public.preguntas_banco (materia_id, parcial, creado_at desc)
  where es_demo = false;

create index if not exists idx_student_materials_reused_from_material_id
  on public.student_materials (reused_from_material_id)
  where reused_from_material_id is not null;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin', false)
    or exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and role = 'admin'
    );
$$;

create or replace function public.get_public_preguntero_catalog()
returns table (
  universidad_id uuid,
  universidad_nombre text,
  carrera_id uuid,
  carrera_nombre text,
  materia_id uuid,
  materia_nombre text,
  question_count bigint,
  parciales bigint[]
)
language sql
stable
security definer
set search_path = public
as $$
  with approved_links as (
    select cm.carrera_id, cm.materia_id
    from public.carrera_materias cm
    where cm.approval_status = 'approved'
      and cm.carrera_id is not null
      and cm.materia_id is not null
  ),
  question_stats as (
    select
      p.materia_id,
      count(*)::bigint as question_count,
      array_agg(distinct p.parcial order by p.parcial)
        filter (where p.parcial is not null) as parciales
    from public.preguntas_banco_public p
    where p.materia_id is not null
    group by p.materia_id
  )
  select
    u.id,
    u.nombre,
    c.id,
    c.nombre,
    m.id,
    m.nombre,
    qs.question_count,
    coalesce(qs.parciales, array[]::bigint[])
  from approved_links l
  join public.carreras c
    on c.id = l.carrera_id
   and c.approval_status = 'approved'
  join public.universidades u
    on u.id = c.universidad_id
   and u.approval_status = 'approved'
  join public.materias m
    on m.id = l.materia_id
   and m.approval_status = 'approved'
  join question_stats qs
    on qs.materia_id = m.id;
$$;

grant execute on function public.get_public_preguntero_catalog()
  to anon, authenticated, service_role;

alter policy materias_read_approved_or_own_pending
on public.materias
using (
  approval_status = 'approved'
  or owner_user_id = (select auth.uid())
  or (select public.current_user_is_admin())
);

drop policy if exists materias_write_admin_only on public.materias;
drop policy if exists materias_insert_admin_only on public.materias;
drop policy if exists materias_update_admin_only on public.materias;
drop policy if exists materias_delete_admin_only on public.materias;

create policy materias_insert_admin_only
on public.materias
for insert
to public
with check ((select public.current_user_is_admin()));

create policy materias_update_admin_only
on public.materias
for update
to public
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

create policy materias_delete_admin_only
on public.materias
for delete
to public
using ((select public.current_user_is_admin()));

alter policy preguntas_banco_read_admin_only
on public.preguntas_banco
using ((select public.current_user_is_admin()));

drop policy if exists preguntas_banco_write_admin_only on public.preguntas_banco;
drop policy if exists preguntas_banco_insert_admin_only on public.preguntas_banco;
drop policy if exists preguntas_banco_update_admin_only on public.preguntas_banco;
drop policy if exists preguntas_banco_delete_admin_only on public.preguntas_banco;

create policy preguntas_banco_insert_admin_only
on public.preguntas_banco
for insert
to public
with check ((select public.current_user_is_admin()));

create policy preguntas_banco_update_admin_only
on public.preguntas_banco
for update
to public
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

create policy preguntas_banco_delete_admin_only
on public.preguntas_banco
for delete
to public
using ((select public.current_user_is_admin()));

drop policy if exists recursos_write_admin_only on public.recursos;
drop policy if exists recursos_insert_admin_only on public.recursos;
drop policy if exists recursos_update_admin_only on public.recursos;
drop policy if exists recursos_delete_admin_only on public.recursos;

create policy recursos_insert_admin_only
on public.recursos
for insert
to public
with check ((select public.current_user_is_admin()));

create policy recursos_update_admin_only
on public.recursos
for update
to public
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

create policy recursos_delete_admin_only
on public.recursos
for delete
to public
using ((select public.current_user_is_admin()));

drop policy if exists resumenes_write_admin_only on public.resumenes;
drop policy if exists resumenes_insert_admin_only on public.resumenes;
drop policy if exists resumenes_update_admin_only on public.resumenes;
drop policy if exists resumenes_delete_admin_only on public.resumenes;

create policy resumenes_insert_admin_only
on public.resumenes
for insert
to public
with check ((select public.current_user_is_admin()));

create policy resumenes_update_admin_only
on public.resumenes
for update
to public
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

create policy resumenes_delete_admin_only
on public.resumenes
for delete
to public
using ((select public.current_user_is_admin()));

alter policy student_materials_select_visible_or_own
on public.student_materials
using (
  visibility = 'shared'
  or (select auth.uid()) = user_id
  or (select public.current_user_is_admin())
);

alter policy student_materials_insert_own_or_admin
on public.student_materials
with check (
  (select auth.uid()) = user_id
  or (select public.current_user_is_admin())
);

alter policy student_materials_update_own_or_admin
on public.student_materials
using (
  (select auth.uid()) = user_id
  or (select public.current_user_is_admin())
)
with check (
  (select auth.uid()) = user_id
  or (select public.current_user_is_admin())
);

alter policy student_materials_delete_own_or_admin
on public.student_materials
using (
  (select auth.uid()) = user_id
  or (select public.current_user_is_admin())
);

alter policy study_errors_select_own
on public.study_errors
using (
  (select auth.uid()) = user_id
  or (select public.current_user_is_admin())
);

drop policy if exists study_errors_admin_all on public.study_errors;
drop policy if exists study_errors_insert_admin_only on public.study_errors;
drop policy if exists study_errors_update_admin_only on public.study_errors;
drop policy if exists study_errors_delete_admin_only on public.study_errors;

create policy study_errors_insert_admin_only
on public.study_errors
for insert
to public
with check ((select public.current_user_is_admin()));

create policy study_errors_update_admin_only
on public.study_errors
for update
to public
using ((select public.current_user_is_admin()))
with check ((select public.current_user_is_admin()));

create policy study_errors_delete_admin_only
on public.study_errors
for delete
to public
using ((select public.current_user_is_admin()));
