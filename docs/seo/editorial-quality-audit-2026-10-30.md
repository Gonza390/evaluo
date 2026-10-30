# Evaluo — auditoría de calidad editorial SEO (30 de octubre de 2026)

## Criterio utilizado
Basado en Google Search Central, *Creating helpful, reliable, people-first content*. Priorizar utilidad, exactitud y transparencia antes que volumen de URLs. No existe un mínimo universal de palabras requerido para posicionarse.

Fuentes: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
https://developers.google.com/search/docs/essentials/spam-policies

## Alcance revisado en main
- 8 guías temáticas de /es/guias, cada una con preguntas aplicadas, procedimiento, errores y recomendaciones por disciplina.
- 4 guías de ingreso: México/EXANI-II, Chile/PAES, Perú/UNMSM, Guatemala/USAC, con fuentes institucionales.
- Landings regionales de estudio con PDF para México, Colombia, España y español general.
- Plantillas SEO académicas: universidad, carrera, materia, pregunteros, resumen y estudio por materia.

## Hallazgos
- Las 12 guías editoriales NO son clones textuales por país; los ejemplos, exámenes y métodos son diferenciados.
- Las cuatro fuentes institucionales son pertinentes: Ceneval, DEMRE, UNMSM y SUN/USAC. Las instituciones pueden revisar programas y convocatorias; cada guía mantiene la advertencia de consultar la edición vigente.
- Se detectaron dos carreras UBA con materias públicas aprobadas pero cero preguntas públicas en el banco: Medicina y psicología. La plantilla de carrera anunciaba simuladores de forma incondicional; corregido para no inducir al usuario a una función sin preguntas de esa carrera.
- Faltaba explicar con suficiente visibilidad cómo se preparan las guías, quién publica el contenido y cuáles son sus límites. Se añadió declaración editorial visible, institucional y sin autores/revisores ficticios.

## Correcciones en esta rama
- Añadir dos verificaciones concretas por cada guía local, basadas en la fuente institucional correspondiente.
- Mostrar metodología/editor responsable (Evaluo) y aclarar que la información no es oficial, que la IA puede equivocarse y que la convocatoria/temario exige verificación.
- Condicionar los CTA de simuladores de carrera a la presencia de preguntas públicas; si no las hay, invitar a estudiar el PDF del alumno sin prometer un examen.
- Mantener las URLs, canonicals, sitemap, indexación y contenido existente; no se agregan páginas de países sin valor diferencial ni se aprueban datos académicos pendientes.

## Riesgos pendientes para siguientes iteraciones
1. Revisión académica humana de las preguntas públicas y resúmenes por materia; la presencia de preguntas no garantiza que sean correctas.
2. Evaluar las páginas universitarias y de carreras con menos contenido diferenciador (especialmente las que no tienen perfiles oficiales o práctica). No aplicar `noindex` en bloque sin medir las consultas de Search Console.
3. Mejorar páginas con impresiones y CTR bajos una vez que el nuevo dominio termine de migrarse. Evitar cambios cosméticos repetidos en fechas de actualización.
4. Controlar periódicamente URLs externas de admisión y actualizar información cuando instituciones publiquen nuevos procesos.

## Bing Webmaster Tools
El sitio evaluoapp.com ya figura en el panel de Bing Webmaster Tools. El panel indica que está procesando datos; falta comprobar en **Sitemaps** si `https://evaluoapp.com/sitemap.xml` figura como enviado/importado correctamente. Estar dado de alta no significa tener URLs indexadas. Fuente: https://www2.bing.com/webmasters/help/sitemaps-3b5cf6ed
