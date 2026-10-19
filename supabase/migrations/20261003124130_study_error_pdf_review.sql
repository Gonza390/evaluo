-- Ayudas reutilizables y comprobaciones privadas del repaso por PDF.
-- No se expone la respuesta correcta de una comprobación por la Data API.
create table public.study_error_help_cache (
  error_id uuid not null references public.study_errors(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  context_key text not null,
  kind text not null check (kind in ('why_wrong', 'simpler', 'example')),
  help_text text not null check (length(help_text) between 1 and 4000),
  created_at timestamptz not null default now(),
  primary key (error_id, context_key, kind)
);
create index study_error_help_cache_user_idx on public.study_error_help_cache(user_id);
alter table public.study_error_help_cache enable row level security;
revoke all on public.study_error_help_cache from public, anon, authenticated;
grant select, insert, update, delete on public.study_error_help_cache to service_role;

create table public.study_error_review_checks (
  id uuid primary key default gen_random_uuid(),
  error_id uuid not null references public.study_errors(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.student_materials(id) on delete cascade,
  context_key text not null,
  source_failed_at timestamptz not null,
  question text not null check (length(question) between 20 and 1000),
  options text[] not null check (cardinality(options) = 3),
  correct_index integer not null check (correct_index between 0 and 2),
  feedback text not null check (length(feedback) between 20 and 1600),
  evidence_quote text not null check (length(evidence_quote) between 20 and 1600),
  status text not null default 'open' check (status in ('open', 'correct', 'incorrect')),
  selected_index integer check (selected_index between 0 and 2),
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  check ((status = 'open' and selected_index is null and answered_at is null)
    or (status <> 'open' and selected_index is not null and answered_at is not null))
);
create index study_error_review_checks_error_idx on public.study_error_review_checks(error_id);
create index study_error_review_checks_material_idx on public.study_error_review_checks(material_id);
create index study_error_review_checks_user_idx on public.study_error_review_checks(user_id);
create unique index study_error_review_checks_open_idx
  on public.study_error_review_checks(error_id, context_key) where status = 'open';
alter table public.study_error_review_checks enable row level security;
revoke all on public.study_error_review_checks from public, anon, authenticated;
grant select, insert, update, delete on public.study_error_review_checks to service_role;

-- Una única transacción corrige, registra el intento y cierra el error.
-- Sólo el servidor puede invocarla; p_user_id siempre viene de auth.getUser().
create function public.submit_study_error_review_check(
  p_user_id uuid, p_check_id uuid, p_selected_index integer
) returns jsonb
language plpgsql security invoker set search_path = public, pg_temp
as $$
declare
  v_check public.study_error_review_checks%rowtype;
  v_error public.study_errors%rowtype;
  v_correct boolean;
  v_now timestamptz := clock_timestamp();
begin
  if p_selected_index is null or p_selected_index not between 0 and 2 then
    return jsonb_build_object('success', false, 'message', 'Elegí una respuesta válida.');
  end if;
  -- Bloqueo del error antes del intento: orden consistente para solicitudes concurrentes.
  select e.* into v_error from public.study_errors e
    join public.study_error_review_checks c on c.error_id = e.id
    where c.id = p_check_id and c.user_id = p_user_id and e.user_id = p_user_id
    for update of e;
  if not found then
    return jsonb_build_object('success', false, 'message', 'No encontramos esta comprobación.');
  end if;
  select * into v_check from public.study_error_review_checks
    where id = p_check_id and user_id = p_user_id for update;
  if v_check.status <> 'open' then
    return jsonb_build_object('success', true, 'correct', v_check.status = 'correct',
      'correctIndex', v_check.correct_index, 'feedback', v_check.feedback, 'replayed', true,
      'resolvedAt', v_error.resolved_at);
  end if;
  if v_error.status <> 'pending' or v_error.last_failed_at <> v_check.source_failed_at
    or v_error.last_reviewed_at is null or v_error.last_reviewed_at < v_error.last_failed_at then
    return jsonb_build_object('success', false, 'message', 'El error cambió. Volvé a repasarlo antes de comprobarlo.');
  end if;
  if not exists (select 1 from public.student_materials
    where id = v_check.material_id and user_id = p_user_id and processing_status = 'ready') then
    return jsonb_build_object('success', false, 'message', 'El PDF ya no está disponible.');
  end if;
  v_correct := p_selected_index = v_check.correct_index;
  update public.study_error_review_checks set
    status = case when v_correct then 'correct' else 'incorrect' end,
    selected_index = p_selected_index, answered_at = v_now where id = v_check.id;
  if v_correct then
    update public.study_errors set status = 'resolved', resolved_at = v_now,
      metadata = case when student_material_id is null
        then metadata || jsonb_build_object('review_material_id', v_check.material_id)
        else metadata end
      where id = v_error.id;
  else
    update public.study_errors set failure_count = failure_count + 1,
      last_failed_at = v_now, last_reviewed_at = null where id = v_error.id;
  end if;
  return jsonb_build_object('success', true, 'correct', v_correct,
    'correctIndex', v_check.correct_index, 'feedback', v_check.feedback, 'replayed', false,
    'resolvedAt', case when v_correct then v_now else null end);
end;
$$;
revoke all on function public.submit_study_error_review_check(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.submit_study_error_review_check(uuid, uuid, integer) to service_role;
