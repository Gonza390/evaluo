# Fase 2 — Captación y activación de pregunteros Argentina

Fecha: 2026-10-29. Dominio principal: https://evaluoapp.com. Rama de producción: `main`.

## Fuente SEO: Search Console, dominio anterior
Propiedad `sc-domain:evaluo.com.ar`, período 2026-09-28 a 2026-10-25, dimensión `page`.
Los valores representan la ventana y propiedad indicadas, no una proyección sobre el nuevo dominio.

| Landing | Impresiones | Clics | Posición promedio |
| --- | ---: | ---: | ---: |
| `/pregunteros` | 1.054 | 63 | 5,34 |
| Aprender en el Siglo 21 (materia) | 121 | 2 | 7,92 |
| Administración y Gestión Inmobiliaria — parcial 1 | 119 | 3 | 7,24 |
| Informática Jurídica (materia) | 70 | 1 | 4,99 |
| Concursos y Quiebras (materia) | 60 | 9 | 8,12 |
| Teoría de la Argumentación Jurídica — parcial 1 | 60 | 7 | 7,07 |
| Derecho Penal Parte General (materia) | 45 | 4 | 8,62 |
| Derecho Sucesorio (materia) | 35 | 3 | 5,83 |

**Búsquedas relevantes en `/pregunteros`:** `pregunteros siglo 21` 133 impresiones, 20 clics, posición 3,16; `preguntero siglo 21` 40 impresiones, 8 clics, posición 3,10. La búsqueda genérica `preguntero` obtuvo 421 impresiones y un clic; puede responder a otras intenciones y no justifica perseguirla mediante cambios de nombre o contenido genérico.

La fuente GSC solo expone consultas no anonimizadas y agrupa distinto por página y por consulta; no equiparar totales entre ambos informes.

## Revisión de producto y funnel

- El hub usa los primeros 12 cursos/materias del catálogo por orden de origen. No prioriza automáticamente las materias con señales orgánicas.
- Las páginas de materia y parcial ya tienen pregunta de muestra, botón principal **Practicar ahora**, metadatos dinámicos y enlaces canónicos. No modificar sus slugs ni quitar la práctica.
- El simulador tiene un registro después de la demo y en la pantalla final ya ofrece **Subir mis apuntes**, con eventos `simulator_result_primary_pdf_activation` y `simulator_result_pdf_activation`.
- El uploader público tenía el `sourceKey` de la página como prioridad sobre `?source=`; al llegar desde un preguntero se perdía esa procedencia específica en eventos `pdf_first_landing_viewed` y `pdf_selected`.

Datos de `public.analytics_events` para octubre, filtrando por rutas de pregunteros o metadatos con su origen (agrupados por evento, *no* un funnel de usuarios único): 201 eventos de clic `preguntero_landing_cta_clicked` en 153 sesiones; `pdf_uploaded` asociado al origen `preguntero-exam-intent`: 4 eventos/4 sesiones. La consulta analítica para todo el simulador también registró `simulator_started` y `simulator_finished`, pero no permite asignarlos exclusivamente a una misma cohorte de pregunteros sin mejorar la atribución.

`seo_funnel_daily` agrupa por `google` y no por subrutas de pregunteros, por lo que **no calcular una tasa de conversión preguntero → PDF** a partir de esa tabla.

## Cambios implementados
1. Orden de accesos rápidos de Siglo 21 basado en materias con señales SEO verificadas. Solo se incluyen IDs presentes en el catálogo público existente y se conservan los enlaces; el resto se ordena por nombre.
2. Contenido explicativo breve que diferencia el banco de preguntas de los exámenes oficiales.
3. CTA secundario **Estudiar con mi propio PDF** al final del hub y al final de la ficha de materia, con un enlace a `/estudiar-pdf-con-ia`, sin interrumpir `Practicar ahora`.
4. Eventos `cta_click` con `location`, `source` y, en ficha de materia, `materia_id`.
5. Prioridad para `?source=` sobre el origen genérico del uploader y persistencia del UUID de materia, cuando existe, hacia `/dashboard` después del registro. El dashboard lo usa como contexto de seguimiento y lo valida; **no se promete preselección académica automática**.

## Monitoreo recomendado (sin métricas inventadas)
- Por fuente `pregunteros-siglo21` / `preguntero-materia`:
  1. Sesiones con `cta_click` de los nuevos CTAs;
  2. `pdf_first_landing_viewed` con `source` específico;
  3. `pdf_selected`;
  4. `create_material_clicked`;
  5. `pdf_uploaded` (distinguir `source` normalizado por uploader);
  6. primera práctica del PDF y retorno a siete días.
- Controlar que el botón principal `preguntero_landing_cta_clicked` y las sesiones con inicio de simulador no caigan.
- Contrastar GSC de `evaluo.com.ar` y `evaluoapp.com` en ventanas comparables; **no confundir el efecto del traslado de dominio con el de nuevos enlaces**.
- UBA XXI y UNLaM: páginas existentes con recursos y CTAs a PDF. Sin evidencia granular suficiente en la ventana analizada para cambiar título, canonical o contenido; mantenerlas estables durante la migración y revisar su indexación y consultas después.
