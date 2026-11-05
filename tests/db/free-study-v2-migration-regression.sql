\set ON_ERROR_STOP on
-- Post-migration regression on a disposable PostgreSQL 17 service.
do $test$
declare
  old_user constant uuid := '00000000-0000-4000-8000-000000000001';
  free_user constant uuid := '00000000-0000-4000-8000-000000000002';
  retry_user constant uuid := '00000000-0000-4000-8000-000000000003';
  paid_user constant uuid := '00000000-0000-4000-8000-000000000004';
  rejected boolean;
  i integer;
begin
  -- El lanzamiento arranca desde CERO incluso para estudiantes con documentos
  -- listos, planes guardados y tres altas Premium hechas previamente hoy.
  if exists (select 1 from public.free_study_v2_upload_claims) then
    raise exception 'Historical ready PDFs consumed the new Free launch grant';
  end if;
  if exists (select 1 from public.study_material_v2_upload_ledger) then
    raise exception 'Historical uploads were imported into the new Premium ledger';
  end if;
  if exists (select 1 from public.free_study_v2_plan_claims) then
    raise exception 'Historical plans consumed new Free study plan grants';
  end if;
  if not exists (select 1 from public.student_materials
    where id='20000000-0000-4000-8000-000000000001'
      and user_id=old_user and processing_status='ready') then
    raise exception 'Previous study material was lost during migration';
  end if;
  if not exists (select 1 from public.student_personal_study_plans
    where user_id=old_user) then
    raise exception 'Previous study plan was lost during migration';
  end if;
  if (select enabled from public.free_study_v2_rollout where id=true) is distinct from false then
    raise exception 'Migration must leave commercial switch OFF';
  end if;

  -- Un archivo que termina entre la instalación de migraciones y el
  -- lanzamiento tampoco puede gastar el nuevo cupo.
  insert into public.student_materials(id,user_id,processing_status)
    values ('20000000-0000-4000-8000-000000000002',old_user,'ready');
  if exists (select 1 from public.free_study_v2_upload_claims)
     or exists (select 1 from public.study_material_v2_upload_ledger) then
    raise exception 'Prelaunch upload consumed quota while rollout was disabled';
  end if;

  update public.free_study_v2_rollout set enabled=true where id=true;

  -- El antiguo usuario recibe una carga NUEVA completa.
  insert into public.student_materials(id,user_id,processing_status)
    values ('20000000-0000-4000-8000-000000000003',old_user,'ready');
  if not exists (
    select 1 from public.free_study_v2_upload_claims
    where user_id=old_user
      and first_material_id='20000000-0000-4000-8000-000000000003'
  ) then
    raise exception 'First postlaunch Free upload not claimed for legacy student';
  end if;
  -- Reprocesar un PDF anterior nunca gasta el cupo del modelo nuevo.
  update public.student_materials set processing_status='failed'
    where id='20000000-0000-4000-8000-000000000001';
  update public.student_materials set processing_status='ready'
    where id='20000000-0000-4000-8000-000000000001';
  if (select count(*) from public.free_study_v2_upload_claims
      where user_id=old_user) <> 1 then
    raise exception 'Legacy PDF reprocessing changed launch quota';
  end if;

  rejected:=false;
  begin
    insert into public.student_materials(id,user_id,processing_status)
      values ('20000000-0000-4000-8000-000000000008',old_user,'uploaded');
  exception when sqlstate 'P0001' then rejected:=true;
  end;
  if not rejected then raise exception 'Second postlaunch upload accepted for legacy student'; end if;

  insert into public.student_materials(id,user_id,processing_status)
    values ('20000000-0000-4000-8000-000000000004',free_user,'uploaded');
  update public.student_materials set processing_status='ready'
    where id='20000000-0000-4000-8000-000000000004';
  if not exists (select 1 from public.free_study_v2_upload_claims where user_id=free_user) then
    raise exception 'Ready material did not consume a lifetime grant';
  end if;
  rejected:=false;
  begin
    insert into public.student_materials(id,user_id,processing_status)
      values ('20000000-0000-4000-8000-000000000005',free_user,'uploaded');
  exception when sqlstate 'P0001' then rejected:=true;
  end;
  if not rejected then raise exception 'Second free upload was accepted'; end if;

  insert into public.student_materials(id,user_id,processing_status)
    values ('20000000-0000-4000-8000-000000000006',retry_user,'failed');
  insert into public.student_materials(id,user_id,processing_status)
    values ('20000000-0000-4000-8000-000000000007',retry_user,'uploaded');
  update public.student_materials set processing_status='ready'
    where id='20000000-0000-4000-8000-000000000007';

  for i in 1..3 loop
    insert into public.student_materials(id,user_id,processing_status)
      values (('30000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,paid_user,'ready');
  end loop;
  delete from public.student_materials
    where id='30000000-0000-4000-8000-000000000001';
  rejected:=false;
  begin
    insert into public.student_materials(id,user_id,processing_status)
      values ('30000000-0000-4000-8000-000000000004',paid_user,'uploaded');
  exception when sqlstate 'P0001' then rejected:=true;
  end;
  if not rejected then raise exception 'Premium daily limit bypassed after deletion'; end if;
  if (select count(*) from public.study_material_v2_upload_ledger where user_id=paid_user)<>3 then
    raise exception 'Premium upload ledger lost an entry';
  end if;
  if exists (
    select 1 from public.free_study_v2_upload_claims where user_id=paid_user
  ) then
    raise exception 'Premium uploads consumed the lifetime Free grant';
  end if;
end;
$test$;

-- Match Supabase service_role behaviour: backend bypasses RLS, browser does not.
grant select,insert,update,delete on all tables in schema public to service_role;
set role service_role;
do $claim$
declare
  free_user constant uuid := '00000000-0000-4000-8000-000000000002';
  material constant uuid := '20000000-0000-4000-8000-000000000004';
  i integer;
  allowed_value boolean;
  count_value integer;
  editable boolean;
begin
  for i in 1..12 loop
    select allowed into allowed_value from public.claim_free_study_v2_unlock(
      free_user,material,'multiple_choice',material::text||':q:'||i::text);
    if allowed_value is distinct from true then raise exception 'Free MCQ % rejected',i; end if;
  end loop;
  select allowed into allowed_value from public.claim_free_study_v2_unlock(
    free_user,material,'multiple_choice',material::text||':q:13');
  if allowed_value is distinct from false then raise exception '13th MCQ must be denied'; end if;
  select allowed into allowed_value from public.claim_free_study_v2_unlock(
    free_user,material,'multiple_choice',material::text||':q:1');
  if allowed_value is distinct from true then raise exception 'Unlocked MCQ cannot be repeated'; end if;
  select count(*) into count_value from public.free_study_v2_unlocks
    where user_id=free_user and kind='multiple_choice';
  if count_value<>12 then raise exception 'Idempotent MCQ claim changed the count'; end if;

  -- Free V2 per-account quotas across all exercise modalities.
  for i in 1..10 loop
    select allowed into allowed_value from public.claim_free_study_v2_unlock(
      free_user,material,'true_false',material::text||':tf:'||i);
    if allowed_value is distinct from true then raise exception 'True/false % rejected',i; end if;
  end loop;
  select allowed into allowed_value from public.claim_free_study_v2_unlock(
    free_user,material,'true_false',material::text||':tf:11');
  if allowed_value is distinct from false then raise exception '11th true/false accepted'; end if;
  for i in 1..2 loop
    select allowed into allowed_value from public.claim_free_study_v2_unlock(
      free_user,material,'case',material::text||':case:'||i);
    if allowed_value is distinct from true then raise exception 'Case % rejected',i; end if;
  end loop;
  select allowed into allowed_value from public.claim_free_study_v2_unlock(
    free_user,material,'case',material::text||':case:3');
  if allowed_value is distinct from false then raise exception 'Third case accepted'; end if;
  for i in 1..25 loop
    select allowed into allowed_value from public.claim_free_study_v2_unlock(
      free_user,material,'flashcard',material::text||':flashcard:'||i);
    if allowed_value is distinct from true then raise exception 'Flashcard % rejected',i; end if;
  end loop;
  select allowed into allowed_value from public.claim_free_study_v2_unlock(
    free_user,material,'flashcard',material::text||':flashcard:26');
  if allowed_value is distinct from false then raise exception '26th flashcard accepted'; end if;
  select allowed into allowed_value from public.claim_free_study_v2_unlock(
    free_user,material,'matching_round',material::text||':matching:first');
  if allowed_value is distinct from true then raise exception 'First matching round rejected'; end if;
  select allowed into allowed_value from public.claim_free_study_v2_unlock(
    free_user,material,'matching_round',material::text||':matching:second');
  if allowed_value is distinct from false then raise exception 'Second matching round accepted'; end if;
  select allowed into allowed_value from public.claim_free_study_v2_unlock(
    free_user,material,'simulator',material::text||':simulator:first');
  if allowed_value is distinct from true then raise exception 'First simulation rejected'; end if;
  select allowed into allowed_value from public.claim_free_study_v2_unlock(
    free_user,material,'simulator',material::text||':simulator:second');
  if allowed_value is distinct from false then raise exception 'Second simulation accepted'; end if;
  begin
    perform public.claim_free_study_v2_unlock(free_user,
      '90000000-0000-4000-8000-000000000001','multiple_choice','invalid');
    raise exception 'Claim accepted a nonexistent material';
  exception when sqlstate '22023' then null;
  end;

  -- El plan anterior existe, pero su primer guardado en Free V2 es gratis.
  if exists (select 1 from public.free_study_v2_plan_claims
    where user_id='00000000-0000-4000-8000-000000000001') then
    raise exception 'Prelaunch study plan already consumed a new grant';
  end if;
  select public.save_free_study_v2_plan(
    '00000000-0000-4000-8000-000000000001',
    current_date+14,30,
    array['20000000-0000-4000-8000-000000000001']::uuid[],
    array['practicar']::text[],'[]'::jsonb) into editable;
  if editable is distinct from true then
    raise exception 'Legacy plan owner could not use new plan grant';
  end if;
  if not exists (select 1 from public.free_study_v2_plan_claims
    where user_id='00000000-0000-4000-8000-000000000001') then
    raise exception 'New study plan grant not recorded';
  end if;
  select public.save_free_study_v2_plan(free_user,current_date+10,30,
    array[material]::uuid[],array['practicar']::text[],'[]'::jsonb) into editable;
  if editable is distinct from true then raise exception 'First Free plan failed'; end if;
  select public.save_free_study_v2_plan(free_user,current_date+11,45,
    array[material]::uuid[],array['practicar']::text[],'[]'::jsonb) into editable;
  if editable is distinct from true then raise exception 'Editing existing plan failed'; end if;
  delete from public.student_personal_study_plans where user_id=free_user;
  select public.save_free_study_v2_plan(free_user,current_date+12,60,
    array[material]::uuid[],array['practicar']::text[],'[]'::jsonb) into editable;
  if editable is distinct from false then
    raise exception 'Deleting a plan restored the single Free grant';
  end if;
end;
$claim$;
reset role;

-- A direct browser JWT cannot sidestep the restrictive RLS policies.
set role authenticated;
do $rpc_privileges$
declare denied boolean:=false;
begin
  begin
    perform public.claim_free_study_v2_unlock(
      '00000000-0000-4000-8000-000000000002',
      '20000000-0000-4000-8000-000000000004',
      'multiple_choice','forged');
  exception when insufficient_privilege then denied:=true;
  end;
  if not denied then raise exception 'Browser JWT executed quota claim RPC'; end if;
end;
$rpc_privileges$;
do $rls$
declare denied boolean:=false;
begin
  begin
    insert into public.student_personal_study_plans(user_id,exam_date)
      values ('00000000-0000-4000-8000-000000000005',current_date+8);
  exception when insufficient_privilege then denied:=true;
  end;
  if not denied then raise exception 'Authenticated client bypassed Free plan RLS'; end if;
end;
$rls$;
reset role;
select 'free_v2_migrations_regression_passed' as result;
