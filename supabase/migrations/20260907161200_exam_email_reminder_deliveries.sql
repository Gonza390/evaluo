create table if not exists public.email_reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  materia_id uuid not null references public.materias(id) on delete cascade,
  material_id uuid not null references public.student_materials(id) on delete cascade,
  exam_date date not null,
  reminder_days smallint not null check (reminder_days in (1, 3, 7)),
  status text not null default 'sending' check (status in ('sending', 'sent')),
  sender_email_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, materia_id, exam_date, reminder_days)
);

alter table public.email_reminder_deliveries enable row level security;

create index if not exists email_reminder_deliveries_user_date_idx
  on public.email_reminder_deliveries (user_id, exam_date desc);

create index if not exists email_reminder_deliveries_sent_at_idx
  on public.email_reminder_deliveries (sent_at desc)
  where sent_at is not null;
