import type { PedagogicalArtifacts, StudyFlashcard, StudyQuestion } from './pedagogy';
import type { StudySummarySection } from './types';

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
    /^Compar[aá]\b/iu.test(question.prompt) &&
    norm(question.answer) === norm(question.reference.excerpt || '') &&
    !/\ben cambio\b|\bmientras\b|\ba diferencia\b|\bpor otro lado\b|\ben contraste\b|\bversus\b/iu.test(question.answer)
  ) return 'comparison_copies_source_without_contrast';

  const section = sectionForQuestion(question, sections);
  const reference = question.reference.excerpt || '';
  const evidence = section ? section.body : reference;
  if (question.kind === 'section') {
    if (!section) return 'section_without_chapter';
    const named = [...question.answer.matchAll(/Un concepto clave es\s+[“"]([^”"]+)[”"]/giu)];
    if (named.some(match => !containsTerm(section.body, match[1] ?? ''))) {
      return 'section_answer_contains_foreign_concepts';
    }
    // Una respuesta abierta tiene que desarrollar lo preguntado, no combinar
    // conceptos de otro capítulo sólo por cercanía en la página.
    if (!evidenceSupportsAnswer(question.answer, section.body)) return 'section_answer_not_grounded';
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
  }
  return null;
}
export function unsafeFlashcardReason(card: StudyFlashcard): string | null {
  if (/^\s*¿C[oó]mo distingu[ií]s\b/iu.test(card.front) &&
    /^\s*Confundir\b/iu.test(card.back)) return 'flashcard_repeats_misconception';
  if (/^\s*Confundir\b/iu.test(card.back)) return 'flashcard_teaches_misconception';
  return null;
}
export function isRecognitionPresentedAsHigherOrder(question: StudyQuestion) {
  if (question.level === 'recordar') return false;
  return (
    /^(?:¿Cu[aá]l de estas afirmaciones representa mejor|¿Cu[aá]l opci[oó]n explica mejor|Un caso del material se describe as[ií]:|¿Qu[eé] explica el PDF sobre)/iu.test(question.prompt) ||
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
    const reason = unsafeModelAnswerReason(question, sections);
    if (reason) rejectedReasons.push(reason);
    return !reason;
  });
  const flashcards = artifacts.flashcards.filter(card => {
    const reason = unsafeFlashcardReason(card);
    if (reason) rejectedReasons.push(reason);
    return !reason;
  });
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
