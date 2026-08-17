-- La migración que agregó premium_pregunta_id mantuvo pregunta_id NOT NULL,
-- impidiendo persistir errores de preguntas premium. Permitir una única fuente.

ALTER TABLE public.simulator_attempt_wrong_questions
  ALTER COLUMN pregunta_id DROP NOT NULL;

ALTER TABLE public.simulator_attempt_wrong_questions
  DROP CONSTRAINT IF EXISTS simulator_attempt_wrong_questions_pregunta_source_chk;

ALTER TABLE public.simulator_attempt_wrong_questions
  ADD CONSTRAINT simulator_attempt_wrong_questions_pregunta_source_chk
  CHECK ((pregunta_id IS NOT NULL) <> (premium_pregunta_id IS NOT NULL));
