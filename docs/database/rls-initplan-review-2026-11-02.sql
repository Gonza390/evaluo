-- Evaluo | RLS initPlan optimization (reviewed 2026-11-02)
-- NOT APPLIED TO PRODUCTION. Database is shared by main and master.
-- Keep original roles, command types, and authorization predicates.
-- Validated in one PostgreSQL transaction followed by ROLLBACK:
-- authenticated test user 00000000-0000-0000-0000-000000000001
-- before/after counts: profiles=0; feedback=0; catalog=1398; jobs=0; notifications=0.
-- Before release: test real user, admin and anon for SELECT, INSERT, UPDATE, DELETE.
-- This is a review script, not a Supabase migration. Generate the migration using Supabase CLI.

BEGIN;

ALTER POLICY profiles_select_own_or_admin ON public.profiles
  USING (((SELECT auth.uid()) = id) OR (SELECT current_user_is_admin()));

ALTER POLICY profiles_insert_own_or_admin ON public.profiles
  WITH CHECK (((SELECT auth.uid()) = id) OR (SELECT current_user_is_admin()));

ALTER POLICY profiles_update_own_or_admin ON public.profiles
  USING (((SELECT auth.uid()) = id) OR (SELECT current_user_is_admin()))
  WITH CHECK (((SELECT auth.uid()) = id) OR (SELECT current_user_is_admin()));

ALTER POLICY student_material_feedback_delete_own ON public.student_material_feedback
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY student_material_feedback_insert_own ON public.student_material_feedback
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY student_material_feedback_select_own ON public.student_material_feedback
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY student_material_feedback_select_owner_material ON public.student_material_feedback
  USING (EXISTS (
    SELECT 1 FROM public.student_materials sm
    WHERE sm.id = student_material_feedback.student_material_id
      AND sm.user_id = (SELECT auth.uid())
  ));

ALTER POLICY student_material_feedback_update_own ON public.student_material_feedback
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY carrera_materias_read_approved_or_own_pending ON public.carrera_materias
  USING (
    approval_status = 'approved'::text
    OR owner_user_id = (SELECT auth.uid())
    OR (SELECT current_user_is_admin())
  );

ALTER POLICY student_material_jobs_select_own_or_admin ON public.student_material_jobs
  USING (EXISTS (
    SELECT 1 FROM public.student_materials sm
    WHERE sm.id = student_material_jobs.student_material_id
      AND (sm.user_id = (SELECT auth.uid()) OR (SELECT current_user_is_admin()))
  ));

ALTER POLICY user_notifications_select_own ON public.user_notifications
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY user_notifications_write_own ON public.user_notifications
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

COMMIT;
