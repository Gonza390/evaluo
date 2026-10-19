-- Evaluo - índices para foreign keys
-- Fecha: 2026-08-25
--
-- Ejecutar DESPUÉS del hardening de seguridad.
-- Estos índices no cambian datos ni permisos; reducen scans en joins/cascadas de FK.
--
-- Nota especial:
-- idx_materias_carrera_id existe en producción pero está indisvalid=false.
-- Se reconstruye explícitamente.

set lock_timeout = '5s';
set statement_timeout = '0';

drop index if exists public.idx_materias_carrera_id;
create index idx_materias_carrera_id
  on public.materias (carrera_id);

create index if not exists idx_fk_analytics_events_archive_user_id
  on public.analytics_events_archive (user_id);

create index if not exists idx_fk_carrera_materias_materia_id
  on public.carrera_materias (materia_id);

create index if not exists idx_fk_explanations_history_materia_id
  on public.explanations_history (materia_id);

create index if not exists idx_fk_historial_respuestas_pregunta_id
  on public.historial_respuestas (pregunta_id);

create index if not exists idx_fk_materiales_materia_id
  on public.materiales (materia_id);

create index if not exists idx_fk_payment_checkout_attempts_plan_id
  on public.payment_checkout_attempts (plan_id);

create index if not exists idx_fk_payment_checkout_attempts_promotion_claim_id
  on public.payment_checkout_attempts (promotion_claim_id);

create index if not exists idx_fk_payment_transactions_subscription_id
  on public.payment_transactions (subscription_id);

create index if not exists idx_fk_preguntas_banco_material_id
  on public.preguntas_banco (material_id);

create index if not exists idx_fk_premium_question_sets_created_by
  on public.premium_question_sets (created_by);

create index if not exists idx_fk_profiles_last_subject_id
  on public.profiles (last_subject_id);

create index if not exists idx_fk_question_edit_audit_admin_user_id
  on public.question_edit_audit (admin_user_id);

create index if not exists idx_fk_question_edit_audit_pregunta_id
  on public.question_edit_audit (pregunta_id);

create index if not exists idx_fk_rag_explanation_feedback_user_id
  on public.rag_explanation_feedback (user_id);

create index if not exists idx_fk_rag_generation_logs_materia_id
  on public.rag_generation_logs (materia_id);

create index if not exists idx_fk_rag_generation_logs_pregunta_id
  on public.rag_generation_logs (pregunta_id);

create index if not exists idx_fk_rag_question_stats_materia_id
  on public.rag_question_stats (materia_id);

create index if not exists idx_fk_resource_views_user_id
  on public.resource_views (user_id);

create index if not exists idx_fk_resumen_votes_resumen_id
  on public.resumen_votes (resumen_id);

create index if not exists idx_fk_sim_attempt_topic_events_materia_id
  on public.simulator_attempt_topic_events (materia_id);

create index if not exists idx_fk_sim_attempt_topic_events_pregunta_id
  on public.simulator_attempt_topic_events (pregunta_id);

create index if not exists idx_fk_sim_attempt_topic_events_subtopic_id
  on public.simulator_attempt_topic_events (subtopic_id);

create index if not exists idx_fk_sim_attempt_topic_events_topic_id
  on public.simulator_attempt_topic_events (topic_id);

create index if not exists idx_fk_sim_attempt_topic_events_user_id
  on public.simulator_attempt_topic_events (user_id);

create index if not exists idx_fk_sim_wrong_questions_materia_id
  on public.simulator_attempt_wrong_questions (materia_id);

create index if not exists idx_fk_sim_wrong_questions_pregunta_id
  on public.simulator_attempt_wrong_questions (pregunta_id);

create index if not exists idx_fk_sim_wrong_questions_user_id
  on public.simulator_attempt_wrong_questions (user_id);

create index if not exists idx_fk_simulator_attempts_materia_id
  on public.simulator_attempts (materia_id);

create index if not exists idx_fk_sim_question_topic_links_subtopic_id
  on public.simulator_question_topic_links (subtopic_id);

create index if not exists idx_fk_sim_question_topic_links_topic_id
  on public.simulator_question_topic_links (topic_id);

create index if not exists idx_fk_student_materials_universidad_id
  on public.student_materials (universidad_id);

create index if not exists idx_fk_student_topic_performance_materia_id
  on public.student_topic_performance (materia_id);

create index if not exists idx_fk_student_topic_performance_subtopic_id
  on public.student_topic_performance (subtopic_id);

create index if not exists idx_fk_student_topic_performance_topic_id
  on public.student_topic_performance (topic_id);

create index if not exists idx_fk_university_requests_approved_career_id
  on public.university_requests (approved_career_id);

create index if not exists idx_fk_university_requests_approved_university_id
  on public.university_requests (approved_university_id);

create index if not exists idx_fk_university_requests_reviewed_by
  on public.university_requests (reviewed_by);

create index if not exists idx_fk_user_notifications_event_id
  on public.user_notifications (event_id);

create index if not exists idx_fk_user_subscriptions_plan_id
  on public.user_subscriptions (plan_id);
