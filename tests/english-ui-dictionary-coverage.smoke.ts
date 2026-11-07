import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Check the strings actually requested by the student-facing UI. Previously a
// missing dictionary key silently returned Spanish even though builds passed.
const read = (path: string) => readFileSync(path, 'utf8');
const dictionaryKeys = (path: string) => new Set(
  [...read(path).matchAll(/^\s*"([^"]+)":/gm)].map(match => match[1])
);
const study = dictionaryKeys('lib/i18n/study-ui-copy.ts');
const exam = dictionaryKeys('lib/i18n/exam-ui-copy.ts');
const studentFacingFiles = [
  'components/dashboard/student-materials-workspace.tsx',
  'components/dashboard/pdf-first-upload-shell.tsx',
  'components/dashboard/pdf-progress-panel.tsx',
  'components/dashboard/practice-results-screen.tsx',
  'components/dashboard/practice-session.tsx',
  'components/dashboard/study-plan-setup.tsx',
  'components/dashboard/practice-mode-picker.tsx',
  'components/dashboard/saved-study-plan-roadmap.tsx',
  'components/dashboard/saved-study-plan-schedule.tsx',
  'components/student-material-flashcards.tsx',
  'components/student-material-diagnostic.tsx',
  'components/student-material-exam.tsx',
  'app/(es)/calendario/page.tsx',
];
let checked = 0;
for (const file of studentFacingFiles) {
  const used = [...read(file).matchAll(/\bt\(\s*(["'])(.*?)\1\s*\)/g)].map(m => m[2]);
  const missing = [...new Set(used.filter(key => !study.has(key) && !exam.has(key)))];
  assert.deepEqual(missing, [], file + ': untranslated literal UI strings');
  checked += used.length;
}
const login = read('components/LoginFormGoogleFirst.tsx');
assert.doesNotMatch(login, /Some advanced study tools, account emails and payment screens are still being translated/);
assert.match(read('components/settings/profile-settings-form.tsx'), /Current year of your degree program/);
const sql = read('supabase/migrations/20261106200000_free_study_v2_i18n_cache_modes.sql');
for (const mode of ['true_false:en', 'cases:en', 'matching:en', 'flashcards:en']) {
  assert.ok(sql.includes(mode), mode + ' must be allowed in bank cache');
}
assert.match(sql, /round:\[0-4\]\(:en\)\?/);
console.log('[english-dictionary] ' + checked + ' literal UI calls covered across ' + studentFacingFiles.length + ' key student screens.');
