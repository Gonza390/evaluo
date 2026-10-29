# SEO: Argentina (UBA XXI y UNLaM) + cuatro mercados de Evaluo

Fecha: 2026-10-29. Dominio público: `https://evaluoapp.com`.
Alcance: mejoras sobre URLs EXISTENTES. No se crean rutas ni se cambia `hreflang`, canonical, DNS o pricing.

## Evidencia de Search Console

Consultas a Windsor.ai, propiedad antigua `sc-domain:evaluo.com.ar`, del 28-09 al 25-10-2026, dimensiones:
- `page, clicks, impressions, position`;
- `page, query, clicks, impressions, position`.

No se obtuvieron filas para `/uba-xxi/parciales`, `/como-estudiar-ingreso-unlam` ni las cuatro rutas internacionales `/es*/estudiar-pdf-con-ia` en ese intervalo. **Ausencia en estas consultas no demuestra volumen cero ni que estén desindexadas**, especialmente porque son páginas recientes y el dominio principal ya es otro. La nueva propiedad Search Console `evaluoapp.com` aún no es visible en este conector.

Ubersuggest: cuenta conectada, plan gratuito, cuota diaria de reportes agotada (HTTP 403). No se pudo obtener volumen mensual, CPC ni dificultad por mercado. No inventar valores y no crear nuevas páginas a partir de supuestos.

## Argentina

### UBA XXI: `/uba-xxi/parciales`

La página ya dispone de muestra interactiva, referencias a modelos de IPC e ICSE, enlaces oficiales y CTA a `/estudiar-pdf-con-ia`. Se agrega un bloque para organizar el repaso en función de fechas oficiales sin confundir la inscripción al parcial con la fecha del examen:
- Segundo cuatrimestre de 2026: cursada finaliza 11/11/2026.
- Inscripción al segundo parcial: 05 y 06/10/2026 (ya finalizada al redactar).
- Comprobar sede, cronograma y programa de la materia en canales oficiales.
- Ejercicios externos y de Evaluo distinguidos de exámenes oficiales.

Fuentes:
- https://ubaxxi.uba.ar/calendario-academico/
- https://ubaxxi.uba.ar/preguntas-frecuentes/

### UNLaM: `/como-estudiar-ingreso-unlam`

La página ya ofrece guía por carrera, actividades de práctica y enlaces al sistema oficial. Se corrige un problema temporal: la segunda instancia de inscripción 2027 terminó el 26/10/2026. Se añade aviso visible, una FAQ y una acción de preparación para quienes ya están inscriptos.

Fechas oficiales del ingreso UNLaM, segunda instancia 2027:
- Preinscripción: 28/09–26/10/2026;
- Documentación: 05/10–26/10/2026, por terminación de DNI;
- Cursada intensiva: 01/02–06/03/2027;
- Exámenes: 08–12/03/2027.

Fuente: https://www.unlam.edu.ar/calendario-academico/ y https://ingresantes.unlam.edu.ar/. La fecha de modificación y el sitemap se actualizaron al 29/10/2026.

## Internacional: cuatro landings existentes

| Mercado | URL | Intención principal de contenido actual | Ejemplo concreto añadido |
| --- | --- | --- | --- |
| Español general | `/es/estudiar-pdf-con-ia` | Estudiar PDF con IA | Sección sobre fotosíntesis: conceptos, recuperación sin mirar y corrección |
| México | `/es-mx/estudiar-pdf-con-ia` | Guía de estudio con IA desde PDF | Administración: dos unidades de planeación, objetivos e indicadores |
| Colombia | `/es-co/estudiar-pdf-con-ia` | Preparar parciales con IA desde PDF | Economía: oferta, demanda, interpretación de gráficos y revisión |
| España | `/es-es/estudiar-pdf-con-ia` | Crear preguntas tipo test desde PDF | Psicología: memoria de trabajo frente a memoria a largo plazo |

Todos los ejemplos son escenarios ilustrativos (no casos verificados de estudiantes ni promesas de predicción de exámenes). Cada página ahora conecta el ejemplo con el uploader público mediante `cta_click` localizado. Se mantienen el encabezado regional, el método, las preguntas de práctica, FAQ, canonical y `hreflang` recíproco existentes.

## Validación de nuevas keywords/páginas

La evidencia disponible solo confirma **intención editorial cualitativa**, no volumen ni ranking. Antes de publicar nuevas URLs, validar con:
1. Search Console de `evaluoapp.com`: impresiones, consultas y clics por las 4 URLs (idealmente dos semanas o más de datos disponibles).
2. Herramienta de volumen real por idioma y país, cuando haya cupo, para distinguir guías de estudio, tests, simulacros y estudio de PDF.
3. Comprobar canibalización con las cuatro URLs y otras funciones existentes, y que la nueva página tenga contenido y oferta propios.

**Decisión:** ninguna nueva landing por país hasta completar al menos (1) y (2).

## Medición de resultado

- Atribución de landing: `market` y `sourceKey` ya existen en `PdfFirstLandingUploader`.
- Nuevo evento `cta_click` desde el ejemplo: `location=international_{market}_regional_example`, `cta_name=seleccionar_pdf_desde_ejemplo`, `market`, `source`.
- Conversión: `pdf_selected`, `create_material_clicked`, registro, `pdf_uploaded` y primera práctica completada por mercado.
- Riesgo operativo pendiente para monetización: el producto mantiene el `/pricing` orientado a Argentina; trabajar precios y pagos locales antes de llevar usuarios internacionales a checkout.
- Problema no bloqueante posterior: `<html lang="es-AR">` en SSR raíz; las páginas internacionales actualizan lang en el cliente. Se recomienda resolver en una tarea de rutas con SEO y accesibilidad, separada del ajuste de contenidos.

## Pruebas

`tests/seo.smoke.ts` protege las secciones regionales, URLs, fechas, canonical/hreflang y sitemap. CI: TypeScript, lint, tests, build, Lighthouse SEO, QA responsive.
