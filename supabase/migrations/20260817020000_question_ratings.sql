-- API-01: Sistema de ratings (likes/dislikes) para preguntas del banco.
-- Solo backend: tabla + RLS + RPC. No incluye UI.

-- ============================================================
-- 1) TABLA question_ratings
-- ============================================================

CREATE TABLE IF NOT EXISTS public.question_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pregunta_id UUID NOT NULL REFERENCES public.preguntas_banco(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating IN (-1, 1)),  -- -1 = dislike, 1 = like
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (pregunta_id, user_id)
);

-- Índice para queries por pregunta (listar ratings de una pregunta)
CREATE INDEX IF NOT EXISTS idx_question_ratings_pregunta_id
  ON public.question_ratings (pregunta_id);

-- Índice para queries por usuario (verificar si ya votó)
CREATE INDEX IF NOT EXISTS idx_question_ratings_user_id
  ON public.question_ratings (user_id);

-- ============================================================
-- 2) ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.question_ratings ENABLE ROW LEVEL SECURITY;

-- El usuario puede leer su propia fila. Los agregados globales se exponen solo
-- mediante la RPC para no publicar la relación user_id/pregunta_id.
DROP POLICY IF EXISTS "Users read own rating" ON public.question_ratings;
CREATE POLICY "Users read own rating"
  ON public.question_ratings
  FOR SELECT
  USING (auth.uid() = user_id);

-- El usuario solo puede insertar/actualizar/eliminar su propio rating
DROP POLICY IF EXISTS "Users manage own rating" ON public.question_ratings;
CREATE POLICY "Users manage own rating"
  ON public.question_ratings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3) RPC: get_question_rating_summary
-- ============================================================
-- Retorna likes, dislikes y el rating del usuario actual para una pregunta.
-- SECURITY DEFINER para poder acceder a auth.uid() de forma confiable.
-- Reemplaza el parámetro p_user_id por auth.uid() interno (igual que
-- get_resource_vote_summaries post-hardening).

CREATE OR REPLACE FUNCTION public.get_question_rating_summary(
  p_pregunta_id UUID
)
RETURNS TABLE (
  likes BIGINT,
  dislikes BIGINT,
  user_rating SMALLINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    count(*) FILTER (WHERE r.rating = 1)  AS likes,
    count(*) FILTER (WHERE r.rating = -1) AS dislikes,
    COALESCE(
      max(CASE WHEN r.user_id = auth.uid() THEN r.rating END),
      0
    )::SMALLINT AS user_rating
  FROM public.question_ratings r
  WHERE r.pregunta_id = p_pregunta_id;
$$;

-- Permisos: cualquier usuario autenticado puede llamar la RPC.
-- Anon no puede (requiere auth.uid() para user_rating).
REVOKE ALL ON FUNCTION public.get_question_rating_summary(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_question_rating_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_question_rating_summary(UUID) TO service_role;
