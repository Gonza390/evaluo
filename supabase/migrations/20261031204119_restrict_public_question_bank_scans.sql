-- La vista histórica permitía a cualquier cliente con clave publishable
-- recorrer las 23k+ preguntas públicas en bloques de 1.000 filas.
-- Las páginas SSR consultan ahora muestras acotadas (10 por materia/parcial)
-- con service_role, y los conteos públicos usan RPC de estadísticas agregadas.
-- Ningún alumno necesita SELECT sin filtro directo sobre esta vista.
--
-- IMPORTANTE: desplegar el código de main antes de aplicar esta migración.
-- Reversible de forma controlada con:
--   GRANT SELECT ON public.preguntas_banco_public TO anon, authenticated;
-- No modificar políticas RLS ni el banco original.
revoke all on public.preguntas_banco_public from public, anon, authenticated;
-- service_role mantiene la lectura administrativa:
grant select on public.preguntas_banco_public to service_role;
