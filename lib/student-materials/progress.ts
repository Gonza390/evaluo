import type { StudyErrorView } from '@/lib/study-errors';
import { findSummarySectionForQuestion } from '@/lib/student-materials/summary-checks';

export type PdfProgressTopic = {
  id: string;
  title: string;
  errors: StudyErrorView[];
  evidence: PdfTopicEvidence[];
};

export type PdfTopicEvidence = {
  topic: string | null;
  sectionTitle: string | null;
  correct: number;
  incorrect: number;
  selfReported: number;
  lastAnsweredAt: string;
};

export function topicAssessmentCount(topic: PdfProgressTopic) {
  return topic.evidence.reduce(
    (total, evidence) => total + evidence.correct + evidence.incorrect,
    0
  );
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^\s*(?:(?:capitulo|unidad|tema)\s+)?\d+(?:\.\d+)*[\s.\-:)]*/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** La ausencia de errores no prueba un acierto ni permite inferir dominio. */
export function buildPdfProgress(
  sections: unknown,
  errors: StudyErrorView[],
  evidence: PdfTopicEvidence[] = []
) {
  const topics: PdfProgressTopic[] = Array.isArray(sections)
    ? sections.flatMap((section, index) => {
        if (
          !section ||
          typeof section !== 'object' ||
          !('title' in section) ||
          typeof section.title !== 'string' ||
          !section.title.trim()
        )
          return [];
        return [{ id: `section-${index}`, title: section.title.trim(), errors: [], evidence: [] }];
      })
    : [];
  const unmatched: StudyErrorView[] = [];
  const storedSections = Array.isArray(sections) ? sections : [];
  const associationSections = topics.map((topic) => {
    const section = storedSections[Number(topic.id.slice('section-'.length))];
    return { title: topic.title, body: typeof section?.body === 'string' ? section.body : '' };
  });
  for (const error of errors) {
    const labels = [error.recommendation?.sectionTitle, error.topic].filter(
      (label): label is string => Boolean(label?.trim())
    );
    const candidates = new Set(
      topics.filter((topic) => labels.some((label) => normalize(label) === normalize(topic.title)))
    );
    // No asignar por coincidencias vagas ni resolver títulos duplicados arbitrariamente.
    if (candidates.size === 1) [...candidates][0].errors.push(error);
    else if (candidates.size === 0 && error.sourceType !== 'simulator' && error.correctAnswer) {
      // Recuperar registros previos usando su pregunta y respuesta originales,
      // con la misma asociación que utiliza la práctica actual. Nunca usar la
      // posición histórica de una tarjeta o summary-check: pudieron reordenarse.
      const index = findSummarySectionForQuestion(
        {
          topic: error.topic ?? undefined,
          prompt: error.prompt,
          answer: error.correctAnswer,
          reference: {
            sectionTitle: error.recommendation?.sectionTitle ?? null,
            excerpt: '',
            pageStart: null,
            pageEnd: null,
          },
        },
        associationSections
      );
      if (index >= 0) topics[index].errors.push(error);
      else unmatched.push(error);
    } else unmatched.push(error);
  }
  const unmatchedEvidence: PdfTopicEvidence[] = [];
  for (const record of evidence) {
    const labels = [record.topic, record.sectionTitle].filter((label): label is string =>
      Boolean(label?.trim())
    );
    const candidates = topics.filter((topic) =>
      labels.some((label) => normalize(label) === normalize(topic.title))
    );
    if (candidates.length === 1) candidates[0].evidence.push(record);
    else unmatchedEvidence.push(record);
  }
  return {
    topics,
    unmatched,
    unmatchedEvidence,
    tracked: topics.filter((topic) => topic.errors.length > 0).length,
    evaluated: topics.filter((topic) => topicAssessmentCount(topic) > 0).length,
  };
}
