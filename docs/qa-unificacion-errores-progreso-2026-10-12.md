# Unificación de acceso al refuerzo

- Mis errores conserva el listado general. Elegir un PDF abre Progreso en su
  primer concepto pendiente, o en uno resuelto si no quedan pendientes.
- Los enlaces antiguos con material o error de PDF redirigen a Progreso.
- La selección inicial solo acepta errores presentes en los datos del usuario y
  material cargados por el servidor. Un identificador desconocido no selecciona
  contenido ajeno. La propiedad del PDF se comprueba en la ruta existente.
- Progreso abre el tema exacto o el grupo de conceptos sin asociación inequívoca,
  enfoca el detalle y permite volver al listado general de Mis errores.
- La guía del primer error de PDF acompaña ese mismo panel y conserva la acción
  existente que registra su finalización o salida.
- Los errores del simulador se agrupan aparte incluso cuando tienen un PDF
  recomendado. Conservan origen, selección y componente de refuerzo existente;
  una recomendación no los convierte en evidencia de progreso del PDF.
- No se modificaron migraciones, permisos ni generación de preguntas.

## Verificación

- ESLint de archivos afectados, TypeScript y diff check: aprobados.
- Build: aprobado; avisos existentes de Edge Runtime y fuente dinámica.
- `flow.smoke.ts`, que importa las nuevas pruebas de navegación: aprobado.
- `pdf-progress.smoke.ts`: aprobado.
- Chrome local, fixture real de PDF con resultados simulados: apertura directa
  en Machine learning, explicación automática, pregunta diferente, acierto,
  devolución y regreso al listado comprobados.
- Móvil 390 × 844: concepto abierto, acción de comprobación visible, sin
  desbordamiento horizontal y foco en el detalle. Viewport restaurado.

QA: LISTO CON RIESGOS para revisión local. Falta verificar las redirecciones, la
guía y su persistencia con sesión autenticada. No se probó una escritura real ni
se hicieron llamadas de IA en esta pasada. No se repitió la suite completa, cuyos
dos fallos preexistentes están documentados en la revisión anterior.

## Cierre para GitHub

- Progreso comparte la forma y el tamaño de las otras pestañas del PDF. Cuando
  hay errores pendientes, se destaca con color y un punto accesible en escritorio
  y móvil; sin pendientes vuelve al estilo normal.
- Verificado en la vista local de escritorio y en 390 × 844, con y sin errores.
- Antes de subir a master: `npm run lint`, `npm run build`, `flow.smoke.ts` y
  `pdf-progress.smoke.ts` aprobados.
- `npm test` se detiene en el fallo previo de `seo.smoke.ts`, que exige el texto
  «Practicar ahora» en la landing de parcial. Esa landing y esa prueba no se
  modifican en este incremento.
- La publicación en GitHub no confirma un despliegue de producción.

## Progreso dentro del espacio del PDF

- La página real del material entrega Progreso como contenido de una pestaña,
  con el mismo encabezado, navegación fija y región deslizable de estudio.
- El panel usa su variante integrada: sin encabezado de archivo ni navegación
  propios, ancho disponible completo y título del tamaño de las otras secciones.
- Las direcciones anteriores de Progreso conservan la comprobación de propiedad
  y redirigen al PDF con `tab=progreso`, el error solicitado y la guía inicial.
- Backend/Security: el contenido se entrega solo cuando `isOwner && user` en el
  servidor; las consultas existentes reciben el ID del usuario autenticado y del
  material autorizado. La selección de error se limita a los registros cargados.
  No se cambia RLS, auth ni se añade un endpoint público.
- CTO: se reutiliza el panel existente mediante un slot de servidor y Suspense.
  Su carga no bloquea el resumen. Al abrir Progreso se refrescan los datos del
  servidor conservando el espacio de estudio; no se añade generación de IA.
- QA: build, ESLint de archivos afectados, pruebas de rutas, flujo y progreso
  aprobados. Desktop y móvil 390 × 844 comprobados en el fixture: cambio entre
  Resumen, Glosario y Progreso, encabezado conservado, región con scroll vertical
  y sin desbordamiento horizontal.
- LISTO CON RIESGOS para revisión local: no se verificó el recorrido autenticado
  con una cuenta real. Este ajuste posterior sigue en local, sin publicar.

## Integración con master — 13 de octubre

- Se incorporaron los siete commits nuevos de master sin reemplazar sus ajustes
  visuales, tracking, pruebas ni actualizaciones de dependencias.
- El contador se refresca al cambiar la apertura de Progreso y al recuperar el
  foco; se conserva la eliminación del refresco en cada pestaña general.
- Lint completo y `npm test` completo aprobados. Los fallos anteriores de SEO y
  guía del primer PDF ya fueron corregidos en los commits recibidos de master.
- Build local aprobado con Next 16.3.7 instalado. El lockfile remoto actualizado
  declara Next 16.3.8; no se reinstalaron dependencias en esta pasada.
- Incremento preparado para subir a master; no se verifica aquí producción.
