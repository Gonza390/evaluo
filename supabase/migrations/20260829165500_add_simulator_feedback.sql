create table if not exists public.simulator_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  materia_id uuid references public.materias(id) on delete set null,
  parcial integer,
  mode text not null default 'regular',
  reason text not null,
  comment text,
  path text not null,
  created_at timestamptz not null default now(),
  constraint simulator_feedback_parcial_check check (parcial is null or parcial in (1, 2, 3)),
  constraint simulator_feedback_mode_check check (mode in ('regular', 'errores', 'premium', 'ultimo_intento', 'unknown')),
  constraint simulator_feedback_reason_check check (reason in ('more_questions', 'better_explanations', 'summaries', 'exam_similarity', 'confusing_experience')),
  constraint simulator_feedback_comment_length_check check (comment is null or char_length(comment) <= 1200),
  constraint simulator_feedback_path_length_check check (char_length(path) <= 500)
);

create index if not exists simulator_feedback_created_at_idx
  on public.simulator_feedback (created_at desc);
create index if not exists simulator_feedback_user_id_idx
  on public.simulator_feedback (user_id, created_at desc);
create index if not exists simulator_feedback_materia_id_idx
  on public.simulator_feedback (materia_id, created_at desc);

alter table public.simulator_feedback enable row level security;

comment on table public.simulator_feedback is 'Feedback explícito del usuario desde el survey del simulador.';
comment on column public.simulator_feedback.comment is 'Comentario libre opcional escrito por el usuario.';
