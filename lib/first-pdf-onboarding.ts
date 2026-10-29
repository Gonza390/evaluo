/** The four-step guide is automatically offered to accounts created since its public rollout. */
export const FIRST_PDF_ONBOARDING_ROLLOUT_AT = '2026-10-20T17:17:07.479Z';
export const FIRST_PDF_ONBOARDING_COMPLETED_KEY = 'evaluo_first_pdf_onboarding_completed_at';
export const FIRST_PDF_ONBOARDING_SKIPPED_KEY = 'evaluo_first_pdf_onboarding_skipped_at';

export function shouldAutoStartFirstPdfOnboarding(input: {
  accountCreatedAt: string | null | undefined;
  completedAt: unknown;
  skippedAt?: unknown;
  previouslyCompleted: boolean;
  isOwner: boolean;
  materialReady: boolean;
  isQaAccount?: boolean;
}) {
  const createdAt = Date.parse(input.accountCreatedAt ?? '');
  const dateEligible = Number.isFinite(createdAt) &&
    createdAt >= Date.parse(FIRST_PDF_ONBOARDING_ROLLOUT_AT);
  return (
    (dateEligible || input.isQaAccount === true) &&
    input.isOwner &&
    input.materialReady &&
    !input.completedAt &&
    !input.skippedAt &&
    !input.previouslyCompleted
  );
}
