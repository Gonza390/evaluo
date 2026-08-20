-- Alinear el RLS de student_material_chunks con student_material_summaries:
-- permitir lectura de chunks de materiales compartidos (no solo del dueño/admin).
-- Antes, un material compartido exponía su resumen/glosario pero no sus chunks,
-- lo que era inconsistente y rompía la trazabilidad de fuentes para lectores.

drop policy if exists student_material_chunks_select_own_or_admin on public.student_material_chunks;

create policy student_material_chunks_select_visible_or_own
on public.student_material_chunks
for select
using (
  exists (
    select 1
    from public.student_materials sm
    where sm.id = student_material_id
      and (
        sm.visibility = 'shared'
        or sm.user_id = auth.uid()
        or public.current_user_is_admin()
      )
  )
);

-- La escritura sigue siendo exclusiva de admin (los chunks los genera el pipeline).
drop policy if exists student_material_chunks_write_admin_only on public.student_material_chunks;
create policy student_material_chunks_write_admin_only
on public.student_material_chunks
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());