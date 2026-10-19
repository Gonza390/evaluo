alter table public.university_requests
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists approved_university_id uuid references public.universidades(id) on delete set null,
  add column if not exists approved_career_id uuid references public.carreras(id) on delete set null;

alter table public.university_requests
  drop constraint if exists university_requests_career_name_check;

alter table public.university_requests
  add constraint university_requests_career_name_check
  check (career_name is not null and char_length(btrim(career_name)) between 2 and 160);

alter table public.university_requests
  alter column career_name set not null;

create unique index if not exists universidades_nombre_normalized_uidx
  on public.universidades (lower(btrim(nombre)));

create unique index if not exists carreras_universidad_nombre_normalized_uidx
  on public.carreras (universidad_id, lower(btrim(nombre)));

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

  if v_career_name is null or char_length(v_career_name) < 2 or char_length(v_career_name) > 160 then
    raise exception 'invalid_career_name';
  end if;

  if v_note is not null and char_length(v_note) > 1000 then
    raise exception 'invalid_note';
  end if;

  begin
    insert into public.university_requests (
      user_id,
      university_name,
      country,
      city,
      career_name,
      note
    )
    values (
      v_user_id,
      v_university_name,
      v_country,
      v_city,
      v_career_name,
      v_note
    )
    returning id into v_request_id;
  exception
    when unique_violation then
      select id
      into v_request_id
      from public.university_requests
      where user_id = v_user_id
        and lower(btrim(university_name)) = lower(v_university_name)
        and status in ('pending','reviewing','planned')
      order by created_at desc
      limit 1;
  end;

  return v_request_id;
end;
$$;

revoke all on function public.submit_university_request(text, text, text, text, text) from public, anon;
grant execute on function public.submit_university_request(text, text, text, text, text) to authenticated;

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
        reviewed_at = now(),
        updated_at = now(),
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
      insert into public.universidades (nombre)
      values (btrim(v_request.university_name))
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

  select id
  into v_career_id
  from public.carreras
  where universidad_id = v_university_id
    and lower(btrim(nombre)) = lower(btrim(v_request.career_name))
  limit 1;

  if v_career_id is null then
    begin
      insert into public.carreras (nombre, universidad_id)
      values (btrim(v_request.career_name), v_university_id)
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

  update public.university_requests
  set status = 'added',
      reviewed_by = p_reviewer_id,
      reviewed_at = now(),
      updated_at = now(),
      approved_university_id = v_university_id,
      approved_career_id = v_career_id
  where id = v_request.id;

  return query select v_request.id, 'added'::text, v_university_id, v_career_id;
end;
$$;

revoke all on function public.resolve_university_request(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.resolve_university_request(uuid, text, uuid) to service_role;

comment on function public.resolve_university_request(uuid, text, uuid) is
  'Resuelve una solicitud de universidad desde el backoffice y crea universidad/carrera de forma transaccional al aprobar.';
