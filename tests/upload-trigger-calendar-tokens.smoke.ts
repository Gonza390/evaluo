import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const file = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

const shell = file('components/dashboard/pdf-first-upload-shell.tsx');
const chrome = file('components/dashboard/maeve-dashboard-chrome.tsx');
const hero = file('components/dashboard/maeve-study-hero.tsx');
const materials = file('components/dashboard/student-materials-workspace.tsx');
const panel = file('components/study-state-panel.tsx');
const calendar = file('app/(es)/calendario/page.tsx');
const globals = file('app/globals.css');

assert.doesNotMatch(shell, /isUploadTriggerLabel|textContent|handleCapturedClick|onClickCapture/,
  'Upload detection must not depend on button text or intercept capture-phase events.');
assert.match(shell, /createContext<\(\(location\?: string\) => void\) \| null>/);
assert.match(shell, /<PdfUploadTriggerContext.Provider value=\{openUploadPicker\}>/,
  'Every dashboard CTA should have a direct upload action.');
assert.match(shell, /const openUploadPicker = useCallback/);
assert.match(shell, /pickerRef\.current\?\.click\(\)/);
assert.match(shell, /const \[open, setOpen\] = useState\(initialOpen && initialSource !== 'signup-direct'\)/,
  'Preserve upload deep-link behavior after removing text interception.');
assert.match(shell, /trackMarketingEvent\('pdf_picker_opened'/,
  'Preserve picker analytics when called directly.');
assert.match(shell, /location === 'dashboard_empty'/,
  'Preserve first PDF acquisition attribution.');

assert.match(chrome, /const openUploadPicker = usePdfUploadTrigger\(\)/);
assert.match(chrome, /onUploadClick=\{openUpload\}/);
assert.doesNotMatch(chrome, /router\.replace\(/,
  'Buttons should no longer reload the dashboard via query-string toggling.');
assert.match(hero, /onClick=\{onUploadClick\}/,
  'Both hero CTAs must retain explicit click handlers.');
assert.doesNotMatch(materials, /dashboard_materials_header/,
  'Do not render a second PDF upload CTA in Tus PDFs; use the hero action instead.');
assert.match(materials, /onPrimaryAction=\{\(\) => openUploadPicker\('dashboard_empty_materials'\)\}/);
assert.match(panel, /onClick=\{onPrimaryAction\}/,
  'Empty-state primary action must remain a functional button.');
assert.match(materials, /href=\{getStudentMaterialRoute\(material\.id\)\}/,
  'PDF opening links must not be repurposed as upload triggers.');
assert.match(materials, /setMaterialToDelete\(material\)/,
  'Deleting PDFs must remain independent of the picker.');

assert.match(globals, /--color-heading: var\(--heading\);/);
assert.match(calendar, /text-heading/);
assert.match(calendar, /border-brand\/25 bg-brand\/10/,
  'Calendar controls retain shared brand colors without requiring a decorative gradient.');
assert.match(calendar, /text-brand/);
assert.match(calendar, /var\(--brand\)/);
assert.doesNotMatch(calendar, /#050B2C|#2563EB|#6366F1/,
  'Use shared tokens for heading and brand blue rather than isolated hex.');
assert.doesNotMatch(calendar, /!isCurrentMonth \? 'text-slate-300'/,
  'Dates outside the visible month should retain readable contrast.');
console.log('upload-trigger-calendar-tokens.smoke passed');
