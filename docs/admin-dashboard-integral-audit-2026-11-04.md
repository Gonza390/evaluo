# Auditoría integral del administrador — 4 de noviembre de 2026

**Ámbito:** las diez pantallas del administrador de Evaluo, rama `master`. No incluye cambios en `main` ni publicación a producción. Se revisaron SQL, caching, permisos, navegación, datos mostrados y despliegue de vista previa.

## Estado de las diez pantallas

| Panel | Principal origen de datos | Caché del servidor | SQL medido (EXPLAIN ANALYZE) | Respuesta SQL JSONB aproximada |
|---|---|---:|---:|---:|
| 1. Tablero general | `admin_home_snapshot_v2` | 15 min | 88–152 ms en mediciones cálidas; una primera ejecución 2.208 ms | 9,1 KB |
| 2. Usuarios y retención | `admin_users_retention_v4` más segmentos/listado paginado | 10, 15 y 2 min respectivamente | 291 ms para el agregado | 10,0 KB |
| 3. Adquisición y SEO | `admin_acquisition_dashboard_v1` | 60 min | 240 ms | 763 KB |
| 4. Activación y recorrido | `admin_activation_cohort_v1` | 60 min | 169 ms | 145 KB |
| 5. Aprendizaje y prácticas | `admin_learning_dashboard_v2` | 60 min | 227 ms | 5,3 KB |
| 6. Planes de estudio | `admin_study_plans_dashboard_v1` | 60 min | 47 ms | 0,8 KB |
| 7. Monetización | `admin_monetization_dashboard_v1` | 60 min | 148 ms | 12,3 KB |
| 8. Comunicaciones | `admin_communications_dashboard_v1` | 60 min | 111 ms | 4,0 KB |
| 9. Sistema e IA | `admin_system_ai_dashboard_v1` | 15 min | 46–131 ms según ejecución | 3,4 KB (7 días), 6,5 KB (30 días) |
| 10. Gestión | `admin_management_snapshot_v1` | 5 min, invalidación tras cambios | 80 ms | 9,8 KB |

Los tiempos son tiempos de ejecución **SQL** puntuales, no tiempos de renderizado del navegador, P95 ni latencia de Vercel. Cambian con la carga y el calentamiento de caché; no deben usarse como SLA.

## Comprobaciones

- Las diez pantallas conservan la navegación hacia `?panel=ia` (Sistema e IA) y `?panel=gestion` (Gestión).
- **Sistema e IA** sustituyó seis lecturas administrativas de IA en `?panel=ia` por una RPC de datos agregados y 15 min de caché; las herramientas antiguas de IA se conservaron en `?panel=ia-herramientas` y no se cargan con el informe nuevo.
- Se corrigieron en Tablero general los enlaces de incidentes de procesamiento y pagos: ahora abren Sistema e IA y Monetización respectivamente.
- Todos los módulos de consulta revisados exigen acceso administrativo **antes** de devolver datos cacheados.
- La RPC nueva de Sistema e IA solo otorga ejecución a `service_role`, con revocación a `anon` y `authenticated`; no expone nombres, emails, tokens secretos ni mensajes brutos de error.
- Las cuatro ventanas (1/7/14/30 días) del panel 9 devuelven datos y sus sumas de tokens por función coinciden con el total.
- Las columnas con información insuficiente (costos reales de IA, cuotas Vercel, P95 por pantalla, reembolsos, aperturas de correos) se muestran como **no medidas**, nunca como cero ni como ejemplos.
- Se mantuvieron funciones reales de aprobación académica, feedback, referidos y editor de herramientas IA, sin crear interruptores de producto ni roles que el backend no reconozca.
- El asistente no ejecutó pruebas de navegador autenticado ni un flujo de extremo a extremo con el usuario, por lo que la validación visual y de acciones en sesión administrativa queda pendiente.

## Priorización de mejoras

### P1 — Reducción de payload de Adquisición y Activación

`admin_acquisition_dashboard_v1` devuelve aproximadamente **1.406 filas / 763 KB** por snapshot y `admin_activation_cohort_v1` alrededor de **169 filas / 145 KB**. Ambos ya utilizan 60 minutos de caché, reduciendo las lecturas de Supabase, pero la descarga y agregación por cliente es la mayor oportunidad de mejorar carga y consumo de transferencia. Para optimizar hay que conservar los filtros interactivos, elegir un esquema de agregación incremental / multidimensional y comparar resultados para todos los filtros antes de reemplazar los contratos actuales. No es una poda segura a ciegas.

### P1 — Observabilidad y precisión

Faltan mediciones de P95 por pantalla, costo efectivamente facturado del proveedor IA y porcentaje de cuota de Vercel consumida. Los costos de tokens equivalentes a tarifas públicas **no** son cobros confirmados. El panel 9 refleja el consumo que sí está instrumentado (`student_material_ai_usage`), además de trabajos, duración, reintentos, errores del navegador y bytes de almacenamiento.

### P1 — Rendimiento inicial de Tablero general

La primera medición de `admin_home_snapshot_v2` alcanzó **2,2 segundos**, pero tres repeticiones de la misma consulta quedaron entre **88 y 152 ms**. El plan evidencia temp read/write (434/217 bloques) y ya existe caché de 15 min. Se recomienda medir la distribución de latencia y el efecto de la carga antes de modificar CTEs o índices.

### P1 — Errores de plataforma fuera del administrador

El informe de errores de Vercel mostró grupos de errores anteriores en procesamiento de materiales (incluyendo errores JSON y extracción), en consultas de pregunteros y revalidación de caché de `/explorar`. Estos grupos no son necesariamente errores activos. No se aplicaron cambios a esas rutas de producción durante esta auditoría; requiere una reproducción y pruebas específicas.

### P2 — Seguridad preexistente y mantenimiento

Los avisos de Supabase incluyen funciones `SECURITY DEFINER` ejecutables por roles públicos y múltiples políticas permisivas/RLS. La RPC nueva de Sistema e IA **no** aparece en los avisos de funciones públicas. Los otros avisos requieren análisis de autorización por función: revocar masivamente permisos rompería la aplicación.

La interfaz histórica conserva componentes, hojas de estilo y utilidades de paneles anteriores; antes de eliminar archivos, conviene verificar importaciones y referencias dinámicas en el repositorio, incluidos tests. No se retiraron módulos sin prueba de ausencia de referencias.

## Veredicto

**Las diez pantallas están conectadas con consulta segregada por panel, datos agregados donde corresponde y cacheo explícito.** No se identificó un bloqueo de compilación en el último despliegue validado. Quedan tareas de observabilidad, reducción de payload de Adquisición/Activación, investigación de errores de producción y pruebas autenticadas end-to-end. Mantener esos trabajos fuera de un cambio masivo reduce el riesgo de romper funciones académicas o pagos.
