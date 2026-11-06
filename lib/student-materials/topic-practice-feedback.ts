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
  reinforced: boolean,
  locale: 'es' | 'en' = 'es'
) {
  if (locale === 'en') {
    if (pending > 0) return 'Review explanations for pending questions before practicing again. You can reread the topic below.';
    if (outcome && outcome.incorrect === 0) return 'All answers in this session were correct. Continue with another topic and check again later.';
    if (reinforced) return 'You completed the review. Check your understanding in another session; one correct answer does not prove mastery.';
    if (outcome?.incorrect) return 'Review this session and the topic content. Any unresolved difficulties will appear here when your results load.';
    return 'Keep studying and practice when you are ready. There is not enough evidence yet to consider this topic mastered.';
  }
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
