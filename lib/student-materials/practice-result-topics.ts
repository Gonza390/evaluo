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

/**
 * Los colores expresan el porcentaje de aciertos en ESTA tanda, no el
 * dominio definitivo del tema. Evitar redondeos que cambien la categoría
 * respecto al porcentaje mostrado.
 */
export type PracticeTopicPerformance = {
  percentage: number;
  label: 'Reforzar' | 'En progreso' | 'Buen resultado';
  tone: 'amber' | 'indigo' | 'green';
  fillClass: string;
  trackClass: string;
  badgeClass: string;
  textClass: string;
  indicatorClass: string;
  zeroMarkerClass: string;
};

export function getPracticeTopicPerformance(correct: number, total: number): PracticeTopicPerformance {
  const percentage = total > 0
    ? Math.round((Math.max(0, Math.min(correct, total)) / total) * 100)
    : 0;

  if (percentage < 50) {
    return {
      percentage,
      label: 'Reforzar',
      tone: 'amber',
      fillClass: 'bg-amber-500',
      trackClass: 'bg-amber-100 dark:bg-amber-950/40',
      badgeClass: 'border border-slate-200 bg-slate-100 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100',
      textClass: 'text-foreground',
      indicatorClass: 'bg-amber-500',
      zeroMarkerClass: 'bg-amber-500',
    };
  }

  if (percentage < 80) {
    return {
      percentage,
      label: 'En progreso',
      tone: 'indigo',
      fillClass: 'bg-indigo-500',
      trackClass: 'bg-indigo-100 dark:bg-indigo-950/40',
      badgeClass: 'border border-slate-200 bg-slate-100 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100',
      textClass: 'text-foreground',
      indicatorClass: 'bg-indigo-500',
      zeroMarkerClass: 'bg-indigo-500',
    };
  }

  return {
    percentage,
    label: 'Buen resultado',
    tone: 'green',
    fillClass: 'bg-emerald-500',
    trackClass: 'bg-emerald-100 dark:bg-emerald-950/40',
    badgeClass: 'border border-slate-200 bg-slate-100 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100',
    textClass: 'text-foreground',
    indicatorClass: 'bg-emerald-500',
    zeroMarkerClass: 'bg-emerald-500',
  };
}
