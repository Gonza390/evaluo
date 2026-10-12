# Prueba del recorrido del estudiante — 11 de octubre de 2026

Resultado: **NO LISTO para dar por validado el recorrido completo**. Los recorridos sin interrupción funcionan, pero cambiar de herramienta interrumpe sesiones y el preview no permite reforzar errores recién creados. No se modificó código de producto durante esta revisión.

## Alcance y entorno

Chrome, `http://localhost:3000/preview/progreso-pdf`, PDF público real de 15 páginas, contenido preparado y resultados simulados. Revisión de escritorio y móvil a 390×844; tamaño original restaurado. Sin cuenta autenticada ni escrituras de progreso remoto. La extracción/subida, el diagnóstico inicial y las comprobaciones durante la lectura no están habilitados en este preview; **no se consideran probados en navegador**. Las llamadas reales de IA corresponden a la revisión anterior, no a esta ejecución.

## Recorridos ejecutados

| Etapa | Acción y resultado observado |
| --- | --- |
| Primera visita | Reinicio sin historial: 0/8 temas evaluados, sin errores ni refuerzos ficticios. |
| Resumen | Índice → capítulo 2; el ancla cambia y se accede al contenido. Lectura no incrementa evaluación. |
| PDF | Mostrar PDF carga el documento de 15 páginas junto al resumen; ocultarlo devuelve el espacio de estudio. |
| Flashcards y saltos | Revelar tarjeta, marcar «Lo sabía», revelar otra y marcar «No lo sabía», ir a Progreso: sigue 0/8. Volver a Flashcards reinicia la tanda. |
| Glosario y mapa | Ambos muestran su contenido y permiten regresar a otras herramientas. El mapa de este preview es una representación simplificada. |
| Práctica interrumpida | Tanda de 5: responder mal Deep learning, avanzar, abrir Resumen y volver a Práctica. Regresa al selector de cantidad; pierde la sesión en curso. El evento ya respondido sigue en Progreso. |
| Práctica completa | Nueva tanda de 5: tres opciones múltiples correctas, una incorrecta y una respuesta abierta marcada «La tenía». Resultado 80%, 4/5, acceso a Progreso. |
| Cobertura | Progreso pasa a 2/8 temas evaluados, 1 tema para reforzar. Los otros 6 no se convierten en errores. La respuesta sin asociación se informa fuera de cobertura. |
| Error recién creado | Abrir Deep learning desde Progreso muestra «No encontramos este ejemplo»; no permite completar el refuerzo en este preview. |
| Flashcards completas | 12 tarjetas alternando conocidas/desconocidas: cierre 6 y 6. «Repasar ahora» ofrece exactamente las 6 difíciles. |
| Refuerzo preparado | Reiniciar datos de ejemplo → abrir sobreajuste → explicación automática → fuente con cita y enlace a pág. 3 → comprobación incorrecta → sigue pendiente → volver a explicación → pedir «Más simple» → comprobar y acertar → «Resolviste el refuerzo» → volver a Progreso. |
| Temas sin banco | En móvil, filtrar Sin evaluar y abrir Robótica muestra resumen y aviso explícito de falta de preguntas, sin atribuir una dificultad al alumno. |
| Recuperación posterior | Después de resolver sobreajuste, simular día siguiente e iniciar 5 preguntas: aparece otro caso de ventas del mismo concepto, sin explicación previa. Comprobado en móvil. |

## Hallazgos y prioridades

1. **Alta — continuidad de sesiones.** Cambiar de pestaña desmonta flashcards/práctica. Reproducción observada en el preview; en el workspace real el contenedor además utiliza `key={activeTab}`. Flashcards conserva clasificaciones históricas fuera del demo, pero no posición ni sesión actual; eso no equivale a continuar la tanda. Una consulta al resumen no debería borrar el intento sin avisar. El cambio entre escritorio y móvil también reinició la sesión durante esta prueba.
2. **Media — simulación incompleta de errores nuevos.** `byId` solo resuelve los ejemplos iniciales; los errores `preview-practice:*` creados al practicar quedan sin explicación, fuente o comprobación preparada. Es un límite del preview, no evidencia de fallo del servicio real. Impide validar el recorrido entero con un alumno nuevo en esta vista.
3. **Media — coherencia de temas y calidad del banco de ejemplo.** El cierre de flashcards incluye etiquetas como «MATERIAL DE ESTUDIO IA Y NUEVAS TECNOLOGIAS…» y subtítulos distintos de los 8 temas del resumen. Solo 2/8 temas tienen preguntas corregibles asociadas. Hay opciones incorrectas de materias conceptualmente lejanas que facilitan el descarte. No se puede asegurar cobertura ni calidad uniforme a partir de este banco.
4. **Baja — lenguaje del resultado.** «4 de 5 respuestas consolidadas» incluye una respuesta abierta autoevaluada. Se respeta la nota existente, pero «consolidadas» puede sugerir una comprobación independiente que no ocurrió. Conviene explicitar la autoevaluación sin cambiar la nota.

## Verificaciones de código ejecutadas

Todos aprobados con `node --import ./tests/alias-loader.mjs --experimental-strip-types <archivo>`:

- `tests/material-answer-evidence.smoke.ts`: corrección y separación entre respuesta evaluada y autoevaluación.
- `tests/topic-practice.smoke.ts`: reparto, continuidad histórica y recuperación posterior conservadora.
- `tests/summary-topic-association.smoke.ts`: asociación de preguntas con temas del resumen.
- `tests/pdf-progress.smoke.ts`: estados y cobertura.
- `tests/flow.smoke.ts`: contratos y reglas de refuerzo, incluido el prompt.

No se repitieron build/lint porque esta pasada no modifica código de producto; ambos aprobaron en la iteración anterior. La suite completa conserva los fallos preexistentes documentados en `progreso-pdf-evaluacion.md`; no se declara aprobada. No se probaron persistencia autenticada, reanudación tras cerrar el navegador, errores de red inducidos, todos los PDFs, generación de cada recurso ni comprobaciones emergentes durante la lectura.

## Recomendación

La secuencia pedagógica está mejor definida. Antes de cerrar la validación, preservar las sesiones al cambiar de herramienta y completar las respuestas preparadas del preview para errores nuevos; después repetir el recorrido con una cuenta real. A continuación, alinear todos los artefactos con los temas canónicos y mejorar cobertura/distractores. Esta revisión no certifica eficacia pedagógica ni readiness de release.

## Corrección de continuidad entre pestañas

Se corrigió el primer hallazgo para el cambio de herramientas en `MaterialStudyWorkspace`: clave estable por PDF y conservación de los paneles de Práctica y Flashcards mediante `Activity` de React 19.2.5 y `forceMount` de Tabs. Las herramientas ocultas pausan efectos y atajos; no se añadieron llamadas de IA, almacenamiento ni dependencias. Referencia: https://react.dev/reference/react/Activity.

Verificación posterior en Chrome:

- Flashcards: responder tarjeta 1, revelar tarjeta 2, consultar Resumen y volver conserva tarjeta 2, respuesta revelada y avance 8%.
- Pulsar flecha abajo en el resumen no responde ni avanza la flashcard oculta.
- Práctica: acertar pregunta 1, elegir una opción en la 2 sin corregir, consultar Resumen y volver conserva pregunta 2 y selección.
- Escribir respuesta abierta en pregunta 4, visitar Resumen y Flashcards, regresar conserva el borrador exacto y la pregunta 4.
- Completar la tanda después de esos cambios devuelve 100%, 5/5; ir a Progreso y regresar mantiene el resultado. Reiniciar exige usar el control existente del intento.
- Móvil 390×844: responder tarjeta 1, consultar Resumen y volver mantiene tarjeta 2 y avance 8%. Tamaño restaurado al terminar.
- Build, ESLint del workspace, `flow.smoke.ts`, `topic-practice.smoke.ts` y `git diff --check` aprobados. Build conserva los avisos previos de Edge Runtime y fuente dinámica.

Alcance: conservación durante cambios de pestaña dentro del PDF abierto. No es persistencia tras recargar/cerrar la página ni sincronización de las sesiones separadas de las vistas móvil/escritorio. Los demás hallazgos del informe, incluido el refuerzo de errores nuevos en el preview, siguen pendientes. No se verificó cuenta autenticada ni se publicó release. QA: **LISTO CON RIESGOS** para revisar este arreglo local; el recorrido completo sigue sin certificación de release.

## Simplificación visual de Progreso

Se compactó el recuento de errores resueltos dentro del recorrido (oculto cuando es cero), se trasladó la definición de evaluación a un desplegable accesible y se retiraron instrucciones, encabezado y acción general de práctica duplicados. Se mantienen el encabezado accesible del detalle, la explicación, la fuente opcional y la comprobación.

Validado en Chrome con resultados preparados y primera visita: 5/8 con dos errores resueltos en una línea; 0/8 sin tarjeta de mejoras vacía y con una acción principal «Empezar práctica». El refuerzo preparado conserva explicación, fuente y comprobación. Vista móvil 390×844 revisada y tamaño restaurado. ESLint del panel, `pdf-progress.smoke.ts`, `flow.smoke.ts`, build y `git diff --check` aprobados; se mantienen los avisos previos del build. Sin cambios de IA, datos ni autenticación; no se verificó cuenta real ni se desplegó.

## Tamaños compactos del espacio de PDF

Escala aplicada a los componentes compartidos del material: título del resumen 22–24 px, títulos de capítulo 18 px, cuerpo 14 px/24 px, filas de glosario con menos separación, preguntas 16–18 px y tarjetas de práctica más compactas. Flashcards reales con altura mínima de 220/260 px y caras en una misma celda de grid para crecer con contenido largo; preview conserva su modo preparado. Mapa y títulos de diálogos de lectura también compactados. No cambia contenido, evaluación, llamadas de IA ni persistencia.

Verificación visual en preview local con PDF público: Resumen, Glosario, Flashcards (pregunta/respuesta), inicio y pregunta de Práctica, y Mapa mental; respuesta de flashcard móvil 390×844 legible y con controles disponibles. Vista restaurada. No se verificó sesión autenticada ni fullscreen de flashcards. ESLint de los componentes, flow.smoke.ts y compilación verificados. Se mantienen los hallazgos previos de cobertura y persistencia sin certificar release.

## Coherencia visual del espacio de PDF

Estilos compartidos en `components/study/pdf-study-styles.ts`: pestañas (únicamente la activa destacada), controles de Button sin sombras grandes y acciones nativas del refuerzo con la misma escala. Se eliminaron el destaque permanente de Práctica y los gradientes decorativos de flashcards/mapa. Bordes, superficies, texto y azul usan tokens; errores usan destructive y aciertos verde, incluidos la comparación anterior y el chequeo de refuerzo. Se conservan etiquetas/iconos y estados disabled/focus. Componentes compartidos aplican a materiales reales y preview; fullscreen de flashcards también recibe los estilos de controles, sin cambiar el componente global Button.

Verificación en Chrome: selección de pestañas, inicio de práctica, respuesta incorrecta/correcta indicada con color e icono, apertura del refuerzo y flashcard revelada en móvil 390×844. Captura final del resumen y viewport restaurado. ESLint, flow.smoke.ts y build aprobados; avisos previos de Edge Runtime/fuente dinámica. La primera compilación detectó una exportación de botones consumida por la pantalla de errores; se conservó la exportación y se recompiló correctamente. No se desplegó ni se verificó cuenta autenticada. Cambios de presentación, sin nuevas peticiones de IA ni dependencias.

## Revisión responsive posterior: escritorio y móvil

Recorrido local en Chrome a 1440×900 y 360×800 por Resumen, Glosario, Flashcards, Práctica, Mapa y Progreso. Se revisaron distribución, lectura, selección de pestañas, acceso a acciones y desplazamiento. DOM sin desborde horizontal de página: ancho 1440/1440 en escritorio y 360/360 en móvil; glosario/mapa móvil panel 323/323 y Progreso 307/307. Flashcards avanzan de 1 a 2; práctica móvil permite corregir y avanzar; refuerzo preparado permite seleccionar respuesta, confirmar y mostrar resolución con actualización de progreso simulado.

Se detectó y corrigió un salto del índice móvil a un capítulo de la vista responsive oculta: los enlaces ahora buscan el capítulo dentro del tabpanel que recibió el clic. Repetido en móvil (capítulo 2 visible) y escritorio (capítulo 2 dentro del área de lectura). No se reescribió el sistema de IDs duplicados; esta corrección acota la navegación del índice, sin certificar otras referencias por ID. ESLint del workspace, flow.smoke.ts, build y diff-check aprobados. Se restauró el viewport. No se probó dispositivo físico, teclado virtual, cuenta autenticada ni llamadas reales de IA; resultados preparados sin guardar en cuenta. QA visual local: LISTO CON RIESGOS por esas limitaciones, no certifica release.
