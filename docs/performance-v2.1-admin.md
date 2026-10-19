# Optimización del panel administrador v2.1

Fecha: 2026-08-24

## Cambios

- El cálculo de conversión y marketing se reutiliza durante 60 segundos por período.
- La autorización se valida antes de consultar la caché; la función de cálculo no se exporta.
- Se agregó `app/administrador/loading.tsx` para mostrar inmediatamente la estructura del panel durante una navegación.
- Los paneles secundarios continúan cargándose de forma diferida.

## Comparación autenticada

Misma sesión, mismo servidor local de producción y misma ruta:
`/administrador?panel=marketing&period=7`.

| Métrica | Antes | Ahora | Diferencia |
|---|---:|---:|---:|
| Primera carga después de iniciar el servidor | 3.119 ms | 1.822 ms | **-41,6%** |
| Mediana de las cinco cargas siguientes | 1.369 ms | 913 ms | **-33,3%** |
| Assets iniciales gzip | 297,5 KB | 297,6 KB | sin cambio material |

Muestras antes: `3119, 2040, 1369, 1393, 1280, 1298` ms.  
Muestras después: `1822, 814, 933, 1157, 913, 856` ms.

## Diagnóstico de datos

Las consultas individuales relevantes observadas en `pg_stat_statements` estaban mayormente entre 0,03 y 3,2 ms. El cuello era la suma de viajes, transferencia de eventos y procesamiento repetido, por lo que agregar índices nuevos no era la solución principal para esta pantalla.

## Verificación

- Lint aprobado.
- Smoke tests aprobados.
- Build y TypeScript aprobados.
- Presupuesto de performance aprobado: administrador 297,6 KB de un máximo de 340 KB.
