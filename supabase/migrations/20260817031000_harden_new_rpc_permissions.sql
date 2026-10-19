-- Supabase puede conceder EXECUTE explícito a roles API al crear funciones.
-- Revocar cada rol evita depender únicamente del privilegio heredado PUBLIC.

REVOKE ALL ON FUNCTION public.increment_ai_daily_usage(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_ai_daily_usage(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.increment_ai_daily_usage(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ai_daily_usage(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.get_question_rating_summary(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_question_rating_summary(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_question_rating_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_question_rating_summary(UUID) TO service_role;
