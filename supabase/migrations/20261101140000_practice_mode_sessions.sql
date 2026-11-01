-- Historial privado de prácticas completadas; no equivale a dominio pedagógico.
create table if not exists public.practice_mode_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.student_materials(id) on delete cascade,
  mode text not null check (mode in ('unir','completar','casos','mixto','simulacro','opciones','flashcards')),
  correct integer not null check (correct >= 0),
  total integer not null check (total between 1 and 100),
  answers jsonb not null default '[]'::jsonb,
  source text not null default 'client_self_reported' check (source = 'client_self_reported'),
  completed_at timestamptz not null default now(),
  constraint practice_sessions_score_valid check (correct <= total),
  constraint practice_sessions_answers_array check (jsonb_typeof(answers) = 'array' and jsonb_array_length(answers) <= 100)
);
create index if not exists practice_mode_sessions_user_recent_idx
  on public.practice_mode_sessions (user_id, completed_at desc);
create index if not exists practice_mode_sessions_material_recent_idx
  on public.practice_mode_sessions (user_id, material_id, completed_at desc);
alter table public.practice_mode_sessions enable row level security;
revoke all on public.practice_mode_sessions from public, anon, authenticated, service_role;
grant select on public.practice_mode_sessions to authenticated;
grant select, insert on public.practice_mode_sessions to service_role;
create policy "Student reads only own practices" on public.practice_mode_sessions
  for select to authenticated using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.student_materials m
      where m.id = material_id and m.user_id = (select auth.uid())
    )
  );
