-- Completa temas estructurados en errores históricos del Preguntero.
with ranked_labels as (
  select distinct on (l.pregunta_id)
    l.pregunta_id::text as question_id,
    coalesce(nullif(trim(s.title), ''), nullif(trim(t.title), '')) as topic_label
  from public.simulator_question_topic_links l
  left join public.simulator_topics t on t.id = l.topic_id
  left join public.simulator_subtopics s on s.id = l.subtopic_id
  where coalesce(nullif(trim(s.title), ''), nullif(trim(t.title), '')) is not null
  order by
    l.pregunta_id,
    l.confidence_score desc nulls last,
    l.updated_at desc
)
update public.study_errors e
set topic = r.topic_label,
    updated_at = now()
from ranked_labels r
where e.source_type = 'simulator'
  and e.question_id = r.question_id
  and (e.topic is null or btrim(e.topic) = '');
