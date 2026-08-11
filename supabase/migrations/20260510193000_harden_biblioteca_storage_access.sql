drop policy if exists biblioteca_select_authenticated on storage.objects;
drop policy if exists biblioteca_select_admin_only on storage.objects;

create policy biblioteca_select_admin_only
on storage.objects
for select
to authenticated
using (
  bucket_id = 'biblioteca'
  and public.current_user_is_admin()
);
