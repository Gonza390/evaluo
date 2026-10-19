alter table public.email_campaign_deliveries
  drop constraint if exists email_campaign_deliveries_status_check;

alter table public.email_campaign_deliveries
  add constraint email_campaign_deliveries_status_check
  check (status in ('sending', 'triggered', 'sent'));

alter table public.email_campaign_deliveries
  add column if not exists triggered_at timestamptz null;
