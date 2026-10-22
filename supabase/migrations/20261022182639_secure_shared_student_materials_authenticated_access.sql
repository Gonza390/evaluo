-- La UI exige login antes de abrir los materiales compartidos.
-- No otorgamos lectura a 'anon' ni a usuarios Auth anónimos.
-- Esta migración ya se aplicó en Supabase con este nombre/versión;
-- se versiona en Git para mantener el historial reproducible.
drop policy if exists student_materials_select_visible_or_own on public.student_materials;
create policy student_materials_select_visible_or_own
on public.student_materials
for select to authenticated
using (
  (select auth.uid()) is not null
  and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  and (
    visibility = 'shared'
    or user_id = (select auth.uid())
    or (select public.current_user_is_admin())
  )
);

drop policy if exists student_material_ai_usage_select_visible_or_own on public.student_material_ai_usage;
create policy student_material_ai_usage_select_visible_or_own
on public.student_material_ai_usage
for select to authenticated
using (
  (select auth.uid()) is not null
  and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  and exists (
    select 1 from public.student_materials sm
    where sm.id = student_material_ai_usage.student_material_id
      and (
        sm.visibility = 'shared'
        or sm.user_id = (select auth.uid())
        or (select public.current_user_is_admin())
      )
  )
);
