-- Datos de contacto y año de carrera para el perfil del estudiante.
alter table public.profiles
  add column if not exists pais text,
  add column if not exists telefono text,
  add column if not exists anio_carrera text;

comment on column public.profiles.pais is 'País desde el que estudia el usuario.';
comment on column public.profiles.telefono is 'Número de teléfono de contacto del usuario.';
comment on column public.profiles.anio_carrera is 'Año de la carrera que está cursando (1-6).';