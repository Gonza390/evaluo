-- Performance de RLS (plan de performance 08/11, puntos 2 y 3).
--
-- No cambia qué filas ve o escribe cada rol. Solo:
--   A. Consolida políticas permisivas duplicadas: Postgres evaluaba todas las
--      políticas de una misma acción y las unía con OR.
--   B. Envuelve auth.uid(), auth.jwt(), auth.role() y current_user_is_admin()
--      en (select ...) para que se evalúen una vez por consulta (initPlan) y
--      no una vez por fila.
--
-- Advisors esperados después: auth_rls_initplan = 0 y
-- multiple_permissive_policies = 0 en public.

begin;

-- ---------------------------------------------------------------------------
-- A1. "admin para todo" (FOR ALL) + lectura propia/pública (FOR SELECT):
--     la política ALL se parte en INSERT/UPDATE/DELETE con el mismo predicado.
--     El SELECT de admin ya está incluido en la política de lectura de cada
--     tabla (o se agrega en A3), así que no se pierde ningún acceso.
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
  admin_expr constant text := '(select public.current_user_is_admin())';
begin
  for r in
    select * from (values
      ('carrera_materias',               'carrera_materias_write_admin_only',               'public'),
      ('carreras',                       'carreras_write_admin_only',                       'public'),
      ('facultades',                     'facultades_write_admin_only',                     'public'),
      ('universidades',                  'universidades_write_admin_only',                  'public'),
      ('chunk_quality_log',              'chunk_quality_log_write_admin_only',              'public'),
      ('explanations_history',           'explanations_history_admin_all',                  'public'),
      ('simulator_question_topic_links', 'simulator_question_topic_links_admin_write',      'public'),
      ('simulator_subtopics',            'simulator_subtopics_admin_write',                 'public'),
      ('simulator_topics',               'simulator_topics_admin_write',                    'public'),
      ('user_subscriptions',             'user_subscriptions_write_admin',                  'public'),
      ('student_material_ai_usage',      'student_material_ai_usage_write_admin_only',      'public'),
      ('student_material_chunks',        'student_material_chunks_write_admin_only',        'public'),
      ('student_material_glossaries',    'student_material_glossaries_write_admin_only',    'public'),
      ('student_material_summaries',     'student_material_summaries_write_admin_only',     'public'),
      ('student_material_jobs',          'student_material_jobs_write_admin_only',          'public'),
      -- Estas dos repetían en línea el cuerpo de current_user_is_admin().
      ('premium_question_sets',          'premium_sets_write_admin',                        'authenticated'),
      ('premium_questions',              'premium_questions_write_admin',                   'authenticated')
    ) as t(tbl, pol, roles)
  loop
    execute format('drop policy %I on public.%I', r.pol, r.tbl);
    execute format('create policy %I on public.%I for insert to %s with check (%s)',
      r.tbl || '_insert_admin', r.tbl, r.roles, admin_expr);
    execute format('create policy %I on public.%I for update to %s using (%s) with check (%s)',
      r.tbl || '_update_admin', r.tbl, r.roles, admin_expr, admin_expr);
    execute format('create policy %I on public.%I for delete to %s using (%s)',
      r.tbl || '_delete_admin', r.tbl, r.roles, admin_expr);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- A2. Políticas de lectura que repetían exactamente otra política FOR ALL.
-- ---------------------------------------------------------------------------
-- "Users manage own rating" (ALL) ya tiene el mismo predicado.
drop policy "Users read own rating" on public.question_ratings;
-- La política *_write_admin (ALL, solo admin) ya cubre el SELECT de admin.
drop policy rag_document_chunks_read_admin_only on public.rag_document_chunks;
drop policy rag_explanations_cache_read_admin_only on public.rag_explanations_cache;
drop policy rag_question_stats_read_admin on public.rag_question_stats;
drop policy subscription_plans_read_admin on public.subscription_plans;

-- ---------------------------------------------------------------------------
-- A3. Lecturas separadas que se unen en una sola política.
-- ---------------------------------------------------------------------------
-- explanations_history: lectura propia + admin (antes venía de admin_all).
drop policy explanations_history_select_own on public.explanations_history;
create policy explanations_history_select_own_or_admin on public.explanations_history
  for select to public
  using ((select auth.uid()) = user_id or (select public.current_user_is_admin()));

-- student_material_feedback: autor del feedback o dueño del material.
drop policy student_material_feedback_select_own on public.student_material_feedback;
drop policy student_material_feedback_select_owner_material on public.student_material_feedback;
create policy student_material_feedback_select_own_or_material_owner
  on public.student_material_feedback
  for select to public
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1
      from public.student_materials sm
      where sm.id = student_material_feedback.student_material_id
        and sm.user_id = (select auth.uid())
    )
  );

-- user_notifications: admin_all (ALL) + write_own (ALL) + select_own (SELECT)
-- pasan a una política por acción: dueño o admin.
drop policy user_notifications_admin_all on public.user_notifications;
drop policy user_notifications_write_own on public.user_notifications;
drop policy user_notifications_select_own on public.user_notifications;
create policy user_notifications_select_own_or_admin on public.user_notifications
  for select to public
  using ((select auth.uid()) = user_id or (select public.current_user_is_admin()));
create policy user_notifications_insert_own_or_admin on public.user_notifications
  for insert to public
  with check ((select auth.uid()) = user_id or (select public.current_user_is_admin()));
create policy user_notifications_update_own_or_admin on public.user_notifications
  for update to public
  using ((select auth.uid()) = user_id or (select public.current_user_is_admin()))
  with check ((select auth.uid()) = user_id or (select public.current_user_is_admin()));
create policy user_notifications_delete_own_or_admin on public.user_notifications
  for delete to public
  using ((select auth.uid()) = user_id or (select public.current_user_is_admin()));

-- ---------------------------------------------------------------------------
-- B. initPlan: envolver las funciones de sesión en todas las políticas de
--    public. Trabaja sobre el texto que devuelve pg_policies, que Postgres
--    normaliza; las llamadas ya envueltas (precedidas por "SELECT ") no se tocan.
-- ---------------------------------------------------------------------------
create or replace function pg_temp.evaluo_wrap_rls_expr(expr text)
returns text
language sql
immutable
as $fn$
  select case when expr is null then null else
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            expr,
            '(?<!SELECT )(?<!SELECT \()(?<!SELECT \(\()auth\.uid\(\)',
            '( SELECT auth.uid() AS uid)', 'g'),
          '(?<!SELECT )current_user_is_admin\(\)',
          '( SELECT current_user_is_admin() AS current_user_is_admin)', 'g'),
        '(?<!SELECT )(?<!SELECT \()(?<!SELECT \(\()auth\.jwt\(\)',
        '( SELECT auth.jwt() AS jwt)', 'g'),
      '(?<!SELECT )auth\.role\(\)',
      '( SELECT auth.role() AS role)', 'g')
  end
$fn$;

do $$
declare
  p record;
  new_qual text;
  new_check text;
  stmt text;
begin
  for p in
    select tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
  loop
    new_qual := pg_temp.evaluo_wrap_rls_expr(p.qual);
    new_check := pg_temp.evaluo_wrap_rls_expr(p.with_check);

    if new_qual is distinct from p.qual or new_check is distinct from p.with_check then
      stmt := format('alter policy %I on public.%I', p.policyname, p.tablename);
      if new_qual is not null then
        stmt := stmt || format(' using (%s)', new_qual);
      end if;
      if new_check is not null then
        stmt := stmt || format(' with check (%s)', new_check);
      end if;
      execute stmt;
    end if;
  end loop;
end $$;

-- Verificación: si quedó alguna llamada sin envolver, la migración falla
-- entera y no cambia nada.
do $$
declare
  leftovers int;
begin
  select count(*) into leftovers
  from pg_policies
  where schemaname = 'public'
    and (
      coalesce(qual, '') || ' ' || coalesce(with_check, '')
    ) ~ '(?<!SELECT )(?<!SELECT \()(?<!SELECT \(\()auth\.(uid|jwt)\(\)|(?<!SELECT )(current_user_is_admin|auth\.role)\(\)';

  if leftovers > 0 then
    raise exception 'Quedaron % políticas con funciones de sesión sin envolver', leftovers;
  end if;
end $$;

commit;
