import type { PedagogicalArtifacts, StudyFlashcard, StudyQuestion } from './pedagogy';
import type { StudySummarySection } from './types';
import { auditPracticeFlashcard } from './practice-card-quality';
import { hasAmbiguousDistractors } from './practice-modes';

/** Conservador: ante una respuesta modelo sin sustento verificable, no presentarla al alumno. */
function norm(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase().replace(/[^a-z0-9]+/gu, ' ').trim();
}
function containsTerm(source: string, term: string) {
  const clean = norm(term);
  return clean.length >= 4 && (' ' + norm(source) + ' ').includes(' ' + clean + ' ');
}
function centralTerms(value: string) {
  const stop = new Set(['conocimiento','concepto','conceptos','enunciado','enunciados','cientifico','cientifica','material','entre','tiene','sobre','como','del','para','que','una','los','las','con','donde','cual','cuales','respuesta','idea','central','corresponde','explica','teoria','tipo']);
  return [...new Set(norm(value).split(' ').filter(t => t.length >= 5 && !stop.has(t)))];
}
function evidenceSupportsAnswer(answer: string, evidence: string): boolean {
  const words = centralTerms(answer);
  if (!words.length || norm(evidence).length < 30) return false;
  const matched = words.filter(t => (' '+norm(evidence)+' ').includes(' '+t+' ')).length;
  return matched >= Math.min(2, words.length) && matched / words.length >= 0.2;
}
function sectionForQuestion(question: StudyQuestion, sections: StudySummarySection[]) {
  const label = question.chapterTitle ?? (question.kind === 'section' ? question.topic : null);
  return sections.find(s => label && norm(s.title) === norm(label)) ?? null;
}
/**
 * Verifica correspondencia mínima entre el alcance de la consigna y la respuesta.
 * Conservador: solo exige etapas completas cuando el PDF las enumera
 * explícitamente, y contraste cuando la pregunta nombra dos entidades.
 */
export function incompleteOpenAnswerReason(
  question: StudyQuestion,
  sections: StudySummarySection[]
): string | null {
  if (question.type !== 'open') return null;

  if (question.kind === 'relationship' && /^\s*Compar[aá](?=\s|[“"])/iu.test(question.prompt)) {
    const pair = [...question.prompt.matchAll(/[“"]([^”"]+)[”"]/gu)]
      .map(match => match[1]?.trim() ?? '')
      .filter(Boolean)
      .slice(0, 2);
    if (pair.length === 2) {
      if (pair.some(entity => norm(entity).length >= 4 && !containsTerm(question.answer, entity))) {
        return 'comparison_answer_omits_entity';
      }
      if (!/\b(?:en cambio|mientras|a diferencia|por el contrario|sin embargo|en contraste|por su parte|frente a|versus)\b/u.test(norm(question.answer))) {
        return 'comparison_answer_lacks_contrast';
      }
    }
  }

  if (question.kind !== 'section') return null;
  const section = sectionForQuestion(question, sections);
  if (!section) return null;
  const focus = question.prompt.match(/[“"]([^”"]+)[”"]/u)?.[1] ?? question.topic ?? '';
  if (!/\b(?:proceso|procedimiento|etapas|fases|pasos|secuencia)\b/u.test(norm(focus))) {
    return null;
  }

  // Identificar el subtítulo exacto antes de evaluar pasos. No exigir etapas
  // que pertenezcan a otro tema del mismo capítulo.
  const subsection = section.body.split(/(?=^#{2,6}\s)/mu).find(block => {
    const heading = block.split('\n')[0]
      ?.replace(/^#{2,6}\s*/u, '')
      .replace(/^\d+(?:\.\d+)*\s+/u, '')
      .trim() ?? '';
    return norm(heading) === norm(focus);
  });
  const source = subsection ?? section.body;
  const stages = [...source.matchAll(/^\s*(?:\d{1,2}[.)]|(?:etapa|fase|paso)\s+\d+\s*[:.)-])\s*(?:\*\*)?\s*([^:\n]{4,100}):/gimu)]
    .map(match => (match[1] ?? '').replace(/\*\*/gu, '').trim())
    .filter(label => norm(label).length >= 4);
  if (stages.length < 3) return null;
  const covered = stages.filter(label => containsTerm(question.answer, label)).length;
  return covered >= Math.ceil(stages.length * 0.75)
    ? null
    : 'section_process_missing_stages';
}

export function unsafeModelAnswerReason(question: StudyQuestion, sections: StudySummarySection[]): string | null {
  if (!question.prompt.trim() || !question.answer.trim()) return 'answer_missing';
  if (question.type === 'multiple_choice') {
    if (!question.options.some(option => norm(option) === norm(question.answer))) {
      return 'correct_answer_not_in_options';
    }
    // Bloquear únicamente incompatibilidades evidentes: una descripción larga
    // que no comparte ningún término central con su cita en una pregunta factual.
    // La coincidencia léxica NO equivale a una validación semántica positiva.
    if (
      (question.kind === 'concept' || question.kind === 'relationship') &&
      norm(question.reference.excerpt).length >= 80
    ) {
      const keywords = centralTerms(question.answer);
      const excerpt = ' ' + norm(question.reference.excerpt) + ' ';
      const overlap = keywords.filter(word => excerpt.includes(' ' + word + ' ')).length;
      if (keywords.length >= 6 && overlap === 0) return 'model_answer_unrelated_to_source';
    }
    return null;
  }

  // Bancos históricos: en algunos PDFs "aclarar la confusión" tenía
  // literalmente como respuesta modelo la misma confusión del enunciado.
  if (question.kind === 'confusion') {
    const claimedMisconception = question.prompt.match(/[“"]([^”"]{12,})[”"]/u)?.[1];
    if (
      claimedMisconception &&
      norm(question.answer) === norm(claimedMisconception)
    ) return 'confusion_answer_repeats_misconception';
  }
  if (
    question.kind === 'relationship' &&
    /^Compar[aá](?:\s|$)/iu.test(question.prompt) &&
    norm(question.answer) === norm(question.reference.excerpt || '') &&
    !/\ben cambio\b|\bmientras\b|\ba diferencia\b|\bpor otro lado\b|\ben contraste\b|\bversus\b/iu.test(question.answer)
  ) return 'comparison_copies_source_without_contrast';

  const section = sectionForQuestion(question, sections);
  const reference = question.reference.excerpt || '';
  const evidence = section ? section.body : reference;
  if (question.kind === 'section') {
    if (!section) return 'section_without_chapter';
    const answerWithoutNumber = question.answer
      .replace(/^\s*(?:#{1,6}\s*)?\d+(?:\.\d+)*[.)]?\s+/u, '')
      .trim();
    if (
      answerWithoutNumber.split(/\s+/u).length < 12 ||
      (answerWithoutNumber.length < 140 && !/[.!?]/u.test(answerWithoutNumber))
    ) return 'section_answer_is_heading_not_explanation';
    const named = [...question.answer.matchAll(/Un concepto clave es\s+[“"]([^”"]+)[”"]/giu)];
    if (named.some(match => !containsTerm(section.body, match[1] ?? ''))) {
      return 'section_answer_contains_foreign_concepts';
    }
    // Una respuesta abierta tiene que desarrollar lo preguntado, no combinar
    // conceptos de otro capítulo sólo por cercanía en la página.
    if (!evidenceSupportsAnswer(question.answer, section.body)) return 'section_answer_not_grounded';
    const completenessIssue = incompleteOpenAnswerReason(question, sections);
    if (completenessIssue) return completenessIssue;
  }
  if (question.kind === 'confusion' || question.kind === 'relationship') {
    if (question.kind === 'relationship' && /\bEn cambio\b/iu.test(question.answer)) {
      const parts = question.answer.match(/^[“"]([^”"]+)[”"] se caracteriza en el material por:\s*([\s\S]+?)\s+En cambio,\s+[“"]([^”"]+)[”"] se caracteriza por:\s*([\s\S]+)$/iu);
      if (!parts) return 'comparison_structure_unverifiable';
      if (norm(parts[2] ?? '') === norm(parts[4] ?? '')) return 'contrast_repeats_same_definition';
      if (!containsTerm(evidence, parts[1] ?? '') || !containsTerm(evidence, parts[3] ?? '')) {
        return 'comparison_not_supported_by_source';
      }
      if (!evidenceSupportsAnswer(parts[2] ?? '', evidence) || !evidenceSupportsAnswer(parts[4] ?? '', evidence)) {
        return 'comparison_answer_not_grounded';
      }
    }
    if (/^La distinci[oó]n clave es esta:/iu.test(question.answer)) {
      const match = question.answer.match(/^[\s\S]*?[“"]([^”"]+)[”"]\s+([\s\S]+?)\s+En cambio,\s+[“"]([^”"]+)[”"]\s+([\s\S]+)$/iu);
      if (!match) return 'contrast_unverifiable';
      const left = norm(match[2] ?? '');
      const right = norm(match[4] ?? '');
      if (!left || !right || left === right) return 'contrast_repeats_same_definition';
      if (!containsTerm(evidence, match[1] ?? '') || !containsTerm(evidence, match[3] ?? '')) {
        return 'contrast_not_in_source';
      }
      if (!evidenceSupportsAnswer(match[2] ?? '', evidence) || !evidenceSupportsAnswer(match[4] ?? '', evidence)) {
        return 'contrast_answer_not_grounded';
      }
    } else if (/^La evidencia del PDF permite|^Para evitar la confusi[oó]n|^La confusi[oó]n consiste/iu.test(question.answer)) {
      return 'confusion_fallback_unreliable';
    }
    if (!evidenceSupportsAnswer(question.answer, evidence)) return 'open_answer_not_grounded';
    const completenessIssue = incompleteOpenAnswerReason(question, sections);
    if (completenessIssue) return completenessIssue;
  }
  return null;
}
export function unsafeFlashcardReason(card: StudyFlashcard): string | null {
  const front = card.front.trim();
  const back = card.back.trim();
  if (!front || !back) return 'flashcard_incomplete';
  if (/^¿C[oó]mo distingu[ií]s\b/iu.test(front) &&
    /^Confundir\b/iu.test(back)) return 'flashcard_repeats_misconception';
  if (/^Confundir\b/iu.test(back)) return 'flashcard_teaches_misconception';
  // Una tarjeta sobre una confusión debe enseñar la distinción o la solución,
  // no repetir literalmente la falsa creencia del enunciado.
  if (
    /^Creer que\b/iu.test(back) &&
    /(?:qu[eé] problema conceptual|qu[eé] confusi[oó]n|c[oó]mo distingu[ií]s)/iu.test(front)
  ) return 'flashcard_repeats_false_belief';
  if (
    /^¿C[oó]mo distingu[ií]s\b/iu.test(front) &&
    norm(front).includes(norm(back)) &&
    !/en cambio|mientras|a diferencia|por otro lado/iu.test(back)
  ) return 'flashcard_does_not_explain_distinction';
  return null;
}

/** La taxonomía refleja el esfuerzo mental real, no la formulación del verbo. */
export function accurateFlashcardLevel(card: StudyFlashcard): StudyFlashcard['level'] {
  if (
    card.kind === 'concept' || card.kind === 'classification' ||
    card.kind === 'formula' || card.kind === 'process' ||
    /^(?:¿Qu[eé] significa|¿Qu[eé] elementos incluye|¿Qu[eé] representa|¿C[oó]mo explicar[ií]as|¿C[oó]mo se clasifica|Reconstru[ií] el proceso)/iu.test(card.front.trim())
  ) return 'recordar';
  return card.level;
}
export function isRecognitionPresentedAsHigherOrder(question: StudyQuestion) {
  if (question.level === 'recordar') return false;
  return (
    /^(?:¿Cu[aá]l de estas afirmaciones representa mejor|¿Cu[aá]l opci[oó]n explica mejor|¿Qu[eé] caracteriza mejor a|Un caso del material se describe as[ií]:|¿Qu[eé] explica el PDF sobre)/iu.test(question.prompt) ||
    (question.level === 'aplicar' &&
      /^(?:En una situaci[oó]n se observan estas acciones|¿Qu[eé] proceso del PDF describe)/iu.test(question.prompt))
  );
}
export function sanitizePedagogicalArtifacts(
  artifacts: PedagogicalArtifacts,
  sections: StudySummarySection[]
): PedagogicalArtifacts {
  const rejectedReasons: string[] = [];
  const questions = artifacts.questions.filter(question => {
    // Legacy questions are used both by the PDF study workspace and Practicar.
    // Never present a single-answer MCQ with two near-equivalent alternatives.
    const reason = question.type === 'multiple_choice' &&
      hasAmbiguousDistractors(question) ? 'near_equivalent_mcq_distractors' :
      unsafeModelAnswerReason(question, sections);
    if (reason) rejectedReasons.push(reason);
    return !reason;
  }).map(question => isRecognitionPresentedAsHigherOrder(question)
    ? { ...question, level: (question.kind === 'process' ? 'comprender' : 'recordar') as StudyQuestion['level'] }
    : question);
  const flashcards = artifacts.flashcards.filter(card => {
    const review = auditPracticeFlashcard(card);
    const reason = unsafeFlashcardReason(card) ?? review.reasons[0] ?? null;
    if (reason) rejectedReasons.push(reason);
    return !reason;
  }).map(card => ({ ...card, level: accurateFlashcardLevel(card) }));
  const allowed = new Set(questions.map(question => question.id));
  const items = [...questions, ...flashcards];
  const prior = artifacts.integrity;
  return {
    ...artifacts,
    questions,
    flashcards,
    miniExamQuestionIds: artifacts.miniExamQuestionIds.filter(id => allowed.has(id)),
    coverage: {
      ...artifacts.coverage,
      referencedItems: items.filter(item =>
        item.reference.pageStart !== null || item.reference.excerpt.trim().length > 0
      ).length,
      totalItems: items.length,
    },
    integrity: {
      rejectedQuestions: (prior?.rejectedQuestions ?? 0) + artifacts.questions.length - questions.length,
      rejectedFlashcards: (prior?.rejectedFlashcards ?? 0) + artifacts.flashcards.length - flashcards.length,
      rejectedReasons: [...(prior?.rejectedReasons ?? []), ...rejectedReasons],
    },
  };
}
