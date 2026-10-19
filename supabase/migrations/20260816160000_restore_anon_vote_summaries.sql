-- Restaura el acceso anon a get_resource_vote_summaries (2026-08-16).
--
-- El revoke de anon (20260816150000) rompió los conteos de votos en páginas
-- públicas: materia-content.tsx y recursos/[id]/page.tsx llaman al RPC con el
-- cliente browser incluso sin sesión. Restaurar el grant es SEGURO porque la
-- función ya deriva user_vote de auth.uid() (null para anon => user_vote 0) e
-- ignora p_user_id, así que un anónimo solo obtiene likes/dislikes/score
-- agregados, nunca el voto de un tercero (el oráculo de SEC-02 sigue cerrado).

begin;

grant execute on function public.get_resource_vote_summaries(uuid[], uuid) to anon;

commit;
