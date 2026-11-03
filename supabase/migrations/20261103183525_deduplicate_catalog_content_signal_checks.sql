-- Evaluate each content signal once per approved course.
-- Preserves the existing SQL function signature and SECURITY DEFINER semantics.
CREATE OR REPLACE FUNCTION public.get_catalog_content_signals()
RETURNS TABLE(materia_id uuid, has_questions boolean, has_summary boolean, has_resources boolean, has_shared_material boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  WITH signals AS MATERIALIZED (
    SELECT m.id AS materia_id,
      EXISTS(SELECT 1 FROM public.preguntas_banco_public p WHERE p.materia_id = m.id) AS has_questions,
      EXISTS(SELECT 1 FROM public.resumenes s WHERE s.materia_id = m.id) AS has_summary,
      EXISTS(SELECT 1 FROM public.recursos r WHERE r.materia_id = m.id::text) AS has_resources,
      EXISTS(
        SELECT 1 FROM public.student_materials sm
        WHERE sm.materia_id = m.id AND sm.visibility = 'shared'
          AND sm.processing_status = 'ready'
      ) AS has_shared_material
    FROM public.materias m
    WHERE m.approval_status = 'approved'
  )
  SELECT s.materia_id, s.has_questions, s.has_summary, s.has_resources, s.has_shared_material
  FROM signals s
  WHERE s.has_questions OR s.has_summary OR s.has_resources OR s.has_shared_material;
$function$;
