alter table public.preguntas_banco
  add column if not exists dificultad text,
  add column if not exists tasa_acierto numeric(5,2);

create table if not exists public.question_edit_audit (
  id uuid primary key default gen_random_uuid(),
  pregunta_id uuid not null references public.preguntas_banco(id) on delete cascade,
  admin_user_id uuid references auth.users(id) on delete set null,
  before_payload jsonb,
  after_payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.rag_explanation_feedback (
  id uuid primary key default gen_random_uuid(),
  pregunta_id uuid not null references public.preguntas_banco(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  voto smallint not null check (voto in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (pregunta_id, user_id)
);

create table if not exists public.admin_alert_logs (
  id uuid primary key default gen_random_uuid(),
  alert_key text not null,
  severity text not null,
  message text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.question_edit_audit enable row level security;
alter table public.rag_explanation_feedback enable row level security;
alter table public.admin_alert_logs enable row level security;

drop policy if exists question_edit_audit_admin_only on public.question_edit_audit;
drop policy if exists rag_explanation_feedback_read_admin on public.rag_explanation_feedback;
drop policy if exists rag_explanation_feedback_insert_own on public.rag_explanation_feedback;
drop policy if exists rag_explanation_feedback_update_own on public.rag_explanation_feedback;
drop policy if exists rag_explanation_feedback_delete_own on public.rag_explanation_feedback;
drop policy if exists admin_alert_logs_admin_only on public.admin_alert_logs;

create policy question_edit_audit_admin_only
on public.question_edit_audit
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy rag_explanation_feedback_read_admin
on public.rag_explanation_feedback
for select
using (public.current_user_is_admin());

create policy rag_explanation_feedback_insert_own
on public.rag_explanation_feedback
for insert
with check (auth.uid() = user_id);

create policy rag_explanation_feedback_update_own
on public.rag_explanation_feedback
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy rag_explanation_feedback_delete_own
on public.rag_explanation_feedback
for delete
using (auth.uid() = user_id);

create policy admin_alert_logs_admin_only
on public.admin_alert_logs
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

