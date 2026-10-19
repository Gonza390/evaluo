-- Track daily AI query usage per user for free-tier daily limits.
-- Premium users bypass this limit; the application layer handles that check.

CREATE TABLE IF NOT EXISTS ai_daily_usage (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE DEFAULT CURRENT_DATE,
  query_count INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, usage_date)
);

-- RLS: el usuario solo puede leer su consumo. Las escrituras quedan reservadas
-- al service role para impedir que un cliente reinicie o reduzca su contador.
ALTER TABLE ai_daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own AI usage"
  ON ai_daily_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Atomic RPC for safe concurrent increments (bypasses RLS via SECURITY DEFINER).
-- Returns the new query_count after increment.
CREATE OR REPLACE FUNCTION public.increment_ai_daily_usage(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO public.ai_daily_usage (user_id, usage_date, query_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET query_count = ai_daily_usage.query_count + 1;

  SELECT query_count INTO new_count
  FROM public.ai_daily_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

  RETURN COALESCE(new_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.increment_ai_daily_usage(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_ai_daily_usage(UUID) TO service_role;

-- Index for fast lookups by user + date.
CREATE INDEX IF NOT EXISTS idx_ai_daily_usage_user_date
  ON ai_daily_usage (user_id, usage_date);
