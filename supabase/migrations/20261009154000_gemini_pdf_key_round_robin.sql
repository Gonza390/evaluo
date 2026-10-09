create table if not exists public.ai_provider_rotation_state (
  scope text primary key,
  next_slot smallint not null default 1 check (next_slot in (1, 2)),
  updated_at timestamptz not null default now()
);

alter table public.ai_provider_rotation_state enable row level security;

create table if not exists public.ai_pdf_key_assignments (
  student_material_id uuid primary key references public.student_materials(id) on delete cascade,
  key_slot smallint not null check (key_slot in (1, 2)),
  created_at timestamptz not null default now()
);

alter table public.ai_pdf_key_assignments enable row level security;

create or replace function public.assign_gemini_pdf_key_slot(
  p_student_material_id uuid
)
returns smallint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing smallint;
  v_slot smallint;
begin
  insert into public.ai_provider_rotation_state(scope, next_slot)
  values ('gemini_pdf', 1)
  on conflict (scope) do nothing;

  perform 1
  from public.ai_provider_rotation_state
  where scope = 'gemini_pdf'
  for update;

  select key_slot
    into v_existing
  from public.ai_pdf_key_assignments
  where student_material_id = p_student_material_id;

  if v_existing is not null then
    return v_existing;
  end if;

  select next_slot
    into v_slot
  from public.ai_provider_rotation_state
  where scope = 'gemini_pdf';

  insert into public.ai_pdf_key_assignments(student_material_id, key_slot)
  values (p_student_material_id, v_slot);

  update public.ai_provider_rotation_state
  set next_slot = case when v_slot = 1 then 2 else 1 end,
      updated_at = now()
  where scope = 'gemini_pdf';

  return v_slot;
end;
$$;

revoke all on function public.assign_gemini_pdf_key_slot(uuid) from public;
revoke all on function public.assign_gemini_pdf_key_slot(uuid) from anon;
revoke all on function public.assign_gemini_pdf_key_slot(uuid) from authenticated;
grant execute on function public.assign_gemini_pdf_key_slot(uuid) to service_role;
