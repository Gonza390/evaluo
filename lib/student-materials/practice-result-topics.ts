/**
 * Tema por tema de una práctica general. El resultado visible debe sumar
 * exactamente lo mismo que el resultado global, incluidas las preguntas
 * abiertas autoevaluadas.
 */
export type PracticeTopicResult = {
  title: string;
  total: number;
  correct: number;
  bankSize: number;
};

export function buildPracticeTopicResults<TQuestion>(
  questions: readonly TQuestion[],
  topicName: (question: TQuestion) => string,
  wasCorrect: (question: TQuestion) => boolean,
  bankCounts: ReadonlyMap<string, number>
): PracticeTopicResult[] {
  const byTopic = new Map<string, PracticeTopicResult>();
  for (const question of questions) {
    const title = topicName(question);
    const item = byTopic.get(title) ?? {
      title,
      total: 0,
      correct: 0,
      bankSize: bankCounts.get(title) ?? 0,
    };
    item.total += 1;
    if (wasCorrect(question)) item.correct += 1;
    byTopic.set(title, item);
  }

  return [...byTopic.values()].sort(
    (left, right) =>
      left.correct / left.total - right.correct / right.total ||
      right.total - left.total ||
      left.title.localeCompare(right.title, 'es')
  );
}

/**
 * En una tanda con pocos temas se muestran TODOS; si hay más, se conservan
 * los más débiles y también el mejor para que los aciertos no desaparezcan.
 * El detalle desplegable siempre muestra la lista completa.
 */
export function visiblePracticeTopicResults<T extends PracticeTopicResult>(
  topics: readonly T[],
  maxVisible = 5
): T[] {
  const limit = Math.max(2, Math.floor(maxVisible));
  if (topics.length <= limit) return [...topics];
  return [...topics.slice(0, limit - 1), topics[topics.length - 1]!];
}
