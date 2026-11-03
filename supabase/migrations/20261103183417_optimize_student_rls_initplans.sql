-- Alinea RLS de las rutas de estudio con initplans de Supabase.
-- No modifica roles ni permisos: solo evita recalcular auth.uid() y el rol admin por fila.
ALTER POLICY profiles_select_own_or_admin ON public.profiles USING ((SELECT auth.uid()) = id OR (SELECT public.current_user_is_admin()));
ALTER POLICY profiles_insert_own_or_admin ON public.profiles WITH CHECK ((SELECT auth.uid()) = id OR (SELECT public.current_user_is_admin()));
ALTER POLICY profiles_update_own_or_admin ON public.profiles USING ((SELECT auth.uid()) = id OR (SELECT public.current_user_is_admin())) WITH CHECK ((SELECT auth.uid()) = id OR (SELECT public.current_user_is_admin()));
ALTER POLICY historial_respuestas_select_own_or_admin ON public.historial_respuestas USING (usuario_id = (SELECT auth.uid()) OR (SELECT public.current_user_is_admin()));
ALTER POLICY student_material_flashcard_progress_insert_own ON public.student_material_flashcard_progress WITH CHECK ((SELECT auth.uid()) = user_id);
ALTER POLICY student_material_flashcard_progress_select_own ON public.student_material_flashcard_progress USING ((SELECT auth.uid()) = user_id);
ALTER POLICY student_material_flashcard_progress_update_own ON public.student_material_flashcard_progress USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
ALTER POLICY student_material_flashcard_progress_delete_own ON public.student_material_flashcard_progress USING ((SELECT auth.uid()) = user_id);
ALTER POLICY student_material_feedback_insert_own ON public.student_material_feedback WITH CHECK ((SELECT auth.uid()) = user_id);
ALTER POLICY student_material_feedback_delete_own ON public.student_material_feedback USING ((SELECT auth.uid()) = user_id);
ALTER POLICY student_material_feedback_update_own ON public.student_material_feedback USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
ALTER POLICY student_material_feedback_select_own ON public.student_material_feedback USING ((SELECT auth.uid()) = user_id);
ALTER POLICY student_material_feedback_select_owner_material ON public.student_material_feedback USING (EXISTS (SELECT 1 FROM public.student_materials sm WHERE sm.id = student_material_feedback.student_material_id AND sm.user_id = (SELECT auth.uid())));
ALTER POLICY student_topic_performance_insert_own_or_admin ON public.student_topic_performance WITH CHECK ((SELECT auth.uid()) = user_id OR (SELECT public.current_user_is_admin()));
ALTER POLICY student_topic_performance_select_own_or_admin ON public.student_topic_performance USING ((SELECT auth.uid()) = user_id OR (SELECT public.current_user_is_admin()));
ALTER POLICY student_topic_performance_update_own_or_admin ON public.student_topic_performance USING ((SELECT auth.uid()) = user_id OR (SELECT public.current_user_is_admin())) WITH CHECK ((SELECT auth.uid()) = user_id OR (SELECT public.current_user_is_admin()));
