do $$ begin
  alter table public.facultades add constraint facultades_approval_status_check check (approval_status in ('approved','pending','rejected'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.carreras add constraint carreras_approval_status_check check (approval_status in ('approved','pending','rejected'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.materias add constraint materias_approval_status_check check (approval_status in ('approved','pending','rejected'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.carrera_materias add constraint carrera_materias_approval_status_check check (approval_status in ('approved','pending','rejected'));
exception when duplicate_object then null; end $$;
