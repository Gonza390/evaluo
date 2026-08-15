-- Archivo y purga de analytics_events: la tabla principal no crece sin límite.
-- Estrategia: particionado lógico por antigüedad (tabla de archivo + purga por lotes),
-- invocada por cron interno (Vercel). Evita recrear la tabla (riesgo alto) y
-- evita DELETE masivo que bloquee la tabla.

create table if not exists public.analytics_events_archive (
  id uuid primary key,
  event_name text not null,
  user_id uuid null,
  session_key text not null,
  path text,
  device_type text,
  metadata jsonb,
  created_at timestamptz not null,
  archived_at timestamptz not null default now()
);

create index if not exists analytics_events_archive_created_at_idx
on public.analytics_events_archive (created_at desc);

alter table public.analytics_events_archive enable row level security;

drop policy if exists analytics_events_archive_admin_read on public.analytics_events_archive;
create policy analytics_events_archive_admin_read
on public.analytics_events_archive
for select
using (public.current_user_is_admin());

drop policy if exists analytics_events_archive_no_client_write on public.analytics_events_archive;
create policy analytics_events_archive_no_client_write
on public.analytics_events_archive
for insert
with check (false);

create or replace function public.archive_analytics_events(
  p_retention_days int default 180,
  p_batch_size int default 1000,
  p_max_batches int default 100
)
returns table (archived_rows bigint, remaining_in_main bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_start timestamptz := clock_timestamp() - make_interval(days => p_retention_days);
  v_batch_limit int := greatest(1, least(p_batch_size, 10000));
  v_max_batches int := greatest(1, p_max_batches);
  v_archived bigint := 0;
  v_remaining bigint := 0;
  v_batch_id uuid;
  v_batch_rows bigint;
begin
  if p_retention_days < 30 then
    raise exception 'Retention demasiado agresiva: % días (mínimo 30).', p_retention_days;
  end if;

  for v_batch in 1..v_max_batches loop
    create temp table tmp_archive_batch on commit drop as
    select e.id, e.event_name, e.user_id, e.session_key, e.path, e.device_type, e.metadata, e.created_at
    from public.analytics_events e
    where e.created_at < v_batch_start
    order by e.created_at asc
    limit v_batch_limit
    for update of e skip locked;

    get diagnostics v_batch_rows = row_count;
    exit when v_batch_rows = 0;

    insert into public.analytics_events_archive
      (id, event_name, user_id, session_key, path, device_type, metadata, created_at, archived_at)
    select id, event_name, user_id, session_key, path, device_type, metadata, created_at, now()
    from tmp_archive_batch;

    delete from public.analytics_events e
    using tmp_archive_batch t
    where e.id = t.id;

    v_archived := v_archived + v_batch_rows;
    drop table tmp_archive_batch;
  end loop;

  select count(*) into v_remaining from public.analytics_events;
  return query select v_archived, v_remaining;
end;
$$;

revoke all on function public.archive_analytics_events(integer, integer, integer) from public;
revoke all on function public.archive_analytics_events(integer, integer, integer) from anon;
revoke all on function public.archive_analytics_events(integer, integer, integer) from authenticated;
