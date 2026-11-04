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
as $
begin
  if new.processing_status = 'ready' then
    insert into public.free_study_v2_upload_claims(user_id, first_material_id)
    values(new.user_id,new.id)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$;
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
  mode text not null check (mode in ('true_false','cases','matching','flashcards')),
  payload jsonb not null check (jsonb_typeof(payload) = 'array'),
  created_at timestamptz not null default now(),
  primary key (user_id, material_id, mode)
);

alter table public.free_study_v2_banks enable row level security;
revoke all on public.free_study_v2_banks from public, anon, authenticated;
grant select, insert on public.free_study_v2_banks to service_role;
