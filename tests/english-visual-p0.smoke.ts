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
assert.ok(proxy.includes("loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)"));
assert.match(proxy, /if \(isSharedMaterialRoute\) loginUrl\.searchParams\.set\('reason', 'shared-pdf'\)/);

const enHome=read('components/marketing/home-redesign.tsx');
assert.match(enHome,/english \? "\/en\/login\?mode=login" : "\/login\?mode=login"/);
assert.match(enHome,/const premiumHref = english \? '\/en\/pricing'/);
assert.match(enHome,/<HomePdfPickerButton locale=\{locale\}/);
const practice = read('components/dashboard/practice-session.tsx');
for (const phrase of ['First, choose a concept', 'Then, select its definition', 'Want to try new real-world scenarios?', ' · Matched']) {
  assert.ok(practice.includes(phrase), 'English practice instructions missing '+phrase);
}

const navbar=read('components/navbar.tsx');
assert.match(navbar, /window\.location\.assign\(locale === 'en' \? '\/en\/login'/);
assert.match(navbar, /href=\{locale === 'en' \? '\/en\/login'/);
assert.ok(navbar.includes('Save your progress and study materials'));

const shell=read('components/ClientLayoutClient.tsx');
assert.match(shell, /window\.location\.assign\(locale === 'en' \? '\/en\/login'/);
for (const text of ['This week','Next milestone','Active streak','Keep studying','Close study streak summary','View study streak: ']) {
  assert.ok(shell.includes(text), 'English study shell missing '+text);
}
assert.ok(shell.includes("href: locale === 'en' ? '/en/resources'"));
assert.ok(shell.includes("href: locale === 'en' ? '/en/pdf-to-quiz'"));

const seoHeader=read('components/marketing/english-seo-header.tsx');
assert.match(seoHeader, /href="\/en\/login\?mode=signup&next=%2Fdashboard%3FopenUpload%3D1"/);
assert.ok(seoHeader.includes('Start studying'));

const enLayout=read('app/(en)/layout.tsx');
assert.ok(enLayout.includes('Study your PDF with AI and prepare for exams'));
assert.doesNotMatch(enLayout, /Estudiá tu PDF con IA y prepará tu examen/);

console.log('[english-visual-p0] Mobile nav, practice, feedback, study guide, English SEO CTA, sidebar login, metadata and auth destinations checked.');
