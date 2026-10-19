alter table public.student_materials
  add column if not exists description text;

update public.student_materials
set description = case
  when length(btrim(coalesce(title, ''))) >= 3 then btrim(title)
  else 'Material de estudio'
end
where description is null or btrim(description) = '';

alter table public.student_materials
  alter column description set default 'Sin descripción especificada';

alter table public.student_materials
  alter column description set not null;

alter table public.student_materials
  drop constraint if exists student_materials_description_length_check;

alter table public.student_materials
  add constraint student_materials_description_length_check
  check (char_length(btrim(description)) between 3 and 240);
