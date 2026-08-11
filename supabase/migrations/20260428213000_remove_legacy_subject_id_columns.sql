update public.resumenes
set materia_id = coalesce(materia_id, subject_id)
where subject_id is not null;

update public.user_favorites
set materia_id = coalesce(materia_id, subject_id)
where subject_id is not null;

alter table public.resumenes
  drop constraint if exists resumenes_subject_id_fkey;

alter table public.user_favorites
  drop constraint if exists user_favorites_subject_id_fkey;

alter table public.resumenes
  drop column if exists subject_id;

alter table public.user_favorites
  drop column if exists subject_id;
