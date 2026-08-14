-- Historial de explicaciones IA (premium)
create table if not exists public.explanations_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  materia_id uuid null references public.materias(id) on delete set null,
  materia_nombre text,
  parcial integer,
  pregunta_id text,
  enunciado text not null,
  explicacion text not null,
  provider text,
  created_at timestamptz not null default now()
);

create index if not exists explanations_history_user_created_idx
on public.explanations_history (user_id, created_at desc);

create index if not exists explanations_history_user_materia_idx
on public.explanations_history (user_id, materia_id);

-- Recordatorios pre-parcial (premium)
alter table if exists public.study_calendar_events
  add column if not exists reminder_days_before jsonb null;

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid null references public.study_calendar_events(id) on delete cascade,
  type text not null default 'exam_reminder',
  title text not null,
  body text not null,
  materia_nombre text,
  event_date text,
  days_before integer,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  seen_at timestamptz,
  unique (user_id, event_id, days_before)
);

create index if not exists user_notifications_user_status_idx
on public.user_notifications (user_id, status);

create index if not exists user_notifications_user_created_idx
on public.user_notifications (user_id, created_at desc);

-- RLS: historial de explicaciones
alter table public.explanations_history enable row level security;
alter table public.user_notifications enable row level security;

drop policy if exists explanations_history_select_own on public.explanations_history;
drop policy if exists explanations_history_admin_all on public.explanations_history;

create policy explanations_history_select_own
on public.explanations_history
for select
using (auth.uid() = user_id);

create policy explanations_history_admin_all
on public.explanations_history
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

-- RLS: notificaciones (lectura propia, escritura propia para cerrar recordatorios)
drop policy if exists user_notifications_select_own on public.user_notifications;
drop policy if exists user_notifications_write_own on public.user_notifications;
drop policy if exists user_notifications_admin_all on public.user_notifications;

create policy user_notifications_select_own
on public.user_notifications
for select
using (auth.uid() = user_id);

create policy user_notifications_write_own
on public.user_notifications
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy user_notifications_admin_all
on public.user_notifications
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());
