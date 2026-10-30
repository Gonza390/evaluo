# Evaluo English product localization — phase 1 (2026-10-30)

## First implemented slice
- New optional `/en/login?mode=signup` route renders the **existing** Supabase Google/email authentication implementation with English labels, success/validation messages and accessibility text.
- `/login` retains Spanish by default; no duplicate authentication backend, no changes to password handling, OAuth callbacks or PDF draft persistence.
- English SEO pages now provide a clearly labeled sign-up link alongside the existing Spanish-product link. The English sign-up page warns that the dashboard, learning tools, support and emails remain in Spanish.
- `/en/login` is `noindex` and absent from the sitemap.
- Classify English SEO / English auth navigation for event attribution and skip the dashboard session-idle guard on English public routes.
- Legal pages are currently in Spanish and labeled `Terms (Spanish)` / `Privacy Policy (Spanish)`. **Do not imply localized legal policies or international payments have launched.**

## Remaining work before English users can complete a full study session
1. Persist a user language preference without changing existing Spanish users; use a common translation dictionary and locale-aware layout, not scattered string replacements.
2. Translate dashboard, first-upload experience, PDF reader, summary, topic selection, quizzes, review of mistakes and flashcards. Verify all user-visible errors and empty states.
3. Exercise a complete account + English PDF flow on desktop and mobile, including difficult layouts, formulas and upload failures. Ensure AI output language and feedback follow the document/user preference.
4. Translate onboarding, account emails, help, privacy information and subscription messages as appropriate.
5. Launch international checkout only once provider and country/payment support are actually confirmed.

## Quality and SEO
- The dedicated English educational pages remain the indexable acquisition destinations.
- An English-language login form does not imply an English-language dashboard; keep that notice until full localization is delivered.
- Never include `/en/login` in the sitemap; `robots.index=false` is explicit.
- The initial root `<html lang>` is still part of the shared Spanish layout. English wrapper and response language are set; an audited multi-root i18n change remains necessary for correct initial HTML root language.

Main emphasis: opt-in, no regression to Spanish product, and honest disclosure.
