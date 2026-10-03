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

Cuando el PDF queda listo:

1. **Ver qué tanto sé**: `/materiales/{id}?diagnostico=1`, diagnóstico existente
   sobre las preguntas del material. Selecciona hasta seis preguntas elegibles.
2. **Empezar por el resumen**: `/materiales/{id}?tab=resumen`, resumen inicial.
3. **Ver todas las herramientas**: `/materiales/{id}`, espacio normal del PDF.

Se reutilizan la autorización, las cuotas, la subida firmada, el procesamiento y
el registro de errores existentes. No se agregan cambios de esquema ni endpoints.
El recorrido posterior de enseñanza exclusivo del primer PDF no forma parte de
este cambio.

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

## Prueba con una cuenta propia

1. Desde Mi espacio, seleccionar un PDF, editar su nombre si hace falta e indicar
   opcionalmente fecha de examen. Iniciar el procesamiento.
2. Comprobar las escenas y la referencia al archivo. Si se desea, agregar los
   datos académicos y volver a la espera.
3. Esperar el estado listo y probar cada destino con una carga distinta o volviendo
   a Mi espacio. Las preguntas y el repaso son los existentes del PDF real.
4. Desde la página pública, elegir un PDF antes del registro y completar el acceso.
   Verificar que se recupere el archivo y que el mismo cierre espere una elección.

La publicación en GitHub no despliega Vercel automáticamente: el repositorio
conserva `git.deploymentEnabled: false`.
