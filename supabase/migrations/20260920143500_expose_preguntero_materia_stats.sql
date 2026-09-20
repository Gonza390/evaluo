create or replace function public.get_public_preguntero_materia_stats(
  p_materia_id uuid
)
returns table (
  question_count bigint,
  parcial_counts jsonb
)
language sql
stable
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
  select
    coalesce(s.question_count, 0)::bigint as question_count,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'parcial', ps.parcial,
          'count', ps.question_count
        )
        order by ps.parcial
      ) filter (
        where ps.parcial is not null
          and ps.question_count > 0
      ),
      '[]'::jsonb
    ) as parcial_counts
  from (select p_materia_id as materia_id) input
  left join private.preguntero_catalog_stats s
    on s.materia_id = input.materia_id
   and s.question_count > 0
  left join private.preguntero_catalog_parcial_stats ps
    on ps.materia_id = input.materia_id
   and ps.question_count > 0
  group by s.question_count;
$$;

grant execute on function public.get_public_preguntero_materia_stats(uuid)
  to anon, authenticated, service_role;
