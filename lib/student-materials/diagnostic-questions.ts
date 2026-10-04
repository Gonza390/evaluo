import type { PedagogicalArtifacts, StudyQuestion } from './pedagogy';

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isEligible(question: StudyQuestion) {
  if (question.type !== 'multiple_choice') return false;
  if (question.kind === 'confusion') return false;
  if (!question.prompt.trim() || !question.answer.trim() || question.options.length < 3)
    return false;
  const answer = normalize(question.answer);
  return question.options.some((option) => normalize(option) === answer);
}

export function selectDiagnosticQuestions(artifacts: PedagogicalArtifacts, target = 6) {
  const preferredIds = new Set(artifacts.miniExamQuestionIds);
  const candidates = artifacts.questions
    .filter(isEligible)
    .map((question, index) => ({
      question,
      index,
      preferred: preferredIds.has(question.id) ? 1 : 0,
    }))
    .sort((left, right) => right.preferred - left.preferred || left.index - right.index)
    .map(({ question }) => question);

  const selected: StudyQuestion[] = [];
  const selectedIds = new Set<string>();
  const topics = new Set<string>();

  for (const question of candidates) {
    if (selectedIds.has(question.id)) continue;
    const topic = normalize(question.topic ?? question.reference.sectionTitle ?? '');
    if (!topic || topics.has(topic)) continue;
    selected.push(question);
    selectedIds.add(question.id);
    topics.add(topic);
    if (selected.length >= target) return selected;
  }

  for (const question of candidates) {
    if (selectedIds.has(question.id)) continue;
    selected.push(question);
    selectedIds.add(question.id);
    if (selected.length >= target) break;
  }

  return selected;
}
