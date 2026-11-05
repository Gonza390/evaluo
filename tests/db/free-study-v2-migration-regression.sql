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
  if not exists (select 1 from public.free_study_v2_upload_claims where user_id=old_user) then
    raise exception 'Preexisting ready material was not recorded';
  end if;
  if (select enabled from public.free_study_v2_rollout where id=true) is distinct from false then
    raise exception 'Migration must leave commercial switch OFF';
  end if;
  insert into public.student_materials(id,user_id,processing_status)
    values ('20000000-0000-4000-8000-000000000002',old_user,'ready');
  update public.free_study_v2_rollout set enabled=true where id=true;

  rejected:=false;
  begin
    insert into public.student_materials(id,user_id,processing_status)
      values ('20000000-0000-4000-8000-000000000003',old_user,'uploaded');
  exception when sqlstate 'P0001' then rejected:=true;
  end;
  if not rejected then raise exception 'Lifetime limit bypassed for prior student'; end if;

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
