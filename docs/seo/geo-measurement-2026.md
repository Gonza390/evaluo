# Evaluo — medición GEO V1 (6 de noviembre de 2026)

Tres indicadores distintos: visibilidad en respuestas de IA, impresiones en funciones de IA generativa de Google y tráfico atribuido a asistentes. Nunca presentarlos como una única "visibilidad %" ni asumir causalidad.

## 1. Visibilidad de marca en respuestas de asistentes (Ubersuggest)

Estado actual: cuenta gratuita conectada; setup generado y **pendiente de revisión/confirmación**; no hay proyecto activo ni cifras de marca.
Mercado elegido: Argentina, idioma español, ID de Ubersuggest 2032. Límites de cuenta: 1 proyecto, 1 mercado, 2 competidores y 10 prompts de IA.
Marcas para comparar: Filmina (getfilmina.com) y Ask Maeve (askmaeve.com).

Consultas de referencia preparadas:
1. ¿Qué IA puedo usar para estudiar un PDF de la universidad?
2. ¿Cuál es la mejor herramienta para estudiar apuntes en PDF con IA?
3. ¿Qué plataforma transforma apuntes en resúmenes y preguntas para practicar?
4. ¿Qué aplicación permite estudiar un Word o PDF con inteligencia artificial?
5. ¿Qué herramienta de IA me ayuda a preparar un examen universitario?
6. ¿Qué app crea simulacros de examen con mis apuntes?
7. ¿Cómo puedo practicar preguntas por tema usando mi propio PDF?
8. ¿Qué IA crea flashcards a partir de un PDF?
9. ¿Qué aplicación me ayuda a identificar los temas que tengo que reforzar?
10. ¿Qué plataforma me arma un plan de estudio según la fecha de examen?

Una vez confirmada y activada la configuración, medir en cada proveedor y por prompt: visibilidad, ranking cuando aparece, menciones de competidores, sentimiento y fuentes enlazadas. Una configuración pendiente o un informe aún no procesado significa **sin datos**, no cero visibilidad.

## 2. Impresiones en funciones generativas de Google

Search Console lanzó un informe específico de rendimiento de IA generativa para AI Overviews y AI Mode. Usar impresiones por página/país/dispositivo. Los clics se incluyen en los informes web generales; no equiparar impresiones de IA con clics exclusivamente atribuibles a IA.

Referencia oficial: https://support.google.com/webmasters/answer/16984139?hl=es

La conexión estándar disponible de Search Console (Windsor.ai) expone Search Analytics, pero no consta acceso a este informe especial. No inventar una exportación ni métricas no expuestas.

## 3. Entradas atribuibles a asistentes

Ya existen \`acquisition_touch\`, \`page_view\` y metadatos de atribución almacenados en \`analytics_events\`, así como un filtro \`ai_referral\` en el panel de adquisición. Se clasifica el dominio de referencia sin registrar consultas ni contenido privado. El referrer puede faltar por las políticas de privacidad y los navegadores; "Directo" no significa "no influido por IA".

El agregado SQL actual del panel reconoce ChatGPT, Perplexity y Claude. El frontend también detecta Gemini y Copilot; hasta que el agregado del panel tenga una regla para ellos, pueden aparecer bajo "Otros" y no deben declararse cubiertos por la cifra de \`ai_referral\`.

Consulta de lectura agregada:

\`\`\`sql
select
  event_name,
  coalesce(metadata->'attribution'->>'source', '(sin fuente)') as source,
  count(*)::int as events
from public.analytics_events
where created_at >= now() - interval '30 days'
  and event_name in ('acquisition_touch', 'page_view', 'signup_completed')
group by 1, 2 order by events desc limit 40;
\`\`\`

Cada fila representa **eventos**, no usuarios únicos, citas ni recomendaciones. Evitar inspeccionar direcciones personales, prompts, PDFs o datos individuales.

## 4. Revisión editorial y evolución

- Conservar los diez prompts de referencia en el tiempo para que las comparaciones tengan sentido.
- Revisar por separado impresiones de IA de Google, visibilidad de marca y sesiones/referrals de asistentes.
- Priorizar contenido original, fundamentado y útil que conteste preguntas con ejemplos verificables.
- Medir cambios, pero no inferir que una mención adicional fue causada necesariamente por una publicación.
- Consultar URLs canónicas y pruebas antes de desplegar; no generar nuevas páginas duplicadas del blog ni ignorar las páginas que ya tienen impresiones.
