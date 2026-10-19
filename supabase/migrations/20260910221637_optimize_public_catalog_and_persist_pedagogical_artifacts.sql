create or replace function public.get_catalog_content_signals()
returns table (
  materia_id uuid,
  has_questions boolean,
  has_summary boolean,
  has_resources boolean,
  has_shared_material boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id as materia_id,
    exists(select 1 from public.preguntas_banco_public p where p.materia_id = m.id) as has_questions,
    exists(select 1 from public.resumenes s where s.materia_id = m.id) as has_summary,
    exists(select 1 from public.recursos r where r.materia_id = m.id::text) as has_resources,
    exists(
      select 1
      from public.student_materials sm
      where sm.materia_id = m.id
        and sm.visibility = 'shared'
        and sm.processing_status = 'ready'
    ) as has_shared_material
  from public.materias m
  where m.approval_status = 'approved'
    and (
      exists(select 1 from public.preguntas_banco_public p where p.materia_id = m.id)
      or exists(select 1 from public.resumenes s where s.materia_id = m.id)
      or exists(select 1 from public.recursos r where r.materia_id = m.id::text)
      or exists(
        select 1
        from public.student_materials sm
        where sm.materia_id = m.id
          and sm.visibility = 'shared'
          and sm.processing_status = 'ready'
      )
    );
$$;

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
set search_path = public
as $$
  with approved_links as (
    select distinct cm.carrera_id, cm.materia_id
    from public.carrera_materias cm
    where cm.approval_status = 'approved'
      and cm.carrera_id is not null
      and cm.materia_id is not null
  ), question_stats as (
    select
      p.materia_id,
      count(*)::bigint as question_count,
      array_agg(distinct p.parcial order by p.parcial) filter (where p.parcial is not null) as parciales
    from public.preguntas_banco_public p
    where p.materia_id is not null
    group by p.materia_id
  )
  select
    u.id,
    u.nombre,
    c.id,
    c.nombre,
    m.id,
    m.nombre,
    qs.question_count,
    coalesce(qs.parciales, array[]::bigint[])
  from approved_links l
  join public.carreras c on c.id = l.carrera_id and c.approval_status = 'approved'
  join public.universidades u on u.id = c.universidad_id and u.approval_status = 'approved'
  join public.materias m on m.id = l.materia_id and m.approval_status = 'approved'
  join question_stats qs on qs.materia_id = m.id;
$$;

grant execute on function public.get_catalog_content_signals() to anon, authenticated, service_role;
grant execute on function public.get_public_preguntero_catalog() to anon, authenticated, service_role;

alter table public.student_materials
  add column if not exists pedagogical_artifacts jsonb;

comment on column public.student_materials.pedagogical_artifacts is
  'Persisted deterministic study artifacts derived from pedagogical_model/chunks to avoid rebuilding on every material read.';
