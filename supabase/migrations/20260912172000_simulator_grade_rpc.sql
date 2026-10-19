create or replace function public.grade_simulator_question(
  p_pregunta_id uuid,
  p_materia_id uuid,
  p_respuestas text[]
)
returns table (
  status text,
  success boolean,
  correct boolean,
  correct_indexes integer[]
)
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_user_id uuid := auth.uid();
  v_question record;
  v_expected text[];
  v_selected text[];
  v_correct boolean;
  v_correct_indexes integer[];
  v_rate record;
begin
  if v_user_id is null then
    return query select 'unauthorized'::text, false, null::boolean, '{}'::integer[];
    return;
  end if;

  if p_pregunta_id is null or p_materia_id is null or coalesce(cardinality(p_respuestas), 0) < 1 or cardinality(p_respuestas) > 20 then
    return query select 'invalid_payload'::text, false, null::boolean, '{}'::integer[];
    return;
  end if;

  select * into v_rate
  from public.consume_rate_limit(
    'sim:grade:' || v_user_id::text,
    60,
    60
  );

  if not coalesce(v_rate.allowed, false) then
    return query select 'rate_limited'::text, false, null::boolean, '{}'::integer[];
    return;
  end if;

  select pb.respuesta_correcta, pb.opciones
    into v_question
  from public.preguntas_banco pb
  where pb.id = p_pregunta_id
    and pb.materia_id = p_materia_id
  limit 1;

  if not found then
    return query select 'not_found'::text, false, null::boolean, '{}'::integer[];
    return;
  end if;

  select coalesce(array_agg(lower(regexp_replace(btrim(answer), '\s+', ' ', 'g'))), '{}'::text[])
    into v_expected
  from unnest(regexp_split_to_array(v_question.respuesta_correcta, E'\\s*[|;]\\s*')) as answer
  where btrim(answer) <> '';

  select coalesce(array_agg(lower(regexp_replace(btrim(answer), '\s+', ' ', 'g'))), '{}'::text[])
    into v_selected
  from unnest(p_respuestas) as answer
  where btrim(answer) <> '';

  if cardinality(v_selected) = 0 then
    return query select 'invalid_payload'::text, false, null::boolean, '{}'::integer[];
    return;
  end if;

  v_correct := cardinality(v_selected) = cardinality(v_expected)
    and not exists (
      select 1
      from unnest(v_selected) as selected_answer
      where not (selected_answer = any(v_expected))
    );

  select coalesce(array_agg((option_row.ordinality - 1)::integer order by option_row.ordinality), '{}'::integer[])
    into v_correct_indexes
  from jsonb_array_elements_text(v_question.opciones) with ordinality as option_row(option_text, ordinality)
  where lower(regexp_replace(btrim(option_row.option_text), '\s+', ' ', 'g')) = any(v_expected);

  insert into public.historial_respuestas (
    usuario_id,
    pregunta_id,
    materia_id,
    es_correcta,
    peso,
    fecha_respuesta
  ) values (
    v_user_id,
    p_pregunta_id,
    p_materia_id::text,
    v_correct,
    case when v_correct then 1 else 3 end,
    now()
  );

  return query select 'ok'::text, true, v_correct, v_correct_indexes;
end;
$$;

revoke all on function public.grade_simulator_question(uuid, uuid, text[]) from public;
grant execute on function public.grade_simulator_question(uuid, uuid, text[]) to authenticated;

comment on function public.grade_simulator_question(uuid, uuid, text[]) is
  'Corrige y persiste una respuesta del simulador usando auth.uid(), sin exponer respuesta_correcta al cliente.';
