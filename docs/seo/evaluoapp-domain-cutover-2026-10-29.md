# Migración Evaluo: evaluo.com.ar → evaluoapp.com (2026-10-29)

**Estado:** preparación técnica. **No fusionar esta rama ni activar redirecciones sin aprobar el cambio coordinado.**

## Objetivo y alcance

- Dominio público, indexable y de aplicación: `https://evaluoapp.com` (sin `www`).
- Repositorio: `Gonza390/evaluo`, rama de producción deseada `main`. Conservar el proyecto de Vercel y el mismo Supabase; no migrar datos de usuarios ni PDFs.
- Mantener `evaluo.com.ar` apuntando a Vercel para redirecciones y enlaces históricos. No cambiar sus DNS.
- La sesión web puede requerir nuevo inicio de sesión: las cookies no se comparten entre dominios.

## Preparación aplicada en esta rama (sin publicarse)

1. Fallback de `lib/site.ts` actualizado a `https://evaluoapp.com`; para el dominio real prevalece `NEXT_PUBLIC_SITE_URL`.
2. Imágenes de los correos transaccionales relativas a `SITE_URL`, en vez de un enlace antiguo codificado.
3. Links de recordatorios de estudio/examen centralizados con `SITE_URL`; conservan sus parámetros UTM.
4. Redirecciones 301 públicas de ambos hosts antiguos al nuevo, preservando ruta y query string de origen. Excluimos `/api` y `/auth/callback` para no romper cron jobs, webhooks de pago ni callbacks OAuth antiguos.
5. Pruebas SEO de reglas de migración y fixtures de URL de checkout actualizadas.

## Gate de publicación: verificar ANTES de fusionar/desplegar

- [ ] Confirmar en Vercel que la rama de producción efectiva sea `main` (el panel mencionó `master`). Revisar el ajuste `git.deploymentEnabled=false` antes de confiar en deploys automáticos.
- [ ] Probar autenticación de Google en `https://evaluoapp.com`, de comienzo a fin, en móvil y escritorio. Comprobar que la sesión finalice en el nuevo host.
- [ ] Verificar que Supabase → Authentication → URL Configuration incluya `https://evaluoapp.com/**` y preserve el callback del dominio antiguo; cambiar `Site URL` al nuevo **solo durante el corte**.
- [ ] Probar registro y login con contraseña, recuperar un usuario existente, carga y procesamiento de PDF, práctica y panel de usuario; no usar cuentas reales para QA.
- [ ] Verificar retorno y webhook de Mercado Pago desde el dominio nuevo, con prueba en sandbox/test; no modificar credenciales de producción para probar.
- [ ] Revisar todos los workflows/plantillas activas en Sender por URLs antiguas y segmentar el cambio. Actualmente el único dominio remitente verificado es `evaluo.com.ar`: NO cambiar `SENDER_FROM_EMAIL` a `@evaluoapp.com` sin SPF, DKIM, DMARC y verificación en Sender.
- [ ] Revisar Search Console actual, rastreabilidad y rutas SEO críticas de Argentina, España, México y Colombia. Inventariar las URLs indexadas y sus nuevas equivalencias. Evitar cambios de contenido simultáneos.
- [ ] Guardar referencias y métricas previas de indexación, clics y tráfico, con fecha.

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
