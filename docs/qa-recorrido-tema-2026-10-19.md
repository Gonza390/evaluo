# Recorrido por tema — verificación local

## Alcance

- Componentes reales del material: contenido existente, apoyos plegables, acceso al PDF y comprobación al final de la lectura.
- Práctica por tema con regreso al mismo tema o a sus dificultades pendientes.
- Cierre del refuerzo dentro del tema, con conteos limitados a ese tema.
- El tutorial general del primer error y la invitación a cargar fecha de examen no interrumpen la práctica iniciada desde un tema.
- Sin cambios de esquema, generación de contenido, proveedores ni reglas de evaluación.

## Verificación

- `npm test`: aprobado.
- `tests/topic-study-resources.smoke.ts`: aprobado; asociaciones conservadoras, contradicciones y ambigüedad.
- TypeScript y ESLint de los seis componentes modificados: aprobados.
- `git diff --check`: aprobado.
- `next build --webpack`: aprobado. Avisos existentes de Edge Runtime y fuente dinámica de imagen (HTTP 400).
- El build por defecto con Turbopack falló al iniciar un proceso de transformación CSS. Webpack se usó como comprobación alternativa, sin cambiar la configuración del proyecto.

## Recorrido en navegador

URL: `/preview/progreso-pdf?tab=progreso&nuevo=1`.

- Tema 2, Machine learning: lectura → pregunta incorrecta → resultado → refuerzo del mismo tema → explicación → pregunta de comprobación diferente → acierto → contenido del mismo tema.
- Tema 6, Ciberseguridad: lectura → práctica → acierto → resultado sin porcentaje de dominio → regreso al tema → evidencia registrada en la simulación.
- Tema 1: contenido accesible sin preguntas autocorregibles asociadas; aviso explícito y sin evaluación ficticia.
- Vista de escritorio, tablet y móvil; ancho de documento igual al viewport en mediciones a 853, 433 y 355 píxeles CSS. Override restaurado al terminar.
- La consola del Chrome del usuario muestra un aviso de hidratación por atributos `bis_skin_checked` y `bis_register` inyectados por una extensión. No se modificó la aplicación para ocultarlo.

## Límites

- El preview usa un PDF público y resultados locales en memoria. No escribe progreso ni consume IA.
- Los refuerzos de Deep learning y Ciberseguridad usan ejemplos y comprobaciones fijas de muestra. El resto reutiliza la pregunta original y lo indica expresamente.
- La explicación reutiliza el resumen existente: no se amplió ni se certificó la calidad pedagógica de todos los temas.
- No se verificaron en navegador el guardado remoto, el tutorial de primer error ni las respuestas de IA en una cuenta autenticada. La integración real conserva las actions existentes.
- Cambios locales; sin publicación a GitHub ni despliegue en esta tarea.

## Ajuste de guía de estudio por tema

- Cada tema presenta tres pasos: resumen abierto, definiciones del glosario visibles y elección de cómo continuar.
- Las flashcards conservan su carácter opcional y plegable.
- Se verificó en navegador el paso del tema 1 al 2 sin práctica, conservando el estado «Sin evaluar»; la práctica del tema 2 y su regreso al contenido; y el cierre del tema 8 sin proponer un tema 9.
- TypeScript, ESLint de los dos componentes ajustados, pruebas de recursos por tema y `recommended-study.smoke.ts`: aprobados.
- En viewport móvil se verificó ancho de documento igual al viewport (355 píxeles CSS). La captura de pantalla falló por timeout del navegador; no se confirma una nueva inspección visual por imagen de este ajuste. Se restauró el override.
- No se repitió el build completo para este último ajuste de presentación y navegación local.

## Prueba local con Marketing I

- URL: `/preview/progreso-pdf/marketing` (solo `next dev`).
- Fuente seleccionada por el usuario: PDF de Marketing I, 29 páginas y 16 lecturas.
- El archivo ya contiene un resumen; se extrajeron sus lecturas completas y se normalizaron saltos de línea. No se ejecutó el pipeline de IA ni se presenta esta preparación manual como una generación real del producto.
- 78 conceptos y tarjetas, 48 preguntas fijas de reconocimiento (3 por lectura). Comprobación con los selectores existentes: todos los temas tienen recursos asociados y las citas de las tarjetas coinciden con la página física indicada.
- El preview reutiliza el componente real, con nombre, documento y cantidad de páginas configurables. Se desactivaron los ejemplos de IA del fixture anterior para este material.
- Navegador: tema 1 → tema 2, práctica específica de enfoques de marketing y regreso al tema; visor del PDF con título correspondiente al original.
- TypeScript, ESLint de archivos modificados, `recommended-study.smoke.ts` y verificación del fixture: aprobados.
- Revisión de seguridad: archivo y fixture en `tmp/`, ignorados por Git; rutas con guardia `NODE_ENV === development`; ruta de PDF fija, sin entrada de paths, caché `private, no-store` y exclusión de indexación. Sin cambios de auth, Supabase ni proveedores. No se realizó una prueba de ejecución de estas rutas en producción ni un nuevo build completo.
- Las preguntas de reconocimiento no prueban dominio conceptual. El refuerzo genérico del fixture reutiliza el ítem original y lo identifica como muestra.

## Validación final para publicar en main

- `origin/main` actualizado antes de publicar: sin divergencia con el HEAD local de partida (`38e9f42`).
- Suite completa `npm test`, `npm run lint`, TypeScript dentro del build y `git diff --check`: aprobados.
- Build final con `next build --webpack`: aprobado (84 páginas generadas). Se mantienen los avisos existentes de Edge Runtime y fuente dinámica HTTP 400; no se cambió el bundler del proyecto.
- Prueba directa del handler del PDF bajo `NODE_ENV=production`: devuelve 404. El PDF y el JSON de Marketing continúan ignorados por Git.
- Security: sin hallazgos críticos en este diff; no se agregaron entradas de rutas arbitrarias ni archivos del usuario al repositorio.
- Gate técnico: APROBADO para publicar el código. Sin migraciones, dependencias ni cambios de proveedores; rollback mediante revert del commit.
- QA: LISTO CON RIESGOS. El flujo autenticado con escritura remota y respuestas de IA no se probó desde una cuenta real. El CI de GitHub y el despliegue se verifican por separado; este documento no los da por aprobados.
