# Auditoría SEO en vivo — migración Evaluo (2026-10-29)

## Alcance y metodología

- Dominio principal: `https://evaluoapp.com`.
- Dominios de origen: `https://evaluo.com.ar` y `https://www.evaluo.com.ar`.
- Ejecución: GitHub Actions, workflow **Live SEO domain migration audit**, PR #330, run `40946008446`, 2026-10-29 20:06 UTC.
- Método: peticiones HTTP reales, redirecciones desactivadas en el cliente para inspeccionar el primer estado y cabecera `Location`, descarga del sitemap/robots y análisis de etiquetas en HTML servido.
- Reproducible: `node scripts/audit-live-domain-migration.mjs` desde un entorno con acceso a internet.

## Resultado

**87 controles aprobados / 87 ejecutados; 0 errores.**

| Área | Resultado |
| --- | --- |
| 301 desde dominio y www antiguos a raíz, pregunteros, estudiar PDF y ruta mexicana | 8/8 correctos |
| Conservación de rutas y `utm_source` en redirección | Correcto |
| Robots público: HTTP 200, sitemap nuevo, sin dominio antiguo | Correcto |
| Sitemap XML: HTTP 200, URLs solo `evaluoapp.com`, 11 rutas muestreadas presentes | Correcto |
| HTML: 11 páginas HTTP 200 | Correcto |
| HTML: canonical absoluto coincidente por ruta | Correcto |
| HTML: ausencia de `noindex` en 11 rutas | Correcto |
| `hreflang`: `es-AR`, `es`, `es-MX`, `es-CO`, `es-ES`, `x-default` en cinco variantes, recíprocos | Correcto |

Rutas del muestreo: `/estudiar-pdf-con-ia`, `/es/estudiar-pdf-con-ia`, `/es-mx/estudiar-pdf-con-ia`, `/es-co/estudiar-pdf-con-ia`, `/es-es/estudiar-pdf-con-ia`, `/pregunteros`, `/landings/parciales`, `/funciones/resumir-pdf-con-ia`, `/funciones/crear-flashcards-desde-pdf`, `/uba-xxi/parciales`, `/convertir-pdf-en-preguntas`.

## Validación de Search Console: pendiente externo

- Windsor.ai devuelve únicamente la propiedad `sc-domain:evaluo.com.ar`. La propiedad nueva `evaluoapp.com` fue confirmada como verificada por el dueño, pero **no es consultable por el conector en este momento**.
- Esto impide certificar por API que Google eligió las URLs nuevas como canónicas, su estado de indexación o las inspecciones URL por URL.
- Acciones necesarias desde Google Search Console:
  1. Abrir la propiedad verificada de `evaluoapp.com` y enviar `https://evaluoapp.com/sitemap.xml` desde *Sitemaps*.
  2. En *Inspección de URL*, revisar `/pregunteros`, `/estudiar-pdf-con-ia`, `/es-mx/estudiar-pdf-con-ia` y `/es-es/estudiar-pdf-con-ia` (Google-selected canonical, rastreo e indexabilidad).
  3. Desde la propiedad antigua, abrir *Configuración → Cambio de dirección* y solicitar el traslado hacia `evaluoapp.com`. Verificar que la propiedad `www` antigua también esté cubierta si corresponde.
  4. Conectar la propiedad nueva a Windsor.ai o analizar por separado el rendimiento en la interfaz de Search Console; comparar impresiones/clics de ambas propiedades.
- Línea base anterior al traslado: `docs/seo/evaluoapp-search-console-baseline-2026-10-29.md` (01–25/10, 242 clics y 5.455 impresiones agrupados por fecha; no mezclar dimensiones sin normalizar).

## Alcance de las conclusiones

El resultado confirma HTTP, etiquetas HTML y descubribilidad **de las URLs muestreadas** en el instante de la ejecución; no equivale a certificar la indexación efectiva de Google ni todas las URLs dinámicas de miles de materias. Las redirecciones permanentes deben permanecer activas por largo plazo. No modificar slugs antiguos durante la estabilización de la migración.

Nota de mejora posterior no bloqueante: el layout raíz usa inicialmente `<html lang="es-AR">` para todos los países y las landings internacionales cambian el idioma en el cliente. Se recomienda SSR por región para accesibilidad y consistencia, pero no es motivo para volver a migrar URLs.
