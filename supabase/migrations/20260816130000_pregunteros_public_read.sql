-- Lectura pública del banco completo de pregunteros (sin respuesta_correcta).
-- Replica el patrón sanitario de demo_questions: una vista que expone solo
-- columnas no sensibles del banco (id, materia_id, parcial, enunciado, opciones
-- y creado_at para ordenar). NUNCA expone respuesta_correcta.
--
-- Bypass de RLS para anon: la vista se crea en la migración con owner con
-- BYPASSRLS y no declara security_invoker, por lo que las lecturas de anon se
-- evalúan con los privilegios del owner y no con la policy admin-only de
-- preguntas_banco (mismo mecanismo que demo_questions).
create or replace view public.preguntas_banco_public as
select
  pb.id,
  pb.materia_id,
  pb.parcial,
  pb.enunciado,
  pb.opciones,
  pb.creado_at
from public.preguntas_banco pb
where pb.es_demo = false;

revoke all on public.preguntas_banco_public from anon, authenticated;
grant select on public.preguntas_banco_public to anon, authenticated;
