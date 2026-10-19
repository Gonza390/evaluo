-- Fase 3: Modelo pedagógico canónico.
-- pedagogical_model: JSONB con la estructura completa del documento (temas, conceptos, relaciones, etc).
alter table public.student_materials
  add column if not exists pedagogical_model jsonb;
