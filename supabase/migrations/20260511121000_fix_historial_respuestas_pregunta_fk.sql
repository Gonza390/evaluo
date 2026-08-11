alter table if exists public.historial_respuestas
  drop constraint if exists historial_respuestas_pregunta_id_fkey;

alter table if exists public.historial_respuestas
  add constraint historial_respuestas_pregunta_id_fkey
  foreign key (pregunta_id)
  references public.preguntas_banco(id)
  on delete set null;
