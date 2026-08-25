# Evaluo — correcciones aplicadas (25-08-2026)

Este conjunto de cambios parte de `master` y agrupa la auditoría de seguridad,
dashboard, procesamiento de PDFs, redes sociales y mantenimiento de índices.

## Estado de producción

Las migraciones de Supabase ya fueron aplicadas al proyecto Evaluo y sus versiones
quedaron alineadas con el historial remoto:

- `20260825150727_security_hardening.sql`
- `20260825150800_fk_indexes.sql`

Después de aplicar el hardening se verificó que:

- `get_warmup_candidates` dejó de ser ejecutable por `anon` y `authenticated`.
- `consume_rate_limit` dejó de ser ejecutable por `anon` y `authenticated`.
- desaparecieron los tres errores `SECURITY DEFINER VIEW` del Security Advisor.
- desaparecieron los warnings de `search_path` mutable corregidos por la migración.
- `idx_materias_carrera_id` quedó `indisvalid=true` e `indisready=true`.
- los avisos de foreign keys sin índice cubiertos por la migración dejaron de aparecer.

## PDFs

La causa del PDF que podía quedarse indefinidamente en 65% era un timeout de la
función de Vercel después de 300 segundos, agravado por modelos de IA retirados.

Cambios incorporados:

- Gemini fijado a `gemini-3.5-flash-lite`.
- Groq usa `openai/gpt-oss-20b` como fallback de producción.
- modelos Groq retirados se descartan incluso si permanecen configurados en una
  variable de entorno antigua.
- los jobs en `processing` tienen un lease de 7 minutos.
- un job vencido se marca como `failed` junto con su `student_material`.
- el propietario ve un botón `Reintentar procesamiento` y no un porcentaje eterno.
- se mantienen como máximo 3 intentos automáticos sobre el mismo job.

## Redes sociales

Los footers usan únicamente los perfiles reales:

- Instagram: `https://www.instagram.com/evaluo.app/`
- LinkedIn: `https://www.linkedin.com/company/evaluo-ar/`

Se eliminaron los placeholders genéricos de TikTok y YouTube y se añadieron tests
para impedir regresiones.

## Dashboard

Los errores del bootstrap principal ya no se convierten en un falso `status: ok`
con datos vacíos. El error llega al error boundary de Next.js y se muestra un
estado recuperable con `Reintentar`.

## CI

El job de calidad ejecuta:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run performance:budget`

El repositorio histórico todavía no posee un baseline completo de Supabase. Las
primeras migraciones asumen tablas preexistentes, por lo que `supabase db reset`
sobre una DB vacía genera un falso negativo. El replay completo debe reactivarse
cuando se incorpore ese baseline.

## Warnings que no se modificaron a ciegas

El Performance Advisor todavía reporta optimizaciones de RLS (`auth_rls_initplan`
y `multiple_permissive_policies`) y varios índices como `unused`. No son errores
funcionales y requieren una migración específica con pruebas de permisos/carga;
no se eliminan índices recién creados sólo porque aún no tengan lecturas en las
estadísticas.

El Security Advisor aún recomienda activar `Leaked password protection`. Esa es
una configuración de Auth de la plataforma, no una migración SQL del repositorio.
