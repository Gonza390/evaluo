create table if not exists public.referral_partner_access (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.referral_partners(id) on delete cascade,
  email text not null,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (partner_id, email)
);

create or replace function public.normalize_referral_partner_access_email()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.email := lower(btrim(new.email));
  if new.email = '' then
    raise exception 'referral access email cannot be empty';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists referral_partner_access_normalize_email on public.referral_partner_access;
create trigger referral_partner_access_normalize_email
before insert or update of email on public.referral_partner_access
for each row execute function public.normalize_referral_partner_access_email();

create or replace function public.sync_referral_partner_portal_access()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_email text;
  previous_email text;
begin
  next_email := nullif(lower(btrim(coalesce(new.contact_email, ''))), '');
  if tg_op = 'UPDATE' then
    previous_email := nullif(lower(btrim(coalesce(old.contact_email, ''))), '');
    if previous_email is distinct from next_email and previous_email is not null then
      update public.referral_partner_access
      set status = 'revoked', revoked_at = now(), updated_at = now()
      where partner_id = new.id
        and email = previous_email
        and status = 'pending'
        and user_id is null;
    end if;
  end if;

  if next_email is not null then
    insert into public.referral_partner_access (partner_id, email, status)
    values (new.id, next_email, 'pending')
    on conflict (partner_id, email) do update
    set
      status = case
        when public.referral_partner_access.user_id is null then 'pending'
        else public.referral_partner_access.status
      end,
      revoked_at = case
        when public.referral_partner_access.user_id is null then null
        else public.referral_partner_access.revoked_at
      end,
      updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists referral_partner_portal_access_sync on public.referral_partners;
create trigger referral_partner_portal_access_sync
after insert or update of contact_email on public.referral_partners
for each row execute function public.sync_referral_partner_portal_access();

insert into public.referral_partner_access (partner_id, email, status)
select id, lower(btrim(contact_email)), 'pending'
from public.referral_partners
where contact_email is not null and btrim(contact_email) <> ''
on conflict (partner_id, email) do nothing;

create index if not exists referral_partner_access_user_status_idx
  on public.referral_partner_access (user_id, status);
create index if not exists referral_partner_access_email_status_idx
  on public.referral_partner_access (email, status);

alter table public.referral_partner_access enable row level security;
revoke all on table public.referral_partner_access from anon, authenticated;
revoke all on function public.normalize_referral_partner_access_email() from public, anon, authenticated;
revoke all on function public.sync_referral_partner_portal_access() from public, anon, authenticated;

comment on table public.referral_partner_access is
  'Private mapping between a referral partner contact email and the verified Evaluo user allowed to view partner metrics.';
