# Configuración del perfil — 12 de octubre de 2026

Alcance: simplificación visual del formulario, extracción de presentación compartida y preview local. La carga, validación y persistencia existentes en `/configuracion` se conservaron.

## Verificaciones

- ESLint de página, layout, formulario y preview: aprobado.
- TypeScript (`npx tsc --noEmit`): aprobado.
- `tests/flow.smoke.ts`, incluidas las comprobaciones de resolución de perfil: aprobado.
- `git diff --check`: aprobado.
- Navegador, preview con datos preparados: selección de universidad cierra resultados y reinicia carrera; selección de carrera cierra resultados; edición de nombre y año habilita guardar; guardado simulado vuelve a deshabilitar el botón.
- Móvil a 390 y 360 px: sin desbordamiento horizontal; inputs de 44 px de altura y texto de 16 px; selector de año y guardado simulado funcionales.

## Límites

El preview usa el mismo formulario, sin llamadas de guardado remotas, y solo existe en desarrollo. No se probó la actualización real de perfil ni la suscripción con una cuenta autenticada. No se realizó una prueba en teléfono físico ni un build de producción.
