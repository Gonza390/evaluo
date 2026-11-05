# Evaluo · Política editorial SEO de tres niveles con búsqueda competitiva · 05/11/2026

**Ámbito:** investigación editorial y publicación exclusiva en GitHub `master` con Vercel Preview. NO se autorizan merges a `main` ni despliegues de producción. Se conservan 3 tareas ChatGPT: A1 cada 3 días, A2 el día siguiente, B cada 4 días. No añadir tareas ni reprogramar.

## Regla reemplazante de demanda (aprobada por el usuario)

- **T1_GOOGLE (preferente):** keyword principal exacta + mismo país AR/ES/MX/CO, datos de búsqueda mensual **Google** (Ubersuggest o una fuente autorizada que permita distinguir frase exacta), medición fresca (≤90 días), volumen ≥500. No utilizar rangos tipo 100–1000 o volumen genérico de marcas como prueba exacta.
- **T2_TRIANGULATED:** si no hay volumen Google suficiente, aprobar mediante tres pruebas *independientes y registradas*: (1) estimación mensual **Bing Webmaster ≥50 para la misma keyword y el mismo país** con ≥4 observaciones y fecha ≤90d **o** al menos **10 impresiones recientes de la misma consulta en Google Search Console**, (2) un autocompletado de Google auténtico que contenga esa keyword en el país objetivo, (3) SERP de esa keyword con **3 dominios independientes** y resultados que respondan a la intención. Bing y Search Console no se convierten en búsquedas Google. T2 no indica 500 búsquedas y no garantiza tráfico.
- **T3_COMPETITOR_GAP (rescate editorial automático):** cuando no sea posible validar T1/T2, investigar qué publican competidores relevantes y detectar un problema de estudio que Evaluo pueda resolver con una guía **original y más útil**. Exigir dos piezas relevantes de dos dominios de competidores distintos, al menos una con publicación confirmada durante los últimos 365 días, URLs y fecha de verificación recientes, huecos concretos identificados en ambas páginas, y un ángulo propio verificable. Conservar `googleMonthlyVolume=null`, sin inventar demanda de Google. El código comprueba la estructura de la evidencia, no visita los sitios ni verifica su contenido; la tarea editorial debe hacerlo.
- **Rescate iterativo:** si un candidato falla cualquier nivel, reemplazarlo y seguir investigando. Si faltan ideas propias, buscar en el radar de competidores, ampliar a problemas de alumnos, guías por materia y examen. Solo bloquear el lote si después de investigar de manera razonable no hay dos temas realmente distintos y de calidad, o hay fallas técnicas/materiales. Nunca inventar hechos, copiar textos o forzar artículos vacíos.

En los tres niveles se exigen **8 controles PASS por tema** (1 evidencia de oportunidad según nivel + 7 con análisis y razón verificable: intención, mercado, competencia, no canibalización, encaje real Evaluo, valor pedagógico original, fuentes comprobables). Total **16 PASS para 2 temas**; de ellos salen 2 ES + 2 EN. Sin 16 PASS => BLOQUEADO solo lote; las tareas siguen activas. Las consultas de marca NO transfieren su volumen a «cómo usar [marca]».

## Fuentes y prioridad

1. Leer el banco compartido: https://docs.google.com/document/d/1I6pHv8w8UM43xBXNq7DxC93-LuXz-fesFkvlf-ofCts/edit .
2. Leer `seo/keyword-data/COMPETITOR_RADAR.md` (Filmina, StudyFetch, Knowt, Quizlet; URLs de partida verificadas, con obligación de actualización) y `seo/keyword-data/bing-latest.json`, con `fetchedAt`, países y `bingMonthlyEstimate`. La API real ya se probó mediante GitHub Actions, pero sus métricas son de Bing.
3. Descubrir candidatos mediante Google Autocomplete, Search Console, fuentes públicas y SERP. Ubersuggest gratis queda como prueba T1 opcional cuando haya cuota. Consultar 1–3 semillas por lote, evitar repetición. No inventar cuentas ni resultados ni tomar Google Trends 0–100 como volumen.
4. Buscar **dos temas distintos** no reservados A/B y no existentes en el blog/landings. **Cascada obligatoria de rescate:** explorar banco/T1 -> combinar señales T2 -> ampliar consultas educativas y mercados -> investigar publicaciones recientes de Filmina, StudyFetch, Knowt, Quizlet y otros competidores verificados para T3 -> comprobar ángulo original y 7 controles -> sustituir los temas rechazados. No terminar el lote en `BLOQUEADO` solo por Ubersuggest agotado, ausencia de volumen o porque los primeros candidatos fallen.
5. Ficha de tema: `keyword`, `country`, `slugEs`, `slugEn`, `signals.google|bing|gsc|autocomplete|serp|competitors`, `review` (7 controles con `pass` y `rationale` ≥20 caracteres), `tier`, fuentes, fechas, diferenciación/CTA. Guardar la evidencia completa en el bloque del lote y en el banco reutilizable; leer después de escribir.

## Validación automatizada

Ejecutar `node tests/seo-editorial-quality-gate.smoke.mjs` en Node 22. El módulo `scripts/seo/editorial-quality-gate.mjs` exporta `evaluateTopic(topic)` y `evaluateBatch([topic1,topic2])`. Los casos de prueba utilizan datos **ficticios** para comprobar fallos y aprobaciones; NO son keywords reales aprobadas.

### Ejecución CLI con una ficha REAL del lote

La investigación A1 o B debe construir temporalmente un archivo JSON con la estructura `{"topics":[{...},{...}],"reserved":["<keyword de otro circuito>"]}`. Cada tema requiere `keyword`, `country`, `slugEs`, `slugEn`, `review` con 7 pares `{pass:true,rationale:"..."}` y `signals` con evidencia T1, T2 o T3. Los modelos falsos del test NO cuentan como medición de producción.

```sh
node scripts/seo/editorial-quality-gate.mjs --file=/tmp/evaluo-seo-lote.json
```

Salida JSON: `LISTO_PARA_DESARROLLO` y exit code 0 si hay 2 temas y 16 PASS; `BLOQUEADO` y exit code 2 si falla algún requisito; exit code 1 para problemas de entrada. Solo guardar LISTO en Google Docs tras revisar las evidencias originales, evitar duplicados reales en master y confirmar que la prueba fue ejecutada sobre el lote correspondiente.

El fallback de competidores requiere registrar dos URLs relevantes de dominios distintos, el título, al menos una fecha de publicación comprobada y dos oportunidades originales; ninguna afirmación sobre búsquedas mensuales está autorizada. La función *no llama APIs, no mide intención editorial por sí sola y no publica nada*: las tareas investigadoras aportan evidencias y revisan hechos; el código valida el formato, cantidades, fechas y controles indicados. Una comprobación documental sin fuentes reales no justifica marcar PASS. Cuando hay un entorno Node en la ejecución, correr el gate con fichas reales y registrar el resultado; si no, aplicar exactamente las mismas verificaciones y reportar que la validación fue documental, no ejecutada.

## Desarrollo y QA

A2/B solo escriben las cuatro páginas para un lote LISTO, exclusivamente en `master`, con el último SHA, canonical/hreflang ES–EN, títulos diferenciados, enlaces internos, fuentes verificables, ejercicio original con soluciones, CTA contextual «Subir mi material», sin funcionalidades inventadas, y pruebas tipográficas/móviles. Ejecutar test, lint, build y validar Preview cuando el entorno lo permita. Si una comprobación falla, mantener sin publicar. No desplegar `main`/producción. Registrar URLs, SHA, Preview, controles y motivos. **No garantizar 4 páginas cuando la evidencia sea insuficiente**.

Nota: Google recomienda contenido útil, original y para personas, no páginas masivas producidas principalmente para manipular rankings: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
