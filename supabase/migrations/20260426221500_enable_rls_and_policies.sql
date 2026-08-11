create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    or exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role = 'admin'
    );
$$;

grant execute on function public.current_user_is_admin() to anon, authenticated;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role is distinct from 'student' then
      new.role := null;
    end if;
    return new;
  end if;

  if old.role is distinct from 'admin' and new.role = 'student' then
    return new;
  end if;

  new.role := old.role;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;

create trigger profiles_protect_role
before insert or update on public.profiles
for each row
execute function public.protect_profile_role();

do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'profiles',
    'universidades',
    'carreras',
    'materias',
    'carrera_materias',
    'materiales',
    'recursos',
    'preguntas_banco',
    'historial_respuestas',
    'configuracion_ia',
    'resumenes',
    'resumen_votes',
    'user_favorites'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);

    for policy_name in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
    loop
      execute format('drop policy if exists %I on public.%I', policy_name, table_name);
    end loop;
  end loop;
end $$;

create policy profiles_select_own_or_admin
on public.profiles
for select
using (
  auth.uid() = id
  or public.current_user_is_admin()
);

create policy profiles_insert_own_or_admin
on public.profiles
for insert
with check (
  auth.uid() = id
  or public.current_user_is_admin()
);

create policy profiles_update_own_or_admin
on public.profiles
for update
using (
  auth.uid() = id
  or public.current_user_is_admin()
)
with check (
  auth.uid() = id
  or public.current_user_is_admin()
);

create policy profiles_delete_admin_only
on public.profiles
for delete
using (public.current_user_is_admin());

create policy universidades_read_public
on public.universidades
for select
using (true);

create policy universidades_write_admin_only
on public.universidades
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy carreras_read_public
on public.carreras
for select
using (true);

create policy carreras_write_admin_only
on public.carreras
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy materias_read_public
on public.materias
for select
using (true);

create policy materias_write_admin_only
on public.materias
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy carrera_materias_read_public
on public.carrera_materias
for select
using (true);

create policy carrera_materias_write_admin_only
on public.carrera_materias
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy recursos_read_public
on public.recursos
for select
using (true);

create policy recursos_write_admin_only
on public.recursos
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy resumenes_read_public
on public.resumenes
for select
using (true);

create policy resumenes_write_admin_only
on public.resumenes
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy preguntas_banco_read_authenticated
on public.preguntas_banco
for select
using (
  auth.role() = 'authenticated'
  or public.current_user_is_admin()
);

create policy preguntas_banco_write_admin_only
on public.preguntas_banco
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy materiales_admin_only
on public.materiales
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy configuracion_ia_admin_only
on public.configuracion_ia
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy historial_respuestas_select_own_or_admin
on public.historial_respuestas
for select
using (
  usuario_id = auth.uid()
  or public.current_user_is_admin()
);

create policy historial_respuestas_insert_own_or_admin
on public.historial_respuestas
for insert
with check (
  usuario_id = auth.uid()
  or public.current_user_is_admin()
);

create policy historial_respuestas_update_own_or_admin
on public.historial_respuestas
for update
using (
  usuario_id = auth.uid()
  or public.current_user_is_admin()
)
with check (
  usuario_id = auth.uid()
  or public.current_user_is_admin()
);

create policy historial_respuestas_delete_admin_only
on public.historial_respuestas
for delete
using (public.current_user_is_admin());

create policy user_favorites_select_own_or_admin
on public.user_favorites
for select
using (
  user_id = auth.uid()
  or public.current_user_is_admin()
);

create policy user_favorites_insert_own_or_admin
on public.user_favorites
for insert
with check (
  user_id = auth.uid()
  or public.current_user_is_admin()
);

create policy user_favorites_update_own_or_admin
on public.user_favorites
for update
using (
  user_id = auth.uid()
  or public.current_user_is_admin()
)
with check (
  user_id = auth.uid()
  or public.current_user_is_admin()
);

create policy user_favorites_delete_own_or_admin
on public.user_favorites
for delete
using (
  user_id = auth.uid()
  or public.current_user_is_admin()
);

create policy resumen_votes_select_public
on public.resumen_votes
for select
using (true);

create policy resumen_votes_insert_own_or_admin
on public.resumen_votes
for insert
with check (
  user_id = auth.uid()
  or public.current_user_is_admin()
);

create policy resumen_votes_update_own_or_admin
on public.resumen_votes
for update
using (
  user_id = auth.uid()
  or public.current_user_is_admin()
)
with check (
  user_id = auth.uid()
  or public.current_user_is_admin()
);

create policy resumen_votes_delete_own_or_admin
on public.resumen_votes
for delete
using (
  user_id = auth.uid()
  or public.current_user_is_admin()
);
