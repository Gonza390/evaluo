-- Los materiales de alumnos son privados salvo consentimiento explícito.
alter table public.student_materials
  alter column visibility set default 'private';

comment on column public.student_materials.visibility is
  'Visibilidad del material. Private es el default seguro; shared requiere una acción explícita del propietario.';
