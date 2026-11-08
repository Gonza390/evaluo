-- Índices para las 23 claves foráneas sin índice (advisor unindexed_foreign_keys,
-- plan de performance 08/11, punto 5). Generados desde pg_constraint en producción.
--
-- Sin ellos, borrar un apunte (student_materials) o un usuario obliga a recorrer
-- entera cada tabla hija para resolver el ON DELETE. Todas las tablas pesan menos
-- de 1 MB: CREATE INDEX toma milisegundos y no hace falta CONCURRENTLY.
-- No cambia resultados de ninguna consulta.

begin;

-- Hijas de student_materials (material_id): las que pesan al borrar un apunte.
create index if not exists idx_fk_practice_mode_sessions_material_id
  on public.practice_mode_sessions (material_id);
create index if not exists idx_fk_student_material_answer_events_material_id
  on public.student_material_answer_events (material_id);
create index if not exists idx_fk_student_material_topic_activity_progress_material_id
  on public.student_material_topic_activity_progress (material_id);
create index if not exists idx_fk_student_personal_study_plan_practice_progress_material_i
  on public.student_personal_study_plan_practice_progress (material_id);
create index if not exists idx_fk_study_calendar_events_material_id
  on public.study_calendar_events (material_id);
create index if not exists idx_fk_study_next_objectives_material_id
  on public.study_next_objectives (material_id);
create index if not exists idx_fk_study_return_reminders_material_id
  on public.study_return_reminders (material_id);
create index if not exists idx_fk_free_study_v2_banks_material_id
  on public.free_study_v2_banks (material_id);
create index if not exists idx_fk_email_reminder_deliveries_material_id
  on public.email_reminder_deliveries (material_id);

-- Envíos de emails.
create index if not exists idx_fk_email_reminder_deliveries_materia_id
  on public.email_reminder_deliveries (materia_id);
create index if not exists idx_fk_email_campaign_deliveries_materia_id
  on public.email_campaign_deliveries (materia_id);
create index if not exists idx_fk_email_campaign_deliveries_user_id
  on public.email_campaign_deliveries (user_id);

-- Catálogo: aprobación y dueño (al borrar un usuario o un admin).
create index if not exists idx_fk_carrera_materias_approved_by
  on public.carrera_materias (approved_by);
create index if not exists idx_fk_carrera_materias_owner_user_id
  on public.carrera_materias (owner_user_id);
create index if not exists idx_fk_carreras_approved_by
  on public.carreras (approved_by);
create index if not exists idx_fk_carreras_owner_user_id
  on public.carreras (owner_user_id);
create index if not exists idx_fk_facultades_approved_by
  on public.facultades (approved_by);
create index if not exists idx_fk_facultades_owner_user_id
  on public.facultades (owner_user_id);
create index if not exists idx_fk_materias_approved_by
  on public.materias (approved_by);
create index if not exists idx_fk_materias_owner_user_id
  on public.materias (owner_user_id);
create index if not exists idx_fk_universidades_owner_user_id
  on public.universidades (owner_user_id);

-- Auditoría del panel de administración.
create index if not exists idx_fk_admin_management_audit_actor_id
  on public.admin_management_audit (actor_id);
create index if not exists idx_fk_admin_management_feedback_triage_updated_by
  on public.admin_management_feedback_triage (updated_by);

commit;
