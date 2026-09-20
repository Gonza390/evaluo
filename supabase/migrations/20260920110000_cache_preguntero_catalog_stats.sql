-- Cache public Preguntero counts so catalog reads do not aggregate the full question bank.
-- The cache is maintained transactionally by triggers on preguntas_banco.

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

lock table public.preguntas_banco in share row exclusive mode;

create table if not exists private.preguntero_catalog_stats (
  materia_id uuid primary key references public.materias(id) on delete cascade,
  question_count bigint not null default 0 check (question_count >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists private.preguntero_catalog_parcial_stats (
  materia_id uuid not null references public.materias(id) on delete cascade,
  parcial bigint not null,
  question_count bigint not null default 0 check (question_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (materia_id, parcial)
);

revoke all on private.preguntero_catalog_stats from public, anon, authenticated;
revoke all on private.preguntero_catalog_parcial_stats from public, anon, authenticated;

truncate table
  private.preguntero_catalog_parcial_stats,
  private.preguntero_catalog_stats;

insert into private.preguntero_catalog_stats (materia_id, question_count, updated_at)
select
  pb.materia_id,
  count(*)::bigint,
  now()
from public.preguntas_banco pb
where pb.es_demo = false
  and pb.materia_id is not null
group by pb.materia_id;

insert into private.preguntero_catalog_parcial_stats (
  materia_id,
  parcial,
  question_count,
  updated_at
)
select
  pb.materia_id,
  pb.parcial,
  count(*)::bigint,
  now()
from public.preguntas_banco pb
where pb.es_demo = false
  and pb.materia_id is not null
  and pb.parcial is not null
group by pb.materia_id, pb.parcial;

create or replace function private.increment_preguntero_catalog_stats(
  p_materia_id uuid,
  p_parcial bigint
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
begin
  if p_materia_id is null then
    return;
  end if;

  insert into private.preguntero_catalog_stats (
    materia_id,
    question_count,
    updated_at
  )
  values (
    p_materia_id,
    1,
    now()
  )
  on conflict (materia_id) do update
  set
    question_count = private.preguntero_catalog_stats.question_count + 1,
    updated_at = excluded.updated_at;

  if p_parcial is not null then
    insert into private.preguntero_catalog_parcial_stats (
      materia_id,
      parcial,
      question_count,
      updated_at
    )
    values (
      p_materia_id,
      p_parcial,
      1,
      now()
    )
    on conflict (materia_id, parcial) do update
    set
      question_count = private.preguntero_catalog_parcial_stats.question_count + 1,
      updated_at = excluded.updated_at;
  end if;
end;
$$;

create or replace function private.decrement_preguntero_catalog_stats(
  p_materia_id uuid,
  p_parcial bigint
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  v_question_count bigint;
  v_parcial_count bigint;
begin
  if p_materia_id is null then
    return;
  end if;

  update private.preguntero_catalog_stats
  set
    question_count = greatest(question_count - 1, 0),
    updated_at = now()
  where materia_id = p_materia_id
  returning question_count into v_question_count;

  if v_question_count = 0 then
    delete from private.preguntero_catalog_stats
    where materia_id = p_materia_id
      and question_count = 0;
  end if;

  if p_parcial is not null then
    update private.preguntero_catalog_parcial_stats
    set
      question_count = greatest(question_count - 1, 0),
      updated_at = now()
    where materia_id = p_materia_id
      and parcial = p_parcial
    returning question_count into v_parcial_count;

    if v_parcial_count = 0 then
      delete from private.preguntero_catalog_parcial_stats
      where materia_id = p_materia_id
        and parcial = p_parcial
        and question_count = 0;
    end if;
  end if;
end;
$$;

create or replace function private.sync_preguntero_catalog_stats()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    if new.es_demo = false and new.materia_id is not null then
      perform private.increment_preguntero_catalog_stats(new.materia_id, new.parcial);
    end if;
    return null;
  end if;

  if tg_op = 'DELETE' then
    if old.es_demo = false and old.materia_id is not null then
      perform private.decrement_preguntero_catalog_stats(old.materia_id, old.parcial);
    end if;
    return null;
  end if;

  if old.materia_id is not distinct from new.materia_id
     and old.parcial is not distinct from new.parcial
     and old.es_demo is not distinct from new.es_demo then
    return null;
  end if;

  if old.es_demo = false and old.materia_id is not null then
    perform private.decrement_preguntero_catalog_stats(old.materia_id, old.parcial);
  end if;

  if new.es_demo = false and new.materia_id is not null then
    perform private.increment_preguntero_catalog_stats(new.materia_id, new.parcial);
  end if;

  return null;
end;
$$;

revoke all on function private.increment_preguntero_catalog_stats(uuid, bigint)
  from public, anon, authenticated;
revoke all on function private.decrement_preguntero_catalog_stats(uuid, bigint)
  from public, anon, authenticated;
revoke all on function private.sync_preguntero_catalog_stats()
  from public, anon, authenticated;

drop trigger if exists preguntas_banco_sync_preguntero_catalog_stats
  on public.preguntas_banco;

create trigger preguntas_banco_sync_preguntero_catalog_stats
after insert or update or delete
on public.preguntas_banco
for each row
execute function private.sync_preguntero_catalog_stats();

create or replace function public.get_public_preguntero_catalog()
returns table (
  universidad_id uuid,
  universidad_nombre text,
  carrera_id uuid,
  carrera_nombre text,
  materia_id uuid,
  materia_nombre text,
  question_count bigint,
  parciales bigint[]
)
language sql
stable
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
  with approved_links as (
    select cm.carrera_id, cm.materia_id
    from public.carrera_materias cm
    where cm.approval_status = 'approved'
      and cm.carrera_id is not null
      and cm.materia_id is not null
  ),
  question_stats as (
    select
      s.materia_id,
      s.question_count,
      coalesce(
        array_agg(ps.parcial order by ps.parcial)
          filter (where ps.parcial is not null),
        array[]::bigint[]
      ) as parciales
    from private.preguntero_catalog_stats s
    left join private.preguntero_catalog_parcial_stats ps
      on ps.materia_id = s.materia_id
     and ps.question_count > 0
    where s.question_count > 0
    group by s.materia_id, s.question_count
  )
  select
    u.id,
    u.nombre,
    c.id,
    c.nombre,
    m.id,
    m.nombre,
    qs.question_count,
    qs.parciales
  from approved_links l
  join public.carreras c
    on c.id = l.carrera_id
   and c.approval_status = 'approved'
  join public.universidades u
    on u.id = c.universidad_id
   and u.approval_status = 'approved'
  join public.materias m
    on m.id = l.materia_id
   and m.approval_status = 'approved'
  join question_stats qs
    on qs.materia_id = m.id;
$$;

grant execute on function public.get_public_preguntero_catalog()
  to anon, authenticated, service_role;
