# Auditoría de requisitos de Google para Evaluo

**Fecha:** 27 de agosto de 2026

**Alcance:** Google Search, experiencia de página, OAuth/Google Sign-In, Google Analytics y consentimiento, Google Ads, AdSense y preparación opcional para PWA/Google Play.

**Entorno revisado:** repositorio local y sitio público `https://evaluo.com.ar`.

> Revisión técnica y jurídica preliminar. No equivale a una aprobación de Google ni reemplaza la revisión de un profesional legal. Google decide la verificación, indexación, publicación o monetización desde sus consolas.

## Conclusión ejecutiva

**Evaluo cumple parcialmente, pero todavía no cumple de forma integral con todos los requisitos aplicables de Google.**

| Área | Estado | Conclusión |
|---|---|---|
| Google Search / SEO técnico | **Mayormente cumple** | Sitio público accesible por HTTPS, metadata, canonical, robots y sitemap válidos. Falta confirmar Search Console y métricas reales de Core Web Vitals. |
| Contenido útil y calidad SEO | **Parcial** | El sitemap excluye materias vacías, lo cual es positivo. Aun así, deben controlarse a escala las 499 URLs públicas para evitar páginas programáticas, repetitivas o con poco valor original. |
| Google OAuth / acceso con Google | **Parcial / no verificable** | El flujo existe y usa scopes básicos mediante Supabase. La web tiene inicio, privacidad y términos; pero la marca, dominios, estado de publicación y URLs autorizadas solo se validan en Google Cloud Console y Search Console. |
| Marca de “Acceder con Google” | **Riesgo medio** | Se construyó un botón y logotipo propios. El texto es válido, pero Google recomienda su SDK o recursos preaprobados y exige medidas, tipografía, colores y espaciado concretos para verificación. |
| Google Analytics / consentimiento | **No cumple para tráfico sujeto a consentimiento** | GA/GTM/Clarity se habilitan por tiempo o interacción, no por una decisión de consentimiento. No existe banner/CMP ni Consent Mode v2 (`analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`). |
| Privacidad y control de datos | **Parcial, con inconsistencia relevante** | La política identifica GA4 y derechos, pero no explica cookies con suficiente detalle. Declara que el usuario puede eliminar su cuenta desde Configuración, aunque no se encontró esa función. |
| Google Ads (anunciante) | **Preparación parcial** | La landing es pública, segura y navegable. Antes de pautar deben verificarse promesas, disponibilidad real, precios, identidad/contacto y contenido original de cada destino. |
| AdSense (publicar anuncios) | **No solicitado/no integrado; no listo** | No existe código AdSense ni `ads.txt`. La aprobación además requiere contenido original suficiente, navegación clara, control del contenido subido y políticas de cookies/consentimiento. |
| PWA | **Parcial** | Hay manifest e iconos, pero faltan iconos instalables recomendables de 192 y 512 px, capturas y evidencia de service worker/offline. El `start_url` lleva a una ruta autenticada. |
| Google Play / Trusted Web Activity | **No aplica actualmente** | No se encontró app Android/TWA. Si se publica, faltan `assetlinks.json`, ficha y Data Safety; además Google Play exige eliminación de cuenta dentro de la app y mediante un recurso web. |

## Hallazgos prioritarios

### P0 — Consentimiento de Analytics

**Evidencia:** `components/DeferredMarketingAnalytics.tsx` activa Analytics al primer gesto o luego de aproximadamente 2,5 segundos. `components/GoogleAnalytics.tsx` carga `gtag.js` y configura GA sin consultar una preferencia. No se encontraron banner, CMP ni comandos de Consent Mode.

**Escenario:** una persona del EEE visita Evaluo; el sitio carga Google Analytics sin obtener ni comunicar consentimiento afirmativo. Si GA está conectado con servicios publicitarios, faltan además las señales de medición y personalización.

**Impacto:** incumplimiento de la política de consentimiento de usuarios de la UE de Google para los usos alcanzados; pérdida o limitación de medición/publicidad y riesgo regulatorio.

**Remediación:** implementar una CMP o banner real, establecer valores predeterminados antes de cargar etiquetas, guardar la preferencia y enviar Consent Mode v2. Bloquear Clarity y etiquetas no esenciales hasta la elección cuando corresponda. Incorporar un control permanente para cambiar o retirar consentimiento.

**Owner:** Frontend + Legal; revisión Security y QA.

**Verificación:** Tag Assistant, vista de Consent Settings de GA4 y pruebas sin consentimiento/con consentimiento.

### P0 — La política promete una eliminación de cuenta que no existe en la interfaz

**Evidencia:** `app/privacidad/page.tsx` afirma “También podés eliminar tu cuenta ... desde la configuración”, pero no se encontró acción, ruta o control de eliminación en Configuración.

**Impacto:** información potencialmente engañosa y falta de un control de privacidad prometido. También impediría cumplir Google Play si en el futuro se empaqueta la plataforma como app.

**Remediación:** implementar eliminación completa y segura de cuenta/datos, o corregir inmediatamente la afirmación y ofrecer un procedimiento verificable por correo/formulario hasta que exista autoservicio. Definir retenciones legales y excepciones.

**Owner:** Backend + Legal + Security; QA obligatorio.

### P1 — Completar y documentar la verificación de OAuth

No puede probarse desde el repositorio. En Google Cloud debe verificarse:

- aplicación de tipo **External** y estado **In production**;
- nombre “Evaluo”, correo de soporte y contactos del desarrollador;
- homepage `https://evaluo.com.ar`, privacidad y términos en el mismo dominio;
- dominio `evaluo.com.ar` verificado por un owner/editor del proyecto en Search Console;
- dominios autorizados y URI de callback exacta usada por Supabase;
- scopes mínimos (`openid`, `email`, `profile`) y ausencia de scopes sensibles/restringidos innecesarios;
- pantalla de consentimiento sin estado de prueba ni usuarios de prueba como limitación de producción.

La política de privacidad debería mencionar de manera expresa qué datos llegan desde Google al iniciar sesión (por ejemplo nombre, email e identificador), para qué se usan, dónde se almacenan y si se comparten.

### P1 — Sustituir o certificar el botón de Google

El texto “Continuar con Google” es admitido, pero el botón utiliza un SVG dibujado en el componente y la tipografía general del sitio. Para reducir el riesgo de rechazo, usar Google Identity Services para renderizarlo o el HTML/recurso preaprobado vigente. Si se conserva personalizado, comparar píxel por píxel logo, fondo, borde, fuente, padding, estados y prominencia.

### P1 — Calidad de contenido e indexación

Aspectos positivos comprobados:

- `https://evaluo.com.ar`, `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` y `/privacidad` responden 200;
- el sitemap público contiene 499 URLs;
- canonical y `lang="es-AR"` están presentes;
- HTTPS y HSTS están activos;
- existen CSP, `nosniff`, Referrer Policy y Permissions Policy;
- el generador de sitemap omite materias sin preguntas, resúmenes ni recursos.

Pendientes:

- verificar propiedad, cobertura, páginas indexadas y acciones manuales en Search Console;
- revisar una muestra y luego automatizar controles sobre las 499 URLs: 200 real, canonical propio, títulos/descripciones no duplicados, contenido original visible sin interacción y ausencia de soft-404;
- medir Core Web Vitals con datos de campo. PageSpeed Insights respondió 429 durante esta auditoría, por lo que no se asigna una puntuación inventada;
- no indexar landings generadas cuando la propuesta sea genérica, repetida o no tenga evidencia académica suficiente.

### P1 — Privacidad, cookies y terceros

La política menciona Google Analytics 4, pero debería agregar:

- categorías de cookies/almacenamiento, finalidades, proveedor y duración;
- diferencias entre cookies necesarias, analítica y publicidad;
- cómo aceptar, rechazar y retirar la elección;
- enlace a controles/opt-out pertinentes;
- tratamiento específico de datos obtenidos por Google Sign-In;
- transferencias internacionales y base/criterio aplicable, revisado legalmente;
- plazos concretos o criterios de retención por categoría;
- proveedores realmente activos (GA, GTM, Clarity, Vercel, Supabase, IA) y no solo ejemplos.

### P2 — Google Ads y AdSense

**Google Ads:** usar como destino únicamente páginas que entreguen exactamente lo prometido, sin contenido “en preparación”, callejones sin salida ni afirmaciones no demostrables. Mantener precio y condiciones visibles cuando se anuncie Premium. El dominio visible y el destino final deben coincidir.

**AdSense:** hoy no está integrado, por lo que la ausencia de `ads.txt` no es una infracción actual. Antes de solicitar aprobación:

- consolidar contenido original y valioso antes que volumen de páginas;
- moderar contenido de usuarios y prevenir material con copyright o fraude académico;
- evitar anuncios en pantallas sin contenido, privadas, de login, simulación interactiva o junto a botones que generen clics accidentales;
- publicar las divulgaciones de cookies requeridas y, para EEE/Reino Unido/Suiza, utilizar una CMP certificada por Google cuando corresponda;
- generar `ads.txt` con el registro exacto que entregue AdSense después de aprobar/configurar la cuenta.

## Preparación PWA y Google Play

Para la web normal, Google Play no es un requisito. Si se decide publicar una TWA/Android:

1. crear la aplicación Android firmada y el vínculo Digital Asset Links en `/.well-known/assetlinks.json`;
2. completar políticas de privacidad, Data Safety, clasificación de contenido y declaraciones de publicidad;
3. ofrecer eliminación dentro de la app y mediante una URL web pública;
4. añadir recursos de tienda y cumplir los niveles de API vigentes;
5. mejorar el manifest con iconos `192x192` y `512x512`, icono maskable real, capturas y un `start_url` que resuelva correctamente para usuarios no autenticados;
6. verificar comportamiento instalable, offline/errores y navegación con Lighthouse/Chrome.

## Orden recomendado antes de lanzar o invertir en adquisición

1. **Consentimiento + Consent Mode v2.**
2. **Eliminar la inconsistencia sobre borrado de cuenta e implementar el flujo real.**
3. **Auditar Google Cloud OAuth y Search Console con acceso a las consolas.**
4. **Adoptar el botón oficial/preaprobado de Google.**
5. **Revisar calidad e indexabilidad de las 499 URLs y obtener Core Web Vitals de campo.**
6. **Recién después lanzar Google Ads; posponer AdSense hasta tener contenido y audiencia suficientes.**
7. **Tratar Play/TWA como proyecto separado, solo si hay una razón de producto.**

## Fuentes oficiales consultadas

- [Google Search Essentials](https://developers.google.com/search/docs/essentials)
- [Contenido útil, fiable y pensado para personas](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Experiencia de página en Google Search](https://developers.google.com/search/docs/appearance/page-experience)
- [Mobile-first indexing](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing)
- [Requisitos de verificación de OAuth](https://support.google.com/cloud/answer/13464321?hl=en)
- [Administrar la marca de la app OAuth](https://support.google.com/cloud/answer/15549049?hl=en)
- [Guía de marca de Sign in with Google](https://developers.google.com/identity/branding-guidelines?hl=en)
- [Verificar consentimiento en GA4](https://support.google.com/analytics/answer/14275483?hl=en)
- [Configurar un banner/CMP y Consent Mode](https://support.google.com/analytics/answer/14546213?hl=en)
- [Experiencia del destino en Google Ads](https://support.google.com/adspolicy/answer/16427615?hl=en)
- [Política contra la tergiversación en Google Ads](https://support.google.com/adspolicy/answer/6020955?hl=en)
- [Elegibilidad de AdSense](https://support.google.com/adsense/answer/9724?hl=en)
- [Preparar páginas para AdSense](https://support.google.com/adsense/answer/7299563?hl=en-uk)
- [Requisitos de CMP para publishers](https://support.google.com/adsense/answer/13554116?hl=en)
- [Requisitos de eliminación de cuenta de Google Play](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en-EN)

## Limitaciones de la auditoría

No se tuvo acceso a Google Cloud Console, Search Console, GA4, Tag Manager, Google Ads, AdSense ni Play Console. Tampoco se realizó una aprobación formal, una campaña real o una revisión jurídica por jurisdicción. Los estados dependientes de esas consolas quedan expresamente como **no verificables** hasta aportar acceso o capturas de configuración.
