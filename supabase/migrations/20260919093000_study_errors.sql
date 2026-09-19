-- Cola unificada de errores de estudio.
-- Separa el estado pedagogico (pendiente/resuelto) del historial de explicaciones IA.

create table if not exists public.study_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  materia_id uuid null references public.materias(id) on delete set null,
  student_material_id uuid null references public.student_materials(id) on delete set null,
  source_type text not null check (source_type in ('simulator', 'flashcard', 'exercise', 'diagnostic')),
  source_key text not null,
  question_id text null,
  topic text null,
  prompt text not null,
  explanation text null,
  correct_answer text null,
  selected_answer text null,
  failure_count integer not null default 1 check (failure_count > 0),
  status text not null default 'pending' check (status in ('pending', 'resolved')),
  reference_page_start integer null,
  reference_page_end integer null,
  reference_section_title text null,
  reference_excerpt text null,
  first_failed_at timestamptz not null default now(),
  last_failed_at timestamptz not null default now(),
  last_reviewed_at timestamptz null,
  resolved_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_type, source_key)
);

create index if not exists study_errors_user_status_failed_idx
  on public.study_errors(user_id, status, last_failed_at desc);

create index if not exists study_errors_user_materia_status_idx
  on public.study_errors(user_id, materia_id, status);

create index if not exists study_errors_user_material_status_idx
  on public.study_errors(user_id, student_material_id, status)
  where student_material_id is not null;

create index if not exists study_errors_user_question_idx
  on public.study_errors(user_id, question_id)
  where question_id is not null;

create or replace function public.set_study_errors_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists study_errors_set_updated_at on public.study_errors;
create trigger study_errors_set_updated_at
before update on public.study_errors
for each row
execute function public.set_study_errors_updated_at();

alter table public.study_errors enable row level security;

drop policy if exists study_errors_select_own on public.study_errors;
create policy study_errors_select_own
on public.study_errors
for select
using (auth.uid() = user_id);

drop policy if exists study_errors_admin_all on public.study_errors;
create policy study_errors_admin_all
on public.study_errors
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

-- Conserva el valor de las explicaciones ya existentes como errores pendientes.
insert into public.study_errors (
  user_id,
  materia_id,
  source_type,
  source_key,
  question_id,
  prompt,
  explanation,
  correct_answer,
  selected_answer,
  failure_count,
  first_failed_at,
  last_failed_at,
  metadata
)
select
  eh.user_id,
  eh.materia_id,
  'simulator',
  'question:' || eh.pregunta_id,
  eh.pregunta_id,
  eh.enunciado,
  eh.explicacion,
  eh.respuesta_correcta,
  case
    when eh.opcion_elegida is not null
      and jsonb_typeof(eh.opciones) = 'array'
      and jsonb_array_length(eh.opciones) > eh.opcion_elegida
    then eh.opciones ->> eh.opcion_elegida
    else null
  end,
  greatest(coalesce(eh.veces_fallada, 1), 1),
  eh.created_at,
  eh.created_at,
  jsonb_build_object('parcial', eh.parcial, 'provider', eh.provider)
from public.explanations_history eh
where eh.pregunta_id is not null
on conflict (user_id, source_type, source_key) do update
set
  materia_id = excluded.materia_id,
  question_id = excluded.question_id,
  prompt = excluded.prompt,
  explanation = excluded.explanation,
  correct_answer = excluded.correct_answer,
  selected_answer = coalesce(excluded.selected_answer, public.study_errors.selected_answer),
  failure_count = greatest(public.study_errors.failure_count, excluded.failure_count),
  last_failed_at = greatest(public.study_errors.last_failed_at, excluded.last_failed_at),
  metadata = public.study_errors.metadata || excluded.metadata;
