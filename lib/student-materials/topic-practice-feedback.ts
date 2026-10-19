/** Resultado de una tanda finalizada; no representa dominio ni progreso de lectura. */
export type TopicPracticeOutcome = {
  sectionIndex: number;
  total: number;
  correct: number;
  incorrect: number;
  incorrectPrompts: string[];
};

export function topicPracticeFeedback(
  outcome: TopicPracticeOutcome | undefined,
  pending: number,
  reinforced: boolean
) {
  if (pending > 0)
    return 'Revisá las explicaciones de las preguntas pendientes antes de volver a practicar. Podés consultar el contenido del tema debajo.';
  if (outcome && outcome.incorrect === 0)
    return 'En esta tanda respondiste todo correctamente. Podés seguir con otro tema y volver a comprobarlo más adelante.';
  if (reinforced)
    return 'Resolviste el refuerzo. Volvé a comprobar lo aprendido en otra sesión; un acierto inmediato no demuestra el dominio de todo el tema.';
  if (outcome?.incorrect)
    return 'Revisá el resultado de esta tanda y el contenido del tema. Las dificultades que sigan pendientes aparecerán acá al cargar tus resultados.';
  return 'Podés continuar estudiando y practicar cuando quieras. Todavía no hay una evaluación suficiente para afirmar que dominás este tema.';
}
