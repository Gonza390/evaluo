-- Auto-approve new universities while preserving an auditable request history.

alter table public.university_requests
  add column if not exists resolution_source text not null default 'manual';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'university_requests_resolution_source_check'
      and conrelid = 'public.university_requests'::regclass
  ) then
    alter table public.university_requests
      add constraint university_requests_resolution_source_check
      check (resolution_source in ('manual', 'automatic'));
  end if;
end $$;

alter table public.university_requests
  alter column career_name drop not null;

alter table public.university_requests
  drop constraint if exists university_requests_career_name_check;

alter table public.university_requests
  add constraint university_requests_career_name_check
  check (
    career_name is null
    or char_length(btrim(career_name)) between 2 and 160
  );

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

comment on function public.submit_university_request(text, text, text, text, text) is
  'Registra una universidad solicitada, la aprueba automáticamente y conserva la solicitud como historial auditable.';
