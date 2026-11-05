# Evaluo SEO · Radar editorial de competidores (fuente de candidatos, no de volúmenes)

Actualizado: 2026-11-05. **Este archivo es una lista de fuentes públicas verificadas para comenzar la búsqueda, NO un banco de keywords aprobadas.** Reconfirmar en cada tanda títulos, URLs, fechas, relevancia, competencia, contenido propio y disponibilidad.

| Competidor / fuente | URL observada | Señal de contenido / fecha | Oportunidad original para Evaluo (hipótesis) |
| --- | --- | --- | --- |
| Filmina, blog | https://getfilmina.com/blog | Blog con guías de estudio, exámenes, flashcards, IA y materias; actualización visible 2026-11-04 | Buscar dificultades que el estudiante aún no resuelve después de leer: práctica por tema, feedback y próximos pasos |
| Filmina, práctica intercalada | https://getfilmina.com/blog/practica-intercalada | Guía publicada 2026-10-30; explica cuándo mezclar temas y cuándo no | Diseñar **un ejercicio original** con soluciones razonadas y proceso de repaso de errores, no repetir el artículo |
| StudyFetch, plan de estudio | https://www.studyfetch.com/blog/study-plan-redesign | Producto/editorial 2026-06-16, distingue temas vistos de dominados | Explicar con ejemplos cómo planificar a partir de una fecha de examen y cómo interpretar errores al practicar, verificando funciones actuales de Evaluo |
| StudyFetch, blog | https://www.studyfetch.com/blog | Contenido sobre aprendizaje espaciado, planes y tutoría IA, con fechas en 2026 | Comparar búsquedas sobre secuencias de estudio y herramientas de evaluación, no copiar sus mensajes comerciales |
| Knowt, práctica desde apuntes | https://help.knowt.com/en/articles/10298080-how-can-i-take-a-practice-test-from-my-notes | Guía pública de tests sobre apuntes, observada 2026-11-05 | Investigar intención «crear preguntas de un PDF», evitar canibalizar landing existente, incluir errores frecuentes auténticos |
| Knowt, flashcards desde notas | https://help.knowt.com/en/articles/10714412-how-can-i-create-flashcards-from-my-notes | Guía pública de flashcards, observada 2026-11-05 | Si ya tenemos /funciones/flashcards-desde-pdf, **optimizar página existente**, no crear blog duplicado |
| Quizlet, hub de aprendizaje | https://quizlet.com/content/hub | Recursos de exámenes, guías y técnicas, observados 2026-11-05 | Descubrimiento de consultas; verificar SERP y competencia antes de reservar |

## Algoritmo de rescate de la tanda

1. **Prioridad:** revisar Google/Bing/GSC/Autocomplete y banco SEO_KW de Evaluo, evitando consultas ya usadas y las reservas de circuitos A y B.
2. **Si no salen 2 temas:** ampliar a conceptos relevantes, problemas reales de estudiantes, materias y formatos de examen; comparar variantes en AR/ES/MX/CO. No bloquear solo por 500 Google.
3. **Si aún faltan:** consultar este radar, investigar las publicaciones recientes de **al menos dos competidores independientes**, leer esas páginas y elegir un problema común o una oportunidad complementaria. Buscar nuevo material, no tomar automáticamente el título ajeno como keyword. Registrar para cada fuente URL, título, fecha si existe y el hueco que deja.
4. Diseñar para Evaluo un **ángulo propio** con ejercicio resuelto original, explicación de errores, trabajo con PDF/DOCX, práctica y CTA real. No atribuir al competidor características que no verificamos.
5. Aplicar la política vigente: T1 Google o T2 con señales trianguladas o T3_COMPETITOR_GAP. En T3, el validador necesita **dos dominios competidores distintos, al menos un contenido publicado en los últimos 365 días, fecha de observación fresca, gap de contenido explícito para cada fuente y enfoque propio**. Registrar sin inventar volumen Google: `googleMonthlyVolume=null`. Además los 7 controles editoriales restantes con pruebas; 2 temas distintos para 16 PASS.
6. **Si una idea coincide con una URL existente de Evaluo** (aunque sea de otra sección), mejorar la URL existente como oportunidad aparte y continuar buscando una keyword original para ocupar la plaza editorial. Revisar blog, funciones, guías y landing, canonicals, hreflang y reservas, no solo comparar slugs.
7. **Continuar buscando reemplazos** dentro de la ejecución hasta tener 2 temas diferenciados y validables; no abandonar por agotarse Ubersuggest, quedarse sin una sugerencia o fallar un candidato. No garantizar resultados cuando haya imposibilidad técnica o evidencia falsa. Bloquear solo por falta auténtica de contenido seguro y de calidad o fallos de sistemas; documentar el bloqueo y conservar la recurrencia.
8. Desarrollar 2 ES + 2 EN por circuito, con QA y Vercel Preview **solo sobre master**. Nunca main ni producción. No crear tareas ni cambiar frecuencias.

## Campos de evidencia para T3

`signals.competitors={source:"COMPETITOR_EDITORIAL",topicKeyword:"keyword primaria",country:"ES",observedAt:"2026-11-05",originalAngle:"Razón específica de la nueva guía de Evaluo y qué ofrecerá en lugar de repetir contenidos previos",articles:[{url:"https://...",title:"...",publishedAt:"YYYY-MM-DD" (solo cuando haya fecha verificada),intentMatches:true,identifiedGap:"Diferencia comprobada y concreta respecto de lo que el competidor explica o no explica"},...]}`.

**No transformar observaciones en afirmaciones de demanda medible.** T3 es prioridad editorial fundamentada en competencia, no volumen de Google/Bing. El validador verifica la estructura, pero la revisión humana/automática debe verificar URLs, contenido, fechas, competencia y diferenciación antes de PASS.

Documentación técnica: `seo/keyword-data/EDITORIAL_POLICY.md`, `scripts/seo/editorial-quality-gate.mjs`. Plan maestro: https://docs.google.com/document/d/1I6pHv8w8UM43xBXNq7DxC93-LuXz-fesFkvlf-ofCts/edit .
