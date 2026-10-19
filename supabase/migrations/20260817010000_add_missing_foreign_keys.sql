-- BD-02: agrega foreign keys faltantes sin usar la sintaxis inexistente
-- `ADD CONSTRAINT IF NOT EXISTS`.
--
-- Se crean NOT VALID: protegen escrituras nuevas inmediatamente y permiten
-- auditar/sanear datos históricos antes de validar cada constraint.

BEGIN;

DO $$
DECLARE
  fk record;
BEGIN
  FOR fk IN
    SELECT *
    FROM (
      VALUES
        ('public.profiles'::regclass, 'profiles_last_subject_id_fkey',
          'FOREIGN KEY (last_subject_id) REFERENCES public.materias(id) ON DELETE SET NULL'),
        ('public.materias'::regclass, 'materias_carrera_id_fkey',
          'FOREIGN KEY (carrera_id) REFERENCES public.carreras(id) ON DELETE SET NULL'),
        ('public.simulator_attempts'::regclass, 'simulator_attempts_user_id_fkey',
          'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE'),
        ('public.student_materials'::regclass, 'student_materials_user_id_fkey',
          'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE'),
        ('public.student_material_feedback'::regclass, 'student_material_feedback_user_id_fkey',
          'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE'),
        ('public.student_topic_performance'::regclass, 'student_topic_performance_user_id_fkey',
          'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE'),
        ('public.study_calendar_events'::regclass, 'study_calendar_events_user_id_fkey',
          'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE'),
        ('public.user_favorites'::regclass, 'user_favorites_user_id_fkey',
          'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE'),
        ('public.user_favorites'::regclass, 'user_favorites_carrera_id_fkey',
          'FOREIGN KEY (carrera_id) REFERENCES public.carreras(id) ON DELETE SET NULL'),
        ('public.user_notifications'::regclass, 'user_notifications_user_id_fkey',
          'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE'),
        ('public.user_subscriptions'::regclass, 'user_subscriptions_user_id_fkey',
          'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE'),
        ('public.explanations_history'::regclass, 'explanations_history_user_id_fkey',
          'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE'),
        ('public.resource_votes'::regclass, 'resource_votes_user_id_fkey',
          'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE'),
        ('public.resumen_votes'::regclass, 'resumen_votes_user_id_fkey',
          'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL'),
        ('public.rag_explanation_feedback'::regclass, 'rag_explanation_feedback_user_id_fkey',
          'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL'),
        ('public.question_edit_audit'::regclass, 'question_edit_audit_admin_user_id_fkey',
          'FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE SET NULL'),
        ('public.premium_question_sets'::regclass, 'premium_question_sets_created_by_fkey',
          'FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL'),
        ('public.resource_views'::regclass, 'resource_views_user_id_fkey',
          'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL'),
        ('public.analytics_events'::regclass, 'analytics_events_user_id_fkey',
          'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL'),
        ('public.analytics_events_archive'::regclass, 'analytics_events_archive_user_id_fkey',
          'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL')
    ) AS definitions(table_oid, constraint_name, definition)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_constraint constraint_row
      WHERE constraint_row.conrelid = fk.table_oid
        AND constraint_row.conname = fk.constraint_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE %s ADD CONSTRAINT %I %s NOT VALID',
        fk.table_oid,
        fk.constraint_name,
        fk.definition
      );
    END IF;
  END LOOP;
END;
$$;

-- No se agregan FKs sobre estas columnas legacy porque todavía son text
-- mientras los catálogos usan uuid: profiles.carrera_id,
-- profiles.universidad_id, recursos.{materia_id,carrera_id,universidad_id} e
-- historial_respuestas.materia_id. Convertirlas requiere una migración de
-- datos explícita, no un cast implícito durante este hardening.

COMMIT;
