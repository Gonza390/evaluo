-- Fase 2: métricas de cobertura del PDF procesado.
-- pages_processed: páginas con texto útil extraído.
-- coverage_ratio: proporción 0-1 de páginas cubiertas sobre el total.
alter table public.student_materials
  add column if not exists pages_processed integer,
  add column if not exists coverage_ratio numeric(5,4);
