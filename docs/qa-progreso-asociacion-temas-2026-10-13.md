# Corrección de asociación de temas y nombre Progreso

## Causa confirmada

Se consultaron, en modo solo lectura, los registros del PDF reportado. Sus cuatro
capítulos tienen títulos amplios, pero los 15 errores históricos guardaban nombres
de conceptos (Corrección formal, Tipos de objetos, etc.). La comparación exacta
del panel dejaba los 15 fuera de sus capítulos. No hay eventos de respuesta
guardados para ese PDF en la tabla de cobertura: asociar su historial no permite
inventar aciertos ni evaluaciones objetivas.

## Corrección

- Se reutiliza la asociación del resumen para recuperar errores históricos por
  pregunta y respuesta original, subtítulos explícitos o contenido respaldado
  por una única sección. No se utiliza la posición vieja de la tarjeta ni el
  índice de summary-check: esos contenidos pudieron reordenarse.
- Se conserva la exclusión de coincidencias ambiguas y referencias contradictorias.
  La nueva recuperación no usa las recomendaciones del simulador como evidencia.
- En los datos reales reportados se asociaron 12 registros: 3, 6, 1 y 2 por
  capítulo. Se conservan los 15 registros y sus estados. Tres conceptos generales
  no tienen respaldo suficiente para asignarlos y siguen disponibles por separado.
- Las respuestas nuevas usan la misma asociación en el servidor y guardan el
  título canónico sin recortarlo antes que el título del evento de respuesta.
- El contexto de práctica utiliza los capítulos asociados para priorizar errores
  y programar el repaso de conceptos reforzados.
- Navegación de PC/móvil, títulos, guías, ejemplos y mensajes del recorrido usan
  Progreso. Se conservan URLs existentes e identificadores internos de eventos.

## Verificación y límites

- Lint completo, npm test completo y build local: aprobados.
- Nuevas regresiones: conceptos de capítulos amplios, respuesta breve, plural,
  error histórico de summary-check en posición incorrecta, ambigüedad, simulador,
  conservación de cobertura y siguiente respuesta canónica desde flashcards.
- Se ejecutó la función corregida sobre la copia temporal de los registros reales.
  La copia se guardó fuera de archivos públicos, en .next, y se eliminó al finalizar.
- Security: sin cambios de auth/RLS, secretos, migraciones ni datos remotos. La
  lectura adicional del resumen en práctica sucede después del control existente
  de propiedad del material. No se aceptan temas suministrados por el cliente.
- React: sin efectos ni dependencias nuevas para renombrar la UI; la asociación es
  determinista y no añade llamadas de IA.
- QA: LISTO CON RIESGOS para revisión local; no se verificó con sesión autenticada
  en navegador ni se publicó en GitHub/producción en esta pasada.
- El build se ejecutó con Next 16.3.7 instalado; el lockfile declara 16.3.8.

## Integración para GitHub

Se incorporaron los nueve commits posteriores de master que mantienen el retorno
al listado y cargan Progreso bajo demanda. Se conserva esa carga diferida, el
tracking y la reducción del payload. El nuevo enlace de retorno también se
renombró a Progreso. No se despliega producción durante esta integración.
