-- The catalog change and its audit record must succeed or roll back together.
-- This private service-role RPC replaces the UI's separate mutation + audit INSERT.
CREATE OR REPLACE FUNCTION public.admin_management_resolve_catalog_v1(
  p_actor uuid, p_kind text, p_id uuid, p_decision text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO ''
AS $function$
DECLARE
  v_current text;
  v_next text;
  v_final text;
  v_owner uuid;
  v_faculty_id uuid;
  v_faculty_owner uuid;
  v_faculty_status text;
  v_parent_career uuid;
  v_parent_status text;
  v_now timestamptz := now();
BEGIN
  IF coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  ) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service_role required' USING errcode = '42501';
  END IF;
  IF p_actor IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = p_actor AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'administrator required' USING errcode = '42501';
  END IF;
  IF p_id IS NULL OR p_kind NOT IN ('university','career','subject')
    OR p_decision NOT IN ('approve','reject') THEN
    RAISE EXCEPTION 'invalid catalog action' USING errcode = '22023';
  END IF;
  v_next := CASE WHEN p_decision = 'approve' THEN 'approved' ELSE 'rejected' END;

  IF p_kind = 'university' THEN
    SELECT status INTO v_current
      FROM public.university_requests WHERE id = p_id FOR UPDATE;
    IF NOT FOUND OR v_current IS DISTINCT FROM 'pending' THEN
      RAISE EXCEPTION 'university request is no longer pending' USING errcode = '40001';
    END IF;
    PERFORM public.resolve_university_request(p_id, p_decision, p_actor);
    v_final := CASE WHEN p_decision = 'approve' THEN 'added' ELSE 'rejected' END;
  ELSIF p_kind = 'career' THEN
    SELECT approval_status, facultad_id, owner_user_id
      INTO v_current, v_faculty_id, v_owner
      FROM public.carreras WHERE id = p_id FOR UPDATE;
    IF NOT FOUND OR v_current IS DISTINCT FROM 'pending' THEN
      RAISE EXCEPTION 'career is no longer pending' USING errcode = '40001';
    END IF;
    IF v_faculty_id IS NOT NULL THEN
      SELECT approval_status, owner_user_id
        INTO v_faculty_status, v_faculty_owner
        FROM public.facultades WHERE id = v_faculty_id FOR UPDATE;
      IF v_faculty_status = 'pending'
         AND v_faculty_owner IS NOT DISTINCT FROM v_owner THEN
        UPDATE public.facultades
           SET approval_status = v_next,
               approved_at = CASE WHEN p_decision = 'approve' THEN v_now ELSE NULL END,
               approved_by = CASE WHEN p_decision = 'approve' THEN p_actor ELSE NULL END,
               owner_user_id = CASE WHEN p_decision = 'approve' THEN NULL ELSE v_faculty_owner END
         WHERE id = v_faculty_id AND approval_status = 'pending';
      END IF;
    END IF;
    UPDATE public.carreras
       SET approval_status = v_next,
           approved_at = CASE WHEN p_decision = 'approve' THEN v_now ELSE NULL END,
           approved_by = CASE WHEN p_decision = 'approve' THEN p_actor ELSE NULL END,
           owner_user_id = CASE WHEN p_decision = 'approve' THEN NULL ELSE v_owner END
     WHERE id = p_id AND approval_status = 'pending';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'career concurrently updated' USING errcode = '40001';
    END IF;
    v_final := v_next;
  ELSE
    SELECT approval_status, carrera_id, owner_user_id
      INTO v_current, v_parent_career, v_owner
      FROM public.materias WHERE id = p_id FOR UPDATE;
    IF NOT FOUND OR v_current IS DISTINCT FROM 'pending' THEN
      RAISE EXCEPTION 'subject is no longer pending' USING errcode = '40001';
    END IF;
    SELECT approval_status INTO v_parent_status
      FROM public.carreras WHERE id = v_parent_career;
    IF p_decision = 'approve' AND v_parent_status IS DISTINCT FROM 'approved' THEN
      RAISE EXCEPTION 'approve the career first' USING errcode = '23514';
    END IF;
    UPDATE public.materias
       SET approval_status = v_next,
           approved_at = CASE WHEN p_decision = 'approve' THEN v_now ELSE NULL END,
           approved_by = CASE WHEN p_decision = 'approve' THEN p_actor ELSE NULL END,
           owner_user_id = CASE WHEN p_decision = 'approve' THEN NULL ELSE v_owner END
     WHERE id = p_id AND approval_status = 'pending';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'subject concurrently updated' USING errcode = '40001';
    END IF;
    UPDATE public.carrera_materias
       SET approval_status = v_next,
           approved_at = CASE WHEN p_decision = 'approve' THEN v_now ELSE NULL END,
           approved_by = CASE WHEN p_decision = 'approve' THEN p_actor ELSE NULL END,
           owner_user_id = CASE WHEN p_decision = 'approve' THEN NULL ELSE v_owner END
     WHERE materia_id = p_id AND carrera_id = v_parent_career AND approval_status = 'pending';
    v_final := v_next;
  END IF;

  INSERT INTO public.admin_management_audit(
    actor_id, action, object_type, object_id, before_state, after_state, result
  ) VALUES (
    p_actor, CASE WHEN p_decision = 'approve' THEN 'catalog_approved' ELSE 'catalog_rejected' END,
    p_kind, p_id::text,
    jsonb_build_object('status', v_current),
    jsonb_build_object('status', v_final), 'success'
  );
  -- An audit INSERT failure rolls back all catalog changes in this RPC.
  RETURN jsonb_build_object('status', v_final, 'audited', true);
END
$function$;

REVOKE ALL ON FUNCTION public.admin_management_resolve_catalog_v1(uuid,text,uuid,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_management_resolve_catalog_v1(uuid,text,uuid,text)
  TO service_role;
