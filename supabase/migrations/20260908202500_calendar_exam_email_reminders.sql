alter table public.email_reminder_deliveries
  add column if not exists calendar_event_id uuid,
  add column if not exists source_type text not null default 'material',
  add column if not exists subject_key text;

update public.email_reminder_deliveries
set subject_key = 'materia:' || materia_id::text
where subject_key is null;

alter table public.email_reminder_deliveries
  alter column material_id drop not null,
  alter column materia_id drop not null,
  alter column subject_key set not null;

alter table public.email_reminder_deliveries
  drop constraint if exists email_reminder_deliveries_user_id_materia_id_exam_date_remi_key,
  drop constraint if exists email_reminder_deliveries_source_type_check,
  drop constraint if exists email_reminder_deliveries_material_id_fkey;

alter table public.email_reminder_deliveries
  add constraint email_reminder_deliveries_source_type_check
    check (source_type = any (array['material'::text, 'calendar'::text])),
  add constraint email_reminder_deliveries_material_id_fkey
    foreign key (material_id) references public.student_materials(id) on delete set null,
  add constraint email_reminder_deliveries_calendar_event_id_fkey
    foreign key (calendar_event_id) references public.study_calendar_events(id) on delete set null,
  add constraint email_reminder_deliveries_dedupe_key
    unique (user_id, subject_key, exam_date, reminder_days);

create index if not exists idx_email_reminder_deliveries_calendar_event_id
  on public.email_reminder_deliveries(calendar_event_id)
  where calendar_event_id is not null;
