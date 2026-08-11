create table if not exists public.simulator_topics (
  id uuid primary key default gen_random_uuid(),
  materia_id uuid not null references public.materias(id) on delete cascade,
  parcial integer,
  topic_key text not null,
  title text not null,
  description text,
  source text not null default 'local-inference',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint simulator_topics_unique_key unique (materia_id, parcial, topic_key)
);

create table if not exists public.simulator_subtopics (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.simulator_topics(id) on delete cascade,
  subtopic_key text not null,
  title text not null,
  description text,
  source text not null default 'local-inference',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint simulator_subtopics_unique_key unique (topic_id, subtopic_key)
);

create table if not exists public.simulator_question_topic_links (
  id uuid primary key default gen_random_uuid(),
  pregunta_id uuid not null references public.preguntas_banco(id) on delete cascade,
  materia_id uuid not null references public.materias(id) on delete cascade,
  parcial integer,
  topic_id uuid not null references public.simulator_topics(id) on delete cascade,
  subtopic_id uuid references public.simulator_subtopics(id) on delete set null,
  confidence_score numeric(4, 3) not null default 0.55,
  source text not null default 'local-inference',
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint simulator_question_topic_links_unique_question unique (pregunta_id)
);

create table if not exists public.student_topic_performance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  materia_id uuid not null references public.materias(id) on delete cascade,
  parcial integer not null,
  topic_id uuid not null references public.simulator_topics(id) on delete cascade,
  subtopic_id uuid references public.simulator_subtopics(id) on delete set null,
  attempts_count integer not null default 0,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  mastery_score numeric(5, 2) not null default 0,
  last_answer_at timestamptz,
  last_wrong_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_topic_performance_unique_scope unique (user_id, materia_id, parcial, topic_id, subtopic_id)
);

create table if not exists public.simulator_attempt_topic_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.simulator_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  materia_id uuid not null references public.materias(id) on delete cascade,
  parcial integer not null,
  pregunta_id uuid not null references public.preguntas_banco(id) on delete cascade,
  topic_id uuid not null references public.simulator_topics(id) on delete cascade,
  subtopic_id uuid references public.simulator_subtopics(id) on delete set null,
  was_correct boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists simulator_topics_materia_parcial_idx
  on public.simulator_topics (materia_id, parcial, title);

create index if not exists simulator_question_topic_links_materia_idx
  on public.simulator_question_topic_links (materia_id, parcial, topic_id);

create index if not exists student_topic_performance_user_materia_idx
  on public.student_topic_performance (user_id, materia_id, parcial, wrong_count desc, updated_at desc);

create index if not exists simulator_attempt_topic_events_attempt_idx
  on public.simulator_attempt_topic_events (attempt_id, pregunta_id);

alter table public.simulator_topics enable row level security;
alter table public.simulator_subtopics enable row level security;
alter table public.simulator_question_topic_links enable row level security;
alter table public.student_topic_performance enable row level security;
alter table public.simulator_attempt_topic_events enable row level security;

drop policy if exists simulator_topics_select_authenticated on public.simulator_topics;
create policy simulator_topics_select_authenticated
on public.simulator_topics
for select
using (auth.role() = 'authenticated' or public.current_user_is_admin());

drop policy if exists simulator_topics_admin_write on public.simulator_topics;
create policy simulator_topics_admin_write
on public.simulator_topics
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists simulator_subtopics_select_authenticated on public.simulator_subtopics;
create policy simulator_subtopics_select_authenticated
on public.simulator_subtopics
for select
using (auth.role() = 'authenticated' or public.current_user_is_admin());

drop policy if exists simulator_subtopics_admin_write on public.simulator_subtopics;
create policy simulator_subtopics_admin_write
on public.simulator_subtopics
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists simulator_question_topic_links_select_authenticated on public.simulator_question_topic_links;
create policy simulator_question_topic_links_select_authenticated
on public.simulator_question_topic_links
for select
using (auth.role() = 'authenticated' or public.current_user_is_admin());

drop policy if exists simulator_question_topic_links_admin_write on public.simulator_question_topic_links;
create policy simulator_question_topic_links_admin_write
on public.simulator_question_topic_links
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists student_topic_performance_select_own_or_admin on public.student_topic_performance;
create policy student_topic_performance_select_own_or_admin
on public.student_topic_performance
for select
using (auth.uid() = user_id or public.current_user_is_admin());

drop policy if exists student_topic_performance_insert_own_or_admin on public.student_topic_performance;
create policy student_topic_performance_insert_own_or_admin
on public.student_topic_performance
for insert
with check (auth.uid() = user_id or public.current_user_is_admin());

drop policy if exists student_topic_performance_update_own_or_admin on public.student_topic_performance;
create policy student_topic_performance_update_own_or_admin
on public.student_topic_performance
for update
using (auth.uid() = user_id or public.current_user_is_admin())
with check (auth.uid() = user_id or public.current_user_is_admin());

drop policy if exists simulator_attempt_topic_events_select_own_or_admin on public.simulator_attempt_topic_events;
create policy simulator_attempt_topic_events_select_own_or_admin
on public.simulator_attempt_topic_events
for select
using (auth.uid() = user_id or public.current_user_is_admin());

drop policy if exists simulator_attempt_topic_events_insert_own_or_admin on public.simulator_attempt_topic_events;
create policy simulator_attempt_topic_events_insert_own_or_admin
on public.simulator_attempt_topic_events
for insert
with check (auth.uid() = user_id or public.current_user_is_admin());
