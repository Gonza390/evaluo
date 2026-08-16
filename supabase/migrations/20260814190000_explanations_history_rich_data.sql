-- Explicaciones IA: data enriquecida por explicación + dedup por (user, pregunta)
alter table public.explanations_history
  add column if not exists opciones jsonb null,
  add column if not exists respuesta_correcta text null,
  add column if not exists opcion_elegida integer null,
  add column if not exists veces_fallada integer not null default 1;
-- Dedup: conservar solo la última explicación por (user_id, pregunta_id)
delete from public.explanations_history
where id in (
  select id from (
    select id,
      row_number() over (
        partition by user_id, pregunta_id
        order by created_at desc, id desc
      ) as rn
    from public.explanations_history
    where pregunta_id is not null
  ) t
  where rn > 1
);
-- Constraint único para permitir upsert desde el pipeline
alter table public.explanations_history
  drop constraint if exists explanations_history_user_question_unique;
alter table public.explanations_history
  add constraint explanations_history_user_question_unique unique (user_id, pregunta_id);
