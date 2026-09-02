-- Private, owner-scoped academic entities created from first-run onboarding.
-- Existing catalog rows remain approved/public. New pending rows are visible only
-- to their owner and admins until an explicit approval promotes them.

alter table public.facultades add column if not exists approval_status text not null default 'approved';
alter table public.facultades add column if not exists owner_user_id uuid null references auth.users(id) on delete set null;
alter table public.facultades add column if not exists approved_at timestamptz null;
alter table public.facultades add column if not exists approved_by uuid null references auth.users(id) on delete set null;

alter table public.carreras add column if not exists approval_status text not null default 'approved';
alter table public.carreras add column if not exists owner_user_id uuid null references auth.users(id) on delete set null;
alter table public.carreras add column if not exists approved_at timestamptz null;
alter table public.carreras add column if not exists approved_by uuid null references auth.users(id) on delete set null;

alter table public.materias add column if not exists approval_status text not null default 'approved';
alter table public.materias add column if not exists owner_user_id uuid null references auth.users(id) on delete set null;
alter table public.materias add column if not exists approved_at timestamptz null;
alter table public.materias add column if not exists approved_by uuid null references auth.users(id) on delete set null;

alter table public.carrera_materias add column if not exists approval_status text not null default 'approved';
alter table public.carrera_materias add column if not exists owner_user_id uuid null references auth.users(id) on delete set null;
alter table public.carrera_materias add column if not exists approved_at timestamptz null;
alter table public.carrera_materias add column if not exists approved_by uuid null references auth.users(id) on delete set null;

create index if not exists facultades_approval_owner_idx on public.facultades (approval_status, owner_user_id, universidad_id);
create index if not exists carreras_approval_owner_idx on public.carreras (approval_status, owner_user_id, universidad_id);
create index if not exists materias_approval_owner_idx on public.materias (approval_status, owner_user_id, carrera_id);
create index if not exists carrera_materias_approval_owner_idx on public.carrera_materias (approval_status, owner_user_id, carrera_id, materia_id);

drop policy if exists facultades_read_public on public.facultades;
drop policy if exists facultades_read_approved_or_own_pending on public.facultades;
create policy facultades_read_approved_or_own_pending on public.facultades for select to public
using (approval_status = 'approved' or owner_user_id = auth.uid() or current_user_is_admin());

drop policy if exists carreras_read_public on public.carreras;
drop policy if exists carreras_read_approved_or_own_pending on public.carreras;
create policy carreras_read_approved_or_own_pending on public.carreras for select to public
using (approval_status = 'approved' or owner_user_id = auth.uid() or current_user_is_admin());

drop policy if exists materias_read_public on public.materias;
drop policy if exists materias_read_approved_or_own_pending on public.materias;
create policy materias_read_approved_or_own_pending on public.materias for select to public
using (approval_status = 'approved' or owner_user_id = auth.uid() or current_user_is_admin());

drop policy if exists carrera_materias_read_public on public.carrera_materias;
drop policy if exists carrera_materias_read_approved_or_own_pending on public.carrera_materias;
create policy carrera_materias_read_approved_or_own_pending on public.carrera_materias for select to public
using (approval_status = 'approved' or owner_user_id = auth.uid() or current_user_is_admin());

create or replace function public.enforce_private_pending_academic_material()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  career_status text;
  career_owner uuid;
  subject_status text;
  subject_owner uuid;
  relation_status text;
  relation_owner uuid;
  pending_context boolean := false;
begin
  select approval_status, owner_user_id into career_status, career_owner
  from public.carreras where id = new.carrera_id;
  if career_status is null then raise exception 'Carrera académica inválida'; end if;
  if career_status <> 'approved' then
    if career_owner is distinct from new.user_id then raise exception 'La carrera pendiente pertenece a otro usuario'; end if;
    pending_context := true;
  end if;

  select approval_status, owner_user_id into subject_status, subject_owner
  from public.materias where id = new.materia_id;
  if subject_status is null then raise exception 'Materia académica inválida'; end if;
  if subject_status <> 'approved' then
    if subject_owner is distinct from new.user_id then raise exception 'La materia pendiente pertenece a otro usuario'; end if;
    pending_context := true;
  end if;

  select approval_status, owner_user_id into relation_status, relation_owner
  from public.carrera_materias
  where carrera_id = new.carrera_id and materia_id = new.materia_id
  order by case when approval_status = 'approved' then 0 else 1 end
  limit 1;
  if relation_status is null then raise exception 'La materia no está asociada a la carrera'; end if;
  if relation_status <> 'approved' then
    if relation_owner is distinct from new.user_id then raise exception 'La relación académica pendiente pertenece a otro usuario'; end if;
    pending_context := true;
  end if;

  if pending_context then new.visibility := 'private'; end if;
  return new;
end;
$$;

drop trigger if exists student_materials_private_pending_academic on public.student_materials;
create trigger student_materials_private_pending_academic
before insert or update of user_id, carrera_id, materia_id, visibility
on public.student_materials
for each row execute function public.enforce_private_pending_academic_material();
