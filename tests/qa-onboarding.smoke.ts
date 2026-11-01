import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isQaAccount } from '../lib/qa-account.ts';
import { shouldAutoStartFirstPdfOnboarding } from '../lib/first-pdf-onboarding.ts';

const qa = { email: 'gonza3900@gmail.com', app_metadata: { evaluo_qa_account: true } };
assert.equal(isQaAccount(qa), true);
assert.equal(isQaAccount({ ...qa, email: 'someone@example.com' }), false);
assert.equal(isQaAccount({ ...qa, app_metadata: {} }), false);
assert.equal(isQaAccount(null), false);

const completedAt = null;
const oldAccount = {
  accountCreatedAt: '2026-04-17T20:38:48.396Z',
  completedAt,
  previouslyCompleted: false,
  isOwner: true,
  materialReady: true,
};
assert.equal(shouldAutoStartFirstPdfOnboarding(oldAccount), false);
assert.equal(shouldAutoStartFirstPdfOnboarding({ ...oldAccount, isQaAccount: true }), true);
assert.equal(shouldAutoStartFirstPdfOnboarding({ ...oldAccount, isQaAccount: true, completedAt: 'done' }), false);
assert.equal(shouldAutoStartFirstPdfOnboarding({ ...oldAccount, isQaAccount: true, isOwner: false }), false);
assert.equal(shouldAutoStartFirstPdfOnboarding({ ...oldAccount, isQaAccount: true, materialReady: false }), false);

const restartAction = readFileSync('app/(es)/qa/actions.ts', 'utf8');
const testPage = readFileSync('app/(es)/qa/page.tsx', 'utf8');
const materialPage = readFileSync('app/(es)/materiales/[id]/page.tsx', 'utf8');
const analytics = readFileSync('app/api/analytics/track/route.ts', 'utf8');
const callback = readFileSync('app/(es)/auth/callback/route.ts', 'utf8');
assert.ok(restartAction.includes('supabase.auth.getUser()'));
assert.ok(restartAction.includes('isQaAccount(user)'));
assert.ok(restartAction.includes('isQaAccount(current.user)'));
assert.ok(restartAction.includes('delete metadata[FIRST_PDF_ONBOARDING_COMPLETED_KEY]'));
assert.ok(restartAction.includes('delete metadata[FIRST_PDF_ONBOARDING_SKIPPED_KEY]'));
assert.ok(!restartAction.includes('reset_test_user_data'), 'QA restart must not call destructive legacy RPC.');
assert.ok(!restartAction.includes('deleteUser('));
assert.ok(testPage.includes('if (!isQaAccount(user)) notFound()'));
assert.ok(materialPage.includes('isQaAccount: qaAccount'));
assert.ok(materialPage.includes('eligibleByAccount && user && !qaAccount'));
assert.ok(analytics.includes('if (isQaAccount(user)) {'));
assert.ok(analytics.includes("skipped: 'qa_user'"));
assert.ok(analytics.indexOf('if (isQaAccount(user)) {') < analytics.indexOf("delete().in('session_key'"),
  'QA bypass must happen before any session deletion.');
assert.ok(callback.includes('isAdminClientConfigured() && !qaAccount'));
assert.ok(!callback.includes(".delete().eq('session_key'"), 'QA login must never delete arbitrary analytics sessions.');
const signupDestination = readFileSync('lib/email-signup-destination.ts','utf8');
const studySpace = readFileSync('components/dashboard/maeve-study-space.tsx','utf8');
const dashboard = readFileSync('app/(es)/dashboard/page.tsx','utf8');
const uploadShell = readFileSync('components/dashboard/pdf-first-upload-shell.tsx','utf8');
assert.doesNotMatch(callback, /openUpload=1&source=signup-direct/,
  'Google signup must not auto-open first PDF popup');
assert.doesNotMatch(signupDestination, /openUpload=1&source=signup-direct/,
  'Email signup must not auto-open first PDF popup');
assert.match(signupDestination, /return path;/);
assert.match(studySpace, /initialSource !== 'signup-direct'/,
  'Old signup deep links must not re-open first PDF popup');
assert.match(dashboard, /source !== 'signup-direct'/);
assert.doesNotMatch(uploadShell, /Empecemos con tu primer material|isDirectSignupFirstPdf/,
  'Special first PDF popup must not be rendered');
assert.match(uploadShell, /initialOpen && initialSource !== 'signup-direct'/);
assert.match(uploadShell, /pickerRef\.current\?\.click\(\)/,
  'User initiated PDF upload must remain available');

console.log('QA account authorization and safe onboarding replay smoke tests passed.');
