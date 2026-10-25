/**
 * Declaración inicial de conocimientos previos: una elección por PDF.
 * En esta etapa se conserva en el navegador, sin crear tablas ni modificar producción.
 */
export const PRIOR_STUDY_VERSION = 'pdf_prior_study_v1';
export type PriorStudyChoice = 'not_studied' | 'already_studied';

export function priorStudyStorageKey(materialId: string): string {
  return `evaluo:${PRIOR_STUDY_VERSION}:${materialId}`;
}

export function isPriorStudyChoice(value: unknown): value is PriorStudyChoice {
  return value === 'not_studied' || value === 'already_studied';
}

export function shouldOpenPriorStudyPopup(input: {
  isOwner: boolean;
  isDemo: boolean;
  isOnboardingActive: boolean;
  isResumen: boolean;
  justUploaded: boolean;
  savedChoice: unknown;
}): boolean {
  return input.isOwner &&
    !input.isDemo &&
    !input.isOnboardingActive &&
    input.isResumen &&
    input.justUploaded &&
    !isPriorStudyChoice(input.savedChoice);
}
