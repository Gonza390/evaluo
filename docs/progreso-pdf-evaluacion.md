# Progreso por PDF: respuestas y cobertura

Verificación: 10 de octubre de 2026.

## Alcance

- Registrar respuestas correctas e incorrectas, incluso sin un error previo, con PDF, pregunta, tema, fecha e identificador de intento.
- Corregir opciones contra los artefactos guardados del material en el servidor. Las respuestas abiertas y flashcards son autoevaluaciones separadas.
- Mostrar temas con al menos una pregunta corregida y temas por evaluar. Esta cobertura no representa dominio.
- Conservar respuestas sin asociación inequívoca, sin atribuirlas a un tema arbitrario.
- Reutilizar las comprobaciones de refuerzo existentes. Los errores históricos por sí solos no reconstruyen respuestas que nunca se guardaron.

## Datos y compatibilidad

Migraciones aplicadas: `20261010163637_student_material_answer_events.sql` y `20261010163936_restrict_material_answer_event_mutations.sql`.

Los eventos son la fuente de cobertura; la lista existente de errores mantiene el flujo de refuerzo. El identificador de intento evita duplicar una respuesta ante reintentos. La inserción del evento y la actualización del error anterior no forman una transacción única: un fallo parcial puede dejar temporalmente desactualizada la lista de errores, sin perder la evidencia guardada.

La tabla tiene RLS, lectura del propietario y escritura restringida al servidor. La consulta agregada comprueba propiedad y solo es ejecutable por el rol de servicio. La asociación con temas reutiliza el criterio conservador del resumen.

## Evidencia

- `npm run lint`: aprobado.
- `npx tsc --noEmit`: aprobado.
- `npm run build`: aprobado.
- Pruebas `material-answer-evidence.smoke.ts` y `pdf-progress.smoke.ts`: aprobadas; incluyen primer acierto, errores, autoevaluaciones, corrección canónica y asociaciones ambiguas.
- `supabase/tests/student_material_answer_events.sql`: aprobado; verifica cobertura, idempotencia, propiedad, RLS y permisos. Datos de prueba descartados con rollback.
- Navegador local: filtro Sin evaluar, respuesta de práctica y actualización de cobertura de 5/8 a 6/8 comprobados en `/preview/progreso-pdf`.
- `git diff --check`: aprobado.

La suite completa `npm test` permanece detenida por la aserción SEO preexistente que exige el texto `Practicar ahora` en la landing de parciales. No pertenece a este cambio. La vista local usa resultados simulados; el recorrido completo con una cuenta autenticada no fue verificado en navegador.

## Gates y riesgos

CTO: **APROBADO** para este alcance incremental. Sin cálculo de dominio, migraciones aditivas y compatibilidad con el refuerzo existente.

Security: sin hallazgos nuevos sobre la tabla o la consulta agregada en la revisión de permisos y pruebas de aislamiento. El asesor remoto conserva avisos preexistentes fuera del alcance, entre ellos una vista pública con SECURITY DEFINER y protección de contraseñas filtradas desactivada. Referencias de remediación: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view y https://supabase.com/docs/guides/auth/password-security.

QA: **LISTO CON RIESGOS** para revisión local. Antes de un release: resolver o aceptar explícitamente la prueba SEO preexistente y completar una práctica autenticada real con recarga posterior de Progreso.

## Selección de prácticas y continuidad

La selección ahora distribuye preguntas entre los temas del resumen. Al iniciar cada práctica carga cobertura, dificultades pendientes y hasta las últimas 1000 respuestas corregidas del usuario y PDF, después de verificar sesión y propiedad. La consulta de cobertura sigue considerando todo el historial. Si falla la carga, informa el problema y usa un reparto inicial entre temas disponibles.

Prioridad: temas sin evaluación corregida, dificultades pendientes y temas con menos evidencia. Dentro del tema prefiere preguntas no respondidas cuando existen alternativas. La tanda queda congelada durante el intento. Se conserva el cálculo previo de calificación, incluidos los ejercicios abiertos autoevaluados, y se añade acceso a Progreso al terminar. La calificación del intento no se presenta como porcentaje de comprensión del PDF.

El diagnóstico inicial también reparte preguntas por los temas del resumen; conserva su tamaño de 5 o 6 preguntas y su recorrido guiado. La selección histórica adaptativa corresponde a Práctica. No se añadieron migraciones ni se alteró la extracción o la generación del banco.

Progreso diferencia `Sin evaluar`, `En evaluación`, dificultades por reforzar y evaluación no disponible cuando no hay preguntas corregibles asociadas inequívocamente. No se añadieron puntos, umbrales de dominio ni porcentajes estimados de comprensión. Permite continuar Práctica.

Verificación adicional:

- Build, lint y TypeScript aprobados.
- `topic-practice.smoke.ts`: aprobado. Reparto inicial, continuidad entre sesiones, prioridad de dificultades, preguntas nuevas, autoevaluaciones, ausencia de banco, asociaciones contradictorias y duplicados.
- Pruebas existentes de evidencia, asociación y progreso aprobadas.
- Navegador: primera visita, práctica de 5 preguntas con un error y una autoevaluación, resultado 80%, acceso a Progreso, 2 temas evaluados y 1 por reforzar; continuidad comprobada en escritorio y móvil.
- Consulta remota de permisos: lectura del historial por servidor permitida, inserción autenticada denegada, RLS activa.
- `npm test`: falla en la aserción SEO preexistente descrita arriba. Ejecución aislada de `recommended-study.smoke.ts`: las nuevas pruebas pasan, después falla una aserción preexistente que espera la antigua condición textual de `initialRecommendedStudy`.

Límite del ejemplo local: solo 2 de sus 8 temas tienen preguntas de opción múltiple con asociación inequívoca en el banco preparado. Los otros se identifican explícitamente; hace falta mejorar el banco o la asociación antes de asegurar cobertura completa. El botón `Simular primera visita` elimina el historial simulado, sin afectar cuentas ni datos remotos.

CTO: **APROBADO** para esta iteración; se reutilizan temas, eventos y errores existentes, sin otra fuente de verdad ni cambios de esquema. Security: sin hallazgos nuevos en la acción de lectura revisada; UUID, sesión, propiedad y límites de frecuencia comprobados en código. QA: **LISTO CON RIESGOS** para revisión local; quedan pendientes el recorrido autenticado real, completar bancos con temas sin preguntas y los fallos preexistentes de la suite. No se publicó un release.

### Revisión del recorrido de refuerzo — 11 de octubre de 2026

- Abrir un error desde Progreso inicia la explicación automáticamente. Se reutiliza la conversación de la vista; el servidor conserva su caché y límites. Un fallo no dispara reintentos automáticos: queda disponible «Reintentar explicación» y el acceso al fragmento.
- Explicación → ayuda adicional opcional → pregunta nueva → devolución → volver a Progreso. El acierto se comunica como «Resolviste el refuerzo», sin atribuir dominio del tema.
- Temas sin errores muestran el contenido disponible del resumen; no se inventa una dificultad ni una evaluación. Las preguntas generales siguen accesibles mediante «Continuar mi práctica».
- El foco vuelve al tema al cerrar y pasa al resultado al responder. Los identificadores accesibles son únicos entre escritorio y móvil. Los conceptos mantienen su orden al resolver un error; se oculta el selector cuando hay uno solo.
- QA manual en Chrome: primera visita con 0/8; apertura automática; respuesta incorrecta; regreso conservando ayuda; «Más simple»; acierto y actualización; regreso al listado; tema sin preguntas. Revisión móvil a 390×844 y restauración del tamaño original.
- Build, ESLint de los componentes modificados, `flow.smoke.ts`, `pdf-progress.smoke.ts` y `git diff --check`: aprobados. El build conserva avisos existentes de Edge Runtime y fuente dinámica.
- Alcance: recorrido local con respuestas preparadas. No se verificaron en esta pasada llamadas reales al proveedor, fallos de red inducidos ni una cuenta autenticada. QA: **LISTO CON RIESGOS** para revisión local, no certificación de release.

### Calidad del refuerzo y recuperación posterior — 11 de octubre de 2026

Se revisaron tres casos públicos: sobreajuste, inferencia y fiabilidad de respuestas de modelos de lenguaje. Dos rondas reales con los proveedores configurados produjeron seis explicaciones y cinco comprobaciones aceptadas por el contrato. Una generación no devolvió una comprobación utilizable; se conservó el resultado nulo, sin inventar una pregunta. El JSON `docs/progreso-refuerzo-evaluacion-ia.json` registra la segunda ronda y `scripts/evaluate-study-error-review.mts` permite repetir la evaluación manual.

Revisión pedagógica: las explicaciones identifican la confusión planteada y las preguntas aceptadas cambian el escenario, con cita verificable y una respuesta respaldada por el fragmento. La calidad de los distractores es variable: hubo opciones redundantes y condiciones implícitas en la primera ronda. Se reforzó el prompt para pedir condiciones explícitas, distractores distintos y plausibles, incluyendo la confusión original. En la segunda ronda aún aparece un distractor sobre datos breves/desordenados sin apoyo en el caso: es descartable, pero débil. Esta muestra no certifica todas las generaciones ni demuestra aprendizaje del alumno. No se ejecuta automáticamente ni usa PDFs privados.

La práctica general reserva como máximo una pregunta para un concepto cuyo refuerzo se resolvió hace al menos 24 horas. Reutiliza el banco, sin otra llamada de IA. Exige asociación inequívoca con el mismo tema, respuesta conceptual específica idéntica normalizada y enunciado distinto tanto del error original como de su comprobación inmediata. Excluye preguntas ya respondidas. Una respuesta independiente posterior cierra esa oportunidad; si falla, el registro de errores existente recoge la nueva dificultad. No cuentan diagnóstico guiado, autoevaluaciones ni respuestas inmediatas. Se mantienen tamaño, nota y resto del reparto por temas; no se declara dominio.

Límite deliberado: si el banco carece de otro caso identificable del mismo concepto, no se sustituye por una pregunta cualquiera ni se declara comprobado. No se añadió generación automática para rellenar esos huecos. La consulta recupera hasta 200 comprobaciones correctas y 1000 respuestas recientes; los límites pueden dejar fuera antecedentes antiguos. El intervalo de 24 horas es una regla inicial de producto, no un umbral validado de dominio.

Preview: resolver el primer error de Machine learning y después pulsar «Simular repaso al día siguiente» → elegir 5 preguntas → empezar. Aparece otro caso de sobreajuste dentro de la práctica. Solo el preview incorpora ese caso preparado y adelanta el tiempo de los refuerzos; no modifica cuentas ni el banco real. Se comprobó este recorrido en Chrome.

Verificación: build aprobado; ESLint de los archivos afectados aprobado; `topic-practice.smoke.ts` y `flow.smoke.ts` aprobados; `git diff --check` aprobado. Las pruebas cubren el intervalo, preguntas repetidas, conceptos/temas diferentes, falta de banco, intento posterior, exclusión del diagnóstico, tamaño de la tanda y fallo del historial. Se conservan los avisos previos del build y los fallos preexistentes de la suite completa descritos arriba.

CTO: revisión local conforme para este incremento, sin esquema ni otra fuente de verdad. Security: consulta con sesión, propiedad, UUID, rate limit y filtros de usuario/material antes del cliente privilegiado; el contenido de IA sigue aislado y validado. Sin nuevas escrituras ni accesos públicos. QA: listo para revisión local; falta verificar el flujo con una cuenta autenticada real y ampliar la muestra pedagógica. No se publicó un release.
