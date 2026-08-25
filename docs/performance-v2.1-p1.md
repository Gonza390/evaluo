# Comparativa de performance: v2.0 vs v2.1 P1

Fecha: 2026-08-24  
Baseline v2.0: commit `4d3c9fea71b86ae409aa4682bf52cc29d129a84b`  
Versión v2.1 P1: árbol de trabajo con P0 + optimización autenticada

## Alcance aplicado

- Medición real con sesión autenticada en dashboard y administración.
- Una única lectura reutilizable del perfil por render de servidor.
- Datos secundarios del dashboard separados de la ruta crítica.
- Streaming con Suspense para materias, favoritos, recomendaciones e insights.
- Paneles pesados de administración cargados por demanda.

## Metodología

- Los dos estados se compilaron con `npm run build`, Next.js 16.3 y las mismas variables.
- Se ejecutaron simultáneamente con `next start` en puertos distintos.
- Se reutilizó la misma sesión autenticada, sin leer ni almacenar credenciales.
- Dashboard: siete pares alternados v2.0/v2.1 para reducir el sesgo de la red remota.
- La métrica es tiempo completo de navegación observado por el navegador; se informa la mediana.
- Administración: el peso inicial se tomó de cinco recargas autenticadas por versión.

## Resultado autenticado

| Flujo | v2.0 | v2.1 P1 | Diferencia |
|---|---:|---:|---:|
| Dashboard, mediana de navegación completa | 565 ms | 477 ms | **-15,6%** |
| Administración, assets iniciales codificados | 445 KB | 318 KB | **-28,5%** |
| Administración, recursos iniciales | 22 | 21 | -4,5% |

Muestras alternadas del dashboard (ms):

| Par | v2.0 | v2.1 P1 |
|---:|---:|---:|
| 1 | 581 | 564 |
| 2 | 710 | 603 |
| 3 | 396 | 477 |
| 4 | 458 | 527 |
| 5 | 591 | 487 |
| 6 | 565 | 404 |
| 7 | 457 | 426 |

## Resultado público acumulado desde v2.0

| Ruta | v2.0 gzip | v2.1 gzip | Diferencia |
|---|---:|---:|---:|
| `/` | 224 KB | 224 KB | 0% |
| `/login` | 328 KB | 328 KB | 0% |
| `/explorar` | 322 KB | 310 KB | -3,7% |
| `/simulador` | 351 KB | 296 KB | -15,7% |
| `/recursos/[id]` | 608 KB | 315 KB | -48,2% |
| `/materiales/[id]` | 645 KB | 364 KB | -43,6% |

## Lectura y límites

- El dashboard ya no espera favoritos, recomendaciones, detalle de materias ni insights para mostrar el contenido crítico.
- El primer intento detectó que el shell duplicaba trabajo de autenticación en servidor. Se retiró ese bloqueo y se repitió la serie final.
- Los tiempos de Supabase mostraron variación y algunos timeouts durante la prueba; por eso se usaron pares alternados y mediana.
- La evidencia es local con backend remoto. Falta confirmar Core Web Vitals p75 y Server-Timing en producción.
- El build final pasó lint, smoke tests y type gate. El prerender de 772 landings sigue siendo un frente independiente de rendimiento de build.
