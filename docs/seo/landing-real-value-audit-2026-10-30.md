# Evaluo — Auditoría SEO de valor real por familias de landings
Fecha: 30 de octubre de 2026 · Revisión de código en main + agregados públicos de Supabase

## Alcance y límite
Auditoría de las principales rutas de captación, componentes de marketing que sirven el contenido real, 8 guías de estudio generales, 4 guías locales, y las plantillas académicas dinámicas. Se revisan contenido, intención, utilidad, transparencia y señales de indexación. **No es una auditoría editorial humana de cada pregunta ni equivale a indexación o rankings reales**. La propiedad nueva de Google está en fase de migración; no atribuir datos del dominio anterior al nuevo.

Fuentes normativas:
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide

Google no establece un mínimo universal de palabras para posicionar. Evitar multiplicar páginas de contenido repetitivo con intención exclusivamente de captación.

## Hallazgos por familia
| Familia | Evaluación editorial | Evidencia observada | Próxima mejora de mayor valor |
| --- | --- | --- | --- |
| Estudiar PDF, resumir PDF, flashcards, IA para estudiantes | Base de utilidad sólida | 4 experiencias independientes y extensas: instrucciones por necesidad, ejemplos pedagógicos, preguntas frecuentes, enlaces internos, demo y flujo de PDF | Prueba real con PDF de ejemplo reproducible: calidad del resultado, limitaciones y diferencias frente a texto genérico; medir conversión a primer PDF |
| Mapa mental desde PDF | Base útil; transparencia comercial defectuosa (corregida en este PR) | Ejemplo visual y checklist; el plan de precios confirma que el mapa mental es Premium, pero la landing omitía explicarlo antes de seleccionar el PDF | Aclarar Premium antes del CTA, junto al selector y en preguntas frecuentes; no insinuar generación gratuita de un recurso de pago |
| Práctica por tema, simulacros, convertir PDF en preguntas | Buena intención y ejemplos de preguntas | Casos ilustrativos, corrección, recomendaciones de repaso y CTA. Ejemplo de Marketing I se repite en varias landings | Añadir un segundo caso auténtico por disciplina cuando haya revisión pedagógica, sin generar datos ficticios |
| Comparativas de ChatGPT, NotebookLM y Quizlet | Buen contexto, pero alto riesgo de desactualización | Comparación por objetivos de estudio, referencias a fuentes oficiales, diferencias de planes y funciones | Revisar las funciones y los precios ajenos periódicamente con fecha de verificación REAL; no inventar reseñas ni resultados de pruebas |
| 8 guías temáticas en español | Contenido diferenciado por materia, pero sin respaldo académico específico exhaustivo | Procedimientos, errores, preguntas y ejemplos por asignatura. Ya se añadió metodología editorial transparente | Revisión de precisión por disciplina y, cuando haga falta, referencias primarias verificables; desarrollar ejercicios propios que puedan comprobarse |
| 4 guías de admisión locales | Fuentes oficiales pertinentes; necesita mantenimiento | EXANI-II/Ceneval, PAES/DEMRE, UNMSM, USAC/SUN; proceso no oficial claramente indicado | Verificar edición, fechas, temario y condiciones cada nuevo ciclo. No copiar temarios de instituciones |
| Landings académicas dinámicas por materia, parcial y carrera | Valor estructural real, pero riesgo de redundancia entre rutas | 67 materias con preguntas públicas y enlaces a práctica, guías con preguntas de muestra y conteos reales | Evaluar canibalización por consulta, contenido repetido y calidad real de banco; no aplicar noindex indiscriminado |

## Inventario del banco de preguntas (datos agregados, no inspección de respuestas)
- 23.326 preguntas públicas en 67 materias activas; todas esas materias tienen al menos 96 preguntas en el corte consultado.
- Hay 454 enunciados exactos duplicados adicionales tras normalizar espacios y mayúsculas (aprox. 1,95 % del banco), 55 duplicaciones adicionales entre materias.
- 2.604 enunciados tienen menos de 55 caracteres (aprox. 11,2 %); longitud breve **no prueba** baja calidad.
- No se detectaron enunciados vacíos ni las fórmulas sencillas «según el PDF» / «basado en el documento» con el patrón consultado.
- Los análisis no prueban que las respuestas y explicaciones sean correctas ni detectan duplicados semánticos.
- **No borrar preguntas automáticamente**: revisar duplicados y enunciados breves con muestreo educativo antes de decidir correcciones.

## Hallazgo P0 corregido en esta rama
La landing /funciones/crear-mapa-mental-desde-pdf usa CTA «Crear mapa mental desde mi PDF» sin informar de inmediato que el mapa es Premium. En /pricing el mapa mental figura exclusivo de Premium. Se agrega información antes del CTA, cerca del selector y en la FAQ, con enlace a planes. Se aclara también en la explicación general de las variantes internacionales que el mapa mental requiere Premium.

## Prioridades recomendadas
1. Medir en Google Search Console del **nuevo dominio** impresiones, consultas, clics, exclusiones y canibalización entre /pregunteros/, /explorar/materia/ y /landings/estudiar/, especialmente de las mismas materias.
2. Auditar muestras de enunciados y explicaciones con una rúbrica pedagógica: claridad, exactitud, nivel, distractores y trazabilidad a material fuente. Corregir problemas reales, no todo el banco por tamaño de texto.
3. Añadir a las páginas con demanda y CTR bajo casos de uso originales y resultados de demostración comprobados. No clonar las mismas explicaciones para cada país.
4. Mantener la información sobre restricciones Free/Premium coherente entre páginas SEO, precios y producto. Revisar las comparativas después de actualizaciones de otros servicios.
5. Definir 1 palabra clave principal e intención por landing; comprobar que los resultados de búsqueda para cada mercado coincidan con esa intención antes de escalar.

## Condiciones para considerar una landing de alta calidad
- Resuelve la necesidad del título en el contenido visible, con tarea útil real o un ejemplo verificable.
- Explica límites, precios y lo que NO hace la plataforma, sin funcionalidades engañosas.
- Diferencia intención y ejemplo de las landings vecinas.
- Tiene enlaces internos a un siguiente paso útil y fuentes externas cuando la afirmación lo necesita.
- No atribuye a fuentes oficiales preguntas generadas por IA, no afirma resultados garantizados, no inventa usuarios ni expertos.
- Se revisa con datos de consultas/clics e indexación; el número de palabras o el simple HTTP 200 no determina calidad.
