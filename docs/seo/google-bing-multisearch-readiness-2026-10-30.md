# Evaluo — SEO Google, Bing y buscadores alternativos (30/10/2026)

## Alcance verificado
- Producción: `evaluoapp.com`, rama `main`. Migración desde `evaluo.com.ar` con redirecciones 301.
- Auditoría HTTP de 30/10: 175/175 pruebas correctas; sitemap XML con 533 URLs únicas bajo el dominio nuevo, muestras académicas con canonical e indexabilidad correctos.
- Google Search Console tiene la propiedad `evaluoapp.com` verificada y reconoce el traslado, pero sus informes de indexación y rendimiento todavía estaban procesándose. El conector de métricas solo lee la propiedad antigua; no atribuirle tráfico al dominio nuevo.
- Las landings regionales mantienen alternates/hreflang para es-AR, es, es-MX, es-CO, es-ES, y x-default; HTML raíz neutro es y Content-Language por mercado.

## Google Search Essentials y calidad editorial
**Confirmado en las muestras**: HTTP 200, robots.txt/sitemap, canonicals, enlaces internos, idioma inicial y ausencia de noindex en páginas ofrecidas a rastreo.

**No verificable como cumplimiento absoluto sin revisión editorial e informes reales**: exactitud de todos los materiales, originalidad de todas las páginas académicas, ausencia de contenido duplicado, calidad/autoría de cada guía, indexación real y experiencia Core Web Vitals por usuarios.

- Crear páginas académicas solo si aportan material de estudio o preguntas realmente útiles. No publicar páginas masivas con únicamente nombres de universidades y texto intercambiable.
- Crear guías de admisión por país con temarios, ejemplos, fuentes oficiales y diferencias verificables; no clonar/renombrar páginas por región para ampliar el sitemap.
- Evitar afirmaciones de exámenes oficiales cuando las preguntas sean generadas por IA. Mantener fuentes, notas de verificación y fecha de revisión REAL solo ante cambios significativos.
- No añadir FAQ schema con respuestas que no aparezcan visibles, ni reseñas o valoraciones artificiales.
- Conservar las redirecciones 301 durante la migración (preferentemente de forma indefinida), revisar enlaces externos e internos, y medir las dos propiedades sin mezclar datos.

Fuentes:
- https://developers.google.com/search/docs/essentials
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes

## Bing Webmaster Tools y otros motores
1. Agregar/verificar `https://evaluoapp.com` en https://www.bing.com/webmasters/ (opción de importar una propiedad de Google Search Console); comprobar que importa la propiedad y sitemap nuevos.
2. Enviar o comprobar `https://evaluoapp.com/sitemap.xml`. No solicitar indexación de páginas `noindex`.
3. Revisar informes de Bing: páginas indexadas, errores, SEO Reports, consultas, IndexNow y recomendaciones.
4. DuckDuckGo obtiene buena parte de sus enlaces de Bing, aunque también cuenta con su propio rastreador; Bing es un canal relevante para su descubrimiento.
5. Brave Search mantiene un índice independiente. Priorizar accesibilidad por bots, enlaces HTML rastreables y contenido original; no prometer indexación específica.
6. Yahoo y otros buscadores también se benefician, según región e integración, de que Bing pueda rastrear el dominio.

Fuentes:
- https://www.bing.com/webmasters/help/add-and-verify-site-12184f8b
- https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a
- https://duckduckgo.com/duckduckgo-help-pages/results/sources
- https://search.brave.com/help/brave-search-crawler

## IndexNow — listo para activar en el dominio nuevo
- El archivo público `/<key>.txt` demuestra propiedad del host. La clave es pública por diseño.
- El workflow `.github/workflows/indexnow-notify.yml` es manual: Actions → Submit changed public SEO URLs to IndexNow → Run workflow → pegar de 1 a 20 URLs canónicas **que hayan sido publicadas o modificadas realmente**.
- No ejecutar el workflow hasta que Vercel haya desplegado el commit que contiene el archivo de clave.
- El script `scripts/submit-indexnow.mjs` verifica el archivo remoto, que la URL pertenezca a `evaluoapp.com`, aparezca en el sitemap vigente, responda 200, tenga canonical igual a sí misma y no sea `noindex` antes de publicar la notificación.
- Notificar solo cambios reales; nunca enviar todo el sitemap de manera reiterada.
- IndexNow es para buscadores participantes, **no es el sistema de envío de URLs de Google**; para Google usar sitemap y Search Console.
- Una aceptación 200/202 solo confirma recepción de la notificación, no indexación.

Fuentes: https://www2.bing.com/indexnow/getstarted ; https://www.indexnow.org/faq

## Seguimiento
Registrar semanalmente, por dominio y motor: URLs válidas/indexadas, errores/exclusiones, impresiones, clics, CTR, consultas no marcarias, países, landing y páginas con impresiones pero CTR bajo. Comparar migración sin interpretar un descenso temporal en el origen como pérdida automática de tráfico agregado.
