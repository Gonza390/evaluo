create table if not exists public.rag_document_chunks (
  id uuid primary key default gen_random_uuid(),
  materia_id uuid references public.materias(id) on delete cascade,
  source_table text not null,
  source_id uuid,
  source_title text,
  chunk_index integer not null,
  chunk_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists rag_document_chunks_materia_idx
on public.rag_document_chunks (materia_id);

create table if not exists public.rag_explanations_cache (
  id uuid primary key default gen_random_uuid(),
  pregunta_id uuid not null references public.preguntas_banco(id) on delete cascade,
  materia_id uuid references public.materias(id) on delete cascade,
  parcial integer,
  explicacion text not null,
  provider text,
  source_used text,
  updated_at timestamptz not null default now(),
  unique (pregunta_id)
);

create index if not exists rag_explanations_cache_materia_idx
on public.rag_explanations_cache (materia_id);

create table if not exists public.rag_generation_logs (
  id uuid primary key default gen_random_uuid(),
  pregunta_id uuid references public.preguntas_banco(id) on delete set null,
  materia_id uuid references public.materias(id) on delete set null,
  provider text,
  status text not null,
  error_message text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.rag_question_stats (
  id uuid primary key default gen_random_uuid(),
  pregunta_id uuid not null references public.preguntas_banco(id) on delete cascade,
  materia_id uuid references public.materias(id) on delete cascade,
  veces_fallada integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (pregunta_id)
);

alter table public.rag_document_chunks enable row level security;
alter table public.rag_explanations_cache enable row level security;
alter table public.rag_generation_logs enable row level security;
alter table public.rag_question_stats enable row level security;

drop policy if exists rag_document_chunks_read_authenticated on public.rag_document_chunks;
drop policy if exists rag_document_chunks_write_admin on public.rag_document_chunks;
drop policy if exists rag_explanations_cache_read_authenticated on public.rag_explanations_cache;
drop policy if exists rag_explanations_cache_write_admin on public.rag_explanations_cache;
drop policy if exists rag_generation_logs_admin_only on public.rag_generation_logs;
drop policy if exists rag_question_stats_read_admin on public.rag_question_stats;
drop policy if exists rag_question_stats_write_admin on public.rag_question_stats;

create policy rag_document_chunks_read_authenticated
on public.rag_document_chunks
for select
using (
  auth.role() = 'authenticated'
  or public.current_user_is_admin()
);

create policy rag_document_chunks_write_admin
on public.rag_document_chunks
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy rag_explanations_cache_read_authenticated
on public.rag_explanations_cache
for select
using (
  auth.role() = 'authenticated'
  or public.current_user_is_admin()
);

create policy rag_explanations_cache_write_admin
on public.rag_explanations_cache
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy rag_generation_logs_admin_only
on public.rag_generation_logs
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy rag_question_stats_read_admin
on public.rag_question_stats
for select
using (public.current_user_is_admin());

create policy rag_question_stats_write_admin
on public.rag_question_stats
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

