/** The four-step guide is automatically offered to accounts created since its public rollout. */
export const FIRST_PDF_ONBOARDING_ROLLOUT_AT = '2026-10-20T17:17:07.479Z';
export const FIRST_PDF_ONBOARDING_COMPLETED_KEY = 'evaluo_first_pdf_onboarding_completed_at';

export function shouldAutoStartFirstPdfOnboarding(input: {
  accountCreatedAt: string | null | undefined;
  completedAt: unknown;
  previouslyCompleted: boolean;
  isOwner: boolean;
  materialReady: boolean;
}) {
  const createdAt = Date.parse(input.accountCreatedAt ?? '');
  if (!Number.isFinite(createdAt)) return false;
  return (
    createdAt >= Date.parse(FIRST_PDF_ONBOARDING_ROLLOUT_AT) &&
    input.isOwner &&
    input.materialReady &&
    !input.completedAt &&
    !input.previouslyCompleted
  );
}
