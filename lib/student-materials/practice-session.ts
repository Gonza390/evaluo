import type { StudyQuestion } from './pedagogy';

export type PracticeDraft = {
  version: 1;
  materialId: string;
  bankSignature: string;
  questionIds: string[];
  selectedSize: number;
  currentIndex: number;
  selectedAnswers: Record<string, string>;
  openDrafts: Record<string, string>;
  revealed: Record<string, boolean>;
  openAssessments: Record<string, 'got_it' | 'review'>;
  answerIds: Record<string, string>;
  savedAnswerIds?: string[];
  sessionId?: string;
  contextUnavailable: boolean;
  savedAt: number;
};

const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

/** Sólo el orden/las respuestas, nunca se guarda todo el PDF o la clave de IA. */
export function practiceDraftKey(materialId: string) {
  return `evaluo:practice-draft:v1:${materialId}`;
}

/** Huella ligera para no retomar un banco que cambió al reprocesar el PDF. */
export function practiceBankSignature(questions: StudyQuestion[]) {
  let hash = 2166136261;
  for (const question of questions) {
    const text = `${question.id}| ${question.type}| ${question.prompt}| ${question.answer}| ${question.options.join(';')}\n`;
    for (let i = 0; i < text.length; i += 1) {
      hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0;
    }
  }
  return `${questions.length}:${hash.toString(36)}`;
}

export function readPracticeDraft(
  raw: string | null,
  materialId: string,
  availableQuestions: StudyQuestion[],
  now = Date.now()
): PracticeDraft | null {
  if (!raw || raw.length > 250_000) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== 'object') return null;
  const draft = value as Partial<PracticeDraft>;
  const currentSignature = practiceBankSignature(availableQuestions);
  // La v12 puede regenerar preguntas de OTROS temas sin modificar las
  // preguntas que componen esta tanda. No descartarla si todos sus IDs siguen
  // presentes: cada ID v11 deriva de enunciado, respuesta y referencia, y las
  // opciones seleccionadas se validan contra la nueva lista más abajo.
  if (
    draft.version !== 1 ||
    draft.materialId !== materialId ||
    typeof draft.bankSignature !== 'string' ||
    draft.bankSignature.length > 80 ||
    typeof draft.savedAt !== 'number' ||
    !Number.isFinite(draft.savedAt) ||
    draft.savedAt > now + 60_000 ||
    now - draft.savedAt > MAX_AGE_MS ||
    !Array.isArray(draft.questionIds) ||
    draft.questionIds.length < 1 ||
    draft.questionIds.length > availableQuestions.length ||
    !Number.isInteger(draft.currentIndex) ||
    draft.currentIndex! < 0 ||
    draft.currentIndex! >= draft.questionIds.length ||
    !Number.isInteger(draft.selectedSize) ||
    draft.selectedSize !== draft.questionIds.length
  ) return null;

  const available = new Map(availableQuestions.map((question) => [question.id, question]));
  if (
    draft.questionIds.some((id) => typeof id !== 'string' || !available.has(id)) ||
    new Set(draft.questionIds).size !== draft.questionIds.length
  ) return null;
  const ids = new Set(draft.questionIds);
  const sourceMap = Object.fromEntries(draft.questionIds.map((id) => [id, available.get(id)!]));
  const safeStringMap = (input: unknown, maxLength: number, isValid: (id: string, val: string) => boolean) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
    return Object.fromEntries(
      Object.entries(input).filter(([id, val]) =>
        ids.has(id) && typeof val === 'string' && val.length <= maxLength && isValid(id, val)
      )
    ) as Record<string, string>;
  };
  const safeBoolMap = (input: unknown) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
    return Object.fromEntries(
      Object.entries(input).filter(([id, value]) => ids.has(id) && value === true)
    ) as Record<string, boolean>;
  };
  const selectedAnswers = safeStringMap(draft.selectedAnswers, 2000, (id, val) =>
    sourceMap[id]?.type === 'multiple_choice' &&
    sourceMap[id]!.options.includes(val)
  );
  const openDrafts = safeStringMap(draft.openDrafts, 8000, (id) =>
    sourceMap[id]?.type === 'open'
  );
  const rawAssessments = safeStringMap(draft.openAssessments, 10, (id, val) =>
    sourceMap[id]?.type === 'open' && (val === 'got_it' || val === 'review')
  );
  const openAssessments: Record<string, 'got_it' | 'review'> = {};
  for (const [id, value] of Object.entries(rawAssessments)) {
    if (value === 'got_it' || value === 'review') openAssessments[id] = value;
  }
  const answerIds = safeStringMap(draft.answerIds, 80, () => true);
  return {
    version: 1,
    materialId,
    bankSignature: currentSignature,
    questionIds: draft.questionIds,
    selectedSize: draft.selectedSize,
    currentIndex: draft.currentIndex!,
    selectedAnswers,
    openDrafts,
    revealed: safeBoolMap(draft.revealed),
    openAssessments,
    answerIds,
    savedAnswerIds: Array.isArray(draft.savedAnswerIds)
      ? [...new Set(draft.savedAnswerIds.filter((id): id is string => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id)))].slice(0, draft.questionIds.length)
      : [],
    sessionId: typeof draft.sessionId === 'string' && /^[0-9a-f-]{36}$/i.test(draft.sessionId)
      ? draft.sessionId : undefined,
    contextUnavailable: draft.contextUnavailable === true,
    savedAt: draft.savedAt,
  };
}
