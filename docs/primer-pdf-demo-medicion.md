# Recorrido del primer PDF: medición

Implementación local del preview `/preview/primer-pdf`. No implica que el demo ya esté
publicado o habilitado en Mi espacio. No hay datos de conversión ni de retención nuevos
hasta desplegarlo, exponerlo a usuarios y dejar madurar las ventanas de regreso.

## Identificación y alcance

- Fuente: `first-pdf-demo`; versión: `guided-pdf-v1`.
- `demo_run_id`: UUID nuevo por montaje/reinicio; impresiones deduplicadas dentro de la corrida,
  incluso con Strict Mode. Volver a un paso no suma otra impresión.
- `environment`: excluir `development` y `test` de los resultados de producción.
- Se reutilizan la cola, el endpoint, la identidad anónima y la tabla de analytics existentes.
  No se agregan tablas, IA, proveedores ni progreso académico del demo.
- El endpoint ya excluye bots y administradores; una cuenta administradora no sirve para
  validar que los eventos se almacenen. El usuario autenticado lo determina el servidor.

## Eventos

Todos los eventos del demo incluyen fuente, versión, corrida y entorno. Los eventos de
analytics incorporan además la identidad anónima y la sesión existentes.

| Etapa                     | Evento y condición                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Demo iniciado             | `demo_material_tour_started`                                                                                         |
| Sección presentada        | `demo_material_tour_step_viewed`, `step`, `target`                                                                   |
| Salto a Práctica          | `demo_material_tour_skipped`, `destination=practice`                                                                 |
| Salida de la guía         | Mismo evento, `destination=free_exploration`; no significa abandonar la página                                       |
| Práctica iniciada         | `demo_checkpoint_reached`, `stage=practice_started`, `entry=guided/shortcut/free_exploration`                        |
| Respuesta de práctica     | `stage=practice_answered`, `question_number`, `correct`                                                              |
| Error real encontrado     | `stage=error_encountered`, `error_kind=real`                                                                         |
| Tres respuestas correctas | `stage=practice_completed`, `correct=true`                                                                           |
| Mis errores visto         | `stage=errors_viewed`, `error_kind=real/illustrative`                                                                |
| Ayuda utilizada           | `stage=help_used`, `help_kind=explanation/simpler/example`, `error_kind`                                             |
| Fuente desplegada         | `stage=source_opened`, `error_kind`                                                                                  |
| Comprobación iniciada     | `stage=check_started`, `error_kind`                                                                                  |
| Comprobación respondida   | `stage=check_answered`, `correct`, `attempt`, `error_kind`                                                           |
| Recorrido terminado       | `demo_material_tour_completed`, `outcome=concept_checked/practice_completed`, `error_kind`                           |
| Subir mi PDF elegido      | `demo_material_tour_upload_clicked`                                                                                  |
| PDF propio cargado        | `pdf_uploaded`, `material_id`, `source`, `file_size_bytes`, `environment` y, cuando existe, la corrida del demo      |
| Espacio propio abierto    | Evento existente `student_material_study_opened`, `is_owner=true`, mismo `material_id` y `user_id` que la carga      |
| Práctica propia iniciada  | Eventos existentes `student_material_exam_started` o `student_material_flashcards_started`, mismo material y usuario |

No se envían preguntas, respuestas elegidas, nombres de archivo ni contenido del PDF.
`correct` registra el resultado, no el texto de la respuesta.

## Atribución de la carga y del uso posterior

El enlace final conserva `source=first-pdf-demo` a través del login existente.
Al elegirlo se guarda localmente una intención con UUID, versión y fecha. Solo se consume
después de que `finalizePdfFirstUploadAction` confirme la carga. Vence a los siete días y
se aplica a un único PDF; ver el demo sin elegir subir no atribuye una carga.

Una carga fallida no emite `pdf_uploaded` ni consume la intención. Carga completada no
significa procesamiento listo: esa etapa tiene el evento existente
`student_material_processing_ready`. Tampoco significa que el alumno estudió.

Para calcular el embudo:

1. Agrupar los eventos del demo por `demo_run_id`; contar corridas distintas, no eventos.
2. Vincular la primera carga por `demo_run_id`, verificando orden temporal y fuente.
3. Desde esa carga, unir las aperturas y prácticas reales por **usuario + material**.
   No considerar PDFs públicos, el material de ejemplo ni otros materiales del usuario.
4. Separar siempre la rama de errores reales de la ilustrativa. No usar la tasa de errores
   como objetivo de conversión: acertar toda la práctica es un resultado válido.
5. Calcular D1 como otra apertura/práctica del mismo material y usuario entre 24 y 48 horas
   después de su primera apertura; D2 entre 48 y 72 horas. Son señales de regreso, no
   demostraciones de aprendizaje. Si interesa regreso a cualquier PDF propio, definirlo
   como otra métrica y verificar propiedad del material.
6. Excluir corridas que todavía no alcanzaron el final de cada ventana de retención.

Si el usuario bloquea o borra almacenamiento, cambia de dispositivo o pasa a otro navegador,
puede perderse la vinculación de corrida. No adivinarla: informar estas cargas como
`source=first-pdf-demo` sin corrida atribuida. No mezclar conversiones sin vinculación con
el numerador por corrida. La cola de analytics es de mejor esfuerzo; red bloqueada o salida
antes del envío puede perder eventos.

## Lectura de resultados

Objetivos principales: PDF propio cargado por usuario, práctica propia iniciada y regreso
D1/D2. Diagnóstico: dónde se detienen antes y después de Mis errores, utilización de ayuda,
errores reales frente a ilustrativos y uso del atajo.

La carga `pdf_uploaded` antes solo se emitía al retomar la landing y no estaba permitida
en el endpoint. Por eso no comparar sus nuevos totales contra ese histórico incompleto:
el período comparable comienza con esta instrumentación.

Terminar el demo o acertar la comprobación no prueba un aumento de retención. Para evaluar
impacto causal hará falta comparar cohortes o una exposición controlada. Este cambio deja
instrumentados los eventos; no agrega un panel de visualización al administrador.

## QA y revisión técnica

- Smoke tests: deduplicación, contrato de eventos, separación del error ilustrativo,
  intentos de comprobación, expiración, consumo único, origen ajeno, fecha futura,
  UUID inválido y almacenamiento bloqueado.
- Seguridad: las nuevas claves siguen la lista permitida del servidor; no se envía contenido
  académico, no cambian auth/RLS/uploads, y permanecen los límites existentes del endpoint.
  Los eventos de cliente son telemetría, no prueba transaccional ni autorización.
- CTO: cambio aditivo sobre analytics existente; sin migraciones ni dependencias. Eliminar
  la instrumentación permite revertirla sin tocar progreso del alumno. Gate local aprobado;
  no constituye validación de despliegue o carga real autenticada.
