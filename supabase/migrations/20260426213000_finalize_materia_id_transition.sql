alter table public.user_favorites
  alter column subject_id drop not null;

create index if not exists idx_resumenes_materia_id
  on public.resumenes (materia_id);

create index if not exists idx_user_favorites_materia_id
  on public.user_favorites (materia_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'resumenes_materia_id_fkey'
  ) then
    alter table public.resumenes
      add constraint resumenes_materia_id_fkey
      foreign key (materia_id) references public.materias (id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_favorites_materia_id_fkey'
  ) then
    alter table public.user_favorites
      add constraint user_favorites_materia_id_fkey
      foreign key (materia_id) references public.materias (id);
  end if;
end $$;
