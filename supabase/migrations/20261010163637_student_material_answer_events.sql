-- Respuestas individuales, incluidos aciertos sin error previo. No equivalen a dominio.
create table public.student_material_answer_events (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.student_materials(id) on delete cascade,
  source_type text not null check (source_type in ('exercise', 'diagnostic', 'flashcard')),
  evidence_kind text not null check (evidence_kind in ('assessed', 'self_report')),
  item_key text not null check (length(item_key) between 1 and 300),
  topic text check (length(topic) <= 500),
  section_title text check (length(section_title) <= 500),
  prompt text not null check (length(prompt) between 1 and 4000),
  selected_answer text not null check (length(selected_answer) <= 4000),
  was_correct boolean not null,
  answered_at timestamptz not null default now()
);
create index student_material_answer_events_coverage_idx
  on public.student_material_answer_events(user_id, material_id, answered_at desc);
alter table public.student_material_answer_events enable row level security;
revoke all on public.student_material_answer_events from public, anon, authenticated;
grant select on public.student_material_answer_events to authenticated;
grant select, insert on public.student_material_answer_events to service_role;
create policy "Read own material answers" on public.student_material_answer_events
  for select to authenticated using (
    user_id = (select auth.uid()) and exists (
      select 1 from public.student_materials m
      where m.id = material_id and m.user_id = (select auth.uid())
    )
  );

-- Agregación completa, sin limitar a los últimos N intentos ni exponer preguntas ajenas.
-- El repaso ya tiene respuestas corregidas e idempotentes: reutilizarlas sin duplicarlas.
create function public.get_student_material_answer_coverage(p_user_id uuid, p_material_id uuid)
returns table(topic text, section_title text, correct_count bigint, incorrect_count bigint,
  self_report_count bigint, last_answered_at timestamptz)
language sql stable security invoker set search_path = public, pg_temp
as $$
  with owner as (
    select id from public.student_materials where id = p_material_id and user_id = p_user_id
  ), answers as (
    select e.topic, e.section_title, e.evidence_kind, e.was_correct, e.answered_at
      from public.student_material_answer_events e join owner m on m.id = e.material_id
      where e.user_id = p_user_id
    union all
    select e.topic, e.reference_section_title, 'assessed', c.status = 'correct', c.answered_at
      from public.study_error_review_checks c
      join public.study_errors e on e.id = c.error_id and e.user_id = c.user_id
      join owner m on m.id = c.material_id
      where c.user_id = p_user_id and c.status in ('correct', 'incorrect')
        and c.answered_at is not null
  )
  select topic, section_title,
    count(*) filter (where evidence_kind = 'assessed' and was_correct),
    count(*) filter (where evidence_kind = 'assessed' and not was_correct),
    count(*) filter (where evidence_kind = 'self_report'), max(answered_at)
    from answers group by topic, section_title;
$$;
revoke all on function public.get_student_material_answer_coverage(uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_student_material_answer_coverage(uuid, uuid) to service_role;
