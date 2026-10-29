# Migración Evaluo: evaluo.com.ar → evaluoapp.com (2026-10-29)

**Estado actualizado (29/10/2026): migración publicada en producción desde `main` (PR #329).** Este documento conserva el checklist original del corte como historial; sus avisos de «no fusionar» y tareas previas corresponden a la preparación inicial, no al estado actual. La verificación HTTP posterior está registrada en [`evaluoapp-domain-live-audit-2026-10-29.md`](./evaluoapp-domain-live-audit-2026-10-29.md): **87/87 controles aprobados**. La inspección de indexación y el cambio de dirección en Google Search Console siguen siendo pasos externos por confirmar.

## Objetivo y alcance

- Dominio público, indexable y de aplicación: `https://evaluoapp.com` (sin `www`).
- Repositorio: `Gonza390/evaluo`, rama de producción deseada `main`. Conservar el proyecto de Vercel y el mismo Supabase; no migrar datos de usuarios ni PDFs.
- Mantener `evaluo.com.ar` apuntando a Vercel para redirecciones y enlaces históricos. No cambiar sus DNS.
- La sesión web puede requerir nuevo inicio de sesión: las cookies no se comparten entre dominios.

## Preparación aplicada en esta rama (sin publicarse)

1. Fallback de `lib/site.ts` actualizado a `https://evaluoapp.com`; para el dominio real prevalece `NEXT_PUBLIC_SITE_URL`.
2. Imágenes de los correos transaccionales relativas a `SITE_URL`, en vez de un enlace antiguo codificado.
3. Links de recordatorios de estudio/examen centralizados con `SITE_URL`; conservan sus parámetros UTM.
4. Redirecciones 301 públicas de ambos hosts antiguos al nuevo, preservando ruta y query string de origen. Excluimos `/api`, `/auth/callback`, `/_next`, `/_vercel` y `/.well-known` para no romper cron jobs, webhooks de pago, callbacks OAuth antiguos ni recursos y verificaciones de clientes anteriores.
5. Pruebas SEO de reglas de migración y fixtures de URL de checkout actualizadas.

## Gate de publicación: verificar ANTES de fusionar/desplegar

- [x] GitHub Actions PR #329: security, quality, Lighthouse SEO y CI required completaron con resultado exitoso el 2026-10-29.

- [x] Vercel confirma despliegues **production** recientes desde `main`, y el despliegue de prueba de la rama de migración es `READY` sin asignación a los dominios públicos. Mantener la observación de `git.deploymentEnabled=false` y validar los triggers antes del corte.
- [x] Probar inicio de sesión de Google en `https://evaluoapp.com`: el dueño confirmó que termina autenticado en `/dashboard` del nuevo dominio el 2026-10-29. Pendiente QA móvil complementario.
- [ ] Verificar que Supabase → Authentication → URL Configuration incluya `https://evaluoapp.com/**` y preserve el callback del dominio antiguo; cambiar `Site URL` al nuevo **solo durante el corte**.
- [x] Registro e inicio de sesión con contraseña, acceso con Google, carga y procesamiento de PDF, resumen, práctica por tema y resultado validados manualmente por el dueño en `evaluoapp.com` (2026-10-29). La recuperación de contraseña todavía no está implementada en el producto; no es prueba de migración.
- [ ] Verificar retorno y webhook de Mercado Pago desde el dominio nuevo, con prueba en sandbox/test; no modificar credenciales de producción para probar.
- [ ] Revisar todos los workflows/plantillas activas en Sender por URLs antiguas y segmentar el cambio. Actualmente el único dominio remitente verificado es `evaluo.com.ar`: NO cambiar `SENDER_FROM_EMAIL` a `@evaluoapp.com` sin SPF, DKIM, DMARC y verificación en Sender.
- [x] El dueño confirmó la verificación de la propiedad `evaluoapp.com` en Google Search Console (2026-10-29). Las landings internacionales usan `SITE_URL` para canonical/hreflang. La propiedad nueva todavía no aparece en el conector Windsor.ai (solo `sc-domain:evaluo.com.ar`). Mantener comparación de rutas y contenido al publicar.
- [x] Línea base de Search Console guardada en `docs/seo/evaluoapp-search-console-baseline-2026-10-29.md` (01–25/10: 242 clics y 5.455 impresiones por fecha).

## Verificaciones adicionales de la rama

- [x] GitHub Actions CI: seguridad, typecheck/lint, tests, compilación, Lighthouse SEO y prueba de auditoría de dominio completaron con éxito para el último commit verificado de la rama (2026-10-29).
- [x] GitHub Actions QA responsive de flujos de estudio en móvil y escritorio completó con éxito (2026-10-29).
- [x] Se auditaron alrededor de 705 archivos de código y recursos; se corrigieron 7 referencias adicionales a URLs antiguas (PDF compartidos, portada de descarga, referidos, analítica, simulador).
- [x] Despliegue de prueba Vercel `dpl_E8wbabRbmZzeywrqJa7hyDawJMAa` en estado READY; no es un despliegue production.
- [x] Sender: único dominio remitente autenticado `evaluo.com.ar`; seis correos en un workflow activo todavía usan links antiguos; sin campañas SCHEDULED. Conservar el remitente durante la migración, y coordinar la actualización de los 6 enlaces y sus recursos al activar el dominio nuevo.
- [ ] Confirmar que un flujo de compra de prueba y sus notificaciones funcionan con el dominio nuevo; si no hay sandbox habilitado, dejar pagos fuera de la certificación y controlar que `/api/webhooks/*` siga operativo en el dominio antiguo.

## Secuencia propuesta para el corte coordinado

1. Confirmar la revisión/QA y programar un cambio de bajo tráfico. Guardar commit y despliegue de rollback.
2. Cambiar `NEXT_PUBLIC_SITE_URL` de **Production** a `https://evaluoapp.com` en Vercel. El código `NEXT_PUBLIC_` se incrusta también en build: crear un despliegue nuevo; no basta cambiar la variable en el panel. Revisar el valor de Preview por separado para evitar que los entornos de prueba publiquen señales SEO erróneas.
3. Fusionar/release esta rama únicamente de forma coordinada con (2); comprobar que `https://evaluoapp.com/sitemap.xml`, `/robots.txt`, canonical, OpenGraph, schema y hreflang contienen el dominio nuevo.
4. Cambiar Supabase `Site URL` a `https://evaluoapp.com` manteniendo ambas Redirect URLs durante el periodo de transición. Volver a verificar OAuth Google, PKCE y email.
5. Confirmar `301` para `https://evaluo.com.ar/estudiar-pdf-con-ia` y `www.evaluo.com.ar`, preservación de rutas y query strings, sin bucles ni cadenas. Confirmar que `/api/internal/*`, `/api/webhooks/mercadopago` y `/auth/callback` siguen respondiendo en el host antiguo.
6. Comprobar pago (checkout/retorno/webhook), tareas cron, correos de ciclo de vida y links con UTM.
7. Agregar/verificar propiedad del dominio nuevo en Google Search Console, subir `https://evaluoapp.com/sitemap.xml` y usar Change of Address para la propiedad anterior cuando la migración esté correcta y las redirecciones activas. Revisar GA/GTM, Clarity, Bing y backlinks/campañas si aplica.
8. Monitorear 404/5xx, callbacks, registros, PDFs, robots, canonical/hreflang, tráfico y cobertura de índices durante las semanas siguientes.

## Rollback y cuidados

- Las redirecciones 301 pueden quedar almacenadas por navegadores y buscadores: un rollback rápido no garantiza deshacer de inmediato sus efectos.
- Si fallan auth, pagos o PDFs: detener el cambio, revertir la publicación a último commit bueno, y restaurar de modo coordinado variables y Supabase `Site URL` antes de validar. Evitar redirecciones contradictorias entre Vercel y Cloudflare.
- Mantener el dominio antiguo renovado y con HTTPS por largo tiempo (idealmente al menos 1 año o más), para conservar valor de enlaces históricos.
- La migración de dominio implica fluctuaciones temporales de ranking; no prometer retención absoluta de posicionamiento SEO.

## Fuentes técnicas

- Vercel: https://vercel.com/docs/project-configuration/vercel-json
- Vercel y query strings: https://vercel.com/kb/guide/how-do-i-perform-vercel-redirects-based-on-query-strings
- Supabase Redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
