do $$
declare
  materia_col_type text;
begin
  select data_type
  into materia_col_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'preguntas_banco'
    and column_name = 'materia_id';

  -- If it's already uuid, ensure FK + index and finish.
  if materia_col_type = 'uuid' then
    begin
      alter table public.preguntas_banco
        add constraint preguntas_banco_materia_id_fkey
        foreign key (materia_id) references public.materias(id) on delete set null;
    exception
      when duplicate_object then
        null;
    end;

    create index if not exists idx_preguntas_banco_materia_id
      on public.preguntas_banco (materia_id);

    return;
  end if;

  -- Text -> uuid migration
  alter table public.preguntas_banco
    add column if not exists materia_id_uuid uuid;

  update public.preguntas_banco
  set materia_id_uuid =
    case
      when materia_id is null then null
      when trim(materia_id) = '' then null
      when materia_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then materia_id::uuid
      else null
    end
  where materia_id_uuid is null;

  alter table public.preguntas_banco
    drop constraint if exists preguntas_banco_materia_id_fkey;

  alter table public.preguntas_banco
    drop column if exists materia_id;

  alter table public.preguntas_banco
    rename column materia_id_uuid to materia_id;

  alter table public.preguntas_banco
    add constraint preguntas_banco_materia_id_fkey
    foreign key (materia_id) references public.materias(id) on delete set null;

  create index if not exists idx_preguntas_banco_materia_id
    on public.preguntas_banco (materia_id);
end $$;

