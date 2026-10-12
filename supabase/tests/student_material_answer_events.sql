-- Prueba transaccional: no conserva PDFs, respuestas ni cambios de sesión.
begin;
do $$
declare
  v_user uuid;
  v_material uuid := gen_random_uuid();
  v_event uuid := gen_random_uuid();
  v_coverage record;
begin
  select user_id into v_user from public.student_materials limit 1;
  if v_user is null then raise exception 'Se necesita un usuario con material para el test'; end if;
  insert into public.student_materials(id, user_id, title, file_name, file_path)
    values(v_material, v_user, 'Prueba transaccional de cobertura', 'test.pdf', 'test-no-storage');
  perform set_config('evaluo.test_material', v_material::text, true);
  perform set_config('evaluo.test_owner', v_user::text, true);
  insert into public.student_material_answer_events
    (id,user_id,material_id,source_type,evidence_kind,item_key,topic,section_title,prompt,selected_answer,was_correct)
    values(v_event,v_user,v_material,'exercise','assessed','q1','Tema','Tema','Pregunta','A',true);
  -- Repetir la misma solicitud no duplica el intento.
  insert into public.student_material_answer_events
    (id,user_id,material_id,source_type,evidence_kind,item_key,topic,section_title,prompt,selected_answer,was_correct)
    values(v_event,v_user,v_material,'exercise','assessed','q1','Tema','Tema','Pregunta','A',true)
    on conflict(id) do nothing;
  insert into public.student_material_answer_events
    (id,user_id,material_id,source_type,evidence_kind,item_key,topic,section_title,prompt,selected_answer,was_correct)
    values
      (gen_random_uuid(),v_user,v_material,'diagnostic','assessed','q2','Tema','Tema','Pregunta 2','B',false),
      (gen_random_uuid(),v_user,v_material,'flashcard','self_report','f1','Tema','Tema','Tarjeta','La sabía',true);
  select * into v_coverage from public.get_student_material_answer_coverage(v_user,v_material);
  if v_coverage.correct_count <> 1 or v_coverage.incorrect_count <> 1 or v_coverage.self_report_count <> 1 then
    raise exception 'Conteo incorrecto o reintento duplicado';
  end if;
  if exists (select 1 from public.get_student_material_answer_coverage(gen_random_uuid(),v_material)) then
    raise exception 'La cobertura permite consultar un material ajeno';
  end if;
  if has_table_privilege('anon','public.student_material_answer_events','SELECT')
    or has_table_privilege('service_role','public.student_material_answer_events','UPDATE')
    or has_table_privilege('authenticated','public.student_material_answer_events','INSERT')
    or has_table_privilege('authenticated','public.student_material_answer_events','UPDATE')
    or has_table_privilege('authenticated','public.student_material_answer_events','DELETE')
    or has_function_privilege('authenticated','public.get_student_material_answer_coverage(uuid,uuid)','EXECUTE') then
    raise exception 'Privilegios excesivos sobre las respuestas';
  end if;
end $$;
set local role service_role;
do $$
declare v_row public.student_material_answer_events%rowtype;
begin
  select * into v_row from public.student_material_answer_events where material_id = current_setting('evaluo.test_material')::uuid limit 1;
  insert into public.student_material_answer_events select v_row.* on conflict(id) do nothing;
  if not exists(select 1 from public.get_student_material_answer_coverage(current_setting('evaluo.test_owner')::uuid,current_setting('evaluo.test_material')::uuid)) then
    raise exception 'El servidor no puede consultar la cobertura';
  end if;
end $$;
reset role;
set local role authenticated;
do $$
begin
  perform set_config('request.jwt.claim.sub', current_setting('evaluo.test_owner'), true);
  if (select count(*) from public.student_material_answer_events where material_id = current_setting('evaluo.test_material')::uuid) <> 3 then
    raise exception 'RLS no permite leer las respuestas propias';
  end if;
  perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
  if exists(select 1 from public.student_material_answer_events where material_id = current_setting('evaluo.test_material')::uuid) then
    raise exception 'RLS expone respuestas ajenas';
  end if;
end $$;
reset role;
select 'OK: cobertura, idempotencia, autoevaluaciones, pertenencia, RLS y privilegios' as result;
rollback;
