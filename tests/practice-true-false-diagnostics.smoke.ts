import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = (p:string) => readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ui=read('components/dashboard/practice-session.tsx');
const api=read('app/api/practice/true-false/route.ts');
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
