\set ON_ERROR_STOP on
-- Disposable integration fixture: check that EN cache modes do not change
-- existing ES caches, unlock quotas, or the service-role-only access model.
set role service_role;
do $$
declare
  student uuid := '00000000-0000-4000-8000-000000000001';
  material uuid := '20000000-0000-4000-8000-000000000001';
  bank_mode text;
  valid_modes text[] := array[
    'true_false', 'cases', 'matching', 'flashcards',
    'true_false:en', 'cases:en', 'matching:en', 'flashcards:en',
    'topic:1:round:0', 'topic:1:round:0:en', 'topic:99:round:4:en'
  ];
  before_unlocks int;
begin
  select count(*) into before_unlocks from public.free_study_v2_unlocks where user_id=student;
  foreach bank_mode in array valid_modes loop
    insert into public.free_study_v2_banks(user_id, material_id, mode, payload)
    values(student, material, bank_mode, '[]'::jsonb);
  end loop;

  if (select count(*) from public.free_study_v2_banks
      where user_id=student and material_id=material) <> array_length(valid_modes, 1)
  then
    raise exception 'Not all ES and EN verified practice caches were saved';
  end if;

  if (select count(*) from public.free_study_v2_unlocks where user_id=student) <> before_unlocks
  then
    raise exception 'Adding bilingual cache modes consumed or reset a Free credit';
  end if;

  -- Unsupported locales and out-of-range topic modes must remain rejected.
  foreach bank_mode in array array['cases:fr', 'matching:de',
     'topic:1000:round:0:en', 'topic:1:round:5:en']::text[] loop
    begin
      insert into public.free_study_v2_banks(user_id, material_id, mode, payload)
      values(student, material, bank_mode, '[]'::jsonb);
      raise exception 'Unsupported mode accepted: %', bank_mode;
    exception when check_violation then
      null;
    end;
  end loop;
end $$;
reset role;

do $$
begin
  if not (select relrowsecurity from pg_class where oid='public.free_study_v2_banks'::regclass)
  then raise exception 'Verified bank cache RLS was disabled'; end if;
  if has_table_privilege('authenticated', 'public.free_study_v2_banks', 'SELECT')
     or has_table_privilege('anon', 'public.free_study_v2_banks', 'SELECT')
  then raise exception 'Public roles gained access to verified bank caches'; end if;
end $$;
select 'Free V2 EN/ES cache modes preserve caps and security' as result;
