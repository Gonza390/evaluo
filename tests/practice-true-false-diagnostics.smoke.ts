import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { isPracticeUuid } from '../lib/student-materials/practice-request-validation.ts';
const read = (p:string) => readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ui=read('components/dashboard/practice-session.tsx');
const api=read('app/api/practice/true-false/route.ts');
const validMaterialId = '07f38305-3033-4373-9ebf-7e8503a95537';
assert.equal(isPracticeUuid(validMaterialId), true,
  'The real Supabase material UUID (8-4-4-4-12) must be accepted in localhost.');
assert.equal(isPracticeUuid(crypto.randomUUID()), true, 'New session IDs must be accepted.');
assert.equal(isPracticeUuid('07f38305-3033-4373-7e8503a95537'), false,
  'A four-group malformed ID must be rejected.');
assert.equal(isPracticeUuid('not-a-material'), false);
assert.equal(isPracticeUuid(null), false);
assert.match(api,/isPracticeUuid\(input\.materialId\)/,
  'True/False must use the canonical UUID guard, not its older four-group regex.');
assert.doesNotMatch(api,/const uuid =/, 'No duplicated endpoint-specific UUID validation.');

assert.match(ui,/response\.json\(\)\.catch\(\(\) => null\)/,
  'Unexpected HTML/error bodies should preserve HTTP status instead of disappearing.');
for(const status of [401,403,404,429,422,503,500]) {
  assert.match(ui,new RegExp('response\\.status === '+status),
    'Diagnose HTTP '+status+' explicitly.');
}
assert.match(ui,/data-practice-diagnostic/,'Show a short diagnostic code on localhost.');
assert.match(ui,/setTrueFalseDiagnostic\('HTTP ' \+ response\.status/,
  'Support should see the HTTP status and server error code.');
assert.match(ui,/material_not_found/);
assert.match(api,/export async function POST\(request: Request\)/);
assert.match(api,/async function handleVerifiedTrueFalse\(request: Request\)/);
assert.match(api,/error: 'server_unavailable'/);
assert.match(api,/error: 'generation_or_review_failed'/);
assert.match(api,/verifyGeneratedTrueFalse\(parsed,fragments\)/);
assert.match(api,/applyIndependentTrueFalseReview\(candidates,judgments,fragments\)/);
assert.match(api,/enforceStrictRateLimit\(/,
  'Safety: authenticated generated practices retain the cost-limiting gate.');
console.log('True/False API + client: classified errors, safe server failure and source verification passed.');
