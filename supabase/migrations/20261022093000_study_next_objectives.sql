-- Objetivo persistente por PDF: la evidencia corregida del servidor es la fuente de verdad.
create table public.study_next_objectives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.student_materials(id) on delete cascade,
  session_id uuid not null,
  kind text not null check (kind in ('reinforce','practice','consolidate')),
  topic_title text check (topic_title is null or length(topic_title) <= 500),
  topic_section_index integer check (topic_section_index is null or topic_section_index >= 0),
  review_on date not null,
  source_finished_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','started','completed','dismissed')),
  created_at timestamptz not null default now(),
  unique (user_id, material_id),
  unique (user_id, session_id)
);
create index study_next_objectives_due_idx on public.study_next_objectives(user_id,status,review_on);
alter table public.study_next_objectives enable row level security;
revoke all on public.study_next_objectives from public, anon, authenticated;
grant select on public.study_next_objectives to authenticated;
grant select, insert, update, delete on public.study_next_objectives to service_role;
create policy "Students read own study objectives" on public.study_next_objectives
  for select to authenticated using (
    user_id = (select auth.uid()) and exists (
      select 1 from public.student_materials sm where sm.id = material_id
        and sm.user_id = (select auth.uid())
    )
  );
