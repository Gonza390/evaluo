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

La fuente de verdad SEO sigue siendo el Google Doc «Evaluo — Plan editorial SEO compartido e historial». No se incorporaron automatizaciones nuevas ni modificaciones de producto. Las tareas A/B usan el reporte Bing de GitHub como señal de priorización, sin alterar el gate Google >=500.

## Google Keyword Planner: no conectado todavía

Google Ads Keyword Planner permite consultar métricas históricas por país y descargar listas, pero la documentación oficial exige completar la configuración de facturación para acceder a funciones básicas: https://support.google.com/google-ads/answer/7337243 .

La API de Google Ads NO se considera accesible aquí: requiere una cuenta autorizada, OAuth y nivel de API compatible con KeywordPlanIdeaService (Explorer no lo incluye). Documentación: https://developers.google.com/google-ads/api/docs/api-policy/access-levels .

La futura importación de CSV desde Keyword Planner deberá conservar país, idioma, período, fuente y rangos cuando correspondan; el promedio de búsquedas incluye variantes cercanas. Nunca convertir un rango 100-1000 en un volumen confirmado >=500.

## Verificación real — 05/11/2026

La integración **sí funciona en GitHub Actions**: el workflow `.github/workflows/seo-bing-keywords.yml` autenticó `BING_WEBMASTER_API_KEY`, hizo 12 llamadas a la API de Bing Webmaster Tools sin errores y guardó el JSON saneado en `seo/keyword-data/bing-latest.json` en `master`. El reporte es recuperable desde las tareas A/B mediante GitHub; el resultado no contiene la clave.

Los términos de muestra más amplios en España muestran estimaciones mensuales de **Bing**: `chatgpt` 785597, `anki` 1323, `resumen` 653, `examen` 486, `flashcards` 412. Consultas long-tail específicas pueden devolver cero observaciones o un historial insuficiente: eso significa `SIN_DATO`, no cero búsquedas.

**No se ha desbloqueado la publicación de artículos por este hecho.** Bing no permite acreditar el umbral editorial de >=500 búsquedas mensuales de Google. Para desarrollar nuevos artículos se necesitan los datos de Google (Ubersuggest gratuito, con cuota; o Google Keyword Planner una vez configurado) y los restantes 16 controles editoriales.

### Cómo se mantiene actualizado sin una tarea adicional

- El archivo de solicitudes `seo/keyword-data/bing-requests.json` admite hasta 15 frases/mercados de AR, ES, MX, CO.
- Una modificación de ese archivo en `master` dispara el workflow de GitHub Actions por `push`.
- GitHub Actions prueba el adaptador con datos sintéticos, consulta el API real y guarda la salida `seo/keyword-data/bing-latest.json` en un commit de datos en `master`.
- Los circuitos ChatGPT A/B consultan esta salida y el Google Doc compartido. Pueden cambiar **solo el archivo auxiliar de solicitudes**, con SHA vigente y sin modificar calendarios ni contenidos no aprobados.
- Si el resultado no está actualizado o faltan series históricas, registrar `SIN_DATO` y no inventar métricas.

Repositorio y fuentes: https://github.com/Gonza390/evaluo/blob/master/seo/keyword-data/bing-latest.json , https://github.com/Gonza390/evaluo/actions/workflows/seo-bing-keywords.yml , Google Doc editorial compartido sección 8.10.

## Prueba autenticada automática desde GitHub Actions

Se añadió el workflow **SEO Bing keyword API smoke (master only)** en `.github/workflows/seo-bing-keywords.yml`. Usa el secret de GitHub Actions `BING_WEBMASTER_API_KEY` y se activa por `push` a **master** cuando cambia el propio workflow, el adaptador o sus pruebas. No utiliza `schedule` ni altera los circuitos SEO A/B.

- Workflow: https://github.com/Gonza390/evaluo/actions/workflows/seo-bing-keywords.yml
- Ejecuta pruebas sintéticas, verifica que exista el secreto SIN mostrarlo y consulta 3 keywords de España con `GetKeywordStats`.
- Los resultados se guardan en el artifact `seo-bing-spain-smoke` del run (JSON sin credenciales).
- El workflow falla si ninguna de las tres consultas reales funciona, e informa el estado sin registrar URLs de autenticación.
- GitHub Actions `workflow_dispatch` solo se habilita cuando el workflow está registrado en la rama predeterminada (`main`). Como NO hay autorización para tocar `main`, se usa exclusivamente un disparador de push limitado a `master` en cambios de estos tres archivos. No está habilitado el botón «Run workflow» por defecto.

IMPORTANTE: La conexión API y la escritura de un reporte quedaron verificadas con datos reales el 05/11/2026. Cada nueva ejecución debe revisarse según fetchedAt, successfulApiCalls y observaciones disponibles. El reporte de Bing no valida demanda mensual de Google.
