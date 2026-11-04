-- Modelo Free v2: cupos inmutables por cuenta, sin reinicio ni liberación al borrar.
-- Sólo se activa al desplegar el código en producción. Esta migración no modifica
-- los permisos ni los contenidos académicos existentes.
create table if not exists public.free_study_v2_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in
    ('materials','multiple_choice','true_false','matching','cases','flashcards','simulator','study_plans')),
  unlock_key text not null check (char_length(unlock_key) between 1 and 200),
  units integer not null check (units between 1 and 100),
  created_at timestamptz not null default now(),
  unique(user_id, feature, unlock_key)
);
create index if not exists free_study_v2_unlocks_account_feature_idx
  on public.free_study_v2_unlocks(user_id,feature);
alter table public.free_study_v2_unlocks enable row level security;
revoke all on public.free_study_v2_unlocks from public, anon, authenticated;
grant select, insert on public.free_study_v2_unlocks to service_role;

-- Las cargas válidas previas cuentan, incluso si se borran luego de lanzar v2.
insert into public.free_study_v2_unlocks(user_id,feature,unlock_key,units)
select user_id,'materials',id::text,1 from public.student_materials
where processing_status='ready'
on conflict (user_id,feature,unlock_key) do nothing;

-- Registrar sólo procesamiento exitoso; errores no gastan cupo.
create or replace function public.record_free_study_v2_material()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.processing_status = 'ready' and
     (tg_op = 'INSERT' or old.processing_status is distinct from 'ready') then
    insert into public.free_study_v2_unlocks(user_id,feature,unlock_key,units)
    values(new.user_id,'materials',new.id::text,1)
    on conflict (user_id,feature,unlock_key) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.record_free_study_v2_material() from public,anon,authenticated;
drop trigger if exists record_free_study_v2_material_trigger on public.student_materials;
create trigger record_free_study_v2_material_trigger
  after insert or update of processing_status on public.student_materials
  for each row execute function public.record_free_study_v2_material();

-- RPC privada de la API de servicio. El bloqueo por usuario+función evita carreras.
-- Los argumentos sólo deben ser enviados desde el servidor con límites fijos.
create or replace function public.claim_free_study_v2_unlock(
  p_user_id uuid, p_feature text, p_unlock_key text, p_limit integer, p_units integer
) returns boolean language plpgsql security invoker set search_path = ''
as $$
declare v_used bigint;
begin
  if p_user_id is null or p_feature not in
    ('multiple_choice','true_false','matching','cases','flashcards','simulator','study_plans')
    or char_length(p_unlock_key) not between 1 and 200
    or p_limit not between 1 and 100 or p_units not between 1 and p_limit then
    raise exception 'invalid free study quota request';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text || ':' || p_feature,0)
  );
  if exists(select 1 from public.free_study_v2_unlocks
      where user_id=p_user_id and feature=p_feature and unlock_key=p_unlock_key) then
    return true;
  end if;
  select coalesce(sum(units),0) into v_used from public.free_study_v2_unlocks
   where user_id=p_user_id and feature=p_feature;
  if v_used + p_units > p_limit then return false; end if;
  insert into public.free_study_v2_unlocks(user_id,feature,unlock_key,units)
    values (p_user_id,p_feature,p_unlock_key,p_units);
  return true;
end;
$$;
revoke all on function public.claim_free_study_v2_unlock(uuid,text,text,integer,integer)
  from public, anon, authenticated;
grant execute on function public.claim_free_study_v2_unlock(uuid,text,text,integer,integer)
  to service_role;
