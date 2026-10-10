# Revisión de pregunteros — 8 de octubre de 2026

## Alcance y resultado

El diseño de práctica se aplica en el código local a todas las páginas de materia y a Parcial 1, Parcial 2 e Integrador. Incluye las excepciones de Personas Jurídicas P1 y la ruta estática de Derecho Sucesorio P2. El hub `/pregunteros` mantiene su catálogo. No se agregó una acción para subir PDF.

La cabecera compartida recibe materia, universidad, parcial, cantidad y pregunta reales. Las opciones llevan al simulador correspondiente con la pregunta y una selección pendiente de confirmar. No muestran respuestas correctas. Cuando no hay una pregunta adicional válida, puede reutilizarse una muestra; ninguna muestra previa se elimina. Sin preguntas, la cabecera no ofrece iniciar la práctica.

Las páginas generales conservan sus seis muestras y enlaces a parciales; las parciales genéricas conservan cinco. Sucesorio conserva sus tres muestras, su plan de estudio y enlaces propios. Personas Jurídicas conserva las muestras y secciones complementarias. Su experimento sigue activo en las secciones inferiores: ambos grupos usan ahora la cabecera compartida, por lo que sus resultados no deben interpretarse como una comparación entre las cabeceras anteriores.

## Evidencia técnica

- `npm run lint`: aprobado, sin advertencias.
- `npm test`: aprobado.
- `npm run build`: aprobado, incluido TypeScript. Persisten avisos previos de Edge Runtime y descarga de una fuente dinámica para una imagen social.
- Render con fixtures de 16 combinaciones: cuatro materias × página general/P1/P2/Integrador. Verificado H1 único, muestras previas, enlace al simulador y opción interactiva. Incluidas ambas excepciones.
- Las funciones `generateMetadata` de las tres rutas son iguales a HEAD tras normalizar espacios. Se conservan títulos, descripciones, canonical, robots e imágenes sociales.
- Auditoría HTTP de las **267 URLs de pregunteros del sitemap publicado** (67 materias, 199 parciales/integradores y el hub): sin incidencias en status 200, título presente, H1 único, canonical coincidente y ausencia de `noindex`. No hay títulos duplicados entre esas URLs. Todas las páginas de detalle incluyen `BreadcrumbList`. Evidencia por URL: [JSON del rastreo](./2026-10-08-pregunteros-public-audit.json).
- Vista estática de Redacción P2: H1 único, cuatro opciones enlazadas y sin desborde horizontal en ancho efectivo de 375 px. No sustituye revisar las otras materias con datos reales en navegador.
- El `robots.txt` publicado permite `/pregunteros` y anuncia el sitemap por HTTPS.

El rastreo corresponde a la versión publicada anterior a estos cambios. Los fixtures validan el código local; no sustituyen una prueba E2E ni prueban todas las preguntas del banco.

## Directrices de Google aplicables

| Área | Evaluación |
| --- | --- |
| Acceso público y rastreo | Preguntas y contenido visibles sin login; rutas no bloqueadas en robots. HTTP público verificado. |
| Contenido indexable | Cabeceras y muestras se renderizan en el servidor; el texto no depende de responder o registrarse. |
| Canonical y descubrimiento | Metadatos conservados; sitemap y enlaces HTML navegables. No se crean nuevas URLs SEO por la selección: los parámetros apuntan al simulador. |
| Contenido útil y políticas de spam | Materias y parciales mantienen preguntas reales, contexto y jerarquía. No se agregó texto oculto para buscadores, relleno de keywords ni contenido distinto por Googlebot. Esto no certifica la calidad editorial de todo el banco. |
| Datos estructurados | Se mantiene `BreadcrumbList`, coherente con la ruta. No se agregan ratings, reseñas ni FAQ ficticios. Google Rich Results Test validó cuatro páginas representativas publicadas, incluidas ambas excepciones. |
| Experiencia de página | Cabecera responsive, CTA accesible y sin modal de registro en la landing. No se agregan imágenes pesadas, scripts externos ni dependencias. Core Web Vitals de la nueva versión pendientes. |

Fuentes oficiales consultadas: [Search Essentials](https://developers.google.com/search/docs/essentials), [requisitos técnicos](https://developers.google.com/search/docs/essentials/technical), [políticas de spam](https://developers.google.com/search/docs/essentials/spam-policies), [datos estructurados](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) y [experiencia de página](https://developers.google.com/search/docs/appearance/page-experience).

## Revisión directa con herramientas de Google

Revisión realizada el **8/10/2026** en la propiedad autenticada `sc-domain:evaluo.com.ar`, sin solicitar indexación ni modificar la propiedad. Evidencia, métricas y listado de URLs: [registro de Google](./2026-10-08-pregunteros-google-review.json).

- **Acciones manuales y problemas de seguridad:** ambos informes indican «No se ha detectado ningún problema».
- **Redacción Publicitaria P2:** «La URL está en Google», indexación permitida y canonical elegida por Google igual a la URL inspeccionada. Último rastreo: 5/9/2026, Googlebot smartphone. La prueba en vivo del 8/10 confirma «La URL está disponible para Google» y que se puede indexar.
- **Sitemap:** estado «Correcto», última lectura el 5/10, 519 páginas descubiertas de todo el sitio.
- **Rich Results Test:** Redacción P2, Constitucional general, Sucesorio P2 y Personas Jurídicas P1: rastreo correcto y un `BreadcrumbList` válido en cada caso. El informe agregado de rutas de exploración del 6/10 tiene 13 elementos válidos y cero inválidos; ese informe no representa todas las URLs del sitemap.
- **PageSpeed de Redacción P2:** laboratorio móvil 99/100 rendimiento, 96/100 accesibilidad, 100/100 buenas prácticas y 100/100 SEO; escritorio 100/100 rendimiento y SEO, 96/100 accesibilidad. LCP móvil 1,9 s, escritorio 0,5 s; CLS 0 en ambos. [Informe de Google](https://pagespeed.web.dev/analysis/https-evaluo-com-ar-pregunteros-redaccion-publicitaria--0eb4946c-227e-4a21-8d2a-72496cb00eca-parcial-2/u1gdm3bdt8?form_factor=mobile).

### Hallazgos a trabajar

1. **Descubrimiento e indexación:** el informe del 3/10 muestra 50 páginas «Descubierta: actualmente sin indexar», de las cuales 37 son parciales/integradores de Pregunteros. Se revisaron los 50 ejemplos. La inspección individual actual confirma que Constitucional P1 sigue sin indexarse y nunca fue rastreada según Google; aparece en el sitemap y Google no identifica una página de referencia. Los otros 36 necesitan inspección individual antes de afirmar su estado actual. Revisar visibilidad de enlaces internos, utilidad y diferenciación del contenido y capacidad de rastreo; el informe por sí solo no prueba una causa concreta. De los 59 ejemplos excluidos por `noindex`, ninguno corresponde a Pregunteros. No se revisaron individualmente las otras clases de exclusión.
2. **Core Web Vitals históricos:** PageSpeed no tiene muestras suficientes de esta URL y usa datos del **origen completo** de los últimos 28 días. Evaluación «No superada»: móvil LCP 2,8 s y CLS 0; escritorio LCP 3,4 s y CLS 0,16; INP sin datos. Son métricas del dominio publicado, no de esta landing ni del diseño local. Search Console, actualizado el 5/10, no dispone de datos suficientes para sus informes móvil/escritorio de los últimos 90 días. Un resultado de laboratorio alto no reemplaza los datos de usuarios reales.
3. **Contraste de la versión publicada:** Lighthouse señala la etiqueta superior y el chip del parcial seleccionado. Revisar contraste del nuevo diseño al desplegarlo.

Estos hallazgos ya existen en producción, antes de publicar los cambios visuales. Google no garantiza indexación o ranking por cumplir requisitos técnicos ni por lograr 100/100 en el chequeo SEO de Lighthouse. Fuentes: [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals), [datos de laboratorio y campo en PageSpeed](https://developers.google.com/speed/docs/insights/v5/about), [Breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb).

## Pendientes y límites

- Rich Results Test y PageSpeed del **nuevo diseño**: repetir después de su despliegue; lo validado con Google corresponde a la versión actualmente publicada.
- Flujo real opción → simulador → login: no verificado en navegador. Windows bloquea la carga de `canvas.node`, lo que impide iniciar la aplicación completa. La vista de `127.0.0.1:3101` es una maqueta estática del componente real de Redacción P2; no sirve para validar SEO ni el simulador.
- Riesgo previo del cargador: ante algunos errores de datos, devuelve un banco vacío y los metadatos pueden emitir `noindex`. No se observó en el rastreo. Conviene diferenciar una indisponibilidad temporal de una materia realmente vacía antes de considerar cerrada una auditoría de resiliencia SEO.

**Gate QA: NO VERIFICADO para un release completo** por el flujo E2E pendiente. Los controles locales y el rastreo técnico sí aprobaron. No se desplegó esta versión ni se puede certificar el cumplimiento de todas las políticas de Google a partir de esos controles.
