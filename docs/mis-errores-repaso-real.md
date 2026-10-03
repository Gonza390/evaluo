# Repaso real por PDF en Mis errores

La ruta autenticada `/dashboard/explicaciones` implementa el ciclo del preview:
elegir PDF → entender el error → consultar la fuente → responder una pregunta
nueva → resolver o volver a repasar. `/preview/mis-errores` sigue siendo una muestra
y no modifica el progreso.

## Comportamiento

- El selector muestra PDFs propios procesados, temas y cantidades pendientes/resueltas.
- El detalle identifica Flashcards, Práctica, Diagnóstico o Preguntero. En celular la
  lista se abre con **Cambiar error**.
- **Ayudame a entenderlo**, **Más simple** y **Dame un ejemplo** usan el fragmento
  del PDF. Las respuestas se guardan por error, revisión, fuente y tipo de ayuda.
- **Ver fragmento** despliega una única referencia dentro del repaso. Leerlo también
  habilita la comprobación, sin obligar a consumir una explicación de IA.
- La pregunta nueva tiene tres opciones y una cita verificable en la fuente.
  Si falta evidencia, no se inventa una pregunta ni se cierra el error.
- Corregir y cambiar el estado es una transacción en el servidor. Un fallo mantiene
  el error pendiente y exige volver al repaso; un acierto actualiza los contadores.
- Un error sin PDF puede asociarse a un material propio si contiene evidencia útil.
  La asociación se conserva; el PDF original de una actividad no se reemplaza.

## Límites y coste

Free conserva el límite de 5 ayudas nuevas cada 3 horas. Las comprobaciones tienen
un límite independiente de 5 cada 3 horas: pedir un ejemplo no consume la oportunidad
de comprobar. Premium mantiene el acceso existente. Todas las generaciones tienen
un límite de ráfaga de 6 por minuto. Las ayudas guardadas y las comprobaciones abiertas
se reutilizan sin otra generación; leer la fuente y confirmar respuestas no consume IA.

Una ayuda usa hasta 600 tokens de salida (400 para variantes); una comprobación
hasta 650 por proveedor. Las respuestas cortadas se rechazan y no se guardan como ayuda.
Se reutilizan Groq, NVIDIA y Gemini con los fallbacks existentes y contexto acotado.
Son topes por llamada, no una medición del coste total. La validación comprueba formato,
opciones distintas y cita presente; la calidad semántica de una pregunta generada
requiere seguir evaluándose con uso real.

## Datos y seguridad

Migraciones aplicadas y alineadas con Supabase:

- `20261003124130_study_error_pdf_review.sql`.
- `20261003130906_study_error_review_stale_replay.sql`.

Las tablas de ayudas y comprobaciones tienen RLS y acceso exclusivo de `service_role`.
El navegador no puede consultar las respuestas correctas ni invocar directamente la RPC.
Las acciones autentican al usuario y verifican propiedad del error y del PDF.
La corrección no llega al cliente antes de responder. Un acierto antiguo no puede
presentar como resuelto un concepto que volvió a quedar pendiente.

Las migraciones son aditivas: volver a la versión anterior de la aplicación no requiere
borrar tablas ni progreso. Eventos nuevos: `study_error_check_started` y
`study_error_check_answered`, además de los eventos existentes de repaso y resolución.
No se registran en estos eventos los textos del PDF, preguntas ni credenciales.

## Verificación del 3 de octubre de 2026

- `npm test`: las 15 suites pasan.
- ESLint del repositorio, excluyendo artefactos locales: 0 errores y 4 advertencias
  preexistentes fuera del cambio. ESLint de los archivos modificados: correcto.
- `npx tsc --noEmit`: correcto, incluidos los ajustes finales de texto.
- `npm run build`: compilación y generación de las 78 páginas correctas.
- Presupuesto de rendimiento sobre la compilación aislada: las 8 rutas pasan.
- Prueba SQL dentro de BEGIN/ROLLBACK: propiedad, índice inválido, repaso obligatorio,
  acierto, fallo, repetición y revisión antigua pasan. No altera filas de estudiantes.
- Cuenta desechable con PDF privado: explicación generada, cita, pregunta nueva,
  acierto persistido, fallo y vuelta a la ayuda, límite Free y comprobación independiente.
- Escritorio y anchos móviles de 390 y 320 px, con comprobación de ancho del documento;
  se verifica también la lista plegable y la asociación de un PDF propio.

`npm audit --omit=dev --audit-level=high`: 0 vulnerabilidades. La auditoría completa
reporta el aviso previo de `braces` a través de las herramientas de ESLint, sin versión
corregida publicada en el aviso. No se aplica `audit fix --force`, que propone retroceder
Next/ESLint. El paso de auditoría de CI seguirá fallando hasta resolver ese riesgo.
Referencia: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm

Security: sin hallazgos críticos nuevos en el flujo revisado; el aviso de herramientas
queda pendiente. QA: **LISTO CON RIESGOS**. CTO: **APROBADO CON CAMBIOS** aplicados
(corrección atómica, revisión de intentos antiguos, cuotas separadas y fuente verificada).
La validación no equivale a demostrar una mejora en retención ni a evaluar todas las
materias; eso requiere medir el uso y auditar muestras de preguntas reales.

## Cómo probarlo con una cuenta propia

1. Iniciar sesión y abrir un PDF procesado.
2. Equivocarse en una Flashcard, Práctica o Diagnóstico para tener un error real.
3. Abrir **Mis errores**, elegir ese PDF y tocar **Ayudame a entenderlo**.
4. Probar las variantes de ayuda y desplegar **Ver fragmento**.
5. Tocar **Responder una pregunta** y confirmar una opción.
6. Comprobar el resultado en Pendientes/Resueltos, recargar y verificar que se conserva.

Los errores previos también aparecen. Para una pregunta del Preguntero sin PDF,
asociar primero apuntes que contengan el concepto. Si no hay evidencia, la interfaz
conserva el error y ofrece continuar estudiando el material original.
