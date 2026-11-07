# Evaluo — preflight SEO de la tanda 07–09/11, con enfoque inglés original
Fecha de revisión: 2026-11-06. Fuente de verdad: GitHub `Gonza390/evaluo`, rama `master`, Doc editorial compartido e historial hasta 05/11. **No es una reserva ni un lote aprobado.**

## Hallazgo principal: las ocho guías del 05/11 YA están en master

Claves y slugs identificados en `lib/study-blog-2026-11-05.ts`:
- concept-maps-nov2026: `/blog/como-hacer-un-mapa-conceptual-para-estudiar` ↔ `/en/blog/how-to-make-a-concept-map-for-studying`
- pomodoro-nov2026: `/blog/metodo-pomodoro-para-estudiar` ↔ `/en/blog/pomodoro-study-method`
- mcq-exam-nov2026: `/blog/como-estudiar-examen-tipo-test` ↔ `/en/blog/how-to-study-for-multiple-choice-exams`
- feynman-nov2026: `/blog/tecnica-feynman-para-estudiar` ↔ `/en/blog/feynman-technique-for-studying`

**Acción A1/B:** NO reservar, reconstruir, reescribir como un "nuevo post" ni contar estos temas como parte del siguiente lote. Si necesitan mejoras, tratarlas como optimización de URL existente fuera de la cuota editorial. La anterior reserva B para `/blog/como-usar-anki-para-estudiar` sigue siendo solo CANDIDATA; el volumen de la marca «Anki» no demuestra el de «how to use Anki to study».

## Mapa de colisiones: otras URLs ya disponibles

Blog ES/EN: contabilidad/accounting; examen oral/oral exam; repetición espaciada/spaced repetition; examen final/final exams; PDF largo/long PDF; biología; marketing; medicina; enfermería; ingeniería; estadística; plan de examen en una semana; recuperación activa; cuatro pares 05/11.
EN adicionales: `/en/blog/how-long-should-i-study-for-an-exam`, `/en/blog/how-to-study-accounting-effectively-for-exams` y `/en/blog/how-to-study-sociology-for-exams` (las dos páginas de contabilidad pueden captar intención similar; revisar antes de agregar otra).
Landings que también absorben intención EN: `/en/pdf-to-quiz`, `/en/pdf-to-flashcards`, `/en/study-pdf-with-ai`, `/en/resources` y herramientas de preguntas/match/true-false.
Otros recursos ES: `/recursos/verificar-preguntas-ia`, `/recursos/metodo-estudio-pdf-practica-activa` y `/recursos/registro-de-errores`.
El hecho de no ver un slug idéntico no descarta colisión por **intención**. Antes de reservar, comparar el contenido real, H1, queries y SERP.

## Resultado de línea de base inglesa

Google Search Console conectado a `sc-domain:evaluoapp.com`; consulta de páginas `/en/` para **2026-10-09 a 2026-11-03** devolvió 2 URLs y **4 impresiones, 0 clics**: `/en/study-pdf-with-ai` (3 impresiones, 0 clics, posición media 9) y `/en/blog/how-to-study-a-long-pdf` (1 impresión, 0 clics, posición media 10). Son datos visibles en el resultado devuelto por el conector; no constituyen todas las consultas posibles ni estimación de volumen de mercado. La muestra es demasiado pequeña para inferir CTR futuro o oportunidad aprobada.

## Hipótesis EN-first para investigar el 07/11 — SIN APROBACIÓN / SIN RESERVA

### Candidato 1: preparar un examen a libro abierto
- Intención EN (provisional): `how to study for an open-book exam`. País inicial: **US**. Slug EN tentativo: `/en/blog/how-to-study-for-open-book-exams`; adaptación ES: `/blog/como-estudiar-para-examen-a-libro-abierto`.
- Diferenciación potencial: taller de recuperación/transferencia con un caso original, índice de referencias del propio PDF/DOCX, prueba con límite de tiempo y revisión de errores. Explicar que "open book" cambia según las reglas del profesor y que la IA podría estar prohibida durante el examen, aunque sirva para prepararlo previamente.
- Fuentes académicas de partida: Cornell Learning Strategies Center https://lsc.cornell.edu/how-to-study/studying-for-and-taking-exams/open-book-exams/ ; University of Pennsylvania https://weingartencenter.universitylife.upenn.edu/open-book-exams-are-you-ready/ ; Kansas State University https://www.k-state.edu/counseling/services/resources/self_help/tipsforopenbookexams.html . **No se presentan como dos competidores T3 ni como prueba de demanda.**
- Enlaces Evaluo: `/en/study-pdf-with-ai` y plan de estudio que se haya validado en inglés; ES `/estudiar-pdf-con-ia`.
- Pendiente para aprobación: volumen Google US exacto T1 **o** T2 con señales US verificables **o** T3 con dos fuentes competidoras EN reales y brecha documentada; viabilidad, competencia, 8 PASS y anticolisión. No hay ningún volumen mensual confirmado para esta keyword.

### Candidato 2: preparar respuestas cortas para exámenes
- Intención EN provisional: `how to study for short answer exams`; US. Slug tentativo EN: `/en/blog/how-to-study-for-short-answer-exams`; ES: `/blog/como-preparar-examenes-de-respuesta-corta`.
- Diferenciación potencial: pasar de apuntes a preguntas abiertas, respuestas de 3–5 frases, rúbrica propia para detectar omisiones y casos nuevos explicados. **No prometer que Evaluo hoy puntúa automáticamente ensayos ni que crea un modo de ensayo dedicado**: mostrar técnica manual apoyada en resúmenes, práctica y errores disponibles.
- Investigación requerida: fuentes académicas y SERP sobre short-answer assessments; verificar diferencia real respecto del artículo de multiple-choice 05/11 y de examen oral; exactitud, mercado, 8 PASS y pruebas T1/T2/T3. Sin dato de búsquedas, NO etiquetar como aprobado.
- Enlaces: EN `/en/pdf-to-quiz` o `/en/study-pdf-with-ai` (cuando su CTA y recorrido estén verificados); ES `/funciones/practicar-por-tema`.

Si los candidatos fallan intención, SERP o competencia, **descartarlos y buscar otros** según la política T1/T2/T3 y el radar existente. El objetivo editorial no autoriza inventar métricas ni copiar guías de universidades o competidores.

## Política comercial internacional y prevención de promesas falsas

En la rama master hay checkout internacional **Creem USD** en `app/api/payments/creem/checkout/route.ts`, importes de US$9,99/mes según `lib/payments/creem-international.ts`, y exclusión de AR mediante el país reportado por Vercel. El modo **live** exige `CREEM_INTERNATIONAL_ENABLED=true`, credenciales/producto live y webhooks. La landing `/pricing` todavía indica disponibilidad condicionada y presenta copy mayormente español. No se comprobó una compra real internacional end-to-end en producción: **no prometer en los nuevos artículos que el pago internacional ya está activo**. Mantener los precios fuera de los artículos educativos para no desactualizarlos; dirigir al usuario al flujo oficial verificado.

### Contrato de los próximos cuatro artículos (A2 08/11 y B 09/11)
- Dos temas nuevos, un artículo inglés editorialmente original y su versión española realmente adaptada por cada tema; mantener **2 ES + 2 EN** sin crear `en-us` duplicado.
- Ejercicio resuelto, explicación de errores, fuentes verificadas, CTA correcto por idioma, canonical absoluto `evaluoapp.com`, hreflang recíproco, un H1, sitemap, metadata, QA y Preview del SHA exacto.
- A1 el 07/11 valida y reserva. A2 el 08/11 implementa SOLO reserva A aprobada. B el 09/11 controla idempotencia y evita tomar el tema A. Ninguna publicación a `main`/producción sin autorización.
- Medir finalmente vistas EN, registros que empiezan en EN, activación en sesión de estudio y pago internacional confirmado por proveedor, por separado. No confundir tráfico con conversiones.

## Fuentes de orientación SEO general
- Google: contenido útil y original, https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google: gestión de idiomas y hreflang, https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- Políticas y validador propios: `seo/keyword-data/EDITORIAL_POLICY.md`; `scripts/seo/editorial-quality-gate.mjs`.

**Estado final de este preflight**: DEDUPLICACIÓN DOCUMENTAL REALIZADA, EN-US HABILITADO PARA VALIDACIÓN, 2 CANDIDATOS POR INVESTIGAR, 0 RESERVAS NUEVAS, 0 ARTÍCULOS PUBLICADOS, NINGÚN CAMBIO EN PRODUCCIÓN.
