# SEO editorial internacional: guía de español a inglés (Evaluo)

Fecha: 2026-10-29. Dominio: `https://evaluoapp.com`. Fase actual: publicar ocho guías originales en español neutral; **no** publicar copias automáticas en inglés.

## Primera colección editorial

Directorio `/es/guias`: cuatro guías por materia, dos de preparación de exámenes y dos de práctica/corrección. Cada pieza tiene una intención informativa diferente de las páginas de funciones que ofrecen crear material desde PDF.

| Intención editorial | URL |
|---|---|
| Anatomía | `/es/guias/como-estudiar-anatomia` |
| Psicología | `/es/guias/como-estudiar-psicologia` |
| Derecho | `/es/guias/como-estudiar-derecho` |
| Economía | `/es/guias/como-estudiar-economia` |
| Plan de parcial | `/es/guias/como-preparar-un-parcial` |
| Examen tipo test | `/es/guias/como-estudiar-examen-tipo-test` |
| Preguntas de práctica PDF | `/es/guias/como-hacer-preguntas-de-estudio-desde-pdf` |
| Aprender de errores | `/es/guias/como-repasar-errores-despues-de-un-examen` |

Todas llevan a `/es/estudiar-pdf-con-ia?source=guia-{slug}` con registro `cta_click` por `guide_slug` y `source`. La landing pública conserva `source` durante el registro por el ajuste anterior al componente PDF-first.

## Cómo crear versiones inglesas

**No traducir palabra por palabra ni inventar ocho temas adicionales.** Separar intención universal y contexto local:

1. Validar demanda por idioma/país con Search Console del `.com`, SERP local y volumen cuando esté disponible. Considerar que `how to study for college exams`, `study for multiple choice exams` y `how to study anatomy` pueden competir con entidades, formatos y vocabulario distintos.
2. Crear una sola sección `/en/guides/` (inglés genérico) y adaptar *solo* los textos para los que el público angloparlante comparte la intención: título, meta, ejemplos, FAQ y terminología. No lanzar `/en-us/` y `/en-gb/` separados si no hay diferencias relevantes.
3. Evitar modismos regionales o ejemplos basados en instituciones sin fundamento. Cuando el objetivo sí sea regional, adaptar `college` vs. `university`, `study guide` vs. `revision guide`, estructura de pruebas y fuentes académicas del mercado.
4. Las URLs españolas tienen canonical propio, y las inglesas también. Solo agregar anotaciones `hreflang="es"`, `hreflang="en"` recíprocas y auto-referenciadas al existir dos páginas equivalentes; no agregar un equivalente inglés que todavía no exista. No apuntar varias páginas españolas distintas a una sola inglesa por conveniencia.
5. Asegurar inglés real también en menú, CTA, FAQ, login, app, correos y política de pagos antes de escalar adquisición. Un artículo inglés que lleva a un producto solo español puede captar clics pero frustrar el registro.
6. No redirigir por IP o idioma automático; ofrecer selector visible y mantener URLs indexables con enlaces internos, sitemap y `hreflang`.
7. Medir por origen e idioma: GSC `/es/guias` y futuro `/en/guides`, visita, CTA, PDF seleccionado, registro, PDF listo y primera práctica. No imputar conversiones sin datos de eventos suficientes.

## Cuándo lanzar en inglés

Propuesta: escoger **2 guías piloto** según consultas verificadas, localizar ambas manualmente, validar lectura en inglés y registrar las conversiones antes de duplicar el resto. Resolver previamente la etiqueta de idioma SSR `<html lang="es-AR">` de la aplicación y las traducciones de interacción. No crear rutas inglesas índice sin contenido completo.

## Advertencia editorial SEO

Google considera abusivo generar muchas páginas a escala mediante traducciones y transformaciones sin valor original. La localización de calidad sí puede reutilizar un método sustantivo manteniendo contenido útil, experiencia coherente y diferenciación de mercado.

Fuentes:
- https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.google.com/search/docs/essentials/spam-policies
- https://www.aft.org/ae/fall2013/dunlosky

## Validación de contenidos

Las ocho guías presentan métodos y ejemplos pedagógicos, no afirmaciones verificadas sobre programas nacionales. Los temas académicos son ejemplos ilustrativos y no sustituyen material del curso ni fuentes oficiales. No crear esquemas de FAQ enriquecido solo por SEO; Google restringe su visualización a determinados tipos de sitios. La indexación es una posibilidad técnica, no una garantía de posicionamiento.
