-- Ejecutar dentro de BEGIN/ROLLBACK con evaluo.review_qa_user_id configurado
-- a una cuenta de prueba. Todas las filas de este ensayo se revierten.
do $$
declare
  v_user uuid := current_setting('evaluo.review_qa_user_id')::uuid;
  v_material uuid;
  v_error uuid := gen_random_uuid();
  v_check uuid := gen_random_uuid();
  v_revision timestamptz := clock_timestamp() - interval '1 minute';
  v_result jsonb;
begin
  select id into strict v_material from public.student_materials
    where user_id = v_user and processing_status = 'ready' limit 1;
  insert into public.study_errors (id,user_id,student_material_id,source_type,source_key,prompt,correct_answer,last_failed_at)
    values (v_error,v_user,v_material,'exercise','qa-transaction-' || v_error,'Una pregunta de prueba del repaso.','Una respuesta válida.',v_revision);
  insert into public.study_error_review_checks
    (id,error_id,user_id,material_id,context_key,source_failed_at,question,options,correct_index,feedback,evidence_quote)
    values (v_check,v_error,v_user,v_material,'qa-context',v_revision,'Una pregunta nueva sobre el mismo concepto.',array['Opción A','Opción B','Opción C'],1,'La fuente sostiene la respuesta elegida.','Un fragmento de fuente que permite comprobar el concepto.');

  v_result := public.submit_study_error_review_check(gen_random_uuid(),v_check,1);
  if (v_result->>'success')::boolean then raise exception 'Un usuario ajeno pudo responder'; end if;
  v_result := public.submit_study_error_review_check(v_user,v_check,3);
  if (v_result->>'success')::boolean then raise exception 'Se aceptó un índice inválido'; end if;
  v_result := public.submit_study_error_review_check(v_user,v_check,1);
  if (v_result->>'success')::boolean then raise exception 'Se resolvió sin repasar'; end if;
  update public.study_errors set last_reviewed_at=clock_timestamp() where id=v_error;
  v_result := public.submit_study_error_review_check(v_user,v_check,1);
  if not (v_result->>'correct')::boolean then raise exception 'No se aceptó el acierto válido'; end if;
  if not exists (select 1 from public.study_errors where id=v_error and status='resolved' and resolved_at is not null) then raise exception 'El acierto no se guardó'; end if;
  v_result := public.submit_study_error_review_check(v_user,v_check,0);
  if not (v_result->>'correct')::boolean or not (v_result->>'replayed')::boolean then raise exception 'El reintento duplicado cambió el resultado'; end if;

  update public.study_errors set status='pending',resolved_at=null,last_failed_at=clock_timestamp(),last_reviewed_at=null where id=v_error;
  v_result := public.submit_study_error_review_check(v_user,v_check,1);
  if (v_result->>'success')::boolean then raise exception 'Un acierto antiguo mostró como resuelto un error reabierto'; end if;

  update public.study_errors set status='pending',resolved_at=null,last_failed_at=v_revision,last_reviewed_at=clock_timestamp(),failure_count=1 where id=v_error;
  v_check := gen_random_uuid();
  insert into public.study_error_review_checks
    (id,error_id,user_id,material_id,context_key,source_failed_at,question,options,correct_index,feedback,evidence_quote)
    values (v_check,v_error,v_user,v_material,'qa-wrong',v_revision,'Otra pregunta nueva sobre el mismo concepto.',array['Opción A','Opción B','Opción C'],1,'La fuente sostiene la respuesta correcta.','Un fragmento de fuente que permite comprobar el concepto.');
  v_result := public.submit_study_error_review_check(v_user,v_check,0);
  if not (v_result->>'success')::boolean or (v_result->>'correct')::boolean then raise exception 'La respuesta incorrecta se corrigió mal'; end if;
  if not exists (select 1 from public.study_errors where id=v_error and status='pending' and failure_count=2 and last_reviewed_at is null) then raise exception 'No se conservó el error pendiente'; end if;
  v_result := public.submit_study_error_review_check(v_user,v_check,1);
  if (v_result->>'correct')::boolean or not (v_result->>'replayed')::boolean then raise exception 'Se pudo resolver reutilizando un intento fallido'; end if;

  v_check := gen_random_uuid();
  update public.study_errors set last_reviewed_at=clock_timestamp() where id=v_error;
  insert into public.study_error_review_checks
    (id,error_id,user_id,material_id,context_key,source_failed_at,question,options,correct_index,feedback,evidence_quote)
    values (v_check,v_error,v_user,v_material,'qa-stale',v_revision,'Una comprobación de una revisión anterior.',array['Opción A','Opción B','Opción C'],1,'La fuente sostiene la respuesta correcta.','Un fragmento de fuente que permite comprobar el concepto.');
  v_result := public.submit_study_error_review_check(v_user,v_check,1);
  if (v_result->>'success')::boolean then raise exception 'Se aceptó una comprobación desactualizada'; end if;
  if has_table_privilege('authenticated','public.study_error_review_checks','SELECT')
    or has_function_privilege('authenticated','public.submit_study_error_review_check(uuid,uuid,integer)','EXECUTE') then
    raise exception 'Se expuso la corrección al navegador';
  end if;
end;
$$;
