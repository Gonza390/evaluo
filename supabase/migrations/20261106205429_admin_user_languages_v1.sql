-- Aggregate only; this function never exposes student profiles or identifiers.
CREATE OR REPLACE FUNCTION public.admin_user_languages_v1(p_from date, p_to date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_today date := (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
  v_start timestamptz;
  v_end timestamptz;
  v_result jsonb;
BEGIN
  IF coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  ) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service_role only' USING errcode = '42501';
  END IF;
  IF p_from IS NULL OR p_to IS NULL OR p_to > v_today OR p_to < v_today - 90
     OR p_from > p_to OR p_from < p_to - 29 THEN
    RAISE EXCEPTION 'invalid language metrics range' USING errcode = '22023';
  END IF;
  v_start := (p_from::timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires');
  v_end := ((p_to + 1)::timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires');

  WITH students AS MATERIALIZED (
    SELECT u.id, u.created_at,
      CASE
        WHEN u.raw_user_meta_data ->> 'ui_locale' IN ('en', 'es')
          THEN u.raw_user_meta_data ->> 'ui_locale'
        ELSE 'unknown'
      END AS language
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE coalesce(p.role, 'student') <> 'admin' AND u.created_at < v_end
  ),
  active AS MATERIALIZED (
    SELECT DISTINCT e.user_id
    FROM public.analytics_events e
    JOIN students u ON u.id = e.user_id
    WHERE e.created_at >= v_start AND e.created_at < v_end
  ),
  studying AS MATERIALIZED (
    SELECT DISTINCT s.user_id
    FROM public.admin_study_days_v1(v_start, v_end) s
    JOIN students u ON u.id = s.user_id
  ),
  aggregated AS (
    SELECT s.language,
      count(*)::bigint AS registered,
      count(*) FILTER (WHERE s.created_at >= v_start)::bigint AS new_users,
      count(*) FILTER (WHERE a.user_id IS NOT NULL)::bigint AS active_users,
      count(*) FILTER (WHERE st.user_id IS NOT NULL)::bigint AS studied_users
    FROM students s
    LEFT JOIN active a ON a.user_id = s.id
    LEFT JOIN studying st ON st.user_id = s.id
    GROUP BY s.language
  ),
  categories AS (
    SELECT c.lang AS language, coalesce(a.registered, 0)::bigint AS registered,
      coalesce(a.new_users, 0)::bigint AS new_users,
      coalesce(a.active_users, 0)::bigint AS active_users,
      coalesce(a.studied_users, 0)::bigint AS studied_users,
      c.sort
    FROM (VALUES ('es', 1), ('en', 2), ('unknown', 3)) AS c(lang, sort)
    LEFT JOIN aggregated a ON a.language = c.lang
  )
  SELECT jsonb_build_object(
    'from', p_from, 'to', p_to, 'source', 'current_account_ui_locale',
    'categories', coalesce(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'language', language, 'registered', registered, 'new_users', new_users,
          'active_users', active_users, 'studied_users', studied_users
        ) ORDER BY sort
      ) FROM categories), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END;
$function$;
REVOKE ALL ON FUNCTION public.admin_user_languages_v1(date, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_user_languages_v1(date, date) TO service_role;
