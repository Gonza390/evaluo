alter table public.student_materials
  alter column universidad_id drop not null,
  alter column carrera_id drop not null,
  alter column materia_id drop not null;

create or replace function public.enforce_private_pending_academic_material()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  university_status text;
  university_owner uuid;
  career_status text;
  career_owner uuid;
  career_university_id uuid;
  subject_status text;
  subject_owner uuid;
  relation_status text;
  relation_owner uuid;
  pending_context boolean := false;
begin
  if new.universidad_id is not null then
    select approval_status, owner_user_id
      into university_status, university_owner
    from public.universidades
    where id = new.universidad_id;

    if university_status is null then
      raise exception 'Universidad académica inválida';
    end if;

    if university_status <> 'approved' then
      if university_owner is distinct from new.user_id then
        raise exception 'La universidad pendiente pertenece a otro usuario';
      end if;
      pending_context := true;
    end if;
  end if;

  if new.carrera_id is not null then
    if new.universidad_id is null then
      raise exception 'Elegí una universidad antes de asociar una carrera';
    end if;

    select approval_status, owner_user_id, universidad_id
      into career_status, career_owner, career_university_id
    from public.carreras
    where id = new.carrera_id;

    if career_status is null then
      raise exception 'Carrera académica inválida';
    end if;

    if career_university_id is distinct from new.universidad_id then
      raise exception 'La carrera no pertenece a la universidad seleccionada';
    end if;

    if career_status <> 'approved' then
      if career_owner is distinct from new.user_id then
        raise exception 'La carrera pendiente pertenece a otro usuario';
      end if;
      pending_context := true;
    end if;
  end if;

  if new.materia_id is not null then
    if new.carrera_id is null then
      raise exception 'Elegí una carrera antes de asociar una materia';
    end if;

    select approval_status, owner_user_id
      into subject_status, subject_owner
    from public.materias
    where id = new.materia_id;

    if subject_status is null then
      raise exception 'Materia académica inválida';
    end if;

    if subject_status <> 'approved' then
      if subject_owner is distinct from new.user_id then
        raise exception 'La materia pendiente pertenece a otro usuario';
      end if;
      pending_context := true;
    end if;

    select approval_status, owner_user_id
      into relation_status, relation_owner
    from public.carrera_materias
    where carrera_id = new.carrera_id
      and materia_id = new.materia_id
    order by case when approval_status = 'approved' then 0 else 1 end
    limit 1;

    if relation_status is null then
      raise exception 'La materia no está asociada a la carrera';
    end if;

    if relation_status <> 'approved' then
      if relation_owner is distinct from new.user_id then
        raise exception 'La relación académica pendiente pertenece a otro usuario';
      end if;
      pending_context := true;
    end if;
  end if;

  if new.universidad_id is null
     or new.carrera_id is null
     or new.materia_id is null
     or pending_context then
    new.visibility := 'private';
  end if;

  return new;
end;
$function$;

drop trigger if exists student_materials_private_pending_academic on public.student_materials;
create trigger student_materials_private_pending_academic
before insert or update of user_id, universidad_id, carrera_id, materia_id, visibility
on public.student_materials
for each row
execute function public.enforce_private_pending_academic_material();
