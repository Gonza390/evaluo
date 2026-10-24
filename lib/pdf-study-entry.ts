/**
 * El inicio de estudio se elige por PDF, independientemente del onboarding
 * de cuatro pasos (que se completa una sola vez por cuenta).
 * Solo se guarda el identificador del PDF y la opción elegida, no su contenido.
 */
export const PDF_STUDY_ENTRY_VERSION = 'pdf_study_entry_v1';
export type PdfStudyEntryChoice = 'not_studied' | 'some_knowledge' | 'free_exploration';

export function getPdfStudyEntryStorageKey(materialId: string): string {
  return `evaluo:${PDF_STUDY_ENTRY_VERSION}:${materialId}`;
}

export function isSavedPdfStudyEntryChoice(value: unknown): value is PdfStudyEntryChoice {
  return value === 'not_studied' || value === 'some_knowledge' || value === 'free_exploration';
}

export function shouldPresentPdfStudyEntry(input: {
  isOwner: boolean;
  isReady: boolean;
  entryRequested: boolean;
  guideActive: boolean;
  savedChoice: unknown;
}): boolean {
  return input.isOwner &&
    input.isReady &&
    input.entryRequested &&
    !input.guideActive &&
    !isSavedPdfStudyEntryChoice(input.savedChoice);
}
