# Evaluo — internacionalización completa del producto ES/EN
Fecha: 2026-11-06
Rama auditada: `master` — commit `7a32cc93a4853bb1d103a173be5d77ffeb3b93b1`
Estado: diagnóstico y especificación. **Este documento no implementa funcionalidades ni habilita inglés en producción.**

## Objetivo y definición de terminado
Un alumno puede recorrer desde `/en` hasta la sesión de estudio y la gestión de su cuenta **sin volver involuntariamente al español**: landing, registro, login, dashboard, carga PDF/DOCX, procesamiento, resúmenes, temas, glosario, flashcards, prácticas (todos los modos), correcciones, tutor, progreso, plan de estudio, calendario, límites Free/Premium, pago, notificaciones, emails, ayuda y políticas. La versión española mantiene exactamente las capacidades actuales.

## Hechos verificados en master
- Existe superficie pública inglesa (`app/(en)/en/*`) y login inglés (`app/(en)/en/login/page.tsx`) con `LoginFormGoogleFirst locale="en"`.
- El layout de `app/(en)/layout.tsx` **ya renderiza** `<html lang="en">`, y el español `app/(es)/layout.tsx` usa `<html lang="es">`. Documentación fechada 2026-10-30 que dice lo contrario está desactualizada en este punto.
- Login inglés predetermina `/dashboard` (`components/LoginFormGoogleFirst.tsx`), y `proxy.ts` redirige a rutas españolas. `SharedPrivateShell` y `ClientLayoutClient` reconocen rutas privadas sin prefijo e incluyen cadenas y enlaces españoles.
- `package.json` no declara una biblioteca general de internacionalización; la traducción inglesa observada se implementa localmente en login y marketing.
- La capa de UI del estudiante, pantallas de práctica, configuración, planes, calendario y estados vacíos contiene copy en español. Hay formateos forzados `es-AR`.
- `GenerateSummaryInput` (`lib/student-materials/types.ts`) no incluye idioma de salida; los prompts del resumen, modelo canónico y feedback son españoles (`lib/student-materials/summary.ts`, `canonical-summary.ts`, `pedagogy-ai.ts`, `app/api/practice/prepare/route.ts`). `buildStudyErrorReviewPrompt` exige explícitamente español sencillo y voseo argentino.
- Varias reglas de calidad/dedupe usan vocabulario y filtros españoles (`lib/student-materials/pedagogy.ts`, `glossary.ts`, `summary.ts`), por lo que traducir sólo prompts no basta.
- `lib/email/student-material-ready.ts`, `study-return-d1.ts`, `exam-reminders.ts` contienen subjects, HTML y copy españoles; el recordatorio de exámenes calcula el día usando zona Argentina y fecha `es-AR`.
- El checkout en `master`, `app/api/payments/checkout/route.ts`, usa Mercado Pago; `lib/payments/mercadopago.ts` configura ARS. La política menciona Paddle **cuando se habilite**, no como checkout internacional ya disponible.
- Existen términos, privacidad, reembolsos y política de uso aceptable en español. No consta equivalente inglés completo en el árbol auditado.
- Las rutas `/administrador` son internas: no es necesario traducirlas para considerar completa la experiencia del estudiante.

## Decisiones de arquitectura (aprobar antes de escribir código)

### Locales y preferencias
- `ui_locale: 'es' | 'en'` del usuario: español predeterminado para las cuentas existentes. Persistir en `profiles` por migración SQL con RLS existente; cookie segura para SSR / visitante y preferencia de sesión. Detectar `Accept-Language` sólo en primera visita de personas sin preferencia, sin redirigir automáticamente a usuarios existentes. Resolver prioridad: URL explícita > elección persistida > cookie > navegador > es.
- `source_locale` del material: detectado en texto original PDF/DOCX y editable sólo si procede.
- `study_locale` por material: idioma del contenido pedagógico generado. Predeterminado al idioma de interfaz al crear el material; permitir cambiarlo explícitamente y advertir sobre regeneración sólo cuando necesaria.
- `time_zone` del usuario independiente del idioma. Nunca suponer que inglés = Estados Unidos ni español = Argentina; fechas y horas con `Intl`.

### Rutas sin romper SEO ni el producto en español
- Preservar URLs públicas actuales y la app española `/dashboard`, `/materiales/*`, `/calendario`, `/configuracion`, `/pricing`, `/login`.
- Inglés con `/en/*` incluyendo rutas privadas `/en/dashboard`, `/en/materiales/*`, `/en/calendario`, `/en/configuracion`, `/en/pricing`. Las dos ramas deben renderizar **los mismos componentes de producto**; las rutas son wrappers y los textos provienen de diccionarios.
- No duplicar lógica de páginas, servidor, cuotas ni servicios. Extraer módulos compartidos por flujo. Considerar `next-intl` o diccionarios tipados con namespaces, evaluando bundle, SSR y compatibilidad con el `proxy.ts` existente. Evitar prefijar ciegamente `/api/*` o rutas OAuth/webhooks/cron.
- Construir helpers tipados `localizePath` / `returnTo` para enlaces profundos, OAuth, recuperación de sesión, referidos, PDF compartido, Premium y botón atrás. Mantener control de open redirects.
- Las páginas privadas `noindex`. Las públicas inglesas tienen metadata/canonical/hreflang sólo si existe equivalente real. No cambiar URLs en SEO español.

### Textos
- Diccionarios `messages/es.json` y `messages/en.json` por namespace: auth, shell, dashboard, upload, processing, material, summary, glossary, flashcards, practice, results, errors, tutor, progress, studyPlan, calendar, premium, account, notifications, emails, accessibility, forms.
- Cobertura obligatoria: botones, menús, estados de carga y error, tooltips, vacíos, toast, diálogos, validaciones, aria-label, accesibilidad, fechas, unidades, separadores, número plural, fallbacks. Evitar copiar traducciones en componentes o comparar texto traducido como identificador; utilizar enum/IDs estables.
- Inglés internacional neutral; revisar terminología universitaria (“study guide”, “practice”, “review mistakes”, “study plan”, “flashcards”, “mock exam”). Revisar pantallas angostas para expansión de texto.

### IA, documentos y calidad
- Centralizar `targetStudyLocale` en **todos** los puntos de generación: mapa pedagógico, guía/resumen, temas, glosario, flashcards, preguntas por tema, simulacros, casos, verdadero/falso, completar/unir, tutor de errores, regeneración y explicaciones de resultados.
- Mantener extracción, páginas, fórmulas, datos y evidencia textual **en idioma original**. Una explicación en inglés puede citar literalmente un fragmento español; esa cita no debe alterarse. Separar claramente evidencia original de explicación traducida.
- No traducir JSON keys, enums, IDs ni modelos de persistencia. Ajustar las reglas de clasificación, deduplicación y validación para reconocer vocabulario de ambos idiomas y no descartar materiales EN por listas ES.
- La cobertura mínima de práctica por tema, grounding, trazabilidad y verificación de respuestas deben seguir funcionando en ambos idiomas. Un fallo de idioma debe ser detectable y recuperable, no un fallback silencioso al español.
- Evitar regenerar OCR/extracción completa sólo por idioma; evaluar caché derivada por `material_id + study_locale + model_version`. Cambiar el idioma de UI no debe forzar consumo extra de IA ni consumir cupos Free. Si se solicita regenerar contenido, aclarar coste y aplicar dedupe/idempotencia.
- Preservar material de usuarios existentes e historial/ids de preguntas sin migrar el contenido histórico de forma destructiva.

### Datos, email, pagos y producto
- Migración SQL aditiva para preferencia de idioma con `es` como fallback, sin reescribir perfiles existentes. Confirmar esquema real y políticas antes de aplicar en Supabase.
- Parametrizar `locale` y `time_zone` en emails transaccionales de Sender, plantillas ES/EN y CTA con enlaces localizados. Incluye bienvenida, PDF listo, recordatorios 7/3/1, retorno D1/48h, flashcards, reactivación, pagos/cancelaciones y errores si se envían.
- Auditar `/en/pricing`, moneda/país, impuestos, cancelación, reembolsos, merchant-of-record y soporte internacional: **no activar checkout inglés o prometer Paddle** hasta verificar aprobación, integración, webhooks, precios y acceso Premium post-pago.
- Traducir legal/ayuda con revisión humana y coherencia contractual. No usar traducción automática ciega para políticas.
- Misma cuota Free/Premium y controles de abuso en español e inglés, sin duplicación por idioma.
- Etiquetar analítica con `ui_locale`, `study_locale`, `source_locale`, ruta y funnel: adquisición EN > signup > primer upload > procesamiento > primera práctica > retorno D7 > Premium. Sin duplicar sesiones o eventos por redirección.

## Plan de implementación en master (todas las fases obligatorias para lanzar “producto completo”)
**P0 — Fundación (bloqueante):** diccionarios y helpers tipados, preferencia UI, SSR `lang`, esquema + migración, resolución de rutas con `proxy`, rutas protegidas inglesas, login/callback y links profundos; pruebas ES sin regresión.
**P1 — Experiencia principal:** shell de escritorio y móvil; bienvenida, onboarding, perfil, dashboard, selección/carga PDF/DOCX, procesando, lector, resumen, temas, glosario, flashcards, progreso; errores y accesibilidad.
**P2 — Aprendizaje IA:** contratos de idioma, generadores y validadores, práctica por tema y todos los modos, feedback, tutor, explicación de errores, calidad, caché por idioma. Casos EN y ES con PDFs reales y DOCX.
**P3 — Continuidad y monetización:** plan, calendario, fechas/horarios, notificaciones, email Sender, referidos, Free/Premium, pagos internacionales comprobados, cambios de plan, cancelación y textos legales en EN.
**P4 — Lanzamiento controlado:** instrumentación de cobertura i18n, catálogo de cadenas no traducidas, métricas de conversión por idioma, SEO `/en` sin promesas engañosas, E2E desktop/mobile; habilitar mediante feature flag sólo tras aprobar gates.

## Criterios de aceptación (QA)
1. Registro nuevo desde `/en` por Google y email termina en `/en/dashboard` sin pantalla ES.
2. Login existente desde ES no cambia preferencias ni ruta sin consentimiento.
3. Salida y entrada, refresh, sesión vencida, error de Auth y Google callback conservan locale y destino.
4. English PDF y English DOCX: todas las vistas, explicaciones, preguntas y repasos salen en inglés; términos/fórmulas/citas originales se preservan.
5. Spanish PDF usado por alumno EN: el comportamiento sigue la preferencia del material, sin falsificar citas. Se admite cambiar idioma sin duplicar extracción/consumo de cuotas.
6. Todos los modos de práctica completan pregunta → respuesta → feedback → resultado → reforzar/siguiente tema en EN, con un mínimo de 6 preguntas válidas cuando aplica.
7. Plan y calendario expresan fechas/horas en locale y zona horaria correctos, con persistencia y avisos consistentes.
8. Free/Premium, límites, paywall, compras y cancelación: comportamiento y controles idénticos, con internacionalización verificada y sin activar proveedor no habilitado.
9. Email de PDF listo, examen, retorno y reactivación tiene subject, cuerpo, CTA, URL, fecha y baja/contacto en idioma correcto.
10. Legal, precio, soporte y estados de error están disponibles en EN donde sean parte de la experiencia.
11. Navegación por teclado, lector de pantalla, aria y textos sin overflow en móviles de 360px; contraste y diseño de marca intactos.
12. `npm test`, typecheck, lint, build, presupuesto de performance y pruebas E2E ES/EN; SEO español no cambia inadvertidamente.
13. En producción pública no se ofrece “full English study experience” hasta superar todas las pruebas.

## Riesgos específicos
- **Crítico:** el `proxy.ts` contiene auth, cookies, rate limit y rutas; componer i18n sin romperlo.
- **Crítico:** traducción de evidencia del PDF rompe validación académica o trazabilidad.
- **Alto:** prompts y heurísticas ES pueden dejar resultados mezclados o degradar calidad en EN.
- **Alto:** generación por idioma mal cacheada eleva consumo de IA en plan Free.
- **Alto:** emails en zona Argentina y checkout ARS no equivalen a capacidad internacional.
- **Medio:** URLs, deeplinks y material compartido pueden volver al español; SSR/hidratación y layout pueden desincronizarse.
- **Medio:** traducir `administrador` no aporta al objetivo inmediato; se excluye del alcance del lanzamiento del alumno.

## Primera unidad implementable
Agregar infraestructura de locales, preferencia persistida y pruebas unitarias de rutas/preferencias; después renderizar **una sesión auténtica EN** (login → dashboard → subir → resumen → practicar → resultados) mediante componentes compartidos. No activar un switch global ni desplegar a producción mientras la sesión no esté integrada.

## Notas sobre alcance y verificación
Diagnóstico sobre archivos de GitHub `master`. No se ejecutaron build, tests de runtime ni E2E: la sesión de análisis no tiene checkout local del repositorio, acceso operativo al navegador autenticado ni validación de pagos. Toda integración de esquema remoto o merchant debe verificarse antes de desplegar.
