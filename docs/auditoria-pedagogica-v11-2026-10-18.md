# Auditoría pedagógica inicial — Evaluo v11

**Fecha:** 18/10/2026 · **Base:** master `d42d9ece13f7804ee2f8b9f48569ee19973b3d7d` · **Estado:** revisión de resultados persistidos, sin regeneraciones ni cambios en producción.

## Alcance y método

- Dos PDFs académicos distintos ya procesados en Supabase, sin registrar nombres de alumnos ni identificadores de cuentas: **Derecho Indiano (28 páginas)** e **IPC UBA (18 páginas)**.
- En Derecho Indiano se examinaron dos generaciones del mismo PDF: resumen de Gemini y resumen local de respaldo; comparten datos de extracción y contenidos académicos.
- Se inspeccionaron metadatos de calidad, resúmenes, glosario, flashcards y muestras dirigidas de preguntas; se contrastaron hallazgos puntuales con el contenido de `student_material_chunks`, por página.
- Los recuentos pertenecen a materiales **almacenados como artefactos pedagógicos v11**. No prueban que el proceso de generación completo haya sido ejecutado de nuevo en esta rama.
- La auditoría **no** es una evaluación manual exhaustiva de todas las páginas ni mide rendimiento real en exámenes. No se recalcula un puntaje global académico hasta revisar muestras representativas.

## Línea base observada

| Medida | Derecho Indiano | IPC UBA |
| --- | ---: | ---: |
| Páginas del PDF | 28 | 18 |
| Secciones de resumen | 6 | 4 |
| Conceptos de glosario | 42 | 44 |
| Flashcards | 16 | 20 |
| Preguntas | 38 | 34 |
| Opción múltiple / abiertas | 31 / 7 | 26 / 8 |
| Preguntas formuladas como «representa mejor» | 18 | 8 |
| Feedback con plantilla «Las demás opciones expresan definiciones…» | 19 | 10 |
| Puntaje interno registrado | 100/100 | 100/100 |

**Importante:** el 100/100 del informe automático registra cobertura, estructura, citas y diversidad superficial; no representa revisión de verdad semántica. En IPC, la distribución de niveles reportada en el quality report (24 comprensión, 8 aplicación, 2 recuerdo) difiere de los conteos recalculados de las preguntas almacenadas (25 comprensión, 7 aplicación, 2 recuerdo); investigar desincronización de reportes en una fase posterior.

### Hallazgo crítico A — causalidad invertida (Derecho Indiano)

- **Fuente extraída, página 7:** «Aquellas leyes fueron consecuencia política y jurídica del sermón pronunciado por Fray Antonio de Montesinos […]».
- **Respuesta del banco v11:** «El sermón fue la consecuencia política y jurídica que provocó la sanción de las Leyes de Burgos».
- **Impacto:** invierte el sujeto de «fue consecuencia» y expone un razonamiento causal incorrecto como respuesta respaldada. El reporte automático marcó 100 y citas literales presentes.
- **Cambio propuesto y test de regresión:** bloquear conservadoramente relaciones si el PDF explícitamente establece que el efecto fue consecuencia de la causa, pero la respuesta afirma que la causa «fue consecuencia». Aplicar tanto a preguntas como a flashcards. Se descarta la actividad dudosa, sin inventar una reformulación.

### Hallazgo crítico B — comparación circular (IPC UBA)

- **Fuente extraída, páginas 7–8:** diferencia validez deductiva basada en estructura frente a apoyo inductivo probabilístico.
- **Respuesta abierta v11:** repite la misma definición de validez deductiva para la validez inductiva al responder una consigna de comparación.
- **Impacto:** el usuario podría memorizar una distinción falsa.
- **Cambio propuesto y test de regresión:** solamente construir respuestas comparativas cuando los dos elementos tienen evidencia conceptual explícita y **distinta**. Si faltan definiciones separadas, omitir la pregunta en vez de reutilizar el mismo texto o fabricar una respuesta genérica.

### Hallazgos de seguimiento (no incluidos en esta corrección puntual)

1. **Feedback genérico:** 19/38 preguntas de Derecho Indiano y 10/34 de IPC repiten la plantilla de definiciones de otros conceptos; requieren contraste y explicación específica.
2. **Nivel cognitivo:** numerosas preguntas marcadas «comprender» piden reconocimiento de una definición, no interpretación; hay que revisar etiquetado y validez de distractores.
3. **Glosario:** existe un término malformado («Ájos de inspección de los visitadores») que indica necesidad de un filtro adicional de calidad de etiquetas.
4. **Resumen de respaldo:** en Derecho Indiano el cuerpo de seis secciones del resumen Gemini tiene 10.918 caracteres y el local 6.333. El respaldo incluye secciones genéricas («Contenido complementario») con menor desarrollo; la diferencia de longitud por sí sola no demuestra mejor calidad.
5. **Evaluación de aprendizaje:** falta evidencia de mejora pre/post y retención diferida. Una prueba de contenido nunca puede demostrar por sí sola que ayuda a aprobar.

## Criterios de cierre para las primeras correcciones

- Regresión automatizada que reproduzca causalidad invertida y comparación ambigua y confirme su bloqueo.
- Contracaso: una relación causal consistente con el material y una comparación explícita con definiciones distintas **no** se bloquean.
- GitHub Actions (typecheck, lint, tests, build, seguridad) en verde sobre la rama. No integrar sin validación.
- En próxima fase, regenerar dos PDFs académicos originales bajo entorno aislado y comprobar si se reducen errores sin perder cobertura útil, con muestras revisadas manualmente por tema/capítulo.

**Distinción imprescindible:** los tests con fixtures validan reglas de rechazo; el control de verdad semántica de todas las respuestas exige auditoría adicional y/o verificación independiente. No se modifica ninguna fila de producción.
