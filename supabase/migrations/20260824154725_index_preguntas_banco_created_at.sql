-- pg_stat_statements mostró esta lectura reciente con ~856 ms de media.
-- La vista preguntas_banco_public conserva creado_at y aprovecha el índice base.
create index if not exists idx_preguntas_banco_creado_at_desc
  on public.preguntas_banco (creado_at desc);
