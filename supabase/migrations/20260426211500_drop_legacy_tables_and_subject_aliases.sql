alter table public.resumenes
  add column if not exists materia_id uuid;

alter table public.user_favorites
  add column if not exists materia_id uuid;

update public.resumenes
set materia_id = subject_id
where materia_id is null
  and subject_id is not null;

update public.user_favorites
set materia_id = subject_id
where materia_id is null
  and subject_id is not null;

drop table if exists public.progreso;
drop table if exists public.pregunteros_ia;
drop table if exists public.contenidos;
drop table if exists public.configuracion_sistema;
drop table if exists public.configuracion;
drop table if exists public.career_subjects;
drop table if exists public.subjects;
drop table if exists public.careers;
