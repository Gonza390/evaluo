alter table public.student_materials
  add column if not exists exam_instance text null,
  add column if not exists exam_date date null;

alter table public.student_materials
  drop constraint if exists student_materials_exam_instance_check;

alter table public.student_materials
  add constraint student_materials_exam_instance_check
  check (exam_instance is null or exam_instance in ('parcial_1', 'parcial_2', 'final', 'otro'));
