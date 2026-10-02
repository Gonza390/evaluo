# Evaluo: del error a entenderlo

Video de 90 segundos, 1920 × 1080, 30 fps. Composición: `EvaluoStudyLoop`.

## Historia

Un mismo estudiante estudia Finalismo con Derecho penal · Unidad 2.pdf. El error
abre la historia; luego volvemos a la subida del PDF, diagnóstico y práctica.
El nuevo Mis errores permite entender, consultar la fuente y aplicar el concepto
en una pregunta diferente. El cierre propone volver a practicar más adelante.

## Materiales y alcance

- Los primeros pasos son escenas ilustrativas, reconstruidas para narrar el recorrido.
- Mis errores utiliza capturas reales del preview local con datos de ejemplo.
- El preview contiene explicaciones, preguntas y fuentes simuladas. El video identifica
  estas escenas como vista previa; no certifica que estén integradas a producción.
- El repaso posterior se identifica como un próximo paso propuesto.
- Voz sintética de trabajo: es-AR-ElenaNeural. Música sintetizada original, sin muestras externas.
- Subtítulos divididos en grupos breves con sincronización aproximada por duración de voz.
- Las fuentes son del sistema; no se requiere una descarga al renderizar.

## Edición y reproducción

Guion y tiempos: `video/study-loop-script.json`.
Animación: `video/EvaluoStudyLoop.tsx`.
Capturas y audio: `public/video/study-loop/`.

Abrir Remotion:

```sh
npm run video:studio
```

Seleccionar `EvaluoStudyLoop` para revisar la composición.

Renderizar:

```sh
npx remotion render video/index.ts EvaluoStudyLoop output/evaluo-del-error-a-entenderlo.mp4 --codec=h264 --crf=20 --concurrency=4
```

La herramienta opcional de voz está aislada en `tmp/video-tools` y no cambia
dependencias de la plataforma. Para regenerar audio, instalar allí `edge-tts`
y ejecutar `video/generate-study-loop-audio.py` con Python 3.

El generador envía únicamente el texto del guion al servicio de voz. Los MP3
quedan guardados, por lo que la edición y el render posteriores funcionan sin TTS.

No se publican el video ni los cambios de esta composición automáticamente.

## Verificación

- Lint de los archivos de la composición y TypeScript del proyecto: sin errores.
- Render MP4 H.264, audio AAC, 1920 × 1080, 30 fps.
- Revisión visual de diez puntos del recorrido y de los encuadres de ayuda/fuente.
- Las diez locuciones caben en sus escenas con playbackRate 1.08.
- Remotion informa una incompatibilidad preexistente entre su paquete zod-types
  y el Zod instalado. Esta composición no usa esos contratos; el render funciona.
  No se modificó Zod ni las dependencias de la plataforma.
