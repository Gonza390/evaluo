# Landing basada en el HTML de referencia

## Alcance autorizado

- Reproducir el diseño y contenido del HTML enviado por el usuario.
- Cambiar la acción principal a «Subir mis apuntes» usando el selector existente.
- Mantener FooterHome completo y sus enlaces, sin editar ese componente.
- Conservar los placeholders de logos, testimonios y precio: el usuario pidió
  explícitamente dejarlos como en la maqueta y enviar los datos más adelante.

## Implementación

Página y contenido principal renderizados en servidor. Se extrajeron las cuatro
ilustraciones y la fuente local del archivo original; se conserva su licencia.
El runtime empaquetado, scripts y dependencias del HTML no se incorporaron.
Los estilos se limitan al contenido de la nueva landing, sin afectar al footer.
La demo usa respuestas preparadas; los ejemplos no registran progreso ni llaman
a IA. Las FAQs usan details/summary y sus respuestas coinciden con el JSON-LD.
Se conservan metadatos, canonical, Organization, WebSite y tracking de portada.

## Verificación

- Lint completo, npm test completo y npm run build: aprobados.
- HTML inicial: HTTP 200, un H1, contenido principal presente y ningún enlace
  perdido del footer original. Se conservan #producto, #como-funciona y #faq.
- Escritorio: ilustraciones cargadas, CTA principal y navegación funcionales.
- Móvil 320, 360 y 390 px: sin desbordamiento horizontal ni elementos de contenido
  cortados fuera del viewport; override temporal restaurado al finalizar.
- Demo: abrir apunte, probar una pregunta nueva, responder Posicionamiento y
  recibir devolución correcta; FAQ desplegable comprobada.
- CTA: selector de un solo archivo abierto. No se seleccionó ni subió un PDF;
  la persistencia y el login posterior conservan su implementación existente.
- Capturas de escritorio y móvil guardadas en el directorio de visualizaciones.
- Chrome tiene una extensión que añade atributos bis_skin_checked antes de la
  hidratación y genera un aviso. El diff del navegador atribuye el aviso a esos
  atributos externos; no se modificó la política de hidratación de la aplicación.
- Build local con Next 16.3.7; lockfile declara 16.3.8. Avisos existentes de Edge
  Runtime y descarga dinámica de fuente; verificación de claves IA omitida por
  el script existente.

## Revisión técnica

Security: se reutiliza el picker y sus validaciones, sin nuevos endpoints,
permisos, dependencias ni dominios externos. Los datos del HTML no se ejecutan
como scripts ni se insertan con dangerouslySetInnerHTML.

CTO: aprobado para revisión local. Mayoría de contenido estático de servidor;
solo selector y demo requieren estado cliente. Footer, rutas de producto y
límites de acceso conservados.

QA: LISTO CON RIESGOS para revisar en local. Pendientes de contenido explícitos:
logos, testimonios, precio y confirmación de las promesas de producto de la
maqueta (porcentajes de preparación y planificación). No se publica producción
ni se hace push en esta pasada.

## Personajes SVG entregados por el usuario

La landing usa Lupa (portada), Pensando (demo), Estudiando (plan) y Festejando
(cierre). Se reemplazaron sus PNG por los SVG originales en public/evi, servidos
directamente mediante Image unoptimized. Los diez personajes recibidos quedan
disponibles en ese directorio; no se cambia el favicon ni el avatar global.

Los SVG son vectores sin raster embebido, scripts, foreignObject, manejadores
de eventos ni referencias externas. Los cuatro recursos cargaron correctamente
en el navegador. Tamaño original conjunto: 209.932 bytes PNG; SVG: 9.131 bytes.
ESLint del componente y git diff check aprobados. Captura: landing-evi-svg.png.

## Pasada responsive y funcional completa

Alcance: landing pública en localhost:3000, con emulación de viewport en Chrome.
No equivale a pruebas físicas en iOS/Safari o Android.

- Tamaños recorridos: 320×568, 360×800, 390×844, 430×932, 768×1024,
  820×1180, 1024×768, 1280×800, 1440×900, 1920×1080 y 844×390.
  Sin desbordamiento horizontal del documento ni acciones cortadas.
- Corregida la cabecera de tablet: logo y acceso en la primera fila,
  navegación centrada en la segunda. Hero en una columna entre 701 y 1023 px,
  con ilustración de ejemplo limitada a 600 px para evitar columnas estrechas.
- Las siete FAQs abren con clic y cierran con Enter. El área completa de cada
  cabecera ahora es pulsable, con altura mínima de 58 px.
- Demo comprobada en 320 px: abrir fragmento, reintentar, responder incorrecto
  y correcto. El foco pasa a la pregunta y después a la devolución, permitiendo
  continuar con Tab sin perder la posición. aria-controls conserva su destino.
- Las cuatro anclas de navegación llegan a su sección. Iniciar sesión y crear
  cuenta llegan al login local sin autenticar ni crear cuentas. Footer: 18 enlaces,
  componente original sin modificaciones. Placeholders conservados por pedido.
- Lint de los componentes modificados, git diff --check y npm test completo
  aprobados después de las correcciones responsive y de foco. El build completo
  aprobado arriba corresponde a la implementación de la landing previa a estos
  ajustes locales de CSS y foco, no se presenta como una nueva ejecución.
- Capturas: landing-movil-revisada.png y landing-escritorio-revisada.png, en el
  directorio de visualizaciones. La captura de tablet falló por timeout del navegador;
  sus dimensiones y distribución sí se comprobaron mediante el DOM renderizado.
- Se restauró el viewport normal al terminar.

Limitación: el navegador rechazó la selección de archivo por falta de permiso.
No se reintentó mediante otros mecanismos; no se cargó un PDF ni se verificó
la persistencia posterior o el login con cuenta real. El selector se había abierto
correctamente en la pasada anterior, sin seleccionar un archivo.

Resultado: LISTO CON RIESGOS para revisión local, con los pendientes de contenido
y verificación de carga/autenticación indicados. Sin push ni despliegue.

## Comparación adicional con el HTML original

- Corregido el centrado de Evi en el cierre: Tailwind convierte img en bloque,
  por lo que text-align del contenedor no bastaba; ahora usa margin-inline auto.
- Los contenedores principales están centrados en escritorio y 390 px, con
  diferencias menores de 1 px atribuibles al redondeo del navegador.
- Detectada interferencia de los estilos globales de párrafos: suprimían los
  márgenes originales en planes y forzaban altura de línea y color. La landing
  ahora declara su tamaño base de 16 px, hereda color/altura de línea localmente
  y recupera márgenes de 1 em donde el original dependía del estilo del navegador.
  Los márgenes explícitos y los estilos de FAQ se mantienen.
- El texto sobre el fondo azul recupera el color claro; las tarjetas blancas
  declaran texto oscuro para conservar contraste, incluida la demo.
- No se encontraron otras imágenes que debieran centrarse: Lupa y Pensando
  usan posición absoluta, Estudiando está a la izquierda también en el original.
- Comprobados estilos calculados y ausencia de desbordamiento en escritorio y
  móvil. Prettier y git diff --check aprobados. Footer sin modificar.

## Preguntas frecuentes completadas

Nueve preguntas sobre inicio con PDF, diferencia frente a un resumen, uso del
material propio, Progreso, refuerzo de errores, fecha de examen, acceso gratis,
Premium y renovación/cancelación. Copy basado en funciones y límites presentes
en el repositorio; no promete nota, aprobación ni planificación adaptativa.

Comprobados: apertura y cierre con teclado de las nueve preguntas, coincidencia
exacta entre respuestas renderizadas y FAQPage, lectura en 390 px sin overflow
y altura táctil mínima de 58 px. ESLint, text-quality.smoke, seo.smoke y
git diff --check aprobados. Captura: landing-faqs-completas.png.

## Planes Gratis y Premium

Reemplazados los placeholders de planes por los cupos reales de PDF y beneficios
actuales. Gratis enlaza al registro con continuidad a la carga; Premium enlaza a
/pricing?source=home_planes#elegir-plan, con tracking existente en ambos enlaces.
No se duplican precios mensuales en la portada: contratación los resuelve desde
la configuración activa. No cambia el checkout ni se inicia ningún pago.

Lint, flow.smoke, text-quality.smoke y git diff --check aprobados. Navegación
desde Premium a la página de precios comprobada. En 390 px, ambas tarjetas
quedan dentro del viewport y los enlaces superan 44 px de altura. El navegador
se desconectó durante la comprobación de Gratis; no se presenta como un login
completado ni se pudo guardar una nueva captura final de esta sección.

## Auditoría completa de enlaces de la nueva landing

- Inventario del HTML local: 28 enlaces, sin href vacío ni href="#".
- Todos los destinos internos devolvieron HTTP 200, incluidos login, registro,
  pricing, las páginas informativas, el blog y los documentos legales. Todas
  las anclas tienen un id de destino; elegir-plan existe en pricing.
- Comprobación en Chrome: login y registro muestran el acceso local, Premium
  llega a pricing con su source y hash, y el enlace del footer cambia a #faq.
  El registro normaliza /dashboard/materiales?openUpload=1 a
  /dashboard?openUpload=1&reason=prepare-material mediante la ruta existente.
- Demo: Ver en mi apunte muestra el fragmento; Probar de nuevo permite responder
  y recibir una devolución correcta. Las ocho FAQs abren y cierran con Enter.
- Tres botones de PDF conectados al picker existente. No se seleccionan archivos
  por la denegación de permiso previa; no se verifica nuevamente la carga real,
  el retorno después de Google ni una compra.
- Instagram abre evaluo.app y LinkedIn resuelve la página Evaluo (la sesión del
  navegador redirige al panel de administración de esa misma página). La consulta
  web automática no pudo leer esas redes; se verificaron en el navegador.

No se encontraron enlaces rotos que requieran cambios de código en esta pasada.

## Logo de Evaluo y carrusel de universidades — 17 de octubre

- Icono del encabezado reemplazado por el SVG entregado por el usuario,
  localizado en Downloads/evaluo-claude/logo/evaluo-logo-icono.svg. Original
  copiado a public/evaluo-logo-icono.svg; sin cambios al favicon ni al footer.
- Siete universidades confirmadas: Siglo 21, UBA, UNTREF, Católica de Córdoba,
  UTN, Columbia del Paraguay y UNAL de Colombia. Cada logo abre su sitio oficial
  en otra pestaña con noopener/noreferrer, según la respuesta del usuario.
- Archivos locales originales, con fuentes y licencias en
  public/universidades/creditos.txt. SVG revisados sin scripts, foreignObject,
  manejadores de eventos, recursos embebidos ni enlaces externos activos.
- Carrusel con scroll nativo y snap: avanza cada 3,6 segundos mientras está
  visible. Invierte el sentido al llegar al extremo, sin duplicar enlaces.
  Se pausa con hover, foco, interacción táctil, pestaña oculta o control explícito.
  Con reducir movimiento no inicia reproducción automática y conserva flechas.
- Comprobación Chrome: ocho imágenes cargadas (marca y siete universidades),
  avance manual, reanudación y avance automático de 208 a 328 px; emulación de
  reducir movimiento elimina el control automático. Se restauró la emulación.
- En 320 y 390 px no hay overflow horizontal del documento. Los controles miden
  44×44 px. El viewport temporal se restauró. Capturas:
  landing-universidades-carrusel.png y landing-logo-evaluo.png.
- ESLint de ambos TSX, Prettier, npm test completo y npm run build aprobados.
  Build conserva avisos existentes de Edge Runtime y fuente dinámica; el script
  de claves IA se omite por su configuración existente. Sin push ni despliegue.

### Simplificación posterior solicitada

Quitados el botón de pausa/reanudar y el enlace visible de créditos. Los créditos
de los archivos se conservan en public/universidades/creditos.txt. Se mantienen
las flechas, pausa por hover/foco, pausa durante el gesto táctil y preferencia
de reducir movimiento. No existe un estado de pausa permanente sin control
para reanudar: al retirar el cursor vuelve a avanzar automáticamente.

Comprobado en Chrome: avance de 0 a 208 px; con hover y sin foco permanece
en 208 px durante más de 4 s; al retirar el cursor continúa hasta 328 px.
Prettier, ESLint del componente y git diff --check aprobados.
Captura: landing-carrusel-sin-pausa-creditos.png.

### Corrección del movimiento automático (17/10)

El avance anterior esperaba 3,6 segundos entre movimientos y el foco de un botón pulsado con el mouse podía mantener el carrusel pausado. Se reemplazó por desplazamiento continuo a 36 px/s con inversión en los extremos; se quitó scroll-snap para permitir avances pequeños y se reservó la pausa por foco para interacción con teclado. Se mantienen pausa al pasar el mouse, interacción táctil, movimiento reducido y enlaces oficiales.

Verificación en navegador local: escritorio pasó de 0 a 135 px automáticamente; sobre la flecha quedó en 327,84 px durante la pausa y volvió a 263,92 px al salir. En viewport móvil de 390 px pasó de 261,33 a 136,67 px, con las 7 imágenes cargadas y sin desbordamiento horizontal de la página (375/375 px). ESLint del componente y git diff --check sin errores. Captura: landing-carrusel-continuo.png.

### Recorrido completo de la landing en móvil (17/10)

Alcance: landing local en Chrome con viewports de 320×740, 390×844 y 430×932. No equivale a una prueba en hardware iOS/Android real.

Hallazgos corregidos por Frontend:
- Encabezado: acceso a navegación móvil mediante Menú nativo, con enlaces a cómo funciona, plan de estudio, planes y preguntas frecuentes. Login y registro conservan una fila en 320 px y 44 px de altura.
- Acciones del hero: botones de ancho completo, separados por 10 px.
- Vista de preparación: círculo más compacto y mayor espacio para el texto en pantallas angostas.
- Demo: Evi ya no se superpone a la tarjeta (10 px de separación medidos); acciones apiladas con espacio para tocar.

Pruebas realizadas:
- Sin desbordamiento de página en 320, 390 y 430 px; sin títulos, párrafos o botones recortados en las mediciones. En 320 px, página 305/305 px y botones principales de 47,7/49 px de alto.
- Menú abre mediante toque y teclado; enlaces a planes y preguntas frecuentes comprobados. En 320 px el menú termina en x=284,67 dentro del ancho útil de 305 px.
- Demo: abrir fragmento, reintentar, respuesta incorrecta y correcta; feedback correcto y foco accesible conservados.
- Carrusel: gesto táctil horizontal comprobado; flechas funcionan con preferencia de movimiento reducido. Las 7 imágenes cargan.
- Ocho FAQs abiertas y cerradas; legibilidad revisada. Cierre y footer recorridos.
- Premium lleva a /pricing?source=home_planes#elegir-plan; crear cuenta llega al registro y preparación del material; enlace de privacidad abre su página. No se inició sesión, aceptaron términos, seleccionaron archivos ni se ejecutó una carga de PDF.
- npm run lint, npm test y npm run build: aprobados. Build aislado con NEXT_DIST_DIR=.next-mobile-review; TypeScript aprobado. Advertencias existentes: Edge Runtime y descarga de fuente dinámica (400), sin impedir la compilación. Prueba de claves IA omitida por configuración existente. La compilación inicial restringida se detuvo tras quedar sin avanzar; se completó fuera del sandbox. Archivos de configuración generados por Next restaurados a su estado anterior.

Pendientes de contenido ya acordados: testimonios reales. La extensión de Chrome inyecta atributos bis_skin_checked y provoca el aviso de hidratación en desarrollo; no se ocultó ni se cambiaron controles de seguridad. Evidencia: landing-mobile-review-390.png.

Comprobación posterior en escritorio: ancho útil 1265 px, página sin desbordamiento (1265 px), navegación de escritorio visible y menú móvil oculto. Overrides temporales de viewport, táctil y movimiento reducido limpiados.

### Simplificación posterior del primer pantallazo móvil

Encabezado en una fila de 68 px: logo, inicio de sesión y Menú. Registro trasladado al menú móvil; escritorio conserva su CTA. Se ocultan solo en móvil la etiqueta inicial y las tres frases repetidas, y se reduce el espacio superior. Acción principal de ancho completo y enlace secundario más liviano. Verificación de menú/registro y ancho de 320 px sin desbordamiento, ESLint del componente y Prettier aprobados. No cambian el H1, el texto principal, metadatos ni footer.

### Planes ocultos en móvil

Por pedido del usuario, la sección Gratis/Premium se oculta hasta 700 px y se quita Planes del menú móvil. Verificado en navegador a 390 px: display none, sin enlace a planes en el menú y FAQs disponibles. La sección y el enlace de escritorio se conservan. Prettier, ESLint del componente y diff-check aprobados.

### Alineación del bloque Plan de estudio

Pasos compactados en una secuencia horizontal de cuatro columnas, con dos en móvil. Se reemplaza la grilla amplia de tarjetas por una lista ordenada; se mantiene el contenido. Evi se integra al pie de la tarjeta del plan, junto a Ejemplo ilustrativo, en 80 px. Las dos columnas de escritorio se estiran al mismo alto: 409,5 px en la medición del navegador, con los mismos bordes superior e inferior. En móvil de 390 px: dos columnas de pasos, imagen de 80 px dentro de la tarjeta y página de 390 px sin desbordamiento. ESLint del componente, Prettier y diff-check aprobados.

### Footer: Navegación con scroll en móvil

Se limita la lista de navegación del footer completo a 224 px de altura por debajo de md, con scrollbar fino, filas táctiles de al menos 44 px y navegación por teclado. Se conservan los 11 enlaces en el HTML y el footer de escritorio mantiene el listado completo. Legal y redes sociales conservan su comportamiento.

Comprobado en 390 px: alto visible 224 px, contenido 524 px y desplazamiento al último enlace de 300 px mediante End; Home vuelve al inicio. En 320 px: lista de 263 px de ancho, 224 px de alto, 11 enlaces y sin desbordamiento de página (305/305 px). ESLint del componente, Prettier, git diff --check y tests/seo.smoke.ts aprobados.

### Footer con scroll también en escritorio

El listado Navegación mantiene ahora la misma altura de 224 px y filas de 44 px en todos los tamaños. En escritorio a 1280 px se verificaron los 11 enlaces, contenido de 524 px y scroll hasta el final (300 px). Se conserva scroll mediante teclado y rueda/táctil. Prettier, ESLint del componente y diff-check aprobados.
