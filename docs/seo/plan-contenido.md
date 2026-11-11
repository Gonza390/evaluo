# Plan de contenido SEO — Evaluo

Fuente de verdad del plan semanal: 4 páginas en español neutro y 4 en inglés por semana.
La tarea programada de los lunes lo lee, elige los temas pendientes, publica y actualiza este archivo.

## Objetivo

Traer estudiantes que **usen el producto**, no visitas sueltas. Cada página responde una búsqueda de alguien
que está por estudiar algo y lleva, de forma natural, a probar Evaluo con su propio material.

## Decisiones

- **Español:** neutro para toda Latinoamérica, con tuteo ("tú", "puedes", "elige"). Nunca voseo.
- **Inglés:** internacional.
- **Autor:** Gonzalo Olmos, fundador de Evaluo (ya lo muestran las plantillas).
- **Mensaje:** "tu material de estudio" / "your study material". "PDF" solo cuando es la búsqueda objetivo.
- **Pregunteros, materias por universidad y exámenes nacionales:** fuera de este plan.

## Dónde se publica (plantillas existentes, el contenido se agrega como datos)

| Idioma | Plantilla | Archivo de datos | URL |
|---|---|---|---|
| Español neutro | Guía | `lib/es-study-guides.ts` (`STUDY_GUIDES`) | `/es/guias/<slug>` |
| Inglés | Artículo del blog | un archivo nuevo `lib/study-blog-<AAAA-MM-DD>-en.ts`, registrado como los anteriores | `/en/blog/<slug>` |

Antes de registrar, mirar cómo lo hicieron los últimos commits (sitemap, índices, hreflang) y seguir el mismo patrón.

## Estándar mínimo de cada página (si no lo cumple, no se publica)

1. **Búsqueda objetivo clara** y que **no compita** con una página existente (buscar el término y el slug en el repo
   y en `app/sitemap.ts`; si existe algo parecido, cambiar el ángulo o descartar).
2. **Valor propio:** un ejemplo trabajado concreto (materia, material, preguntas de ejemplo, resultado), pasos
   aplicables y errores frecuentes. Nada de relleno ni texto genérico.
3. **Datos verificados:** todo dato de terceros (precios, funciones, nombres de productos) se busca en la web el
   mismo día y se cita con su fuente oficial. Sin precios de terceros: indicar si hay plan gratuito y enlazar.
4. **Datos de Evaluo:** solo los de `/pricing` y `public/llms.txt` vigentes. Sin cifras de usuarios, testimonios ni
   premios inventados.
5. **Honestidad:** en comparativas y alternativas, decir que Evaluo es nuestro y cuándo conviene otra herramienta.
6. **Conversión:** enlace a la landing de producto que corresponda y al selector de archivo.
7. **Calidad de texto:** frases cortas, sin muletillas de IA, sin promesas ("aprueba seguro"), título ≤ 60 caracteres
   con la búsqueda, descripción ≤ 155 caracteres.

## Coordinación

- Otro proceso publica artículos del blog (`lib/study-blog-*.ts`). Antes de elegir temas, revisar los commits de
  los últimos 14 días en esos archivos y no repetir temas ni búsquedas.
- Cada semana, sumar al backlog ideas nuevas con datos de Search Console (Windsor, conector `searchconsole`,
  cuenta `sc-domain:evaluoapp.com`): búsquedas con impresiones donde estamos entre la posición 8 y 40 y no hay
  una página dedicada.

## Backlog

Estados: `pendiente` · `en curso` · `publicado` (con fecha y URL) · `descartado` (con motivo).
Prioridad: 1 = más alta.

| # | Idioma | Búsqueda objetivo | Título de trabajo | Tipo | Producto al que lleva | Prioridad | Estado |
|---|---|---|---|---|---|---|---|
| 1 | es | alternativas a notebooklm | Alternativas a NotebookLM para estudiar (2026) | Alternativas | /es/mejores-ia-para-estudiar, home | 1 | pendiente |
| 2 | es | chatgpt para estudiar | Cómo usar ChatGPT para estudiar (y cuándo conviene otra herramienta) | Cómo hacer | /es/generador-de-examenes-con-ia | 1 | pendiente |
| 3 | es | cuestionario con ia | Cómo hacer un cuestionario con IA a partir de tus apuntes | Cómo hacer | /es/generador-de-examenes-con-ia | 1 | pendiente |
| 4 | es | plan de estudio con ia | Cómo armar un plan de estudio con IA para tus exámenes | Cómo hacer | /es/como-funciona | 2 | pendiente |
| 5 | en | notebooklm alternatives | NotebookLM Alternatives for Studying in 2026 | Alternatives | /en/best-ai-for-studying | 1 | pendiente |
| 6 | en | how to use chatgpt to study | How to Use ChatGPT to Study (and When to Use Something Else) | How-to | /en/ai-test-prep | 1 | pendiente |
| 7 | en | make practice questions from lecture notes | How to Make Practice Questions from Your Lecture Notes with AI | How-to | /en/pdf-to-quiz | 1 | pendiente |
| 8 | en | ai study planner | AI Study Planner: How to Plan Exam Revision with AI | How-to | /en/how-it-works | 2 | pendiente |
| 9 | es | alternativas a quizlet gratis | Alternativas gratis a Quizlet para estudiar con IA | Alternativas | /es/flashcards-con-ia | 2 | pendiente |
| 10 | es | gemini para estudiar | Cómo usar Gemini para estudiar: aprendizaje guiado y cuadernos | Cómo hacer | /es/mejores-ia-para-estudiar | 2 | pendiente |
| 11 | es | estudiar para un examen en 3 días | Cómo estudiar para un examen en 3 días con tu material | Cómo estudiar | /es/generador-de-examenes-con-ia | 2 | pendiente |
| 12 | es | alternativas a knowt | Alternativas a Knowt en español | Alternativas | /es/flashcards-con-ia | 3 | pendiente |
| 13 | en | free quizlet alternatives | Free Quizlet Alternatives with AI Flashcards | Alternatives | /en/pdf-to-flashcards | 2 | pendiente |
| 14 | en | how to use gemini to study | How to Use Gemini to Study: Guided Learning and Study Notebooks | How-to | /en/best-ai-for-studying | 2 | pendiente |
| 15 | en | study for an exam in 3 days | How to Study for an Exam in 3 Days | How to study | /en/ai-test-prep | 2 | pendiente |
| 16 | en | knowt alternatives | Knowt Alternatives for Studying | Alternatives | /en/pdf-to-flashcards | 3 | pendiente |

## Resultados

Cada 4 semanas: páginas publicadas, impresiones, clics y posición media en Search Console, y sesiones que llegaron a
`pdf_selected` o `auth_completed` en `analytics_events`. Las que no traen nada en 8 semanas se mejoran o se fusionan.

| Semana | Publicadas | Notas |
|---|---|---|
