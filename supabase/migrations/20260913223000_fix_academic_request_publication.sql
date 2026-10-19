-- Make academic entities approved through university requests behave like normal public catalog rows.
-- Pending entities keep their owner while under review; approved entities release that ownership.

update public.universidades as u
set approval_status = 'approved',
    owner_user_id = null
from public.university_requests as r
where r.status = 'added'
  and r.approved_university_id = u.id
  and (u.approval_status <> 'approved' or u.owner_user_id is not null);

update public.carreras as c
set approval_status = 'approved',
    owner_user_id = null,
    approved_at = coalesce(c.approved_at, r.reviewed_at, now()),
    approved_by = coalesce(c.approved_by, r.reviewed_by)
from public.university_requests as r
where r.status = 'added'
  and r.approved_career_id = c.id
  and (
    c.approval_status <> 'approved'
    or c.owner_user_id is not null
    or c.approved_at is null
    or (c.approved_by is null and r.reviewed_by is not null)
  );

create or replace function public.resolve_university_request(
  p_request_id uuid,
  p_decision text,
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
  v_university_id uuid;
  v_career_id uuid;
  v_decision text := lower(btrim(coalesce(p_decision, '')));
  v_now timestamptz := now();
begin
  if p_reviewer_id is null then
    raise exception 'reviewer_required';
  end if;

  if v_decision not in ('approve', 'reject') then
    raise exception 'invalid_decision';
  end if;

  select *
  into v_request
  from public.university_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'request_not_found';
  end if;

  if v_request.status in ('added', 'rejected') then
    return query
      select v_request.id,
             v_request.status,
             v_request.approved_university_id,
             v_request.approved_career_id;
    return;
  end if;

  if v_decision = 'reject' then
    update public.university_requests
    set status = 'rejected',
        reviewed_by = p_reviewer_id,
        reviewed_at = v_now,
        updated_at = v_now,
        approved_university_id = null,
        approved_career_id = null
    where id = v_request.id;

    return query select v_request.id, 'rejected'::text, null::uuid, null::uuid;
    return;
  end if;

  select id
  into v_university_id
  from public.universidades
  where lower(btrim(nombre)) = lower(btrim(v_request.university_name))
  limit 1;

  if v_university_id is null then
    begin
      insert into public.universidades (nombre, approval_status, owner_user_id)
      values (btrim(v_request.university_name), 'approved', null)
      returning id into v_university_id;
    exception
      when unique_violation then
        select id
        into v_university_id
        from public.universidades
        where lower(btrim(nombre)) = lower(btrim(v_request.university_name))
        limit 1;
    end;
  end if;

  if v_university_id is null then
    raise exception 'university_resolution_failed';
  end if;

  -- A pending university selected by the request becomes a normal public entity.
  update public.universidades
  set approval_status = 'approved',
      owner_user_id = null
  where id = v_university_id;

  select id
  into v_career_id
  from public.carreras
  where universidad_id = v_university_id
    and lower(btrim(nombre)) = lower(btrim(v_request.career_name))
  limit 1;

  if v_career_id is null then
    begin
      insert into public.carreras (
        nombre,
        universidad_id,
        approval_status,
        owner_user_id,
        approved_at,
        approved_by
      )
      values (
        btrim(v_request.career_name),
        v_university_id,
        'approved',
        null,
        v_now,
        p_reviewer_id
      )
      returning id into v_career_id;
    exception
      when unique_violation then
        select id
        into v_career_id
        from public.carreras
        where universidad_id = v_university_id
          and lower(btrim(nombre)) = lower(btrim(v_request.career_name))
        limit 1;
    end;
  end if;

  if v_career_id is null then
    raise exception 'career_resolution_failed';
  end if;

  -- The same rule applies when the onboarding already created the career as pending.
  update public.carreras
  set approval_status = 'approved',
      owner_user_id = null,
      approved_at = coalesce(approved_at, v_now),
      approved_by = coalesce(approved_by, p_reviewer_id)
  where id = v_career_id;

  update public.university_requests
  set status = 'added',
      reviewed_by = p_reviewer_id,
      reviewed_at = v_now,
      updated_at = v_now,
      approved_university_id = v_university_id,
      approved_career_id = v_career_id
  where id = v_request.id;

  return query select v_request.id, 'added'::text, v_university_id, v_career_id;
end;
$$;

revoke all on function public.resolve_university_request(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.resolve_university_request(uuid, text, uuid) to service_role;

comment on function public.resolve_university_request(uuid, text, uuid) is
  'Resuelve solicitudes académicas y publica universidad/carrera como entidades normales, liberando ownership privado al aprobar.';
