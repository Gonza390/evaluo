-- Endurecimiento del banco de preguntas (filtración de respuestas correctas).
-- 1) preguntas_banco: se cierra la lectura masiva autenticada y la demo anónima.
--    Solo admin (o service_role vía server actions) puede leer el banco completo.
-- 2) Vista demo SANITIZADA: expone enunciado/opciones y correct_count (para UX
--    multi-respuesta) pero NUNCA respuesta_correcta.
-- 3) simulator_attempt_wrong_questions: soporta preguntas premium.
-- 4) historial_respuestas: escritura solo desde el servidor (grading server-side).

-- 1) Cerrar RLS sobre preguntas_banco
drop policy if exists preguntas_banco_read_authenticated on public.preguntas_banco;
drop policy if exists preguntas_banco_read_demo on public.preguntas_banco;

create policy preguntas_banco_read_admin_only
on public.preguntas_banco
for select
using (public.current_user_is_admin());

-- 2) Vista demo sanita (sin respuesta_correcta)
create or replace view public.demo_questions as
select
  pb.id,
  pb.materia_id,
  pb.parcial,
  pb.enunciado,
  pb.opciones,
  coalesce(
    array_length(
      array_remove(
        regexp_split_to_array(pb.respuesta_correcta, '\s*(\||;)\s*'),
        ''
      ),
      1
    ),
    0
  ) as correct_count
from public.preguntas_banco pb
where pb.es_demo = true;

revoke all on public.demo_questions from anon, authenticated;
grant select on public.demo_questions to anon, authenticated;

-- 3) simulator_attempt_wrong_questions: soportar preguntas premium
alter table public.simulator_attempt_wrong_questions
  add column if not exists premium_pregunta_id uuid null
    references public.premium_questions(id) on delete cascade;

alter table public.simulator_attempt_wrong_questions
  drop constraint if exists simulator_attempt_wrong_questions_pregunta_source_chk;

alter table public.simulator_attempt_wrong_questions
  add constraint simulator_attempt_wrong_questions_pregunta_source_chk
  check (
    (pregunta_id is not null) <> (premium_pregunta_id is not null)
  );

create index if not exists simulator_attempt_wrong_questions_premium_idx
  on public.simulator_attempt_wrong_questions(premium_pregunta_id);

-- 4) historial_respuestas: escritura únicamente server-side (grading del servidor)
drop policy if exists historial_respuestas_insert_own_or_admin on public.historial_respuestas;
create policy historial_respuestas_no_client_write
on public.historial_respuestas
for insert
with check (false);

drop policy if exists historial_respuestas_update_own_or_admin on public.historial_respuestas;
create policy historial_respuestas_update_admin_only
on public.historial_respuestas
for update
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

-- 5) Resumen de valoraciones por materia: agregación SQL (evita descargar miles
--    de filas y deduplicar en el servidor de aplicación).
create or replace function public.get_simulator_ratings_summary(p_materia_id uuid)
returns table (parcial int, likes bigint, dislikes bigint)
language sql
security definer
set search_path = public
as $$
  with latest as (
    select distinct on (user_id, metadata ->> 'parcial')
      (metadata ->> 'parcial')::int as parcial,
      metadata ->> 'vote_type' as vote_type
    from public.analytics_events
    where event_name = 'simulator_rating'
      and metadata ->> 'materia_id' = p_materia_id::text
      and user_id is not null
      and metadata ->> 'parcial' in ('1', '2', '3')
      and metadata ->> 'vote_type' in ('1', '-1')
    order by user_id, metadata ->> 'parcial', created_at desc
  )
  select
    parcial,
    count(*) filter (where vote_type = '1') as likes,
    count(*) filter (where vote_type = '-1') as dislikes
  from latest
  group by parcial;
$$;

revoke all on function public.get_simulator_ratings_summary(uuid) from public, anon, authenticated;
grant execute on function public.get_simulator_ratings_summary(uuid) to service_role;
