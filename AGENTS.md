<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Evaluo

EdTech web platform — Next.js 16 (App Router), React 19, TypeScript, Supabase, Tailwind v4. Full architecture doc: `PROYECTO_EVALUO.md` (Spanish; docs and comments are Spanish). Requires Node 22.

## Flujo de trabajo (obligatorio para todos los chats y agentes)

Varios chats/agentes trabajan en paralelo sobre `master`. Reglas:

- **`master`** = integración. **`main`** = producción (protegida: solo PR con check "CI required"; Vercel despliega automáticamente desde `main`).
- Cada tarea: rama corta desde el `master` más reciente (`git fetch origin && git checkout -b <tipo>/<tema> origin/master`).
- **Al terminar una tarea, integrarla en `master` sin esperar a nadie:**
  1. `git fetch origin && git rebase origin/master`
  2. `npx tsc --noEmit && npm run lint && npm test` (deben pasar)
  3. `git checkout master && git merge --ff-only origin/master && git merge --no-ff <rama>` y `git push origin master`
  4. Si el push falla porque `master` avanzó: repetir desde el paso 1. Si hay conflicto en archivos de otro chat, resolver conservando su trabajo; si no es obvio, avisar al usuario.
- No dejar PRs abiertos esperando merge ni trabajo sin integrar al terminar.
- Agrupar commits: un push a `master` por tarea terminada, no por cada cambio (cada push dispara el CI).
- **Nunca** pushear ni abrir PRs contra `main`. El release `master → main` lo hace un único responsable (el chat de infraestructura o el usuario), con un PR y CI en verde, y sale todo junto.
- **Migraciones (`supabase/migrations`)**: la DB es compartida con producción. Solo el chat de infraestructura las aplica; los demás chats agregan el archivo y avisan.
- Archivos compartidos (`package.json`, `next.config.mjs`, `proxy.ts`, `tests/smoke-manifest.json`, `vercel.json`, `.github/workflows`): cambios mínimos y en commits separados.

## Commands

- `npm run dev` / `build` / `start` — Next.js.
- `npm run lint` — ESLint (flat config `eslint.config.mjs`). CI also runs `npx tsc --noEmit` before the build.
- `npm test` — runs the curated list in `tests/smoke-manifest.json` through `scripts/run-smoke-tests.mjs`. The runner preserves each test's alias-loader setting and uses Node's TypeScript stripping. Add a test to the manifest when it should gate CI; other `tests/` files can remain ad-hoc. `tsconfig` excludes `tests/`, so type errors there won't surface in build.
- Prettier (`.prettierrc`: single quotes, printWidth 100, tailwind plugin) — no `format` script; run `npx prettier --write <path>`.
- CI (`.github/workflows/ci.yml`) runs security and quality/SEO jobs; quality checks typecheck → lint → tests → build → performance budget → Lighthouse. Build jobs restore `.next/cache`.
- Node 22 is required (`.nvmrc` and `package.json` engines). Run `npm ci` after switching versions.

## Path alias

`@/*` maps to the repo **root** (`./*`), not `src/` — e.g. `@/lib/...`, `@/components/...`, `@/app/...`, `@/types/supabase`.

## Supabase & schema

- No local Supabase stack; connect to the remote project via `.env.local` (copy `.env.example`).
- Schema changes go **only** through timestamped migrations in `supabase/migrations/*.sql`. `supabase/schema.remote.sql` is a snapshot.
- Clients in `lib/supabase*.ts`: `createClientServer()` (server components/actions), `createAdminClient()` (privileged/backoffice), `supabase-public`, etc. `types/supabase.ts` is the generated `Database` type.
- `seed.cjs` (eslint-ignored) seeds `preguntas_banco`.

## Auth & routing

- Role/authorization is centralized in `lib/access-control.ts` + `lib/roles.ts` + `lib/admin-users.ts` (cache per request). Admin = `app_metadata.role === 'admin'` OR `profiles.role === 'admin'`. Don't add ad-hoc role checks.
- Route gating lives in `proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`, export `proxy` + `config.matcher`). `/api/internal/*` bypasses API protection (used by Vercel crons in `vercel.json`).

## Styling / design system

- Tailwind **v4**: config is in CSS (`app/globals.css` via `@theme inline`, `@tailwindcss/postcss`), not `tailwind.config.cjs` (legacy, eslint-ignored).
- Design tokens are OKLCH CSS vars in `app/globals.css` — the source of truth. `.cursorrules`/`CLAUDE.md` hold visual conventions (use token classes like `bg-background`/`text-foreground`/`bg-primary`, `.pc-gigante-card` for premium cards, no hardcoded colors). Note: `.cursorrules` references `DESIGN_SYSTEM.md` (doesn't exist) and calls accents "emerald/teal", but actual `--primary`/`--accent` are blue/indigo — trust `globals.css`.

## Notable structure

- `lib/ai/providers.ts` — multi-provider LLM (Groq, Gemini, GitHub Models, NVIDIA); keys in `.env.example`.
- Simulator core: `components/simulador/SimuladorExamen.tsx` (large, actively being split) + `lib/simulator-*.ts`.
- `components/ui` — shadcn/ui (new-york, aliases in `components.json`).
- `next.config.mjs` — strict CSP + security headers; any new third-party script/connect domain must be whitelisted there or it will be blocked.
- `instrumentation.ts` — Next `onRequestError` forwards server errors to Sentry/Axiom/`ERROR_REPORT_URL` when those env vars are set.
- `Evaluo/` (empty) and `backups/` are legacy artifacts; `backups/` is excluded from `tsconfig`.

## Codex Skills

Codex principal coordina el trabajo y conserva la responsabilidad de interpretar el pedido, activar Skills, ordenar dependencias, integrar resultados y responder al usuario. No existe ni debe crearse un Skill `orchestrator`.

Activa solo los Skills estrictamente necesarios para la tarea. No cargues especialistas por rutina ni delegues una tarea que Codex pueda resolver directamente con el contexto ya disponible. Si un cambio cruza dominios, usa el conjunto mínimo de Skills y mantén un único responsable por cada parte:

- `product-strategist`: producto, MVP, prioridad, PMF, growth, pricing, funnels y métricas.
- `cto`: decisiones de arquitectura, contratos transversales, deuda estructural y gate técnico.
- `backend`: APIs, server actions, Supabase, datos, auth, jobs y lógica de servidor.
- `frontend`: Next.js/React, componentes, integración cliente y estados de interfaz.
- `ai`: proveedores LLM, prompts, structured output, resiliencia, coste y seguridad de IA.
- `rag`: extracción documental, chunking, recuperación, trazabilidad y calidad pedagógica.
- `ux`: flujos, jerarquía, responsive y accesibilidad.
- `security`: auditoría de vulnerabilidades y controles de seguridad.
- `qa`: criterios de aceptación, regresiones, verificaciones y readiness de release.
- `legal`: revisión jurídica preliminar de privacidad, copyright, términos y regulación.

Backend, Frontend, AI y RAG implementan únicamente dentro de su dominio. Product Strategist, CTO, UX, Security, QA y Legal revisan o definen su especialidad; no deben absorber implementación ajena salvo instrucción explícita del usuario.

Exige revisión de Security cuando el cambio afecte auth/autorización, RLS, secretos, datos sensibles, uploads, endpoints públicos o internos, pagos, dependencias externas, IA no confiable o límites de abuso. Exige QA cuando exista riesgo razonable de regresión o se prepare un release. Exige gate de CTO cuando cambien arquitectura, esquema o contratos transversales, infraestructura, proveedores, costes relevantes, seguridad crítica, rendimiento/escalabilidad o preparación para producción. Para cambios pequeños y locales de bajo riesgo, evita estos gates adicionales.
