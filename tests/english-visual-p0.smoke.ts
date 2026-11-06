import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (path: string) => readFileSync(path, 'utf8');

const mobile = read('components/study/pdf-mobile-navigation.tsx');
assert.match(mobile, /useOptionalAppLocale\(\) === 'en'/);
for (const value of ['Summary','Practice','Progress','More','Glossary','Mind map']) {
  assert.ok(mobile.includes(value), 'English mobile navigation missing '+value);
}
assert.match(mobile, /english \? 'Study tools for this document'/);

const picker = read('components/dashboard/practice-mode-picker.tsx');
for (const value of ['How would you like to review?', 'Review duration', 'Continue', 'Practice']) {
  assert.ok(picker.includes(value), 'English practice selector missing '+value);
}
assert.ok(picker.includes('Evi thinking'));
assert.match(read('app/(es)/dashboard/materiales/subir/page.tsx'), /next\.set\('openUpload', '1'\)/);

const feedback = read('components/FeedbackDialog.tsx');
assert.match(feedback, /useOptionalAppLocale\(\) === 'en'/);
for(const value of ['Send feedback','Your feedback','Phone number','Category','Cancel','Sending...']) {
  assert.ok(feedback.includes(value), 'English feedback dialog missing '+value);
}
assert.match(feedback, /english \? "e\.g\., \+1/);

const guide=read('components/study/recommended-study-guide.tsx');
assert.match(guide,/const current = english \? englishSteps\[step\] : steps\[step\]/);
for (const value of ['Understand your notes','Check your understanding','See how you are doing','Learn how to review','Step ','Skip guide','Start studying']) {
  assert.ok(guide.includes(value), 'English optional tutorial missing '+value);
}

const proxy=read('proxy.ts');
assert.match(proxy, /savedLocale === 'en' \? '\/en\/login' : '\/login'/);
assert.match(proxy, /loginUrl\.searchParams\.set\('next', `${pathname}${request\.nextUrl\.search}`\)/);
assert.match(proxy, /if \(isSharedMaterialRoute\) loginUrl\.searchParams\.set\('reason', 'shared-pdf'\)/);

const enHome=read('components/marketing/home-redesign.tsx');
assert.match(enHome,/english \? "\/en\/login\?mode=login" : "\/login\?mode=login"/);
assert.match(enHome,/const premiumHref = english \? '\/en\/pricing'/);
assert.match(enHome,/<HomePdfPickerButton locale=\{locale\}/);
console.log('[english-visual-p0] Mobile study nav, practice, feedback, tutorial, expired sessions, English public CTAs and PDF-first destination checked.');
