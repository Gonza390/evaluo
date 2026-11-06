-- English-only cache keys are an independent projection of the same source.
-- Apply BEFORE deploying the bilingual practice endpoints. No quota reset.
-- This changes ONLY the check constraint on cache keys: existing rows and
-- global per-account unlock limits remain unchanged.
alter table public.free_study_v2_banks
  drop constraint if exists free_study_v2_banks_mode_check;

alter table public.free_study_v2_banks
  add constraint free_study_v2_banks_mode_check
  check (
    mode in (
      'true_false', 'cases', 'matching', 'flashcards',
      'true_false:en', 'cases:en', 'matching:en', 'flashcards:en'
    ) or mode ~ '^topic:[0-9]{1,3}:round:[0-4](:en)?$'
  );

-- Access remains service_role-only with RLS, as defined in Free V2.
-- No changes to claim_free_study_v2_unlock() or its global counters.
