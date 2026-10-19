# Devolución de práctica y asociación conservadora de recursos

## Cambios locales

- La práctica por tema transmite el resultado de la tanda finalizada: total, aciertos y preguntas incorrectas.
- Al volver al tema se muestra «Tu próxima actividad», antes del resumen, con el resultado separado del total de pendientes del tema.
- Los pendientes pueden incluir prácticas anteriores. El refuerzo prioriza una pregunta incorrecta de la última tanda cuando sigue pendiente.
- Un refuerzo ya resuelto recomienda comprobar en otra sesión; no programa recordatorios ni afirma dominio.
- Los resultados de la última tanda se conservan en memoria del workspace al regresar. No se incorporó persistencia de sesiones nuevas ni recuperación de ese mensaje después de recargar.
- Se eliminó la asignación circular de capítulos en el glosario local. Ahora usa la misma resolución conservadora que Progreso: título explícito no contradictorio o mención inequívoca del término. Los casos ambiguos quedan sin asociación.
- Los títulos repetidos no se usan como identidad inequívoca para conceptos o tarjetas. No se regeneran materiales anteriores.

## Verificación

- Suite completa `npm test`: aprobada.
- Nuevas regresiones en `glossary-noise.smoke.ts` y `topic-study-resources.smoke.ts`: aprobadas. Verifican asociación independiente del orden, términos ausentes y títulos duplicados.
- TypeScript, lint completo y `git diff --check`: aprobados.
- Navegador con Marketing I: alumno nuevo sin devolución ficticia; tanda incorrecta, retorno al mismo tema con conteos y CTA de refuerzo; tanda correcta en otro tema, devolución sin afirmación de dominio.
- Ancho de documento igual al viewport móvil medido (433 píxeles CSS). Las capturas móviles fallaron por timeout; no se confirma una nueva inspección visual completa de móvil. Override restaurado.
- Se conservó captura de escritorio del caso con dificultad. La captura del caso correcto salió vacía durante la transición; su contenido fue comprobado mediante el árbol accesible del navegador.

## Alcance pendiente

- La corrección de asociación es una mejora compatible del mecanismo existente. No implementa todavía identificadores persistentes nuevos de tema ni cambia los contratos almacenados del procesamiento pedagógico.
- No se midió cobertura pedagógica en una muestra de PDFs nuevos de diferentes longitudes, ni se probó la escritura remota o IA con sesión autenticada.
- Sin cambios en schema, auth, prompts, proveedores, límites Free/Premium ni costos de IA.
- QA: LISTO CON RIESGOS para probar en local. No se realizó un build completo ni publicación de esta iteración.

## Validación previa a publicar en main

- Nueva ejecución de `npm run lint` y `npm test`: aprobadas.
- `next build --webpack`: aprobado, incluido TypeScript y 84 páginas generadas. Se mantienen avisos existentes de Edge Runtime y fuente dinámica HTTP 400. No se cambió el bundler configurado para CI.
- `git diff --check`: aprobado. El PDF de Marketing y su fixture siguen ignorados por Git.
- Gate técnico: APROBADO para publicar el código con los límites documentados. Contrato opcional solo entre componentes; sin cambios de esquema, endpoints, permisos, proveedores o costos de IA. Rollback con revert del commit.
- QA: LISTO CON RIESGOS. No se da por probado el flujo autenticado remoto, el CI de GitHub ni un despliegue en Vercel.
- La apertura automática de la explicación de Evi, comentada después, no forma parte de este cambio.
