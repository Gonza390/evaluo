-- Historial irrevocable de cargas exitosas, incluyendo materiales borrados.
-- No aplicar antes del lanzamiento del Free v2 en producción.
create table if not exists public.free_study_v2_material_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id,material_id)
);
create index if not exists free_study_v2_material_claims_user_idx
 on public.free_study_v2_material_claims(user_id);
alter table public.free_study_v2_material_claims enable row level security;
revoke all on public.free_study_v2_material_claims from public,anon,authenticated;
grant select, insert on public.free_study_v2_material_claims to service_role;

insert into public.free_study_v2_material_claims(user_id,material_id)
select user_id,id from public.student_materials where processing_status='ready'
on conflict do nothing;

create or replace function public.record_free_study_v2_material_claim()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if new.processing_status = 'ready' and
     (tg_op = 'INSERT' or old.processing_status is distinct from 'ready') then
    insert into public.free_study_v2_material_claims(user_id,material_id)
    values(new.user_id,new.id) on conflict do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.record_free_study_v2_material_claim() from public,anon,authenticated;
drop trigger if exists record_free_study_v2_material_claim_trigger on public.student_materials;
create trigger record_free_study_v2_material_claim_trigger
after insert or update of processing_status on public.student_materials
for each row execute function public.record_free_study_v2_material_claim();
