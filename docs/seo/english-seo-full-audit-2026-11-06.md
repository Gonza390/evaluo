# Evaluo — Auditoría integral SEO inglés (06/11/2026)

Estado: auditoría realizada sobre GitHub \`master\`, comparación selectiva con \`main\`/Vercel producción, Google Search Console de \`sc-domain:evaluoapp.com\`, Ubersuggest US e investigación de competidores. **No es una declaración de resultados de despliegue ni de indexación general.** Trabajo circunscrito al SEO público: el usuario administra experiencia interna en inglés y pagos.

## Resumen ejecutivo

La prioridad no es duplicar cientos de páginas ni corregir una supuesta lentitud grave. Es asegurar la publicación de los cambios SEO revisados, mejorar la correspondencia entre la intención de búsqueda y la primera acción posible en las landings, verificar el rastreo/indexación de las páginas inglesas, crear diferenciación pedagógica original y conseguir menciones/enlaces legítimos.

### Métricas verificadas

- GSC conectado, ventana 2026-10-07 a 2026-11-04, filtro \`page contains /en\`: **13 impresiones, 0 clics, seis URLs**.
  - \`/en/study-pdf-with-ai\`: 6 impresiones, posición media 7,5.
  - \`/en/ai-true-false-questions\`: 3 impresiones, posición media 3,6667.
  - \`/en\`: 1 impresión, posición 2.
  - \`/en/blog/how-to-prepare-for-an-oral-exam\`: 1, posición 6.
  - \`/en/blog/how-to-study-a-long-pdf\`: 1, posición 10.
  - \`/en/blog/how-to-study-for-final-exams\`: 1, posición 7.
- Desglose GSC de queries bajo el mismo filtro: una sola query visible \`study pdf ai\` con 1 impresión, 0 clics. Las queries de bajo volumen pueden ocultarse por privacidad: **no concluir que es la única búsqueda**.
- Desglose por país devolvió una única fila de 1 impresión (Rusia). **No afirmar que EE. UU. carece de tráfico: el desglose no es completo**.
- Ubersuggest, US/en, keyword \`pdf to quiz\`: **390 búsquedas mensuales estimadas; dificultad SEO 40/100; CPC US$4,23; intención informacional**. Son estimaciones del proveedor, no demanda propia ni conversiones; serie histórica disponible 2026-05 a 2026-08.
- Ubersuggest \`domain_overview\` de Evaluo US/en no devolvió métricas; no inventar tráfico, enlaces, autoridad ni posiciones.
- Auditoría de laboratorio Ubersuggest PageSpeed para el dominio: **LCP escritorio 437 ms, móvil 1,5 s, CLS 0 en ambos; JavaScript potencialmente no utilizado 185 KB escritorio / 188 KB móvil; oportunidad de redirecciones 190 ms escritorio / 630 ms móvil**. No son datos reales de usuarios ni auditoría aislada de \`/en\`. No hay evidencia de rendimiento móvil crítico.
- El blog inglés en código contiene **20 artículos**: cinco base, seis master expansion, dos expansion, cuatro del 05/11, uno sobre tiempo de estudio y dos adicionales de contabilidad/sociología. Varias publicaciones son del 05/11, después del cierre de la ventana GSC: no concluir desindexación solo por su ausencia en rendimiento.

### Despliegue: separar fuente de verdad

- Vercel producción apuntaba a commit \`799d974bc43b15a833a165e4dce8d8019fdf17fd\` en \`main\`; auditado \`master\` \`505e0e72074fd4385655d4011b3c94a57ebc4b87\`. **No son el mismo árbol de código**.
- En \`main\`, \`components/marketing/study-blog-view.tsx\` todavía tenía \`<FooterHome variant="full" />\` (pie español), mientras \`master\` usa \`locale={locale}\` y un selector de idioma contextual sin enlaces repetitivos en el contenido.
- El fichero de los cuatro pares de artículos del 05/11 ya existe en \`main\` y la lista de artículos los incluye; **no afirmar que no hay artículos del 05/11 en producción**. Lo pendiente son, entre otras diferencias, las mejoras recientes de navegación SEO.
- Recomendación: fusionar solo cambios SEO aprobados, o PR/cherry-pick cuidadoso sobre \`main\`, previo análisis de diferencias, CI y visual QA. **No hacer merge completo de \`master\` mientras el usuario desarrolla el producto y los pagos**.
- La versión de rastreo web del blog obtenida durante el análisis tenía seis días de antigüedad; no constituye un chequeo HTTP actual de todas las URLs.

## Hallazgos por prioridad

### P0 — Adquisición y publicación

**P0-A — Publicación controlada de SEO.**
Verificar que cada corrección de navegación, enlaces ingleses y copy SEO probada en \`master\` llegue al dominio público sin desplegar cambios de autenticación/cobro. Validar SHA exacto en Vercel, pruebas CI, caché y navegación real en móvil y escritorio. Hasta entonces Google ve la versión de \`main\`.

**P0-B — Intención transaccional / funcional de las landings.**
\`/en/pdf-to-quiz\`, \`/en/pdf-to-flashcards\`, \`/en/study-pdf-with-ai\` comparten el componente \`EnglishStudyPage\`. Arriba del pliegue, el CTA primario actual es \`Explore the worked example\` y el acceso a registrarse aparece al final. Para queries orientadas a usar una herramienta, priorizar \`Try with my PDF\` o \`Create a quiz from my notes\`, que lleve a un recorrido inglés probado, conservando los ejemplos pedagógicos como segundo CTA. No incorporar un uploader ficticio ni reclamar funciones que todavía no estén validadas por el dueño de producto.

**P0-C — Cobertura de indexación.**
GSC performance no ofrece por sí solo un listado completo de URLs indexadas. Revisar con herramientas de inspección para: \`/en\`, \`/en/resources\`, \`/en/blog\`, las cinco landings de práctica/PDF y una muestra de las veinte guías. Comprobar estado 200, canonical propio, \`hreflang\` recíproco, ausencia de \`noindex\` en páginas públicas, rastreo en móvil, sitemap actualizado y enlaces navegables. Corregir causas comprobadas, no enviar índices a ciegas.

**P0-D — Arquitectura sin sobrecarga.**
La estructura de cabecera inglesa y el selector contextual único en \`master\` simplifican la UX. Mantener un idioma visible por página, sin repetir “Read in English / Versión en español”, con ruta equivalente del artículo cuando exista. Las etiquetas \`hreflang\` permanecen en metadatos y sitemap. Organizar \`/en/blog\` (20 artículos) por temas/inicio rápido si hace falta, sin ocultar los enlaces de rastreo con filtros exclusivamente JS.

### P1 — Contenido, autoridad y CTR

**P1-A — Clúster de producto / alta intención.**
Pilares ya existentes: \`/en/study-pdf-with-ai\`, \`/en/pdf-to-quiz\`, \`/en/pdf-to-flashcards\`, \`/en/ai-true-false-questions\`, \`/en/match-concepts-with-ai\`. Fortalecer cada página con ejemplo propio verificable, limitaciones, captura o demostración real cuando el producto esté listo, preguntas frecuentes de intención real y CTA directo. Evitar plantillas idénticas que respondan la misma intención con un título distinto. No crear nuevas variaciones territoriales \`/en-us\` sin demanda.

**P1-B — Clúster de aprendizaje y exámenes.**
En el blog existen guías en inglés sobre exámenes orales, finales, tipo test, Pomodoro, Feynman, active recall, spaced repetition y materias. Las hipótesis \`how to study for open-book exams\` y \`how to study for short-answer exams\` deben aprobarse con T1/T2/T3 US y verificación anticolisión antes de reservarse. Conservar los dos pares ES/EN por circuito existentes; inglés editorial original y adaptación ES, no traducciones mecánicas.

**P1-C — Canibalización potencial.**
Hay dos guías EN de contabilidad:
\`/en/blog/how-to-study-accounting\` y
\`/en/blog/how-to-study-accounting-effectively-for-exams\`.
No se prueba canibalización solo por los títulos; comparar queries/SERP, intención, H1, recursos y datos GSC antes de separarlas por objetivo o consolidarlas. No publicar una tercera guía general de contabilidad.

**P1-D — Confianza, fuentes y GEO.**
Promover guías originales que expliquen cómo comprobar preguntas generadas con IA, cómo corregir errores y cómo transformar una sección de PDF en práctica activa (ya hay dos recursos españoles originales). Publicar equivalentes ingleses solo cuando aporten ejemplos/casos genuinos y demanda validada. Incluir autoría editorial, fecha real, metodología y fuentes contrastables. Evitar testimonios no verificables. Un bloque \`FAQPage\` no debe tratarse como un atajo garantizado para rich snippets.

**P1-E — Distribución y enlaces editoriales.**
La competencia internacional cuenta con directorios completos de herramientas. Evaluo puede diferenciarse con una guía de estudio basada en evidencia y materiales realmente útiles para estudiantes: checklist descargable de calidad de preguntas, registro de errores, ejemplos pedagógicos y microherramientas de repaso. Buscar colaboraciones auténticas con clubes de estudio, estudiantes universitarios, blogs educativos y comunidades, sin campañas de enlaces artificiales. No inventar autoridad de dominio ni backlinks.

**P1-F — Medición de embudo SEO inglés.**
Funnel: entrada orgánica \`/en\` → CTA \`/en\` → signup EN → primer PDF/DOCX → primera práctica → retorno 7 días. Diferenciar tráfico orgánico de clics de páginas y eventos, atribución de AI referrals y completitud de prácticas. El SEO puede instrumentar el origen y consultar métricas; el usuario controla los cambios internos y el pago. Registrar al menos cada semana páginas, queries, países, clicks, impresiones, indexación verificable y calidad del contenido; interpretar tendencias con ventana más larga de 28 días.

### P2 — Afinado técnico/editorial

- \`app/(en)/layout.tsx\` **ya declara \`<html lang="en">\` desde el servidor**. Es correcto, sin necesidad de cambiarlo. Solo actualizar el comentario obsoleto de \`next.config.mjs\` que aún menciona una raíz española compartida.
- \`app/robots.ts\` permite las páginas públicas y disallow de rutas privadas principales. \`/en/login\` ya usa \`robots: {index:false}\` (noindex) y \`/en/pricing/result\` también. No bloquear estas URLs precipitadamente por robots si se necesita que Google vea el noindex; revisar con datos reales.
- \`lib/seo.ts\` declara área servida por Argentina, México, Colombia y España y descripción española, mientras el marketing se expande al inglés. Actualizar señales de marca internacionales **solo si las funciones declaradas y disponibilidad geográfica corresponden al producto real**, sin afirmar presencia física inexistente.
- \`public/llms.txt\` describe el inglés como secundario y lista principalmente páginas españolas; actualizar directorio y enlaces EN si el catálogo real lo justifica. **No hay base para considerarlo un factor confirmado de ranking Google**.
- \`/en/resources\` tiene canonical propio por \`metadataBase\` compartida; no hay evidencia de canonical erróneo. Revisar similitud de intención con \`/en/study-pdf-with-ai\` y la homepage, sin consolidar URLs sin señales.
- Revalorar titles y meta descriptions usando queries reales cuando haya muestra, no cambiar todos por 13 impresiones. Google puede generar title links dinámicamente.
- Prioridad baja a la optimización de velocidad general mientras la medición de laboratorio del dominio sea buena y no haya problema real por ruta. Examinar redirects/JS en móvil solo con prueba específica de \`/en\` y URLs de entrada.

## Comparación de experiencia en inglés

Competidores observados:
- StudyFetch: https://www.studyfetch.com/tools — páginas por tarea "PDF to Quiz", "PDF to Flashcards", "Practice Test Maker" y "Study Guide Maker"; describe subida única de material y diferentes recursos desde el mismo archivo.
- Knowt: https://knowt.com/ai-flashcard-maker y https://help.knowt.com/en/articles/10722204-student-s-guide-to-getting-started — muestra carga directa para generación de tarjetas, notas y prácticas.

No replicar todas las funcionalidades. Mensaje recomendado, verificable por el producto: **"Study your notes by topic, check what you remember, review mistakes and know what to practice next."** No afirmar que Evaluo es el único con ese flujo. No inventar tamaños de mercado, tráfico de competidores ni volumen de funciones.

## Criterios de aceptación para cada mejora futura

Para una landing EN: intención y país documentados; title/H1 único y coherente; párrafo respuesta antes del primer scroll; demostración o ejemplo propio; CTA principal fiel al producto; enlaces internos; canonical y hreflang a contraparte real si existe; render SSR HTML EN; sitemap; prueba móvil; no testimonios falsos; medición de evento de CTA.

Para blog EN: keyword validada T1/T2/T3; no duplicado de intención; ejemplo resuelto; errores y explicación; fuentes primaria; fecha real, link a funcionalidad adecuada, navegación clara, JSON-LD fiel al contenido y prueba de enlaces.

## Fuentes

- Search Console conectado (Windsor.ai), dominio \`sc-domain:evaluoapp.com\`, extracción 06/11/2026.
- Ubersuggest conectado, US \`locId=2840\`, keyword \`pdf to quiz\`, extracción 06/11/2026.
- GitHub \`Gonza390/evaluo\`, commit master \`505e0e72074fd4385655d4011b3c94a57ebc4b87\`; Vercel main \`799d974bc43b15a833a165e4dce8d8019fdf17fd\`.
- Google Search Central, internacionales: https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- Google, utilidad editorial: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google, títulos: https://developers.google.com/search/docs/appearance/title-link
- Google, FAQ rich results: https://developers.google.com/search/blog/2023/08/howto-faq-changes
- StudyFetch: https://www.studyfetch.com/tools
- Knowt: https://knowt.com/ai-flashcard-maker

**Resultado:** informe de auditoría; ningún cambio de interfaz, registro, app, pagos ni fusión a producción realizado.
