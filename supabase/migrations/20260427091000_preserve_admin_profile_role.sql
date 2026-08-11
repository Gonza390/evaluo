create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role is distinct from 'student' then
      new.role := null;
    end if;
    return new;
  end if;

  new.role := old.role;
  return new;
end;
$$;
