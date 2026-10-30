# Evaluo English organic search launch — 2026-10-30

## Scope
English SEO first, without pretending that the current product UI is localized. Do not change or deindex existing Spanish pages.

New English-language content pages:
- `/en` — overarching English study workflow.
- `/en/pdf-to-quiz` — writing and checking practice questions from a PDF.
- `/en/pdf-to-flashcards` — creating focused recall cards from a PDF.
- `/en/study-pdf-with-ai` — a source-checked PDF study workflow.

Each includes a distinct worked educational example, an actionable procedure, common pitfalls, FAQs, relevant internal links and an explicit disclosure that the product's sign-in, navigation and pricing remain in Spanish. Teaching examples are illustrative, **not recorded outputs of the product or official exam items**. Users can follow the method without creating an account.

## Search demand to validate
Ubersuggest estimates for **United States**, queried 2026-10-30:
- `pdf to quiz` approx. 390 monthly searches, SEO difficulty 40.
- `create flashcards from pdf` approx. 140 monthly searches, SEO difficulty 24.
- `pdf to quiz generator` approx. 110 monthly searches, SEO difficulty 34.
- `make flashcards from pdf` approx. 110 monthly searches, SEO difficulty 23.
- `flashcards from pdf` approx. 70 monthly searches, SEO difficulty 23.
- `study pdf with ai` produced no measurable monthly demand in the Ubersuggest query. The broader study-workflow page is primarily an educational hub, **not** an evidence-based high-volume target.

These are third-party estimates, not confirmed Google traffic or future ranking guarantees. Use US English as a research starting point and one neutral `en` version initially; do not multiply `en-US`, `en-GB`, and `en-CA` copies before demand merits regionalization.

## SEO implementation
- Four unique, indexable URL paths under `/en`, each with explicit metadata, self-referencing canonical, English meta titles/descriptions, `en_US` Open Graph.
- `Content-Language: en` initial response for `/en` and `/en/*`.
- HTML content wrapper `lang=en`, with client document-language synchronization.
- Reciprocal `hreflang=en` between the Spanish and English **equivalent** guide pages (study PDF, quiz from PDF, flashcards from PDF). Do not tag a Spanish home page as the English homepage's duplicate.
- Four new sitemap entries; English links from Spanish international landing and site footer; crosslinks among the four English pages.
- English language UI throughout each landing, including English header and footer; all links to the existing Spanish interface are labeled as such.
- Keep original Spanish canonicals, sitemap URLs and `robots.txt` untouched.

## Important technical limitation for future localization
The shared Next.js root layout still emits `<html lang="es">` in SSR for all languages. The new English subtree has `lang="en"` on its content wrapper, `Content-Language: en` in the initial response and a client effect to sync the root document attribute. **Do not claim that initial root HTML is fully localized.** Fixing the initial root locale correctly would require an i18n multi-root-layout refactor or another audited static architecture; avoid making the entire site dynamic to change one attribute. Google determines language predominantly from visible content, not this attribute alone.

## What must be implemented before promoting a full English product
- English sign-in, registration, header, dashboard, onboarding, upload, PDF reader, summary, quiz, correction, flashcards, error reinforcement and return flow.
- QA on actual English PDFs including diagrams, difficult formulas and scanned PDFs.
- English-language error messages, emails, legal disclosures and support materials.
- Localized pricing and **verified** international payment acceptance, before marketing a paid plan to English-language users.
- Measure Search Console impressions/clicks and indexing per English URL, registrations originating from `/en` and whether users can complete the study session. Old `evaluo.com.ar` GSC property does not measure this launch.

## Editorial guardrail
Google Search Central recommends unique language URLs and clear language throughout visible content. Avoid auto-translation-only pages at scale. Indexing is not a guarantee of discovery or ranking. Sources:
- https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/essentials/spam-policies
