create table if not exists public.admin_storage_audit_snapshots (
  audit_key text primary key,
  scanned_at timestamptz not null default now(),
  total_files integer not null default 0 check (total_files >= 0),
  orphan_count integer not null default 0 check (orphan_count >= 0),
  orphan_sample jsonb not null default '[]'::jsonb
);

alter table public.admin_storage_audit_snapshots enable row level security;

comment on table public.admin_storage_audit_snapshots is 'Service-role-only snapshots for expensive administrator storage audits.';
