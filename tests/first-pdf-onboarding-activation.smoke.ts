import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  FIRST_PDF_ONBOARDING_COMPLETED_KEY,
  FIRST_PDF_ONBOARDING_ROLLOUT_AT,
  shouldAutoStartFirstPdfOnboarding,
} from '../lib/first-pdf-onboarding.ts';

const t = Date.parse(FIRST_PDF_ONBOARDING_ROLLOUT_AT);
const eligible = {
  accountCreatedAt: new Date(t + 1000).toISOString(),
  completedAt: null,
  previouslyCompleted: false,
  isOwner: true,
  materialReady: true,
};
assert.equal(shouldAutoStartFirstPdfOnboarding(eligible), true);
assert.equal(shouldAutoStartFirstPdfOnboarding({
  ...eligible, accountCreatedAt: new Date(t - 1000).toISOString(),
}), false, 'Existing accounts must not be interrupted by a new automatic tour.');
assert.equal(shouldAutoStartFirstPdfOnboarding({ ...eligible, completedAt: new Date().toISOString() }),
  false, 'A saved completion must be permanent across sessions.');
assert.equal(shouldAutoStartFirstPdfOnboarding({ ...eligible, previouslyCompleted: true }),
  false, 'Previously completed guides must not replay.');
assert.equal(shouldAutoStartFirstPdfOnboarding({ ...eligible, isOwner: false }),
  false, 'A shared PDF visitor cannot be forced into an owner-only progress guide.');
assert.equal(shouldAutoStartFirstPdfOnboarding({ ...eligible, materialReady: false }),
  false, 'A pending PDF cannot host the four-step guide.');
assert.equal(shouldAutoStartFirstPdfOnboarding({ ...eligible, accountCreatedAt: '' }), false);
assert.equal(shouldAutoStartFirstPdfOnboarding({ ...eligible }), true,
  'Skipping without completion must not permanently dismiss the guide.');

const action = readFileSync('app/materiales/[id]/onboarding-actions.ts','utf8');
const page = readFileSync('app/materiales/[id]/page.tsx','utf8');
const workspace = readFileSync('components/material-study-workspace.tsx','utf8');
assert.match(action, /'use server'/);
assert.match(action, /supabase\.auth\.getUser\(\)/);
assert.match(action, /admin\.auth\.admin\.updateUserById\(user\.id/);
assert.match(action, /app_metadata:/);
assert.match(action, /FIRST_PDF_ONBOARDING_COMPLETED_KEY/);
assert.match(action, /\.\.\.\(user\.app_metadata \?\? \{\}\)/,
  'Preserve existing auth application metadata.');
assert.match(page, /user\?\.app_metadata\?\.\[FIRST_PDF_ONBOARDING_COMPLETED_KEY\]/);
assert.match(page, /initialRecommendedStudy=\{shouldShowFirstPdfGuide\}/);
assert.match(page, /initialProgressOpen=\{isOwner && query\.tab === 'progreso' && !shouldShowFirstPdfGuide\}/);
assert.match(page, /initialDiagnostic=\{isOwner && query\.diagnostico === '1' && !shouldShowFirstPdfGuide\}/);
assert.match(page, /recommendedStudyAvailable=\{eligibleByAccount\}/);
assert.match(workspace, /await completeFirstPdfOnboardingAction\(\)/,
  'The finish CTA must persist completion before closing.');
assert.match(workspace, /if \(!result\.success\)/);
assert.match(workspace, /closeRecommendedTour\('completed'\)/);
assert.match(workspace, /closeRecommendedTour\('skipped'\)/);
assert.ok(FIRST_PDF_ONBOARDING_COMPLETED_KEY.startsWith('evaluo_'));
console.log('first-pdf-onboarding-activation.smoke passed');
