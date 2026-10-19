# Progreso → Estudiar por temas: P0/P1 (19/10/2026)

## Alcance

- **P0 (presentación):** reutilizar `StudyRichText` para el cuerpo del tema en Progreso en lugar de imprimir Markdown como texto plano. Soporte adicional para cursivas `*...*` y `_..._`; encabezados `###` suficientemente destacados.
- **P1 (guía de lectura):** antes del texto, mostrar hasta tres conceptos reales del glosario que correspondan de manera inequívoca al tema, priorizando los de importancia alta. Pedir al alumno que intente explicarlos con sus palabras, sin agregar objetivos o definiciones inventados.
- **P1 (auditoría del banco):** análisis *solo lectura*, agregado y sin datos de alumnos para dimensionar la asociación explícita de preguntas a capítulos. No se modifica ninguna pregunta ni la base de datos.

## Datos agregados de Supabase (últimos 30 días; 19/10/2026)

Se consultaron PDFs con procesamiento `ready`, resumen `ready` y artefactos pedagógicos disponibles.

| Versión de artefactos | PDFs | Preguntas | Preguntas con coincidencia explícita de capítulo/tema/referencia | Sin coincidencia explícita |
| --- | ---: | ---: | ---: | ---: |
| v11 | 9 | 304 | 121 | 183 |
| v5 | 67 | 1930 | 243 | 1687 |
| v2 | 1 | 31 | 4 | 27 |

En los nueve PDFs **v11** hay **48 capítulos**: 12 tienen una sola pregunta con etiqueta de capítulo coincidente y 36 tienen al menos dos; ninguno quedó sin una coincidencia explícita. Los 77 PDFs recientes inspeccionados contienen Markdown con encabezados (al menos un `###` por PDF), que el panel de Progreso antes exponía literalmente.

**Límite fundamental:** esta métrica compara etiquetas normalizadas con el título del resumen; **no** ejecuta `findSummarySectionForQuestion` ni analiza semánticamente el PDF. Los 183 ítems sin coincidencia explícita pueden asociarse conservadoramente mediante `topic`, pregunta, respuesta y fragmentos de referencia. Los 12 temas con solo una coincidencia pueden tener preguntas adicionales asociadas por ese mecanismo. No debe interpretarse la métrica como número de preguntas realmente disponibles, ni como errores pedagógicos. Para el conteo mostrado al estudiante, el producto mantiene `getTopicQuestionCounts`, que llama al algoritmo real de asociación y descarta ítems ambiguos.

### Calidad conceptual (seguimiento)

La auditoría del 18/10 sobre Derecho Indiano e IPC UBA encontró casos de causalidad invertida, comparación circular, distractores débiles y feedback genérico. La corrección de visualización **no** repara esos errores de contenido en artefactos guardados. Antes de declarar cobertura pedagógica suficiente por tema se requiere:

1. Ejecutar `getTopicQuestionCounts` sobre una muestra estratificada de PDFs reales v11, v5, cortos/largos, con verificación de falsos positivos/falsos negativos por capítulo.
2. Revisar manualmente respuestas, opciones y explicaciones contra el PDF de origen. No inferir comprensión por la etiqueta `comprender`.
3. Registrar por tema preguntas corregibles disponibles y preguntas descartadas por ambigüedad, sin atribuirlas a un capítulo inventado.
4. Comprobar en navegador autenticado y móvil la lectura, tarjetas, práctica y retorno al mismo tema; validar que las marcas Markdown no aparezcan y que tablas anchas permitan desplazamiento horizontal.

## Cambios de código

- `components/dashboard/pdf-progress-panel.tsx`: lectura con `StudyRichText` y guía de lectura con 0–3 conceptos preexistentes, sin generación ni escritura.
- `components/study-rich-text.tsx`: cursivas Markdown y jerarquía de títulos `###`; compatible con la pantalla Resumen.
- `tests/recommended-study.smoke.ts`: regresión estática para uso del renderizador y origen del contenido de la guía.

## Seguridad, integración y límites

- Sin migraciones, nuevas API, cambios de permisos, regeneraciones, llamadas a LLM ni consumos adicionales.
- No se cambian las reglas de práctica, notas, cobertura, refuerzo ni porcentajes de dominio.
- La guía se oculta cuando el glosario carece de conceptos asociados inequívocamente.
- Pendiente: CI completo y verificación visual/autenticada. Esta rama no debe describirse como desplegada mientras no se integre y confirme el release.
