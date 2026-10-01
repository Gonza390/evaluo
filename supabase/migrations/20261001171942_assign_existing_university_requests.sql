-- Keep university requests and student profiles synchronized, and allow admins
-- to resolve a request by selecting an existing university.

create or replace function public.submit_university_request(
  p_university_name text,
  p_country text default 'Argentina',
  p_city text default null,
  p_career_name text default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_university_name text := btrim(coalesce(p_university_name, ''));
  v_country text := btrim(coalesce(nullif(p_country, ''), 'Argentina'));
  v_city text := nullif(btrim(coalesce(p_city, '')), '');
  v_career_name text := nullif(btrim(coalesce(p_career_name, '')), '');
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_request_id uuid;
  v_university_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  if char_length(v_university_name) < 2 or char_length(v_university_name) > 160 then
    raise exception 'invalid_university_name';
  end if;

  if char_length(v_country) < 2 or char_length(v_country) > 100 then
    raise exception 'invalid_country';
  end if;

  if v_city is not null and char_length(v_city) > 120 then
    raise exception 'invalid_city';
  end if;

  if v_career_name is not null
    and (char_length(v_career_name) < 2 or char_length(v_career_name) > 160) then
    raise exception 'invalid_career_name';
  end if;

  if v_note is not null and char_length(v_note) > 1000 then
    raise exception 'invalid_note';
  end if;

  select id
  into v_university_id
  from public.universidades
  where lower(btrim(nombre)) = lower(v_university_name)
  limit 1;

  if v_university_id is null then
    begin
      insert into public.universidades (
        nombre,
        city,
        approval_status,
        owner_user_id
      )
      values (
        v_university_name,
        v_city,
        'approved',
        null
      )
      returning id into v_university_id;
    exception
      when unique_violation then
        select id
        into v_university_id
        from public.universidades
        where lower(btrim(nombre)) = lower(v_university_name)
        limit 1;
    end;
  end if;

  if v_university_id is null then
    raise exception 'university_resolution_failed';
  end if;

  update public.universidades
  set approval_status = 'approved',
      owner_user_id = null,
      city = coalesce(city, v_city)
  where id = v_university_id
    and (
      approval_status <> 'approved'
      or owner_user_id is not null
      or (city is null and v_city is not null)
    );

  update public.profiles
  set universidad_id = v_university_id::text
  where id = v_user_id
    and universidad_id is distinct from v_university_id::text;

  select id
  into v_request_id
  from public.university_requests
  where user_id = v_user_id
    and lower(btrim(university_name)) = lower(v_university_name)
    and resolution_source = 'automatic'
  order by created_at desc
  limit 1;

  if v_request_id is null then
    insert into public.university_requests (
      user_id,
      university_name,
      country,
      city,
      career_name,
      note,
      status,
      reviewed_at,
      approved_university_id,
      approved_career_id,
      resolution_source
    )
    values (
      v_user_id,
      v_university_name,
      v_country,
      v_city,
      v_career_name,
      v_note,
      'added',
      now(),
      v_university_id,
      null,
      'automatic'
    )
    returning id into v_request_id;
  else
    update public.university_requests
    set country = v_country,
        city = coalesce(v_city, city),
        career_name = coalesce(v_career_name, career_name),
        note = coalesce(v_note, note),
        status = 'added',
        reviewed_at = coalesce(reviewed_at, now()),
        updated_at = now(),
        approved_university_id = v_university_id,
        resolution_source = 'automatic'
    where id = v_request_id;
  end if;

  return v_request_id;
end;
$$;

revoke all on function public.submit_university_request(text, text, text, text, text)
  from public, anon;
grant execute on function public.submit_university_request(text, text, text, text, text)
  to authenticated;

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

  if v_request.status = 'added' then
    update public.profiles
    set universidad_id = coalesce(v_request.approved_university_id::text, universidad_id),
        carrera_id = coalesce(v_request.approved_career_id::text, carrera_id)
    where id = v_request.user_id;

    return query
      select v_request.id,
             v_request.status,
             v_request.approved_university_id,
             v_request.approved_career_id;
    return;
  end if;

  if v_request.status = 'rejected' then
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

  update public.universidades
  set approval_status = 'approved',
      owner_user_id = null
  where id = v_university_id;

  if v_request.career_name is not null then
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
  end if;

  if v_request.career_name is not null and v_career_id is null then
    raise exception 'career_resolution_failed';
  end if;

  if v_career_id is not null then
    update public.carreras
    set approval_status = 'approved',
        owner_user_id = null,
        approved_at = coalesce(approved_at, v_now),
        approved_by = coalesce(approved_by, p_reviewer_id)
    where id = v_career_id;
  end if;

  update public.profiles
  set universidad_id = v_university_id::text,
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
      approved_university_id = v_university_id,
      approved_career_id = v_career_id,
      resolution_source = 'manual'
  where id = v_request.id;

  return query select v_request.id, 'added'::text, v_university_id, v_career_id;
end;
$$;

revoke all on function public.resolve_university_request(uuid, text, uuid)
  from public, anon, authenticated;
grant execute on function public.resolve_university_request(uuid, text, uuid)
  to service_role;

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

  if v_request.status in ('added', 'rejected') then
    return query
      select v_request.id,
             v_request.status,
             v_request.approved_university_id,
             v_request.approved_career_id;
    return;
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

comment on function public.submit_university_request(text, text, text, text, text) is
  'Registra una universidad solicitada, la aprueba automáticamente y sincroniza la universidad del perfil en la misma transacción.';

comment on function public.resolve_university_request(uuid, text, uuid) is
  'Resuelve solicitudes académicas, publica universidad/carrera y sincroniza el perfil del alumno de forma transaccional.';

comment on function public.assign_existing_university_request(uuid, uuid, uuid) is
  'Resuelve una solicitud usando una universidad existente, guarda la asociación y sincroniza el perfil del alumno.';
