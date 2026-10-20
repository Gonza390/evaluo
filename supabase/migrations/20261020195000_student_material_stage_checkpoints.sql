-- Checkpoints privados de procesamiento. Nunca exponer el texto OCR en la API pública.
-- OCR persistido por página para reintentar solamente las páginas faltantes.
create table if not exists public.student_material_ocr_pages (
  student_material_id uuid not null references public.student_materials(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  file_sha256 text not null check (length(file_sha256) = 64),
  origin text not null check (origin in ('vision', 'blank')),
  content text not null,
  confidence text check (confidence in ('alta', 'media', 'baja')),
  has_math boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (student_material_id, page_number)
);

create table if not exists public.student_material_processing_checkpoints (
  student_material_id uuid primary key references public.student_materials(id) on delete cascade,
  file_sha256 text not null check (length(file_sha256) = 64),
  pipeline_version text not null,
  stage text not null check (stage in ('source_ready', 'model_ready')),
  source_payload jsonb not null check (jsonb_typeof(source_payload) = 'object'),
  updated_at timestamptz not null default now()
);

create index if not exists student_material_ocr_pages_file_idx
  on public.student_material_ocr_pages(student_material_id, file_sha256);
create index if not exists student_material_checkpoint_updated_idx
  on public.student_material_processing_checkpoints(updated_at);

alter table public.student_material_ocr_pages enable row level security;
alter table public.student_material_processing_checkpoints enable row level security;

revoke all on public.student_material_ocr_pages from anon, authenticated;
revoke all on public.student_material_processing_checkpoints from anon, authenticated;
grant all on public.student_material_ocr_pages to service_role;
grant all on public.student_material_processing_checkpoints to service_role;
