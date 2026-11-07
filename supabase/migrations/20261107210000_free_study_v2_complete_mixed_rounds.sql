-- Free: 1 ronda gratis de Completar y 1 de Mixto por cuenta (antes eran solo Premium).
-- La ronda de Mixto es independiente: no descuenta de los cupos de opción
-- múltiple ni de casos. La aplica solo el chat de infraestructura.

alter table public.free_study_v2_unlocks
  drop constraint if exists free_study_v2_unlocks_kind_check;
alter table public.free_study_v2_unlocks
  add constraint free_study_v2_unlocks_kind_check check (kind in (
    'multiple_choice','true_false','matching_round','case','flashcard',
    'simulator','complete_round','mixed_round'
  ));

create or replace function public.claim_free_study_v2_unlock(
  p_user_id uuid, p_material_id uuid, p_kind text, p_item_key text
)
returns table (allowed boolean, used_count integer, limit_count integer, already_unlocked boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_limit integer;
  v_used integer;
begin
  v_limit := case p_kind
    when 'multiple_choice' then 12
    when 'true_false' then 10
    when 'matching_round' then 1
    when 'case' then 2
    when 'flashcard' then 25
    when 'simulator' then 1
    when 'complete_round' then 1
    when 'mixed_round' then 1
    else null
  end;

  if p_user_id is null or p_material_id is null or v_limit is null
     or p_item_key is null or length(p_item_key) < 1 or length(p_item_key) > 300
     or not exists (
       select 1 from public.student_materials m
       where m.id = p_material_id and m.user_id = p_user_id and m.processing_status = 'ready'
     )
  then
    raise exception 'invalid_free_study_unlock' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('free-study-v2:' || p_user_id::text, 0)
  );

  select count(*)::integer into v_used
  from public.free_study_v2_unlocks
  where user_id = p_user_id and kind = p_kind;

  if exists (
    select 1 from public.free_study_v2_unlocks
    where user_id = p_user_id and kind = p_kind and item_key = p_item_key
  ) then
    return query select true, v_used, v_limit, true;
    return;
  end if;

  if v_used >= v_limit then
    return query select false, v_used, v_limit, false;
    return;
  end if;

  insert into public.free_study_v2_unlocks(user_id,material_id,kind,item_key)
  values(p_user_id,p_material_id,p_kind,p_item_key);

  return query select true, v_used + 1, v_limit, false;
end;
$$;

revoke all on function public.claim_free_study_v2_unlock(uuid,uuid,text,text)
  from public, anon, authenticated;
grant execute on function public.claim_free_study_v2_unlock(uuid,uuid,text,text)
  to service_role;
