# Evaluo internacional — medición de adquisición y aprendizaje con PDF
Actualizado: 2026-10-23

## Alcance del primer experimento
- Argentina sigue en `/estudiar-pdf-con-ia` y **no forma parte de la comparación internacional**.
- Mercados piloto: `es-mx`, `es-co`, `es-es`. `es` es español internacional, no un país adicional.
- "Mercado" identifica la versión de la página seleccionada; no prueba dónde vive ni estudia el visitante.
- Google Search Console debe segmentarse por **país del usuario**, **página** y **consulta no relacionada con la marca**. Los resultados de los primeros días pueden no aparecer todavía.

## Comparación semanal (por URL y por origen de tráfico)
1. Search Console: impresiones, clics, CTR, posición, consultas y país. No equiparar impresiones con personas únicas.
2. Eventos de producto en `/api/analytics/track`: medir **sesiones únicas**, usuarios únicos o eventos según la pregunta, y etiquetar la denominación.
3. Funnel por `landing_market` y `latest_landing_market`:
   - `page_view` con path de la landing regional (sesiones).
   - `pdf_first_landing_viewed` y `pdf_picker_opened`.
   - `pdf_selected`.
   - `create_material_clicked`.
   - `signup_completed` / `login_success`, cuando corresponde.
   - `pdf_uploaded` y `material_ready` / `student_material_processing_ready`.
   - `student_material_exam_started` (ejercicios sobre el PDF del alumno).
   - `student_material_exam_completed` (actividad de práctica real completada).
4. Usuarios que vuelven a realizar una actividad con el **mismo PDF** a D+1 y D+7 cuando haya identificador de usuario y material, contando cohortes con antigüedad suficiente.

**Métrica primaria**: sesiones que originan un PDF de usuario con `student_material_exam_completed`, divididas por sesiones de la landing regional. Comprobar el emparejamiento por identificadores y atribución antes de presentar una tasa; una visita que vuelve después puede pertenecer a otra sesión.

**No contabilizar**:
- `seo_*_practice_*`, `simulator_*`, `materia_simulator_*` ni los simuladores de materias de SEO.
- `international_study_demo_answer_revealed`, `international_study_demo_progress_viewed`, `international_study_demo_pdf_answered` o `international_study_demo_pdf_progress_viewed` (todos **demo_only**).
- Visitas a la demo como prácticas reales. La demo utiliza un PDF de muestra y no guarda progreso académico.

## Atribución y límites
- `landing_market` se deriva de la URL regional al ingresar incluso sin parámetros UTM.
- `latest_landing_market` preserva la última entrada regional capturada por el navegador.
- `source` del PDF-first se transporta en el borrador y enlace a dashboard para identificar `international-study-<mercado>`.
- Son campos de atribución en el mismo navegador/dispositivo, no una identidad geográfica verificada. Cambios de dispositivo, bloqueo de cookies o sesiones anteriores pueden interrumpir la relación.
- `page_view` y eventos de intención no prueban que se haya procesado el PDF. Solo contar `student_material_exam_completed` asociado con material real como activación final.
- Proteger datos de estudiante: no registrar contenido ni nombre del PDF en eventos.

## Primeras lecturas
- Día 0: confirmar sitemap, respuesta pública 200, canonical, hreflang, consentimiento/analytics y no errores.
- Día 7: visitas relevantes por mercado, selección del PDF, abandono por etapa, indexación y nuevas consultas de Search Console.
- Día 28: clics orgánicos no marcarios y cohortes de uso real con PDF, comparadas con fuente y dispositivo.
- No interpretar cero impresiones inmediatas como fallo de Google; puede haber demora de indexación y de Search Console.
- No declarar un mercado ganador con muestras pequeñas; priorizar el de más estudiantes que llegan a practicar con su propio PDF.

## Difusión para medir bien
- Mantener URLs públicas indexables sin forzar redirección por IP.
- Usar parámetros `utm_source`, `utm_medium`, `utm_campaign` consistentes para TikTok y comunidades, por ejemplo `utm_campaign=evaluo-internacional-2027`.
- Los canales comunitarios deben ofrecer valor real; no publicar enlaces masivamente ni vulnerar reglas anti-spam.
- No enviar mensajes de precios internacionales que todavía no están habilitados.
