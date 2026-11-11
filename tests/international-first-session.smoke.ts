import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { firstUploadErrorMessage } from '../lib/i18n/first-upload-error.ts';

const read = (path: string) => readFileSync(path, 'utf8');

const picker = read('components/marketing/home-pdf-picker-button.tsx');
const home = read('components/marketing/home-redesign.tsx');
const login = read('components/LoginFormGoogleFirst.tsx');
const callback = read('app/(es)/auth/callback/route.ts');
const dashboard = read('app/(es)/dashboard/page.tsx');
const upload = read('components/dashboard/pdf-first-upload-shell.tsx');
const processing = read('components/pdf-processing/fullscreen-processing.tsx');
const processingEnglish = read('components/pdf-processing/english-processing-scene.tsx');
const status = read('components/material-study-status-workspace.tsx');
const material = read('app/(es)/materiales/[id]/page.tsx');
const study = read('components/material-study-workspace.tsx');
const seo = read('components/marketing/english-study-page.tsx');

assert.match(picker, /isSupportedStudentMaterialFile\(file\.name, file\.type\)/);
assert.match(picker, /accept="\.pdf,\.docx,/);
assert.match(picker, /locale === 'en' \? '\/en\/login' : '\/login'/);
assert.match(picker, /reason', 'pdf-first'/);
assert.match(picker, /savePdfFirstDraft\(file, source\)/);
assert.match(home, /\{!english && \(/, 'English homepage should not display region-specific university logos');
assert.match(login, /data: \{ ui_locale: 'en' \}/, 'English email signup must set the profile language');
assert.match(callback, /callback/); // OAuth callback itself must be retained.
assert.match(callback, /ui_locale: entryLocale/, 'English OAuth signup should persist the selected language');
assert.match(dashboard, /locale !== 'en' && hasReadyMaterial && openUpload !== '1'/,
  'A new English student should not see academic-profile interruption');
assert.match(upload, /const rawMessage = error instanceof Error \? error\.message : null;/);
assert.match(upload, /firstUploadErrorMessage\(rawMessage, locale\)/);
assert.match(upload, /t\("Subiendo tu apunte"\)/);
assert.match(processing, /useOptionalAppLocale\(\) === 'en'/);
assert.match(processing, /EnglishProcessingScene scene=\{visibleScene\}/);
assert.match(processing, /english \? 'Your document is ready to study'/);
assert.match(processing, /english \? 'Start topic 1'/);
assert.match(processingEnglish, /Illustrative example/);
assert.match(status, /locale = 'es'/);
assert.match(status, /english \? 'Preparing your study materials'/);
assert.match(material, /const shouldShowFirstPdfGuide = !isEnglishStudyEntry && eligibleByAccount/);
assert.match(material, /initialStudyStartGuideRequested=\{!isEnglishStudyEntry/);
assert.match(material, /locale=\{isEnglishStudyEntry \? 'en' : 'es'\}/);
assert.match(study, /data-reopen-first-pdf-guide/,
  'Optional help must remain available after suppressing the automatic tutorial');
assert.match(seo, /Study with my material/);
assert.match(seo, /next=%2Fdashboard%3FopenUpload%3D1/);

const original = 'Ya utilizaste tu material gratuito. Podés seguir estudiándolo o usar Premium para agregar otro.';
const quota = firstUploadErrorMessage(original, 'en');
assert.match(quota, /upload limit/);
assert.doesNotMatch(quota, /Podés|material gratuito/);
assert.equal(firstUploadErrorMessage(original, 'es'), original);
assert.match(firstUploadErrorMessage('El archivo supera el límite de 20 MB.', 'en'), /20 MB/);
assert.match(firstUploadErrorMessage('Escribí un nombre válido para tu PDF.', 'en'), /valid title/);
assert.match(firstUploadErrorMessage('No pudimos guardar la subida.', 'en'), /could not upload your file/);
assert.match(firstUploadErrorMessage('Iniciá sesión para subir tu material.', 'en'), /session has expired/);
assert.match(firstUploadErrorMessage('La materia seleccionada no corresponde a la carrera indicada.', 'en'), /course selection/);
console.log('[international-first-session] English PDF/DOCX first upload, no forced academic form or tour, localized processing and errors verified.');
