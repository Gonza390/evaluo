create table if not exists public.resource_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  resource_id uuid not null references public.recursos(id) on delete cascade,
  vote_type smallint not null check (vote_type in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resource_votes_user_resource_unique unique (user_id, resource_id)
);

create index if not exists resource_votes_resource_id_idx
  on public.resource_votes (resource_id);

create index if not exists resource_votes_user_id_idx
  on public.resource_votes (user_id);

alter table public.resource_votes enable row level security;

create policy resource_votes_select_public
on public.resource_votes
for select
using (true);

create policy resource_votes_insert_own_or_admin
on public.resource_votes
for insert
with check (
  auth.uid() = user_id
  or public.current_user_is_admin()
);

create policy resource_votes_update_own_or_admin
on public.resource_votes
for update
using (
  auth.uid() = user_id
  or public.current_user_is_admin()
)
with check (
  auth.uid() = user_id
  or public.current_user_is_admin()
);

create policy resource_votes_delete_own_or_admin
on public.resource_votes
for delete
using (
  auth.uid() = user_id
  or public.current_user_is_admin()
);
