update storage.buckets
set public = false
where id = 'biblioteca';

drop policy if exists biblioteca_select_authenticated on storage.objects;

create policy biblioteca_select_authenticated
on storage.objects
for select
to authenticated
using (bucket_id = 'biblioteca');
