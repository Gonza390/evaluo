-- Bilingual verified practice banks. No new allowance or entitlement is created.
-- Original ES bank modes remain intact; independent EN payloads use :en suffix.
alter table public.free_study_v2_banks
  drop constraint if exists free_study_v2_banks_mode_check;

alter table public.free_study_v2_banks
  add constraint free_study_v2_banks_mode_check
  check (
    mode in ('true_false','cases','matching','flashcards','true_false:en','cases:en')
    or mode ~ '^topic:[0-9]{1,3}:round:[0-4](:en)?$'
  );

-- RLS, ownership, primary key, service_role privileges and Free unlock claims
-- are unchanged. Never partition claims or increase the Free caps by locale.
