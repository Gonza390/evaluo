# Performance v2.1 P2: Supabase y presupuesto de CI

Fecha: 2026-08-24

## Supabase

- Se consultó `pg_stat_statements` del proyecto productivo antes de cambiar índices.
- `get_user_partial_stats` ahora devuelve también `total_preguntas`; el dashboard pasa de dos viajes normales a uno para construir los insights del parcial.
- Se corrigió el consumo del RPC: PostgREST devuelve una tabla como arreglo y la aplicación estaba interpretándola como objeto, por lo que caía silenciosamente al fallback.
- El fallback se conserva para degradación segura y ejecuta sus dos lecturas en paralelo.
- El RPC quedó `security invoker` y ejecutable únicamente por `service_role` y el propietario `postgres`.

### Índice respaldado por evidencia

`pg_stat_statements` mostraba la consulta de preguntas recientes con una media aproximada de 855,84 ms. Se agregó `idx_preguntas_banco_creado_at_desc`.

Plan verificado después de la migración:

- `Index Scan using idx_preguntas_banco_creado_at_desc`.
- 50 filas devueltas.
- Ejecución: 2,331 ms.
- Mejora observada del plan equivalente: aproximadamente 99,7%.

## Presupuesto de performance

El build genera el tamaño gzip a partir de los manifests de cliente de Next.js. CI falla si alguna ruta supera su presupuesto.

| Ruta | Build actual | Máximo CI |
|---|---:|---:|
| `/` | 227,3 KB | 250 KB |
| `/login` | 328,1 KB | 360 KB |
| `/explorar` | 300,2 KB | 330 KB |
| `/dashboard` | 297,4 KB | 340 KB |
| `/administrador` | 297,5 KB | 340 KB |
| `/simulador` | 296,3 KB | 325 KB |
| `/recursos/[id]` | 304,9 KB | 340 KB |
| `/materiales/[id]` | 357,4 KB | 400 KB |

Los límites dejan entre 9% y 15% de margen para variaciones normales de compilación, sin permitir que regresen los paquetes pesados retirados en P0.

## Verificaciones

- `npm run lint`: aprobado.
- `npm test`: aprobado.
- `npm run build`: aprobado.
- `npm run performance:budget`: ocho rutas aprobadas.
- RPC ejecutado contra Supabase: respuesta válida con los cuatro agregados.
- Permisos remotos verificados: sin `EXECUTE` para `anon` ni `authenticated`.
