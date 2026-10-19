# Estado integral de Evaluo — preparación v2.1

Fecha del análisis: 24 de agosto de 2026.

## Resumen ejecutivo

Evaluo ya es una plataforma funcional y no una demo: combina catálogo académico público,
cuentas y perfiles, dashboard de estudio, recursos/PDF, simuladores, materiales generados con IA,
pagos, analítica y un backoffice operativo.

El estado técnico para la v2.1 es **aprobado con seguimiento**. La aplicación compila, pasa lint,
las ocho suites smoke y los presupuestos de JavaScript. Las mejoras realizadas redujeron trabajo de
servidor, consultas duplicadas, JavaScript inicial y tiempo del panel administrativo. Todavía falta
la validación con usuarios reales en producción durante 7–14 días y una capa de pruebas E2E.

## Tamaño y composición

| Indicador                                     | Estado actual |
| --------------------------------------------- | ------------: |
| Archivos TypeScript/TSX                       |           324 |
| Líneas TypeScript/TSX                         |        65.644 |
| Rutas/páginas/endpoints                       |            56 |
| Archivos dentro de `app/`                     |           117 |
| Migraciones Supabase                          |            76 |
| Suites smoke ejecutadas por CI                |             8 |
| Landings académicas antes generadas por build |           772 |

Módulos principales:

- experiencia pública: home, exploración, universidades, carreras, materias y SEO;
- experiencia autenticada: perfil, dashboard, favoritos, historial y calendario;
- estudio: recursos, PDF, resúmenes, materiales y simuladores;
- IA: generación de preguntas, explicaciones, resúmenes y proveedores con fallback;
- operación: panel administrador, biblioteca, usuarios, analytics y logs;
- plataforma: Supabase/Auth/Postgres/Storage, Mercado Pago, cron, analytics y observabilidad.

## Resultado de las mejoras de performance

### Panel administrador

La carga autenticada del panel bajó de:

| Medición            |    Antes |    Ahora | Mejora |
| ------------------- | -------: | -------: | -----: |
| Primera carga       | 3.119 ms | 1.822 ms |  41,6% |
| Mediana en caliente | 1.369 ms |   913 ms |  33,3% |

Se logró mediante carga diferida de paneles pesados, skeleton dedicado y caché de 60 segundos para
el cálculo de conversión. La autorización sigue ocurriendo antes de acceder al dato cacheado.

### Landings académicas

El build dejó de prerenderizar las 772 landings en cada despliegue. Ahora se generan con ISR en el
primer acceso y quedan cacheadas durante 10 minutos.

| Medición                       |  Antes |            Ahora |             Mejora |
| ------------------------------ | -----: | ---------------: | -----------------: |
| Rutas generadas en build       |    818 |               47 |        94,3% menos |
| Fase de generación estática    | 27,7 s |           12,6 s |              54,5% |
| Primera visita local a landing |      — | 1.222 ms, `MISS` | generación inicial |
| Segunda visita local           |      — |     20 ms, `HIT` |  98,4% vs. primera |

La primera visita de una landing poco usada paga el costo de generación. Las páginas populares
pueden precalentarse después del despliegue si los datos de tráfico lo justifican.

### Dashboard, simulador y datos

- el dashboard consolidó estadísticas parciales en una sola RPC: 2 viajes a base pasaron a 1;
- la consulta reciente de preguntas recibió un índice específico; el plan medido bajó de unos
  856 ms a 2,3 ms, una mejora aproximada de 99,7% en esa operación;
- simulador, dashboard, PDFs y paneles administrativos cargan sus bloques pesados de forma diferida;
- sesión y perfil reutilizan datos por request, evitando consultas duplicadas;
- recursos y materiales tienen metadata/layout más livianos.

### Presupuesto de JavaScript

Todas las superficies controladas pasan el presupuesto actual:

| Ruta               | JS gzip estimado | Límite |
| ------------------ | ---------------: | -----: |
| `/`                |         228,3 KB | 250 KB |
| `/login`           |         329,1 KB | 360 KB |
| `/explorar`        |         301,2 KB | 330 KB |
| `/dashboard`       |         298,4 KB | 340 KB |
| `/administrador`   |         298,5 KB | 340 KB |
| `/simulador`       |         297,3 KB | 325 KB |
| `/recursos/[id]`   |         305,9 KB | 340 KB |
| `/materiales/[id]` |         358,4 KB | 400 KB |

El control está integrado a CI: un incremento que supere estos límites bloquea el cambio.

## Salud por área

| Área             | Estado                      | Lectura                                                                                                               |
| ---------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Frontend y carga | Bueno                       | Lazy loading, ISR, caché y presupuestos ya protegen las rutas principales.                                            |
| Backend y datos  | Bueno                       | Acceso centralizado, RPC e índices reducen roundtrips y consultas costosas.                                           |
| Admin            | Bueno                       | Mejoró sensiblemente; falta medir cada pestaña con volumen real.                                                      |
| IA y materiales  | Bueno con riesgo            | Hay múltiples proveedores y validación, pero es un área costosa y compleja.                                           |
| Seguridad        | Bueno con seguimiento       | Autorización admin centralizada y secretos server-side; conviene revisar advisors/RLS antes del release.              |
| Observabilidad   | En transición               | Errores server ya se pueden enviar a Sentry/Axiom; Speed Insights acaba de incorporarse.                              |
| QA               | Suficiente para integración | Lint, build y smoke pasan; faltan pruebas reales de navegador y producción.                                           |
| Mantenibilidad   | Media                       | Tres archivos muy grandes concentran lógica y elevan el costo de cambios.                                             |
| Dependencias     | Media                       | No hay vulnerabilidades reportadas por `npm audit`, pero existen upgrades mayores que requieren migración controlada. |

## Observabilidad incorporada

`@vercel/speed-insights` está montado globalmente. Al desplegar permitirá segmentar por ruta y
dispositivo los Core Web Vitals reales:

- LCP objetivo p75: menos de 2,5 s;
- INP objetivo p75: menos de 200 ms;
- CLS objetivo p75: menos de 0,1;
- TTFB operativo inicial: menos de 800 ms en las rutas críticas.

Esto no produce datos históricos locales: requiere desplegar y acumular tráfico real. La medición
de errores server ya sanitiza encabezados sensibles y puede enviarse a Sentry, Axiom o un endpoint
propio cuando sus variables están configuradas.

## Mejoras viables recomendadas

### P0 — cerrar la v2.1 con evidencia real

1. **Desplegar y observar 7–14 días.** Revisar LCP, INP, CLS y TTFB por ruta, dispositivo y país.
   Ayuda a priorizar por experiencia real, evitando optimizaciones basadas sólo en laboratorio.
2. **Agregar pruebas E2E de los cinco flujos críticos.** Login, dashboard, abrir material, completar
   simulador y operación admin. Ayuda a detectar errores de hidratación, permisos, navegación y
   persistencia que las pruebas smoke no ven.
3. **Gate de seguridad previo al release.** Revisar RLS, funciones `SECURITY DEFINER`, grants,
   uploads y endpoints internos. Ayuda a evitar exposición de datos o privilegios en una versión
   que ya tiene más superficie y usuarios.

### P1 — reducir riesgo y sostener el crecimiento

1. **Dividir los tres módulos más grandes.** `SimuladorExamen.tsx` (2.908 líneas), actions admin
   (2.889) y dashboard-content (1.879). Extraer lógica por dominio y agregar pruebas por módulo.
   No promete una mejora inmediata de red, pero reduce regresiones, tiempo de desarrollo y costo de
   optimizar la siguiente funcionalidad.
2. **Precalentar sólo las landings más visitadas.** Usar analytics para generar las 20–50 páginas
   principales después del deploy. Mantiene el build rápido y evita que el primer usuario frecuente
   reciba el `MISS` de ISR.
3. **Consolidar analytics administrativos.** Migrar cálculos de marketing crecientes a RPC o tablas
   agregadas por hora/día. Reduce filas transferidas, CPU serverless y latencia cuando aumente el
   historial.
4. **Controlar consultas públicas de conteo/listado.** Aplicar caché, paginación y métricas de uso a
   las consultas de preguntas que aparecen con alta frecuencia. Reduce consumo acumulado de Postgres.

### P2 — eficiencia operativa y de producto

1. **Telemetría de IA por generación.** Guardar proveedor, modelo, latencia, tokens, costo, retry y
   resultado validado. Ayuda a elegir el proveedor por calidad/costo y detectar fallbacks caros.
2. **Procesos IA pesados en cola.** Resúmenes, extracción y generación masiva no deberían competir
   con requests interactivos. Mejora estabilidad, permite retries y evita timeouts percibidos.
3. **Actualizar dependencias por lotes.** Primero parches de Next/Supabase/React, luego majors con
   rama y regresión dedicada. Ayuda con fixes y soporte sin asumir el riesgo de actualizar todo junto.
4. **Tightening progresivo de budgets.** Después de obtener RUM, bajar 5–10% los límites de las rutas
   con margen. Evita que el peso vuelva a crecer silenciosamente.

## Criterio de salida para v2.1

La versión puede considerarse lista cuando:

- CI continúa verde y todos los presupuestos pasan;
- no hay regresiones en los cinco E2E críticos;
- el gate de seguridad no deja hallazgos P0/P1 abiertos;
- Speed Insights acumula una muestra útil y las rutas críticas cumplen Core Web Vitals p75 o tienen
  un plan documentado;
- logs y errores posteriores al deploy permanecen estables durante al menos 48 horas.

## Conclusión

Evaluo está en una posición técnicamente buena para avanzar a 2.1. Las mejoras realizadas sí
benefician al usuario: menos espera en admin, menos JavaScript inicial y menos consultas duplicadas.
También mejoran la operación: builds más cortos, caché reutilizable y un límite automático al peso.

La prioridad ahora debe pasar de “optimizar todo” a **medir producción, proteger recorridos críticos
y atacar sólo los cuellos confirmados**. Ese enfoque permitirá que la 2.1 sea más rápida y, sobre
todo, más estable y fácil de evolucionar.
