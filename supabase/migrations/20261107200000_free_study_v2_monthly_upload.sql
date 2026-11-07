-- Free: 1 apunte nuevo por mes calendario (hora de Argentina), en lugar de
-- 1 apunte de por vida. Premium mantiene 3 altas por día UTC.
-- Reemplaza las funciones de 20261104180000_free_study_v2_unlocks.sql; la
-- tabla free_study_v2_upload_claims se conserva como historial.
-- La aplica solo el chat de infraestructura.

create table if not exists public.free_study_v2_monthly_upload_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  period date not null,
  -- Sin FK: borrar el material NO devuelve el cupo del mes.
  material_id uuid not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, period)
);
alter table public.free_study_v2_monthly_upload_claims enable row level security;
revoke all on public.free_study_v2_monthly_upload_claims from public, anon, authenticated;
grant select, insert on public.free_study_v2_monthly_upload_claims to service_role;

-- Mes del cupo: primer día del mes en hora de Argentina.
create or replace function public.free_study_v2_upload_period(p_at timestamptz default pg_catalog.now())
returns date language sql stable set search_path = ''
as $period$
  select (pg_catalog.date_trunc('month', p_at at time zone 'America/Argentina/Buenos_Aires'))::date
$period$;
revoke all on function public.free_study_v2_upload_period(timestamptz) from public, anon, authenticated;
grant execute on function public.free_study_v2_upload_period(timestamptz) to service_role;

-- El apunte ya reclamado cuenta para el mes en que se reclamó.
insert into public.free_study_v2_monthly_upload_claims(user_id, period, material_id, claimed_at)
select c.user_id, public.free_study_v2_upload_period(c.claimed_at), c.first_material_id, c.claimed_at
from public.free_study_v2_upload_claims c
on conflict (user_id, period) do nothing;

-- Registrar el cupo del mes cuando el material queda listo.
create or replace function public.remember_free_study_v2_upload()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if public.is_free_study_v2_rollout_enabled()
     and new.processing_status = 'ready'
     and exists (
       select 1 from public.study_material_v2_upload_ledger l
       where l.material_id = new.id and l.user_id = new.user_id
     )
     and not public.free_study_v2_is_premium_account(new.user_id) then
    insert into public.free_study_v2_upload_claims(user_id, first_material_id)
    values(new.user_id,new.id)
    on conflict (user_id) do nothing;
    insert into public.free_study_v2_monthly_upload_claims(user_id, period, material_id)
    values(new.user_id, public.free_study_v2_upload_period(), new.id)
    on conflict (user_id, period) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.remember_free_study_v2_upload() from public, anon, authenticated;

create or replace function public.remember_study_material_v2_upload()
returns trigger language plpgsql security definer set search_path = ''
as $ledger$
begin
  if not public.is_free_study_v2_rollout_enabled() then return new; end if;
  insert into public.study_material_v2_upload_ledger(material_id,user_id,claimed_at)
  values(new.id,new.user_id,new.created_at)
  on conflict (material_id) do nothing;

  -- El flujo PDF-first puede insertar directamente con status='ready'.
  if new.processing_status = 'ready'
     and not public.free_study_v2_is_premium_account(new.user_id) then
    insert into public.free_study_v2_upload_claims(user_id, first_material_id)
    values(new.user_id,new.id)
    on conflict (user_id) do nothing;
    insert into public.free_study_v2_monthly_upload_claims(user_id, period, material_id)
    values(new.user_id, public.free_study_v2_upload_period(), new.id)
    on conflict (user_id, period) do nothing;
  end if;
  return new;
end;
$ledger$;
revoke all on function public.remember_study_material_v2_upload()
  from public, anon, authenticated;

create or replace function public.guard_free_study_v2_material_insert()
returns trigger language plpgsql security definer set search_path = ''
as $guard_insert$
declare
  v_unlimited boolean;
  v_daily integer;
begin
  if not public.is_free_study_v2_rollout_enabled() then return new; end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('free-v2-material:' || new.user_id::text, 0)
  );

  select coalesce(p.student_material_uploads_unlimited, false)
    into v_unlimited
  from public.profiles p where p.id = new.user_id;

  if coalesce(v_unlimited,false) then return new; end if;

  if exists (
    select 1 from public.student_materials m
    where m.user_id = new.user_id
      and m.processing_status in ('uploaded','processing')
  ) then
    raise exception 'free_v2_upload_already_processing' using errcode = 'P0001';
  end if;

  if public.free_study_v2_is_premium_account(new.user_id) then
    select count(*)::integer into v_daily
    from public.study_material_v2_upload_ledger l
    where l.user_id = new.user_id
      and l.claimed_at >= (pg_catalog.date_trunc('day', pg_catalog.now() at time zone 'UTC') at time zone 'UTC');
    if v_daily >= 3 then
      raise exception 'premium_daily_upload_limit' using errcode = 'P0001';
    end if;
  elsif exists (
    select 1 from public.free_study_v2_monthly_upload_claims c
    where c.user_id = new.user_id
      and c.period = public.free_study_v2_upload_period()
  ) then
    raise exception 'free_v2_monthly_upload_limit' using errcode = 'P0001';
  end if;

  new.created_at := pg_catalog.now();
  return new;
end;
$guard_insert$;
revoke all on function public.guard_free_study_v2_material_insert()
  from public, anon, authenticated;

-- Reintentar el archivo fallido está permitido, pero convertir otro registro
-- fallido en listo no puede regalar un segundo apunte en el mismo mes.
create or replace function public.guard_free_study_v2_failed_material_retry()
returns trigger language plpgsql security definer set search_path = ''
as $guard_retry$
begin
  if not public.is_free_study_v2_rollout_enabled() then return new; end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('free-v2-material:' || new.user_id::text, 0)
  );

  if not public.free_study_v2_is_premium_account(new.user_id)
    and not exists (
      select 1 from public.profiles p
      where p.id = new.user_id and p.student_material_uploads_unlimited
    )
    and exists (
      select 1 from public.study_material_v2_upload_ledger l
      where l.material_id = new.id and l.user_id = new.user_id
    )
    and exists (
      select 1 from public.free_study_v2_monthly_upload_claims c
      where c.user_id = new.user_id
        and c.period = public.free_study_v2_upload_period()
        and c.material_id <> new.id
    )
  then
    raise exception 'free_v2_monthly_upload_limit' using errcode = 'P0001';
  end if;
  return new;
end;
$guard_retry$;
revoke all on function public.guard_free_study_v2_failed_material_retry()
  from public, anon, authenticated;
