alter table if exists public.study_calendar_events
  add column if not exists materia_id uuid null references public.materias(id) on delete set null,
  add column if not exists materia_nombre text null,
  add column if not exists carrera_id uuid null references public.carreras(id) on delete set null,
  add column if not exists carrera_nombre text null,
  add column if not exists exam_instance text null check (exam_instance in ('1', '2', 'integrador')),
  add column if not exists source_payload jsonb null default '{}'::jsonb;

create index if not exists study_calendar_events_carrera_date_idx
  on public.study_calendar_events(carrera_id, event_date asc);

create index if not exists study_calendar_events_materia_date_idx
  on public.study_calendar_events(materia_id, event_date asc);
