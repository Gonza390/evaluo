create table if not exists public.resource_views (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.recursos(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  session_key text null,
  created_at timestamptz not null default now()
);

create index if not exists resource_views_resource_id_idx
  on public.resource_views (resource_id);

create index if not exists resource_views_created_at_idx
  on public.resource_views (created_at desc);

alter table public.resource_views enable row level security;

drop policy if exists resource_views_select_public on public.resource_views;
create policy resource_views_select_public
on public.resource_views
for select
using (true);

drop policy if exists resource_views_insert_public on public.resource_views;
create policy resource_views_insert_public
on public.resource_views
for insert
with check (true);
