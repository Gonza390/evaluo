-- Un único plan Free de por vida. No aplicar hasta el release de producción.
-- Borrar o reemplazar el registro no devuelve el cupo.
create table if not exists public.free_study_v2_plan_claims (
  user_id uuid primary key references auth.users(id) on delete cascade,
  claimed_at timestamptz not null default now()
);
alter table public.free_study_v2_plan_claims enable row level security;
revoke all on public.free_study_v2_plan_claims from public, anon, authenticated;
grant select, insert on public.free_study_v2_plan_claims to service_role;

-- Reinicio comercial al lanzamiento: los planes creados antes de Free V2
-- se conservan y siguen siendo editables, pero NO consumen el nuevo cupo.
-- El primer guardado hecho bajo Free V2 utilizará el único cupo nuevo.

-- Guardado y cargo de cupo en una única transacción para no cobrar intentos fallidos.
create or replace function public.save_free_study_v2_plan(
  p_user_id uuid,
  p_exam_date date,
  p_daily_minutes integer,
  p_material_ids uuid[],
  p_preferences text[],
  p_schedule jsonb
) returns boolean language plpgsql security invoker set search_path = ''
as $$
declare v_exists boolean;
begin
  if p_user_id is null or p_exam_date is null or
     p_daily_minutes not in (15,30,45,60) or
     p_material_ids is null or cardinality(p_material_ids) not between 1 and 20 or
     p_preferences is null or cardinality(p_preferences) not between 1 and 4 or
     p_schedule is null or pg_catalog.jsonb_typeof(p_schedule) <> 'array' then
    raise exception 'invalid_free_study_plan';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('free-v2-plan:' || p_user_id::text,0)
  );
  select exists(select 1 from public.student_personal_study_plans
    where user_id=p_user_id) into v_exists;
  if not v_exists and exists(select 1 from public.free_study_v2_plan_claims
    where user_id=p_user_id) then
    return false;
  end if;
  insert into public.free_study_v2_plan_claims(user_id) values(p_user_id)
    on conflict (user_id) do nothing;
  insert into public.student_personal_study_plans
    (user_id,exam_date,daily_minutes,material_ids,preferences,schedule,updated_at)
  values (p_user_id,p_exam_date,p_daily_minutes,p_material_ids,p_preferences,p_schedule,now())
  on conflict (user_id) do update set
    exam_date=excluded.exam_date,
    daily_minutes=excluded.daily_minutes,
    material_ids=excluded.material_ids,
    preferences=excluded.preferences,
    schedule=excluded.schedule,
    updated_at=now();
  return true;
end;
$$;
revoke all on function public.save_free_study_v2_plan(uuid,date,integer,uuid[],text[],jsonb)
 from public, anon, authenticated;
grant execute on function public.save_free_study_v2_plan(uuid,date,integer,uuid[],text[],jsonb)
 to service_role;

-- Las políticas originales de SELECT y escritura siguen funcionando
-- mientras el rollout de BD está APAGADO. Al activarlo, estas políticas
-- RESTRICTIVE se combinan con RLS para bloquear escrituras JWT directas,
-- sin bloquear la lectura del plan. El backend usa service_role.
drop policy if exists free_v2_plan_insert_guard on public.student_personal_study_plans;
create policy free_v2_plan_insert_guard on public.student_personal_study_plans
  as restrictive for insert to authenticated
  with check (not public.is_free_study_v2_rollout_enabled());
drop policy if exists free_v2_plan_update_guard on public.student_personal_study_plans;
create policy free_v2_plan_update_guard on public.student_personal_study_plans
  as restrictive for update to authenticated
  using (not public.is_free_study_v2_rollout_enabled())
  with check (not public.is_free_study_v2_rollout_enabled());
drop policy if exists free_v2_plan_delete_guard on public.student_personal_study_plans;
create policy free_v2_plan_delete_guard on public.student_personal_study_plans
  as restrictive for delete to authenticated
  using (not public.is_free_study_v2_rollout_enabled());
