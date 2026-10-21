-- Los enlaces de materiales compartidos sirven para descubrir el recurso,
-- pero el contenido de estudio solo se puede consultar tras iniciar sesion.
-- La metadata en public.student_materials sigue visible para los catalogos.
-- No alcanza con proteger la pagina: la Data API tambien necesita RLS.

drop policy if exists student_material_summaries_select_visible_or_own
  on public.student_material_summaries;
create policy student_material_summaries_select_visible_or_own
on public.student_material_summaries
for select
to authenticated
using (
  (select auth.uid()) is not null
  and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  and exists (
    select 1
    from public.student_materials sm
    where sm.id = student_material_id
      and (
        sm.visibility = 'shared'
        or sm.user_id = (select auth.uid())
        or public.current_user_is_admin()
      )
  )
);

drop policy if exists student_material_glossaries_select_visible_or_own
  on public.student_material_glossaries;
create policy student_material_glossaries_select_visible_or_own
on public.student_material_glossaries
for select
to authenticated
using (
  (select auth.uid()) is not null
  and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  and exists (
    select 1
    from public.student_materials sm
    where sm.id = student_material_id
      and (
        sm.visibility = 'shared'
        or sm.user_id = (select auth.uid())
        or public.current_user_is_admin()
      )
  )
);

drop policy if exists student_material_chunks_select_visible_or_own
  on public.student_material_chunks;
create policy student_material_chunks_select_visible_or_own
on public.student_material_chunks
for select
to authenticated
using (
  (select auth.uid()) is not null
  and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  and exists (
    select 1
    from public.student_materials sm
    where sm.id = student_material_id
      and (
        sm.visibility = 'shared'
        or sm.user_id = (select auth.uid())
        or public.current_user_is_admin()
      )
  )
);
