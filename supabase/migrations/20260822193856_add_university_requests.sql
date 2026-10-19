create table if not exists public.university_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  university_name text not null,
  country text not null default 'Argentina',
  city text,
  career_name text,
  note text,
  status text not null default 'pending' check (status in ('pending','reviewing','planned','added','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(btrim(university_name)) between 2 and 160),
  check (char_length(btrim(country)) between 2 and 100),
  check (city is null or char_length(city) <= 120),
  check (career_name is null or char_length(career_name) <= 160),
  check (note is null or char_length(note) <= 1000)
);

alter table public.university_requests enable row level security;
revoke all on table public.university_requests from anon, authenticated;

create index if not exists university_requests_status_created_idx
  on public.university_requests (status, created_at desc);

create unique index if not exists university_requests_open_request_idx
  on public.university_requests (user_id, lower(btrim(university_name)))
  where status in ('pending','reviewing','planned');

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

  if v_career_name is not null and char_length(v_career_name) > 160 then
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

comment on table public.university_requests is 'Solicitudes autenticadas de usuarios para sumar nuevas universidades al catálogo de Evaluo.';
