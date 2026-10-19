-- Harden de RLS / RPC de seguridad (2026-08-16)
--
-- Cierra tres exposiciones detectadas en auditoría:
-- 1) RLS-02: rag_document_chunks / rag_explanations_cache legibles por CUALQUIER
--    usuario autenticado (fuga del corpus de estudio y de explicaciones que
--    derivan de respuesta_correcta). El código productivo lee esas tablas solo
--    con service_role (createAdminClient), así que restringir el SELECT a admin
--    no rompe ningún flujo.
-- 2) RLS-03: resource_votes / resumen_votes con SELECT público (using true)
--    exponen user_id de cada votante. El frontend solo hace upsert de sus
--    propios votos (auth.uid() = user_id) y lee conteos desde
--    get_resource_vote_summaries / resumenes.score; cerrar el SELECT público
--    no rompe la UI.
-- 3) SEC-02: get_resource_vote_summaries (security definer) ejecutable por anon
--    con p_user_id arbitrario (oráculo de votos por usuario). Se revoca anon y
--    p_user_id se deriva de auth.uid() dentro de la función.

begin;

-- ============================================================
-- 1) RLS-02: cerrar lectura pública de rag_*
-- ============================================================
drop policy if exists rag_document_chunks_read_authenticated on public.rag_document_chunks;
drop policy if exists rag_explanations_cache_read_authenticated on public.rag_explanations_cache;

create policy rag_document_chunks_read_admin_only
on public.rag_document_chunks
for select
using (public.current_user_is_admin());

create policy rag_explanations_cache_read_admin_only
on public.rag_explanations_cache
for select
using (public.current_user_is_admin());

-- ============================================================
-- 2) RLS-03: cerrar SELECT público de votos
-- ============================================================
drop policy if exists resource_votes_select_public on public.resource_votes;
create policy resource_votes_select_own_or_admin
on public.resource_votes
for select
using (
  auth.uid() = user_id
  or public.current_user_is_admin()
);

drop policy if exists resumen_votes_select_public on public.resumen_votes;
create policy resumen_votes_select_own_or_admin
on public.resumen_votes
for select
using (
  auth.uid() = user_id
  or public.current_user_is_admin()
);

-- ============================================================
-- 3) SEC-02: RPC de votos sin oráculo por usuario
-- ============================================================
create or replace function public.get_resource_vote_summaries(
  p_resource_ids uuid[],
  p_user_id uuid default null
)
returns table (
  resource_id uuid,
  likes bigint,
  dislikes bigint,
  score bigint,
  user_vote smallint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    v.resource_id,
    count(*) filter (where v.vote_type = 1) as likes,
    count(*) filter (where v.vote_type = -1) as dislikes,
    count(*) filter (where v.vote_type = 1) - count(*) filter (where v.vote_type = -1) as score,
    coalesce(
      max(case when v.user_id = auth.uid() then v.vote_type end),
      0
    )::smallint as user_vote
  from public.resource_votes v
  where v.resource_id = any(p_resource_ids)
  group by v.resource_id;
$$;

revoke all on function public.get_resource_vote_summaries(uuid[], uuid) from public;
grant execute on function public.get_resource_vote_summaries(uuid[], uuid) to authenticated;
grant execute on function public.get_resource_vote_summaries(uuid[], uuid) to service_role;
-- anon revocado: no puede consultar votos de terceros; el parámetro p_user_id
-- queda obsoleto y se ignora (el voto propio sale de auth.uid()).

commit;
