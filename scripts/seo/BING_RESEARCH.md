# Evaluo — investigación SEO gratuita: Bing Webmaster (adaptador)

Herramienta aislada del producto (solo investigación; no altera Next.js ni publica URLs). Requiere Node.js 22. Código: scripts/seo/bing-keyword-research.mjs. Pruebas: node tests/seo-bing-keyword.smoke.mjs.

## Preparación de la cuenta (una sola vez)

1. Abrir https://www.bing.com/webmasters/ e iniciar sesión.
2. Añadir y verificar el dominio evaluoapp.com. Bing permite importar una propiedad ya validada en Google Search Console, si esa opción aparece en tu cuenta.
3. En Bing Webmaster Tools: Settings > API Access > API Key > Generate API Key.
4. Guardar la clave como variable de entorno **BING_WEBMASTER_API_KEY** en el entorno desde el que se ejecute el script. No pegar claves en el código, el documento SEO, el chat ni commits.
5. Verificar la primera lectura con una keyword y un país; si no hay datos, mantener estado SIN_DATO.

## Ejemplo local (Windows PowerShell)

    $env:BING_WEBMASTER_API_KEY = 'clave-que-guardas-solo-en-tu-equipo'
    node scripts/seo/bing-keyword-research.mjs --keywords="tecnica feynman;como estudiar para un examen tipo test" --country=es --language=es-ES --out=bing-resultado.json
    Remove-Item Env:BING_WEBMASTER_API_KEY

También se acepta --file=keywords.txt (una keyword por línea), --country=ar|es|mx|co y --language=es-AR|es-ES|es-MX|es-CO. Máximo 30 keywords por ejecución; no incluye programación ni polling en segundo plano.

## Interpretación SEO

Bing GetKeywordStats devuelve impresiones históricas por término. El adaptador distingue cadencia semanal/mensual, normaliza a una estimación mensual de **Bing** cuando hay suficientes observaciones y no inventa datos faltantes.

**Importante:** los resultados NO son estimaciones de volumen de **Google**, no se pueden sumar a cifras de Ubersuggest ni aprobar con ellos el umbral editorial de >=500 búsquedas mensuales de Google. El campo eligibleForGoogle500Rule siempre es false; usarlo para descubrir/priorizar, nunca aprobar publicaciones automáticamente.

La fuente de verdad SEO sigue siendo el Google Doc «Evaluo — Plan editorial SEO compartido e historial». No se incorporaron automatizaciones nuevas ni modificaciones de producto. La activación de la fuente en las tareas A/B queda PENDIENTE de verificar acceso real y definir cómo intercambiar el archivo con el banco compartido.

## Google Keyword Planner: no conectado todavía

Google Ads Keyword Planner permite consultar métricas históricas por país y descargar listas, pero la documentación oficial exige completar la configuración de facturación para acceder a funciones básicas: https://support.google.com/google-ads/answer/7337243 .

La API de Google Ads NO se considera accesible aquí: requiere una cuenta autorizada, OAuth y nivel de API compatible con KeywordPlanIdeaService (Explorer no lo incluye). Documentación: https://developers.google.com/google-ads/api/docs/api-policy/access-levels .

La futura importación de CSV desde Keyword Planner deberá conservar país, idioma, período, fuente y rangos cuando correspondan; el promedio de búsquedas incluye variantes cercanas. Nunca convertir un rango 100-1000 en un volumen confirmado >=500.

## Estado

- Adaptador implementado y pruebas simuladas: sí.
- Consulta real a Bing con evaluoapp.com: pendiente de verificación y clave.
- Google Keyword Planner (UI o API): pendiente de configuración por el titular.
- Número de keywords nuevas validadas para Google: cero.
- Commit permitido solo en master. No desplegar producción ni tocar main.


## Prueba autenticada automática desde GitHub Actions

Se añadió el workflow **SEO Bing keyword API smoke (master only)** en `.github/workflows/seo-bing-keywords.yml`. Usa el secret de GitHub Actions `BING_WEBMASTER_API_KEY` y se activa por `push` a **master** cuando cambia el propio workflow, el adaptador o sus pruebas. No utiliza `schedule` ni altera los circuitos SEO A/B.

- Workflow: https://github.com/Gonza390/evaluo/actions/workflows/seo-bing-keywords.yml
- Ejecuta pruebas sintéticas, verifica que exista el secreto SIN mostrarlo y consulta 3 keywords de España con `GetKeywordStats`.
- Los resultados se guardan en el artifact `seo-bing-spain-smoke` del run (JSON sin credenciales).
- El workflow falla si ninguna de las tres consultas reales funciona, e informa el estado sin registrar URLs de autenticación.
- GitHub Actions `workflow_dispatch` solo se habilita cuando el workflow está registrado en la rama predeterminada (`main`). Como NO hay autorización para tocar `main`, se usa exclusivamente un disparador de push limitado a `master` en cambios de estos tres archivos. No está habilitado el botón «Run workflow» por defecto.

IMPORTANTE: Que el workflow exista en master NO confirma por sí solo el éxito de una consulta autenticada. Revisar el run y su artifact; si falla, investigar credenciales o compatibilidad de la API antes de conectar resultados a los circuitos A/B. El registro diario de Bing sigue siendo una métrica de Bing, NO demanda mensual Google validada.
