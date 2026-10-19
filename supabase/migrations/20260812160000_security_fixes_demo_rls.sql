-- Security fixes: C1 demo questions, C2 premium RLS, C3 resource_views
-- 1) Demo simulador sin cuenta: columna es_demo + policy de lectura anonima acotada.
alter table public.preguntas_banco
  add column if not exists es_demo boolean not null default false;

create policy preguntas_banco_read_demo
on public.preguntas_banco
for select
to public
using (es_demo = true);

-- Backfill: muestra minima (~3 por materia+parcial) solo en las 20 materias con mas preguntas.
with top_materias as (
  select materia_id
  from public.preguntas_banco
  where materia_id is not null
  group by materia_id
  order by count(*) desc
  limit 20
),
candidates as (
  select pb.id,
         row_number() over (
           partition by pb.materia_id, pb.parcial
           order by char_length(pb.enunciado) asc, pb.creado_at desc
         ) as rn
  from public.preguntas_banco pb
  inner join top_materias tm on tm.materia_id = pb.materia_id
  where pb.parcial in (1, 2, 3)
    and char_length(pb.enunciado) between 15 and 400
    and coalesce(pb.respuesta_correcta, '') <> ''
)
update public.preguntas_banco
set es_demo = true
where id in (select id from candidates where rn <= 3);

-- 2) Premium: restringir lectura de preguntas y sets premium a usuarios premium o admin.
drop policy if exists premium_questions_read_authenticated on public.premium_questions;
create policy premium_questions_read_premium
on public.premium_questions
for select
to authenticated
using (
  public.current_user_is_admin()
  or exists (
    select 1
    from public.user_subscriptions s
    where s.user_id = auth.uid()
      and lower(s.status) in ('active', 'trialing', 'approved')
      and (s.expires_at is null or s.expires_at > now())
      and exists (
        select 1
        from public.subscription_plans p
        where p.id = s.plan_id and p.code = 'premium'
      )
  )
);

drop policy if exists premium_sets_read_authenticated on public.premium_question_sets;
create policy premium_sets_read_premium
on public.premium_question_sets
for select
to authenticated
using (
  public.current_user_is_admin()
  or exists (
    select 1
    from public.user_subscriptions s
    where s.user_id = auth.uid()
      and lower(s.status) in ('active', 'trialing', 'approved')
      and (s.expires_at is null or s.expires_at > now())
      and exists (
        select 1
        from public.subscription_plans p
        where p.id = s.plan_id and p.code = 'premium'
      )
  )
);

-- 3) resource_views: ocultar filas crudas (user_id) al publico; solo owner/admin leen.
--    Los conteos publicos se sirven via vista agregada sin datos personales.
drop policy if exists resource_views_select_public on public.resource_views;
create policy resource_views_select_own_or_admin
on public.resource_views
for select
to public
using (
  user_id = auth.uid()
  or public.current_user_is_admin()
);

create or replace view public.resource_view_counts as
select resource_id, count(*) as views
from public.resource_views
group by resource_id;

grant select on public.resource_view_counts to anon, authenticated;
