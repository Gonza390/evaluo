-- Nuevo Free: desbloqueos globales por cuenta, sin vencimiento ni renovación.
-- Preparada en master. NO aplicar sobre Supabase hasta el despliegue de producción.

-- Registro irreversible del primer archivo procesado, aun si el usuario lo borra.
create table if not exists public.free_study_v2_upload_claims (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_material_id uuid not null,
  claimed_at timestamptz not null default now()
);
alter table public.free_study_v2_upload_claims enable row level security;
revoke all on public.free_study_v2_upload_claims from public, anon, authenticated;
grant select, insert on public.free_study_v2_upload_claims to service_role;

-- Conservar usos históricos para no regalar cupos tras una eliminación.
insert into public.free_study_v2_upload_claims(user_id, first_material_id, claimed_at)
select distinct on (m.user_id) m.user_id, m.id, m.created_at
from public.student_materials m
join auth.users u on u.id = m.user_id
where m.processing_status = 'ready'
order by m.user_id, m.created_at
on conflict (user_id) do nothing;

-- La carga fallida no consume el único material Free.
create or replace function public.remember_free_study_v2_upload()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.processing_status = 'ready' then
    insert into public.free_study_v2_upload_claims(user_id, first_material_id)
    values(new.user_id,new.id)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.remember_free_study_v2_upload() from public, anon, authenticated;
drop trigger if exists trg_free_study_v2_ready_upload on public.student_materials;
create trigger trg_free_study_v2_ready_upload
after insert or update of processing_status on public.student_materials
for each row execute function public.remember_free_study_v2_upload();

create table if not exists public.free_study_v2_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Sin FK: borrar un material NO puede devolver los usos ya desbloqueados.
  material_id uuid not null,
  kind text not null check (kind in (
    'multiple_choice','true_false','matching_round','case','flashcard',
    'simulator'
  )),
  item_key text not null check (length(item_key) between 1 and 300),
  created_at timestamptz not null default now(),
  primary key (user_id, kind, item_key)
);

create index if not exists idx_free_study_v2_unlocks_user_kind
  on public.free_study_v2_unlocks(user_id, kind);

alter table public.free_study_v2_unlocks enable row level security;
revoke all on public.free_study_v2_unlocks from public, anon, authenticated;
grant select, insert, update, delete on public.free_study_v2_unlocks to service_role;

-- Solo el backend con clave service_role puede ejecutar esta operación.
-- El bloqueo transaccional evita gastar el mismo cupo en solicitudes paralelas.
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


-- Cache de muestras verificadas: repetir no vuelve a gastar IA ni desbloquea
-- una nueva tanda por actualizar o cambiar el parámetro "round".
create table if not exists public.free_study_v2_banks (
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.student_materials(id) on delete cascade,
  mode text not null check (mode in ('true_false','cases','matching','flashcards')
    or mode ~ '^topic:[0-9]{1,3}:round:[0-4]
  payload jsonb not null check (jsonb_typeof(payload) = 'array'),
  created_at timestamptz not null default now(),
  primary key (user_id, material_id, mode)
);

alter table public.free_study_v2_banks enable row level security;
revoke all on public.free_study_v2_banks from public, anon, authenticated;
grant select, insert on public.free_study_v2_banks to service_role;

-- Switch de base de datos separado del feature flag de Vercel.
-- Instalar migraciones no debe activar restricciones ni alterar producción.
create table if not exists public.free_study_v2_rollout (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.free_study_v2_rollout(id,enabled)
values(true,false) on conflict (id) do nothing;
alter table public.free_study_v2_rollout enable row level security;
revoke all on public.free_study_v2_rollout from public, anon, authenticated;
grant select, update on public.free_study_v2_rollout to service_role;

create or replace function public.is_free_study_v2_rollout_enabled()
returns boolean language sql stable security definer set search_path = ''
as $rollout$
  select coalesce((
    select enabled from public.free_study_v2_rollout where id = true
  ),false);
$rollout$;
revoke all on function public.is_free_study_v2_rollout_enabled()
  from public, anon;
grant execute on function public.is_free_study_v2_rollout_enabled()
  to authenticated, service_role;

-- Registro inmutable de CADA alta de material, independiente de su borrado.
-- Un Premium no puede recuperar 3 altas/día borrando PDFs desde Supabase.
create table if not exists public.study_material_v2_upload_ledger (
  material_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  claimed_at timestamptz not null
);
create index if not exists idx_study_material_v2_upload_daily
  on public.study_material_v2_upload_ledger(user_id, claimed_at);
alter table public.study_material_v2_upload_ledger enable row level security;
revoke all on public.study_material_v2_upload_ledger from public, anon, authenticated;
grant select, insert on public.study_material_v2_upload_ledger to service_role;
insert into public.study_material_v2_upload_ledger(material_id,user_id,claimed_at)
select id,user_id,created_at from public.student_materials
on conflict (material_id) do nothing;

create or replace function public.remember_study_material_v2_upload()
returns trigger language plpgsql security definer set search_path = ''
as $ledger$
begin
  insert into public.study_material_v2_upload_ledger(material_id,user_id,claimed_at)
  values(new.id,new.user_id,new.created_at)
  on conflict (material_id) do nothing;
  return new;
end;
$ledger$;
revoke all on function public.remember_study_material_v2_upload()
  from public, anon, authenticated;
drop trigger if exists trg_remember_study_material_v2_upload on public.student_materials;
create trigger trg_remember_study_material_v2_upload
after insert on public.student_materials for each row
execute function public.remember_study_material_v2_upload();

-- El navegador puede llamar directamente a Supabase con JWT. Por eso la
-- validación de cupos no puede depender sólo de Server Actions / rutas Next.js.
-- Los siguientes triggers se instalan junto con el lanzamiento de Free V2.
-- Ambos flujos legítimos de carga (PDF/DOCX y PDF-first) usan la misma tabla.

create or replace function public.free_study_v2_is_premium_account(p_user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $paid$
  select exists (
    select 1
    from public.user_subscriptions s
    join public.subscription_plans p on p.id = s.plan_id
    where s.user_id = p_user_id and p.code = 'premium'
      and (
        (pg_catalog.lower(s.status) in ('active','approved','authorized','trialing')
          and (s.expires_at is null or s.expires_at > pg_catalog.now()))
        or (pg_catalog.lower(s.status) = 'canceled'
          and s.expires_at > pg_catalog.now())
      )
  );
$paid$;
revoke all on function public.free_study_v2_is_premium_account(uuid)
  from public, anon, authenticated;
grant execute on function public.free_study_v2_is_premium_account(uuid)
  to service_role;

-- Transacción serializada por estudiante: dos solicitudes simultáneas no
-- pueden gastar el mismo cupo de un material o evadir los 3 diarios Premium.
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
    select 1 from public.free_study_v2_upload_claims c where c.user_id = new.user_id
  ) or exists (
    select 1 from public.student_materials m
    where m.user_id = new.user_id and m.processing_status <> 'failed'
  ) then
    raise exception 'free_v2_lifetime_upload_limit' using errcode = 'P0001';
  end if;

  -- Un cliente autenticado no debe poder falsificar created_at para evadir
  -- el conteo Premium del día UTC.
  new.created_at := pg_catalog.now();
  return new;
end;
$guard_insert$;
revoke all on function public.guard_free_study_v2_material_insert()
  from public, anon, authenticated;
drop trigger if exists trg_guard_free_study_v2_material_insert on public.student_materials;
create trigger trg_guard_free_study_v2_material_insert
before insert on public.student_materials for each row
execute function public.guard_free_study_v2_material_insert();

-- Reintentar el mismo primer archivo fallido está permitido, pero convertir
-- otro registro fallido en listo no puede regalar un segundo archivo Free.
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
    and (
      exists (
        select 1 from public.free_study_v2_upload_claims c
        where c.user_id = new.user_id and c.first_material_id <> new.id
      )
      or exists (
        select 1 from public.student_materials m
        where m.user_id = new.user_id and m.id <> new.id
          and m.processing_status <> 'failed'
      )
    )
  then
    raise exception 'free_v2_lifetime_upload_limit' using errcode = 'P0001';
  end if;
  return new;
end;
$guard_retry$;
revoke all on function public.guard_free_study_v2_failed_material_retry()
  from public, anon, authenticated;
drop trigger if exists trg_guard_free_study_v2_failed_retry on public.student_materials;
create trigger trg_guard_free_study_v2_failed_retry
before update of processing_status on public.student_materials
for each row
when (old.processing_status = 'failed' and new.processing_status <> 'failed')
execute function public.guard_free_study_v2_failed_material_retry();
),
  payload jsonb not null check (jsonb_typeof(payload) = 'array'),
  created_at timestamptz not null default now(),
  primary key (user_id, material_id, mode)
);

alter table public.free_study_v2_banks enable row level security;
revoke all on public.free_study_v2_banks from public, anon, authenticated;
grant select, insert on public.free_study_v2_banks to service_role;

-- El navegador puede llamar directamente a Supabase con JWT. Por eso la
-- validación de cupos no puede depender sólo de Server Actions / rutas Next.js.
-- Los siguientes triggers se instalan junto con el lanzamiento de Free V2.
-- Ambos flujos legítimos de carga (PDF/DOCX y PDF-first) usan la misma tabla.

create or replace function public.free_study_v2_is_premium_account(p_user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $paid$
  select exists (
    select 1
    from public.user_subscriptions s
    join public.subscription_plans p on p.id = s.plan_id
    where s.user_id = p_user_id and p.code = 'premium'
      and (
        (pg_catalog.lower(s.status) in ('active','approved','authorized','trialing')
          and (s.expires_at is null or s.expires_at > pg_catalog.now()))
        or (pg_catalog.lower(s.status) = 'canceled'
          and s.expires_at > pg_catalog.now())
      )
  );
$paid$;
revoke all on function public.free_study_v2_is_premium_account(uuid)
  from public, anon, authenticated;
grant execute on function public.free_study_v2_is_premium_account(uuid)
  to service_role;

-- Transacción serializada por estudiante: dos solicitudes simultáneas no
-- pueden gastar el mismo cupo de un material o evadir los 3 diarios Premium.
create or replace function public.guard_free_study_v2_material_insert()
returns trigger language plpgsql security definer set search_path = ''
as $guard_insert$
declare
  v_unlimited boolean;
  v_daily integer;
begin
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
    from public.student_materials m
    where m.user_id = new.user_id
      and m.created_at >= (pg_catalog.date_trunc('day', pg_catalog.now() at time zone 'UTC') at time zone 'UTC');
    if v_daily >= 3 then
      raise exception 'premium_daily_upload_limit' using errcode = 'P0001';
    end if;
  elsif exists (
    select 1 from public.free_study_v2_upload_claims c where c.user_id = new.user_id
  ) or exists (
    select 1 from public.student_materials m
    where m.user_id = new.user_id and m.processing_status <> 'failed'
  ) then
    raise exception 'free_v2_lifetime_upload_limit' using errcode = 'P0001';
  end if;

  -- Un cliente autenticado no debe poder falsificar created_at para evadir
  -- el conteo Premium del día UTC.
  new.created_at := pg_catalog.now();
  return new;
end;
$guard_insert$;
revoke all on function public.guard_free_study_v2_material_insert()
  from public, anon, authenticated;
drop trigger if exists trg_guard_free_study_v2_material_insert on public.student_materials;
create trigger trg_guard_free_study_v2_material_insert
before insert on public.student_materials for each row
execute function public.guard_free_study_v2_material_insert();

-- Reintentar el mismo primer archivo fallido está permitido, pero convertir
-- otro registro fallido en listo no puede regalar un segundo archivo Free.
create or replace function public.guard_free_study_v2_failed_material_retry()
returns trigger language plpgsql security definer set search_path = ''
as $guard_retry$
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('free-v2-material:' || new.user_id::text, 0)
  );

  if not public.free_study_v2_is_premium_account(new.user_id)
    and not exists (
      select 1 from public.profiles p
      where p.id = new.user_id and p.student_material_uploads_unlimited
    )
    and (
      exists (
        select 1 from public.free_study_v2_upload_claims c
        where c.user_id = new.user_id and c.first_material_id <> new.id
      )
      or exists (
        select 1 from public.student_materials m
        where m.user_id = new.user_id and m.id <> new.id
          and m.processing_status <> 'failed'
      )
    )
  then
    raise exception 'free_v2_lifetime_upload_limit' using errcode = 'P0001';
  end if;
  return new;
end;
$guard_retry$;
revoke all on function public.guard_free_study_v2_failed_material_retry()
  from public, anon, authenticated;
drop trigger if exists trg_guard_free_study_v2_failed_retry on public.student_materials;
create trigger trg_guard_free_study_v2_failed_retry
before update of processing_status on public.student_materials
for each row
when (old.processing_status = 'failed' and new.processing_status <> 'failed')
execute function public.guard_free_study_v2_failed_material_retry();
