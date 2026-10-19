# SEO Search Console — corte 2026-08-30

## Ventana base

Datos de Google Search Console: 2026-08-22 a 2026-08-28.

- Clics: 42
- Impresiones: 1.387
- CTR: 3,03%
- Posición media aproximada: 8,0

### Dispositivos

- Desktop: 32 clics / 736 impresiones / CTR 4,35% / posición 8,78
- Mobile: 10 clics / 643 impresiones / CTR 1,56% / posición 7,12
- Tablet: 0 clics / 8 impresiones / CTR 0% / posición 6,88

### Señales que motivaron el trabajo

- Pregunteros: aproximadamente 28 clics / 500 impresiones / CTR 5,6% / posición 6,1.
- `pregunteros siglo 21`: 2 clics / 58 impresiones / CTR 3,45% / posición 5,83.
- `preguntero siglo 21`: 0 clics / 23 impresiones / posición 4,17.
- `pregunteros universidad siglo 21`: 0 clics / 5 impresiones / posición 3,8.
- Mobile rankeaba mejor que desktop pero tenía CTR sustancialmente inferior.
- Una URL histórica `/explorar/materia/UUID?tab=pregunteros&carreraId=...` acumuló 135 impresiones.
- `/materias?carreraId=...` ya recibía impresiones pese a no ser la URL SEO deseada.

## Cambios publicados

Implementados en PR #32 (`feat/seo-gsc-optimizations-20260830`).

### 1. Consolidación de URLs y canonicalización

- El sitemap publica materias con el slug canónico `nombre--UUID`.
- Las URLs históricas de materia con `?tab=pregunteros` redirigen permanentemente al preguntero canónico cuando hay preguntas.
- Las URLs históricas con `?tab=resumenes` redirigen al resumen canónico cuando existe contenido.
- Las URLs de materia no canónicas se consolidan mediante redirect permanente al slug legible.
- `/materias?carreraId=...` queda `noindex, follow` y canonicaliza a la landing limpia de carrera.

Hipótesis: reducir señales repartidas entre variantes de una misma intención y mover impresiones hacia las URLs que queremos posicionar.

### 2. Linking interno de Pregunteros

- Las páginas de materia exponen enlaces HTML visibles al preguntero, Parcial 1, Parcial 2 e Integrador cuando existen.
- Pregunteros enlaza de vuelta a sus parciales y a la materia.
- Las páginas de parcial mantienen el CTA al simulador y agregan caminos explícitos al preguntero completo, materia y resúmenes.
- Las landings de carrera y simulador enlazan materias mediante URLs canónicas sin parámetros.

Hipótesis: mejorar descubrimiento/crawl, concentración de autoridad interna y navegación entre páginas de alta intención.

### 3. Foco explícito en Universidad Siglo 21

- `/pregunteros` usa title y H1 alineados con `Pregunteros Siglo 21`.
- Se agregó una sección server-rendered con enlaces directos a materias de Siglo 21 que ya tienen preguntas.
- Siglo 21 se prioriza visualmente en el hub sin eliminar otras universidades.

Hipótesis: capturar mejor las queries donde Evaluo ya estaba entre posiciones 3 y 6 y convertir más impresiones en clics.

### 4. CTR mobile

- Los títulos de páginas de Pregunteros se acortaron y ponen primero `Materia – Preguntero` / `Materia – Preguntero Parcial N`.
- Se agrega `| Siglo 21` sólo cuando el título final entra dentro de aproximadamente 62 caracteres.
- Las descriptions de parciales pasan a enfatizar cantidad de preguntas + práctica + revisión de errores.

Hipótesis: reducir truncamiento y hacer el resultado más fácil de entender en SERP mobile.

## Resultados esperados

No se considera éxito simplemente tener más impresiones. El objetivo es que Google concentre las señales en las URLs correctas y que las páginas de alta intención conviertan mejor la impresión en clic.

Indicadores principales:

1. Pregunteros: mantener o superar CTR base ~5,6% y aumentar clics.
2. Mobile: subir desde CTR 1,56%; primera señal positiva >= 2%, objetivo posterior 2,5–3% si el volumen lo permite.
3. Queries `pregunteros siglo 21`, `preguntero siglo 21` y variantes: más clics/CTR y, secundariamente, mayor estabilidad en top 3–5.
4. URL histórica con `?tab=pregunteros`: sus impresiones deberían caer y trasladarse a la URL canónica; eso no se interpreta como pérdida si el total de la intención se mantiene o crece.
5. `/materias?carreraId=`: las impresiones deberían decaer al procesarse `noindex`/canonical.
6. Slugs canónicos de materias, Pregunteros y landings de carrera: deberían concentrar una mayor proporción de las impresiones.

## Próximos cortes

### Corte direccional

Hacerlo el 2026-09-09 o 2026-09-10, usando como período principal 2026-08-31 a 2026-09-06. Search Console suele necesitar algunos días para completar datos y Google además debe recrawlear/reprocesar las URLs.

### Corte de validación

Hacerlo el 2026-09-16 o 2026-09-17, evaluando dos semanas completas post-cambio. Este segundo corte es el adecuado para decidir si las mejoras de canonicalización, linking y snippets tuvieron efecto real.

## Regla de interpretación

Durante una consolidación de canonicales pueden bajar temporalmente impresiones de URLs antiguas. Evaluar en conjunto:

- clics totales;
- CTR;
- posición;
- distribución de impresiones entre URL antigua y canónica;
- rendimiento mobile;
- rendimiento específico de Pregunteros y queries Siglo 21.

No revertir por una oscilación de pocos días salvo que aparezca un problema técnico de indexación.