# Espera y cierre de la carga de PDF

La carga desde Mi espacio y la recuperación del PDF elegido antes del registro
comparten la misma espera y el mismo cierre. El usuario que llega desde la página
pública ya no es redirigido automáticamente al terminar el procesamiento.

## Comportamiento

- La espera presenta Entender → Practicar → Reforzar, a razón de 6,5 segundos por
  escena. Solo el paso visible aparece en azul.
- La finalización depende del estado `ready` del servidor. No hay demora mínima
  ni obligación de terminar las tres escenas.
- Si sigue procesando después de las tres escenas, permanece en Reforzar con
  «Seguimos preparando tu PDF»; no reinicia el recorrido.
- El nombre del archivo es real. Su primera página se renderiza en el navegador,
  sin nuevas llamadas de IA ni transferencia a otro servicio. Si falla la
  miniatura, se conserva un icono de PDF y el resto de la carga sigue funcionando.
- Los ejemplos durante la espera son genéricos: no se presentan preguntas ni
  temas ficticios como resultados generados del archivo del usuario.
- Universidad y carrera siguen siendo opcionales y se pueden agregar durante la
  espera desde Mi espacio. Guardar o saltar vuelve al proceso, sin abrir el PDF
  antes del cierre.
- Si el procesamiento falla, se muestra el error; no se habilitan los destinos.

Cuando el primer PDF propio queda listo:

1. **Empezar a estudiar**: `/materiales/{id}?recorrido=1`, abre el resumen real
   con una ayuda visual que destaca el resumen y después señala Práctica.
2. **Ver todas las herramientas**: `/materiales/{id}`, espacio normal del PDF.
   Conserva una invitación opcional a abrir el recorrido recomendado.

Desde el segundo PDF:

1. **Ver qué tanto sé**: `/materiales/{id}?diagnostico=1`, diagnóstico existente
   sobre las preguntas del material. Selecciona hasta seis preguntas elegibles.
2. **Empezar por el resumen**: `/materiales/{id}?tab=resumen`, resumen inicial.
3. **Ver todas las herramientas**: `/materiales/{id}`, espacio normal del PDF.

Se reutilizan la autorización, las cuotas, la subida firmada, el procesamiento y
el registro de errores existentes. No se agregan cambios de esquema ni endpoints.

El primer PDF se identifica entre los archivos propios con estado `ready`,
ordenando por `created_at` e `id`. No cuentan demos, archivos fallidos ni archivos
compartidos por otra persona. Es una consulta adicional al terminar la carga y al
abrir un material propio, sin modificar esquema. Esta definición se recalcula:
eliminar el primero o reintentar un archivo anterior puede cambiar cuál es el
primero. No equivale a guardar permanentemente un hito histórico de onboarding.

## Recorrido recomendado dentro del PDF

- Se destaca el resumen real mientras el resto se desenfoca. Una ayuda breve
  explica «Este es tu resumen». Su contenido puede desplazarse dentro del área
  visible, sin exigir leerlo completo para continuar.
- «Entendido» señala la pestaña Práctica. «Probar una práctica» cierra el
  destacado y empieza las preguntas del mismo PDF. No hay barra inferior.
- Glosario, tarjetas, mapa y práctica siguen disponibles al cerrar la ayuda
  con la X o Escape. «Cómo estudiar este PDF» permite volver a abrirla.
- Selecciona hasta cinco preguntas existentes y elegibles, priorizando variedad
  de temas. Muestra el número real. Con menos de tres no ofrece este cuestionario.
  El diagnóstico normal conserva su máximo de seis preguntas.
- Las respuestas se conservan al cambiar de herramienta y entre las vistas
  móvil/escritorio. La sesión de preguntas es local a la página; recargar no
  recupera el cuestionario, pero los errores ya guardados permanecen en la cuenta.
- Se espera el guardado de cada respuesta. Un fallo muestra un aviso y permite
  reintentar antes de avanzar. No se anuncia un guardado que no ocurrió.
- Si hubo errores, una ayuda destaca el resultado y explica cómo reforzarlos.
  «Ver mis errores» abre
  `/dashboard/explicaciones?material={id}` con ese PDF seleccionado. Si corresponde,
  incorpora la guía existente del primer error al entrar en Mis errores.
- Si acertó todo, informa qué preguntas respondió correctamente sin inventar un
  error ni declarar dominio de todo el documento.
- La consulta de propietario limita la guía inicial a PDFs propios. El parámetro
  de selección en Mis errores solo filtra los datos autorizados existentes.

## Preview público

- `/preview/procesando-pdf`: tres escenas de espera y primer PDF listo.
- `/preview/procesando-pdf?listo=1`: primer PDF listo directamente, dos acciones.
- `/preview/procesando-pdf?pdf=siguiente&listo=1`: tres acciones del siguiente PDF.
- `/preview/procesando-pdf?estudiar=1`: abre directamente el resumen con la guía
  visual, sin pasar por la pantalla de PDF listo.

Usa el mismo workspace de producción con un PDF de ejemplo real de dos páginas,
resumen y preguntas preparados. La práctica y las explicaciones de Mis errores
son simuladas: no necesitan cuenta, no escriben progreso y no llaman a la IA.
No se muestran controles de preview dentro del recorrido.

## Implementación y mantenimiento

`components/pdf-processing` contiene el componente compartido de la espera, su
reloj, estilos y miniatura. El preview usa esa misma interfaz con una simulación
local y destinos de ejemplo, sin resultados de cuenta ni generación de IA.

La miniatura carga de forma diferida una copia local sin modificar de PDF.js
5.4.296, `public/pdf-thumbnail-runtime-5.4.296.mjs`, con su licencia original.
Comparte la versión del worker que ya utiliza el visor. Al actualizar PDF.js,
actualizar ambos archivos y sus referencias. No se cambian dominios de CSP.
Se desactiva la evaluación de código en la lectura de la miniatura y se cancelan
el render y el documento al desmontar.

## Verificación del 3 de octubre de 2026

- Carga real de cliente probada en un entorno aislado, con acciones de servidor y
  Storage simulados: 16 combinaciones de dos entradas y ocho tamaños de pantalla.
  Las pruebas no consumen PDFs ni IA de cuentas reales.
- Resoluciones: 320×568, 360×640, 390×844, 430×932, 768×1024, 1024×768,
  1366×900 y 844×390. Chromium; las pruebas no equivalen a comprobar cada modelo
  físico ni todos los motores de navegador.
- Primera página real renderizada; nombre, fecha de examen, universidad/carrera,
  procesamiento rápido, espera prolongada, fallo y tres URLs de salida comprobados.
- Ajuste específico de celular horizontal: las tres escenas y el cierre caben sin
  scroll interno. En alturas extremas o con nombres muy largos se conserva el
  desplazamiento, con la barra oculta.
- Preview: cuatro tamaños, diagnóstico con errores y todos los aciertos, resumen,
  herramientas, teclado, regreso y ausencia de escrituras de cuenta comprobados.
- `npm test`: las 15 suites pasan, incluido el contrato de subida firmada.
- TypeScript y ESLint: sin errores nuevos. Advertencias previas ajenas al cambio.
- Build completo con `NEXT_DIST_DIR=.next-vercel-build`: compilación, tipos y
  generación de las 79 páginas correctos.
- El servidor completo de producción no pudo iniciarse en este Windows por el
  bloqueo previo de `canvas.node` en Application Control. No se modifican ni se
  deshabilitan esos controles. La interfaz se verificó con los componentes reales
  en el entorno aislado descrito arriba; no se repitió una subida autenticada real.
- Presupuesto de rendimiento: las ocho rutas pasan; Mi espacio dentro de 340 KB.
- `npm audit --omit=dev --audit-level=high`: cero vulnerabilidades de producción.
- La auditoría completa conserva el aviso previo de `braces` y sus dependientes
  en ESLint: cinco avisos altos. CI ejecuta esa auditoría antes del resto de
  verificaciones, por lo que puede detenerse allí. No se aplica el rollback de
  Next/ESLint propuesto por `audit fix --force`.

Security: sin hallazgos nuevos en la integración; permanecen los controles de
propiedad y cuotas existentes. QA: **LISTO CON RIESGOS** por el aviso previo de
herramientas y la cobertura limitada a Chromium. CTO: **APROBADO**, con una única
interfaz compartida, runtime diferido y sin cambios de contratos del servidor.

## Limpieza del 4 de octubre de 2026

Se retiraron doce archivos sin consumidores: las versiones 1–5 del recorrido
antiguo, cuatro paneles de biblioteca y el panel de usuarios reemplazados, el
preview anterior del primer PDF y el reexport innecesario de la espera. La
comprobación de referencias incluyó imports, reexports y cargas dinámicas.
También se eliminaron estilos de elementos retirados, un componente interno,
un import, un estado y una consulta de Premium cuyo resultado no se utilizaba.

Las salidas `output/`, `out/`, `.lighthouseci/` y las compilaciones `.next*/`
quedan excluidas de Git; se conservan los archivos generados locales.
Verificación posterior: ESLint sin errores ni advertencias, TypeScript correcto,
las quince suites de pruebas y el build de producción con 79 páginas correctos.
No se repitió la verificación visual ni la carga autenticada real en esta limpieza.
QA de la limpieza: **LISTO**, dentro de ese alcance.

## Verificación del recorrido recomendado — 4 de octubre de 2026

- ESLint sin errores ni advertencias; TypeScript correcto; `npm test` pasa las
  16 suites, incluido el selector de preguntas y el filtro del primer PDF propio.
- Build de producción con `NEXT_DIST_DIR=.next-vercel-build`: compilación,
  tipos y 79 páginas correctos. Conserva avisos previos de Edge Runtime y una
  descarga de fuente del símbolo ✓ en la imagen social; el build no falla.
- Carga de primer PDF: 16 combinaciones de dos entradas y ocho tamaños, con
  miniatura real, dos acciones, espera prolongada, rapidez, fallo y contexto
  académico opcional.
- Cargas posteriores: 48 combinaciones (dos entradas, ocho tamaños y tres
  acciones), sin errores de navegador y con las tres rutas correctas.
- Recorrido recomendado: ocho tamaños, cambio entre herramientas, conservación
  de respuestas al redimensionar de móvil a escritorio y volver, cinco preguntas,
  resultado con errores, ayuda y versión más simple comprobados. También todos
  los aciertos, activación/salida opcional de la guía, fallo al guardar, reintento
  y destino de Mis errores filtrado por PDF.
- No se detectó desborde horizontal en esos casos. Cobertura Chromium; no se
  afirma compatibilidad comprobada con cada dispositivo o Safari/Firefox.
- Las dos páginas del PDF de ejemplo fueron renderizadas y revisadas completas
  en el visor; título, texto y referencias de página corresponden al material.
- Las ocho rutas cumplen los presupuestos de assets iniciales, incluido material
  por debajo de 400 KB y Mi espacio por debajo de 340 KB gzip.
- Browser tests en el servidor aislado: acciones y Storage simulados. El caso
  de guardado usa una copia del componente sin otros cambios, reemplazando solo
  el import de la acción por un stub. El visor usa el mismo PDF.js mediante un
  puente ESM exclusivo del fixture Webpack. Esos archivos están en `tmp/`, no
  forman parte de producción. No se realizó una carga autenticada real.
- El CLI `agent-browser` no está instalado; se usó Playwright incluido en el
  runtime local como alternativa, con Chrome instalado. Persiste el bloqueo
  previo de `canvas.node` para arrancar la aplicación completa en este Windows.
- Security: sin hallazgos nuevos; consulta limitada al propietario y sus PDFs
  listos, selector UUID validado, guardado mantiene autenticación/propiedad. Sin
  cambios de RLS, cuotas, CSP, secretos, dependencias ni llamadas de IA.
- CTO: **APROBADO** para integración local: contrato opcional compatible, lógica
  de selección compartida, reutilización de workspace/errores y sin migraciones.
- QA: **LISTO CON RIESGOS** dentro del alcance probado, por la cobertura de
  navegador y el backend simulado. Antes de publicar corresponde comprobar la
  carga autenticada y el guardado real en un entorno de despliegue.

## Ayuda visual dentro del PDF

La alternativa con frase y barra inferior fue reemplazada por un destacado del
resumen, seguido de una indicación sobre Práctica. La espera conserva sus tres
escenas. El componente de destacado compartido vive en `components/study`; los
recorridos anteriores conservan su comportamiento por defecto.

Se comprobó el recorrido de cinco preguntas, resultado con errores y acceso a
Mis errores/ayuda en los ocho tamaños anteriores, además de salida con Escape,
cierre y reapertura. Se verificó también el desplazamiento hasta el final del
resumen dentro del destacado y el recorrido anterior de muestra en móvil y
escritorio. ESLint y TypeScript correctos; build de producción con 79 páginas.
Cobertura en Chromium con backend simulado; no se repitió una carga autenticada real.

## Revisión responsive y del flujo — 4 de octubre de 2026

- Chrome: doce tamaños entre 320×480 y 1920×1080, incluidos celular horizontal,
  tablet y escritorio. Edge: cuatro tamaños. Animaciones normales, simulación
  táctil y densidad de píxeles doble en las pantallas pequeñas.
- Resumen hasta el final, bordes del destacado, ayuda dentro del viewport,
  práctica de cinco preguntas, resultado y acceso a Mis errores comprobados
  sin desborde horizontal ni errores de JavaScript en esos casos.
- Giro y cambio móvil/escritorio durante la guía y durante la segunda pregunta:
  conserva índice y respuesta seleccionada. Tab permanece en el área destacada
  y la ayuda; Escape devuelve el scroll normal y restaura el estilo del body.
- Todos los aciertos llevan a un resultado sin errores inventados. El ciclo con
  fallos incluye explicación, «Más simple», ejemplo, fuente, comprobación fallida,
  nuevo repaso, comprobación correcta, cierre y regreso al PDF.
- Texto al 200% mediante font-size del documento probado en móvil y escritorio;
  los botones siguen accesibles. No equivale a validar todas las configuraciones
  de zoom y lectores de pantalla de cada sistema operativo.
- Se corrigió el foco al cerrar la ventana de PDF listo en el preview para que
  llegue al título de la guía. La X de esa guía tiene área táctil de 44 px.
  Las fases se identifican por su nombre, sin «2 de 2» antes de Reforzar.
- Después de esos ajustes se repitió el recorrido en cuatro tamaños críticos.
  ESLint, TypeScript, formato y `git diff --check` correctos.
- QA: **LISTO CON RIESGOS** para revisión local. Safari y Firefox no están
  disponibles en este entorno; no se validaron dispositivos físicos ni una
  carga/guardado autenticados reales. Las pruebas usan los componentes reales
  con backend simulado y no consumen IA ni alteran progreso de usuarios.

## Prueba con una cuenta propia

1. Desde Mi espacio, seleccionar un PDF, editar su nombre si hace falta e indicar
   opcionalmente fecha de examen. Iniciar el procesamiento.
2. Comprobar las escenas y la referencia al archivo. Si se desea, agregar los
   datos académicos y volver a la espera.
3. En el primer PDF listo, elegir «Empezar a estudiar», leer el resumen, comprobar
   lo entendido y reforzar los errores. Abrir herramientas normalmente también
   permite activar la guía de forma opcional.
4. Con otro PDF, comprobar diagnóstico, resumen y herramientas. Las preguntas y
   el repaso son los existentes del PDF real.
5. Desde la página pública, elegir un PDF antes del registro y completar el acceso.
   Verificar que se recupere el archivo y que el mismo cierre espere una elección.

La publicación en GitHub no despliega Vercel automáticamente: el repositorio
conserva `git.deploymentEnabled: false`.

## Preparación para GitHub — 4 de octubre de 2026

`origin/master` coincide con la base local `e076b82`; no hay commits remotos
pendientes de integrar. Se publican el recorrido recomendado, el cierre según
primer PDF, el preview con material real y la limpieza de versiones sin uso.

Verificación final: lint completo correcto, dieciséis suites de pruebas correctas,
compilación de producción con 79 páginas, ocho presupuestos de rendimiento dentro
del límite y diff sin problemas de espacios. Se excluyen salidas de compilación,
diagnósticos temporales y variables de entorno.

La auditoría completa sigue dando cinco avisos altos en la cadena de dependencias
de desarrollo de ESLint por `braces`; no cambió el lockfile. El CI comienza con
esa auditoría y puede detenerse antes de las comprobaciones de producto. No se
aplica `audit fix --force`, que propone cambiar a Next/ESLint 14. La publicación
del código no equivale a un despliegue ni a una aprobación nueva de producción.
