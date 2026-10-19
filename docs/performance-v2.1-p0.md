# Comparativa de performance: v2.0 vs v2.1 P0

Fecha: 2026-08-24  
Baseline v2.0: commit `4d3c9fea71b86ae409aa4682bf52cc29d129a84b`  
Versión v2.1 P0: árbol de trabajo posterior a la optimización

## Metodología

- Ambos estados se construyeron con `npm run build`, Next.js 16.3 y las mismas variables locales.
- Se levantaron dos servidores de producción independientes con `next start`.
- Para cada ruta se realizaron seis solicitudes: una primera y cinco calientes.
- El tiempo caliente informado es la mediana de las últimas cinco solicitudes.
- Los assets iniciales incluyen JavaScript, CSS y workers referenciados directamente por el HTML.
- El tamaño gzip se calculó sobre los archivos de producción, sin contar chunks lazy no solicitados inicialmente.

## Resultados

| Ruta | v2.0 gzip | v2.1 P0 gzip | Diferencia | Mediana servidor v2.0 | Mediana servidor v2.1 |
|---|---:|---:|---:|---:|---:|
| `/` | 224 KB | 224 KB | 0% | 13 ms | 19 ms |
| `/login` | 328 KB | 328 KB | 0% | 8 ms | 11 ms |
| `/explorar` | 322 KB | 310 KB | -3,7% | 39 ms | 31 ms |
| `/simulador` | 351 KB | 296 KB | -15,7% | 385 ms | 293 ms |
| `/recursos/[id]` | 608 KB | 315 KB | -48,2% | 18 ms | 18 ms |
| `/materiales/[id]` | 645 KB | 364 KB | -43,6% | 407 ms | 314 ms |

## Lectura

- La mayor mejora está en PDF: el worker y el visor dejan de formar parte de la descarga anticipada.
- El simulador ya no entra completo en el grafo inicial del Server Component.
- Explorar mejora moderadamente por el nuevo shell y la carga secundaria de elementos no críticos.
- Home y login funcionan como grupo de control: no fueron alcanzados por el P0 y su peso permanece igual.
- Los tiempos de servidor dependen de red, caché y Supabase; por eso el tamaño inicial gzip es el indicador principal de esta comparación local.

## Limitaciones

- Las rutas autenticadas de dashboard y administración no se midieron sin una sesión de prueba reproducible.
- Esta prueba local no reemplaza Core Web Vitals p75 de usuarios reales en producción.
- El prerender de landings pertenece al P1 y no forma parte de esta comparación.
