alter table public.study_calendar_events
  add column if not exists material_id uuid null
  references public.student_materials(id) on delete set null;

create index if not exists idx_study_calendar_events_user_material
  on public.study_calendar_events(user_id, material_id)
  where material_id is not null;

comment on column public.study_calendar_events.material_id is
  'PDF/material concreto que originó el evento de examen, cuando existe.';
