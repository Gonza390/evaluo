-- Allow administrators to correct an already-added university request by
-- reassigning it to a canonical university that already exists.

create or replace function public.assign_existing_university_request(
  p_request_id uuid,
  p_university_id uuid,
  p_reviewer_id uuid
)
returns table (
  request_id uuid,
  final_status text,
  university_id uuid,
  career_id uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request public.university_requests%rowtype;
  v_university public.universidades%rowtype;
  v_career_id uuid;
  v_now timestamptz := now();
begin
  if p_reviewer_id is null then
    raise exception 'reviewer_required';
  end if;

  if p_university_id is null then
    raise exception 'university_required';
  end if;

  select *
  into v_request
  from public.university_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'request_not_found';
  end if;

  if v_request.status = 'rejected' then
    raise exception 'rejected_request_cannot_be_reassigned';
  end if;

  select *
  into v_university
  from public.universidades
  where id = p_university_id
  for update;

  if not found then
    raise exception 'university_not_found';
  end if;

  update public.universidades
  set approval_status = 'approved',
      owner_user_id = null
  where id = p_university_id;

  if v_request.career_name is not null then
    select id
    into v_career_id
    from public.carreras
    where universidad_id = p_university_id
      and approval_status = 'approved'
      and lower(btrim(nombre)) = lower(btrim(v_request.career_name))
    limit 1;
  end if;

  update public.profiles
  set universidad_id = p_university_id::text,
      carrera_id = case
        when v_career_id is not null then v_career_id::text
        else null
      end
  where id = v_request.user_id;

  update public.university_requests
  set status = 'added',
      reviewed_by = p_reviewer_id,
      reviewed_at = v_now,
      updated_at = v_now,
      approved_university_id = p_university_id,
      approved_career_id = v_career_id,
      resolution_source = 'manual'
  where id = v_request.id;

  return query select v_request.id, 'added'::text, p_university_id, v_career_id;
end;
$$;

revoke all on function public.assign_existing_university_request(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.assign_existing_university_request(uuid, uuid, uuid)
  to service_role;

comment on function public.assign_existing_university_request(uuid, uuid, uuid) is
  'Asigna o reasigna una solicitud no rechazada a una universidad existente y sincroniza el perfil del alumno.';
