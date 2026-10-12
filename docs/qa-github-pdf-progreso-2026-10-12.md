# Revisión para GitHub — 12 de octubre de 2026

## Alcance y otros trabajos

Incluye Progreso por PDF, evidencia de respuestas, reparto de práctica por temas,
refuerzo y repaso posterior, navegación y tamaños del espacio de estudio,
flashcards, glosario y formulario de Configuración. Los ajustes de Explorar y del
simulador corresponden a accesibilidad, controles y navegación móvil.

Se encontraron cuatro commits remotos posteriores a la base local, limitados a
las plantillas de correo y recordatorios. La rama de revisión parte de
`origin/master` en `47c96fb`, conservando ese trabajo sin modificarlo.

## Verificaciones ejecutadas

- `npm run lint`: aprobado.
- `git diff --check`: aprobado.
- `npm run build`: aprobado, incluido TypeScript. Avisos sobre Edge Runtime y
  descarga de fuente dinámica; la comprobación de claves IA se omitió según el
  comportamiento del script. El primer intento aislado falló por permisos del
  sistema de archivos; la ejecución autorizada completó el build.
- Todos los archivos `tests/*.smoke.ts` se ejecutaron individualmente: solo
  fallaron `seo.smoke.ts` y `recommended-study.smoke.ts`.
- `npm test`: detenido en la aserción SEO que exige `Practicar ahora` dentro del
  archivo de la landing. Esa cadena ya falta en HEAD anterior a estos cambios.
- La aserción de recorrido inicial exige una expresión antigua sin la condición
  `!firstPdfGuideAlreadySeen`. También falla contra HEAD anterior al trabajo local.
- Las pruebas de evidencia, asociación de temas, Progreso, práctica, prompt de
  refuerzo y seguridad básica pasan.

Entorno de esta ejecución: Node 24.19.0; CI utiliza Node 22. Las comprobaciones de
CI deben confirmarse en GitHub.

## Seguridad y arquitectura

Revisión de código de la acción de registro y del contexto de práctica: sesión,
UUID, propiedad del material, límites de frecuencia y corrección contra artefactos
canónicos. Las migraciones restringen escritura de eventos al servidor y lectura
al propietario. La función de cobertura usa `security invoker` y ejecución
restringida al rol de servicio. Sin hallazgos críticos nuevos en este alcance.

No se aplicaron migraciones ni se modificaron datos remotos durante esta pasada.
El documento `progreso-pdf-evaluacion.md` contiene evidencia histórica de las
migraciones; no se revalidó su estado remoto hoy. El registro del evento y la
actualización de errores siguen siendo operaciones separadas.

CTO: conforme para subir a revisión; no certifica despliegue. QA: LISTO CON
RIESGOS para PR en borrador. Antes de publicar, resolver los fallos de CI y
comprobar con cuenta autenticada la persistencia de práctica, refuerzo y perfil.
Las pruebas visuales previas usan fixtures; no equivalen a un recorrido real.

## Pendientes de release

- Confirmar CI completo, auditoría de dependencias y Lighthouse.
- Confirmar estado remoto de las migraciones y recorrido autenticado con recarga.
- Mantener visible la distinción entre cobertura de evaluación y dominio; no
  todos los temas del ejemplo disponen de preguntas corregibles asociadas.

Este trabajo se prepara para GitHub sin merge ni despliegue a producción.
