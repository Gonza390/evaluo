# Integración local con GitHub — 5 de octubre de 2026

## Versiones conservadas

- Base local: `e90182e`.
- Trabajo local protegido en `167ce22`: chat real de Mis errores, conversación por error durante la sesión, avatar preparado para Evi, selector de PDFs, consistencia visual y de textos, desenfoque suave de 1,5 px.
- GitHub: `origin/master` en `e06e451`.
- Merge local: `0a8e448`, sin conflictos. Ambos commits anteriores son ancestros del merge.
- Copia adicional previa a la integración: `tmp/integracion-2026-10-05/`, ignorada por Git.

## Cambios incorporados de GitHub

- Activación del primer PDF después del registro directo y guía inicial breve.
- Accesos a conceptos pendientes desde Mi espacio y navegación móvil.
- Lector de material más compacto, con scroll del resumen unificado.
- Comprobaciones opcionales de dos preguntas durante la lectura, ayuda breve y nueva comprobación sin salir del material.
- Recomendación del siguiente paso al terminar el resumen, según los pendientes del PDF.
- Analítica de activación, guía, comprobaciones y refuerzo.
- Credenciales Groq principales y fallback mediante `GROQ_API_KEY` y `GROQ_API_KEY_FALLBACK`.
- Indicador de actividad estimada en el header.

No se agregaron dependencias ni migraciones. No se modificaron datos remotos, precios, permisos o despliegues. Se conserva la configuración de GitHub que desactiva los despliegues automáticos de Vercel.

## Correcciones de la última revisión

1. Los dos popups del resumen usan el diálogo existente: foco dentro de la ventana, Escape, retorno de foco, bloqueo del fondo y altura máxima con scroll interno. Se admite texto largo y el botón de cierre tiene 44 px.
2. Las llamadas del popup manejan fallos de conexión: liberan el estado de carga y permiten continuar o reintentar. Si no se guardaron respuestas, se informa explícitamente. La muestra no afirma haber guardado errores reales.
3. La lectura de capítulos largos cuenta el tiempo mientras el contenido está visible. Se elimina el umbral del 35 % del capítulo que podía impedir las comprobaciones en materiales extensos. Al volver a la pestaña se recalcula la intersección, incluido el recorte del scroll interno. La invitación sigue requiriendo llegar al final y respetar los tiempos y saltos configurados.
4. Los popups y el indicador del header se cargan por separado. Las ocho rutas del presupuesto de assets vuelven a quedar dentro de sus límites; no se ampliaron los presupuestos para ocultar la regresión.
5. Se agregó cobertura del plan de comprobaciones en las pruebas existentes: respuesta entre las opciones, alternativas distintas, fuente conservada y ausencia de preguntas inventadas para contenido vacío. El test de navegación acepta el formato multilínea de Prettier sin cambiar el contrato comprobado.
6. Se reinstalaron las dependencias exactas del lockfile: la instalación local anterior usaba Next 16.3.0, mientras que el proyecto fija 16.3.7.

## Verificación

| Control | Resultado |
| --- | --- |
| `npm ci` | Pasó. Advertencias de peer dependencies y paquetes antiguos preexistentes. |
| `npm run lint` | Pasó después de las correcciones. |
| `npm test` | Pasaron los 16 archivos smoke, incluida la nueva cobertura de comprobaciones. |
| `npx tsc --noEmit` | Pasó. |
| `npm run build` | Pasó la compilación final en Next 16.3.7. |
| `npm run performance:budget` | Ocho rutas dentro de sus límites tras separar las cargas. |
| `git diff --check` | Pasó. |
| HTTP de 19 entradas | Páginas públicas/preview responden 200. Mi espacio, Mis errores, perfil, calendario y administrador redirigen a login sin sesión. `/empezar` también conserva su redirección esperada. |
| `npm audit --omit=dev --audit-level=high` | Cero vulnerabilidades reportadas. |
| `npm audit --audit-level=high` | No pasa: cinco hallazgos en la cadena de herramientas de desarrollo por `braces <=3.0.3`. |
| Lighthouse CI | Parcial: dos mediciones de Inicio, tercera ejecución interrumpida por `EPERM` al limpiar un directorio temporal de Chrome en Windows. No se ejecutó el conjunto completo ni se verificó su mediana. |
| Visual responsive después del merge | Pendiente: el navegador integrado quedó en una página interna `data:` de error que su política impide automatizar. Se pidió abrir manualmente el enlace HTTP válido; no se intentó eludir ese bloqueo. |
| Sesión, IA y progreso reales | Pendiente: el usuario informó que no puede iniciar sesión en local. No se simularon credenciales ni se realizaron escrituras remotas para sustituir esa prueba. |

Los comandos locales corrieron con Node 24.19.0; CI exige Node 22. La validación en ese entorno sigue correspondiendo a CI.

El build conserva dos advertencias previas: deprecación de Edge Runtime y descarga fallida de la fuente dinámica para el símbolo de verificación en Open Graph. No impiden compilar, pero tampoco se certifica con esto la imagen social.

Las dos mediciones de Lighthouse de Inicio dieron LCP 5,24 s y 3,68 s, TBT 106 ms y 50 ms, CLS 0 y 0. Una muestra no alcanza para declarar cumplimiento de la mediana exigida por CI.

## Security y CTO

Revisión del diff de autenticación y de las nuevas acciones: el callback conserva el intercambio de sesión y las consultas del usuario autenticado; las acciones de refuerzo verifican sesión, propiedad del error y del PDF, evidencia suficiente y límites de generación. Las credenciales Groq permanecen en servidor. No hay nuevas políticas RLS, grants ni cambios de esquema en esta integración.

No se halló una nueva exposición crítica confirmada en ese diff. Esto es revisión de código, no una auditoría dinámica del proyecto remoto ni una certificación de todas las acciones existentes.

La alerta de desarrollo está documentada en [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), sin versión corregida al momento de la consulta. No se ejecutó `npm audit fix --force`, que propone bajar `eslint-config-next` a una versión incompatible. El gate actual de audit de CI queda bloqueado; no se debilitó.

Observación de producto: el indicador del header calcula cifras y distribuciones estimadas, no sesiones activas reales. Los textos “estudiando ahora” y “Actualizado en vivo” requieren revisión antes de presentarlo como actividad medida. Se conserva el cambio solicitado en GitHub, sin alterar su alcance durante el merge.

**CTO: APROBADO CON CAMBIOS para la integración local.** Conserva contratos y ambos historiales. No equivale a aprobación de publicación.

**QA de release: NO VERIFICADO.** Falta cerrar la revisión visual posterior al merge, los estados autenticados, Lighthouse completo y la alerta que bloquea el audit de CI. No declarar “funciona en todos los dispositivos” a partir de las comprobaciones técnicas.

## Cómo revisar localmente

- Mis errores con componentes reales y acciones ficticias: `http://localhost:3000/preview/mis-errores/explicacion`.
- Procesamiento terminado: `http://localhost:3000/preview/procesando-pdf?listo=1`.
- Lector y comprobaciones de muestra: `http://localhost:3000/demo/material-estudio`.
- Recorrido de primer PDF: `http://localhost:3000/preview/primer-pdf`.

La versión combinada está en el repositorio local. No se hizo push ni despliegue en esta solicitud.
