-- Muestra de preguntas de /pregunteros (lib/data/preguntero.ts) y consultas del
-- simulador y de errores: filtran por materia_id + es_demo y ordenan por
-- creado_at. Con varios parciales (parcial = ANY) el índice (materia_id, parcial,
-- creado_at) no sirve para ordenar y el planner recorría idx_preguntas_banco_creado_at_desc
-- descartando ~26K filas: 148 ms de promedio, la consulta más cara de la base
-- desde el 08/11. Probado en copia temporal con plan genérico (como PostgREST):
-- 26 ms -> 0,07 ms. No es parcial (es_demo como columna) para que también lo use
-- el plan genérico con es_demo = $1. Tabla de ~20 MB: se crea en segundos.

create index if not exists idx_preguntas_banco_materia_demo_creado
  on public.preguntas_banco (materia_id, es_demo, creado_at desc);
