import { normalizedAnswer } from './practice-modes';

export type PracticeFlashcard = {
  front: string;
  back: string;
  reference?: { pageStart?: number | null; sectionTitle?: string | null; excerpt?: string | null } | null;
};
export type FlashcardReview = {
  approved: boolean;
  reasons: string[];
  improvements: string[];
};

/** Read-only QA gate: never edits, deletes or regenerates existing Flashcards. */
export function auditPracticeFlashcard(card: PracticeFlashcard): FlashcardReview {
  const front = normalizedAnswer(card.front);
  const back = normalizedAnswer(card.back);
  const reasons: string[] = [], improvements: string[] = [];
  if (front.length < 14 || back.length < 17) reasons.push('insufficient_content');
  const ref = card.reference;
  const anchored = (typeof ref?.pageStart === 'number' && ref.pageStart > 0) ||
    (typeof ref?.sectionTitle === 'string' && ref.sectionTitle.trim().length > 0) ||
    // Some legitimate Word notes contain no headings: an extracted excerpt
    // still gives students a traceable passage without fictitious pages.
    (ref?.pageStart === null && typeof ref.excerpt === 'string' &&
      ref.excerpt.trim().length >= 80);
  if (!anchored || typeof ref?.excerpt !== 'string' ||
      ref.excerpt.trim().length < 40) reasons.push('missing_source');
  if (/(?:materia correspondiente|carrera a la que pertenece|universidad que imparte|documento original|tu espacio academico|seguir estudiando este material)/.test(back) ||
      /^(?:que significa|cual es) (?:desarrollo emprendedor|licenciatura en comercializacion)/.test(front)) {
    reasons.push('nonacademic_document_metadata');
  }
  if (front.includes(back) && back.length >= 24) reasons.push('answer_revealed');
  if (back.includes('penetracion de mercado') &&
      back.includes('riesgo medio') &&
      back.includes('desarrollo de mercados') && back.includes('riesgo bajo')) {
    reasons.push('unverified_ansoff_risk_ranking');
  }
  if (/segun (?:el pdf|el material)/.test(front)) improvements.push('replace_generic_prompt');
  if (card.back.length > 360 ||
      card.back.split(/\s*[·;]\s*/).length >= 5) improvements.push('split_into_single_target_cards');
  return { approved: reasons.length === 0, reasons, improvements };
}
