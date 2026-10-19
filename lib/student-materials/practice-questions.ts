import type { StudyQuestion } from './pedagogy';

export type ExamSizeOption = {
  count: number;
  mode: 'brief' | 'coverage' | 'complete';
  label: string;
  description: string;
};

export function normalizeAnswer(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeForSearch(value: string) {
  return normalizeAnswer(value).replace(/[^a-z0-9áéíóúñü\s]/gi, ' ');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function levelLabel(level: StudyQuestion['level']) {
  if (level === 'recordar') return 'Recordar';
  if (level === 'aplicar') return 'Aplicar';
  return 'Comprender';
}

export function sourceLabel(question: StudyQuestion) {
  const { pageStart, pageEnd, sectionTitle } = question.reference;
  if (pageStart && pageEnd && pageEnd !== pageStart) return `Páginas ${pageStart}–${pageEnd}`;
  if (pageStart) return `Página ${pageStart}`;
  return sectionTitle || 'Referencia del documento';
}

function hasExplicitClassificationEvidence(question: StudyQuestion) {
  if (question.kind !== 'classification') return true;
  const answer = question.answer.trim();
  const excerpt = question.reference.excerpt;
  if (!answer || !excerpt) return false;

  return new RegExp(`${escapeRegExp(answer)}\\s*:`, 'i').test(excerpt);
}

function hasGroundedComparisonAnswer(question: StudyQuestion) {
  if (question.type !== 'open' || question.kind !== 'relationship') return true;
  const topic = normalizeForSearch(question.topic ?? '');
  const answer = normalizeForSearch(question.answer);
  const stopWords = new Set([
    'segun',
    'material',
    'entre',
    'frente',
    'estructura',
    'estructural',
    'funcional',
  ]);
  const keywords = Array.from(
    new Set(topic.split(/\s+/).filter((word) => word.length >= 4 && !stopWords.has(word)))
  );

  if (keywords.length === 0) return Boolean(answer);
  const matches = keywords.filter((word) => answer.includes(word)).length;
  return matches >= Math.min(2, keywords.length);
}

function isUsefulFormulaQuestion(question: StudyQuestion) {
  if (question.kind !== 'formula') return true;
  const expression = question.topic?.trim() ?? '';
  if (!expression) return false;
  if (/^km$/i.test(expression)) return true;
  return /[=+\-*/()[\]0-9]/.test(expression);
}

export function isEligibleExamQuestion(question: StudyQuestion) {
  if (question.kind === 'confusion') return false;
  if (!hasExplicitClassificationEvidence(question)) return false;
  if (!hasGroundedComparisonAnswer(question)) return false;
  if (!isUsefulFormulaQuestion(question)) return false;

  if (question.type === 'multiple_choice') {
    if (question.options.length < 3) return false;
    const answer = normalizeAnswer(question.answer);
    if (!question.options.some((option) => normalizeAnswer(option) === answer)) return false;
  }

  return Boolean(question.prompt.trim() && question.answer.trim());
}

/** Un ítem cuenta una sola vez y sólo si permite una evaluación verificable. */
export function getDistinctEligibleExamQuestions(questions: StudyQuestion[]): StudyQuestion[] {
  const seen = new Set<string>();
  return questions.filter((question) => {
    if (!isEligibleExamQuestion(question)) return false;
    const identity = `${normalizeAnswer(question.prompt)}|${normalizeAnswer(question.answer)}`;
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

/**
 * Tres modos progresivos: repaso breve, cobertura de capítulos y el banco completo.
 * No inventamos preguntas: el tamaño siempre se acota a las disponibles.
 * assessedSections cuenta los capítulos con al menos una pregunta corregible.
 */
export function resolveExamSizeOptions(
  totalQuestions: number,
  assessedSections = 0
): ExamSizeOption[] {
  if (totalQuestions <= 0) return [];

  // El repaso breve escala con el banco: 20% de las preguntas disponibles.
  // Límite de 30 para que siga siendo una sesión relativamente corta.
  const brief = Math.min(30, Math.max(1, Math.round(totalQuestions * 0.20)));
  const coverage = Math.max(
    brief + 1,
    Math.round(totalQuestions * 0.4),
    totalQuestions >= 20 ? 12 : Math.round(totalQuestions * 0.7),
    Math.min(assessedSections, totalQuestions - 1)
  );
  const counts = [Math.min(brief, totalQuestions - 2), Math.min(coverage, totalQuestions - 1), totalQuestions]
    .filter((count) => count >= 1);
  const uniqueCounts = [...new Set(counts)].sort((left, right) => left - right);

  const modes: ExamSizeOption['mode'][] = uniqueCounts.length === 3
    ? ['brief', 'coverage', 'complete']
    : uniqueCounts.length === 2
      ? ['brief', 'complete']
      : ['complete'];

  return uniqueCounts.map((count, index) => {
    const mode = modes[index];
    return {
      count,
      mode,
      label: mode === 'brief' ? 'Repaso breve' : mode === 'coverage' ? 'Cobertura' : 'Completo',
      description: mode === 'brief'
        ? 'Repasá los puntos principales en pocos minutos.'
        : mode === 'coverage'
          ? 'Practicá una selección amplia y distribuida entre los temas.'
          : 'Practicá todas las preguntas disponibles de este PDF.',
    };
  });
}

export function resolveExamQuestions(
  questions: StudyQuestion[],
  preferredQuestionIds: string[],
  targetCount: number
) {
  const selected: StudyQuestion[] = [];
  const selectedIds = new Set<string>();
  const selectedTopics = new Set<string>();
  const selectedPages = new Set<number>();
  const selectedKinds = new Set<StudyQuestion['kind']>();
  const preferredIds = new Set(preferredQuestionIds);
  const levelSequence: StudyQuestion['level'][] = [
    'recordar',
    'comprender',
    'aplicar',
    'comprender',
    'aplicar',
  ];
  const maxOpenQuestions = Math.max(1, Math.round(targetCount * 0.15));

  const score = (question: StudyQuestion) => {
    let value = preferredIds.has(question.id) ? 4 : 0;
    if (question.type === 'multiple_choice') value += 4;
    if (question.topic && !selectedTopics.has(normalizeAnswer(question.topic))) value += 6;
    if (question.reference.pageStart && !selectedPages.has(question.reference.pageStart))
      value += 5;
    if (question.kind && !selectedKinds.has(question.kind)) value += 3;
    if (question.kind === 'formula' && question.level === 'aplicar') value += 6;
    return value;
  };

  const pickBest = (level?: StudyQuestion['level']) =>
    questions
      .filter((question) => !selectedIds.has(question.id))
      .filter((question) => !level || question.level === level)
      .filter(
        (question) =>
          question.type !== 'open' ||
          selected.filter((selectedQuestion) => selectedQuestion.type === 'open').length <
            maxOpenQuestions
      )
      .map((question, index) => ({ question, index, score: score(question) }))
      .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.question;

  const push = (question: StudyQuestion | undefined) => {
    if (!question || selectedIds.has(question.id) || selected.length >= targetCount) return;
    selected.push(question);
    selectedIds.add(question.id);
    if (question.topic) selectedTopics.add(normalizeAnswer(question.topic));
    if (question.reference.pageStart) selectedPages.add(question.reference.pageStart);
    if (question.kind) selectedKinds.add(question.kind);
  };

  for (let index = 0; index < targetCount; index += 1) {
    const desiredLevel = levelSequence[index % levelSequence.length];
    push(pickBest(desiredLevel) ?? pickBest());
  }

  while (selected.length < targetCount) {
    const match = pickBest();
    if (!match) break;
    push(match);
  }

  if (targetCount >= 10 && selected.every((question) => question.type !== 'open')) {
    const openCandidate = questions
      .filter((question) => question.type === 'open' && question.level === 'comprender')
      .map((question, index) => ({ question, index, score: score(question) }))
      .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.question;
    const replaceIndex = selected.findLastIndex(
      (question) => question.type === 'multiple_choice' && question.level === 'comprender'
    );
    if (openCandidate && replaceIndex >= 0) {
      selected[replaceIndex] = openCandidate;
    }
  }

  return selected.slice(0, targetCount);
}
