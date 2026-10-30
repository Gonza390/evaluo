# Evaluo — auditoría de intención SEO y solapamiento de URLs
Fecha del análisis: 30/10/2026

## Origen y límites
- Fuente: Google Search Console via Windsor.ai; propiedad **sc-domain:evaluo.com.ar**, período **01/10/2026–28/10/2026**, dimensión `query` + `page`, 143 filas visibles y 90 consultas.
- Se refiere al **dominio anterior**, no al posicionamiento posmigración en `evaluoapp.com`.
- Search Console omite algunas consultas por privacidad y las filas con dimensiones adicionales no cubren todas las impresiones. Por tanto, las cifras no equivalen a un censo exhaustivo.
- **Aparecer con más de una URL en una consulta no prueba canibalización ni penalización**. Hay que estudiar intención, CTR, estabilidad del ranking y satisfacción del usuario antes de redirigir o consolidar URLs.
- No cambiar URLs, canonicals, sitemap, robots ni indexación durante este paso.

## Evidencia de intención principal
| Consulta (1–28 oct) | Impresiones y clics visibles en el desglose | Página dominante | Observación |
| --- | --- | --- | --- |
| `pregunteros siglo 21` | 183 impresiones, 23 clics | `/pregunteros`: 134 impresiones, 23 clics | El hub responde a la intención de buscar bancos de preguntas |
| `preguntero siglo 21` | 80 impresiones, 9 clics | `/pregunteros`: 47 impresiones, 7 clics | Preservar enfoque del hub y enlaces a materias |
| `parciales siglo 21` | 28 impresiones, 4 clics | `/landings/parciales`: 25 impresiones, 4 clics | Reforzar intención de preparar una evaluación, no duplicar el catálogo |
| `simulador de parciales siglo 21` | 19 impresiones, 1 clic | Simulador de Abogacía: 12 impresiones; `/landings/parciales`: 7 impresiones y el clic | Falta punto de entrada general hacia simuladores de carrera disponibles |
| `simulador siglo 21` | 8 impresiones, 0 clics | Simuladores individuales | Oportunidad de mejor navegación, no demanda masiva demostrada |
| `crear flashcards a partir de pdf` | 6 impresiones, 0 clics | `/funciones/crear-flashcards-desde-pdf` | Requiere monitoreo; muestra pequeña para cambios radicales |
| `ia para resumir pdf` | 2 impresiones, 0 clics | `/funciones/resumir-pdf-con-ia` | Requiere maduración y datos nuevos |

## Mapa de intención recomendado
1. `/pregunteros`: encontrar un banco de preguntas de Universidad Siglo 21, buscar por materia y elegir parcial.
2. `/landings/parciales`: preparar parciales de Siglo 21, comprender cómo practicar y localizar un simulador de carrera público.
3. `/simulador-parcial/[carrera]`: escoger materias y simuladores publicados de una carrera en particular.
4. `/pregunteros/[materia]` y `/pregunteros/[materia]/parcial/[parcial]`: practicar preguntas concretas y parciales de una materia.
5. `/explorar/materia/[id]`: espacio y recursos agregados de una materia; no duplicar el título y contenido del banco de preguntas.
6. `/funciones/simulacro-examen-con-ia`: preparar prácticas desde PDF **propio**, sin suponer examen oficial ni disponibilidad universal.
7. `/estudiar-pdf-con-ia`: experiencia general basada en documento propio.

## Implementación
- Afinar el título y la descripción de `/landings/parciales` hacia "parciales" y "simuladores por carrera", sin cambiar URL ni canonical.
- Agregar un bloque de enlaces HTML rastreables a **carreras Siglo 21 con preguntas públicas**, obtenido del catálogo público existente de pregunteros; el bloque solo aparece cuando hay carreras comprobables. Si falla el catálogo, se preserva el contenido fijo de la landing.
- Desde `/pregunteros`, diferenciar el preguntero del estudio de un parcial y enlazar en contexto a `/landings/parciales` y `/funciones/simulacro-examen-con-ia`, sin quitar el selector de preguntas ni modificar enlaces existentes.
- Smoke tests de intención y canonicals distintos.

## Qué NO modificar todavía
- No aplicar `noindex`, canonical cruzado ni 301 a las rutas de materias, parciales y carreras con contenido.
- No cambiar títulos de las fichas académicas solo porque varias aparezcan para una consulta general. Comparar primero consultas específicas por materia y CTR.
- No inventar simuladores para carreras sin preguntas públicas.
- No publicar nuevas landings de términos genéricos "simulador" sin diferenciar necesidad y contenidos.

## Próxima medición
- Vincular la propiedad `sc-domain:evaluoapp.com` al conector de Search Console. Hoy el conector Windsor.ai solamente incluye `sc-domain:evaluo.com.ar`; no atribuir la visibilidad del dominio anterior al nuevo.
- Medir impresiones, clics, posición y consultas por URL, especialmente `/pregunteros`, `/landings/parciales` y los simuladores enlazados.
- Medir clics en enlaces internos y activación orgánica (selección y procesamiento de primer PDF), además del volumen de tráfico.
- Revisar Core Web Vitals reales después de que haya suficientes datos del nuevo dominio; no equiparar Lighthouse simulado con métricas de campo.

Fuente: https://developers.google.com/search/docs/crawling-indexing/links-crawlable
