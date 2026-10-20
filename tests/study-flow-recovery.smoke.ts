import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeStudyHtmlTables } from '../lib/student-materials/study-html-tables.ts';

const sample = [
  '### Tipos de ciencia',
  '<table><tr><th>Tipo</th><th>Descripción</th></tr><tr><td>Formales</td><td><strong>Lógica</strong> &amp; matemática</td></tr><tr><td>Fácticas</td><td>Observación y experimentación</td></tr></table>',
  'Ver en PDF · pág. 2',
].join('\n');

const normalized = normalizeStudyHtmlTables(sample);
assert.match(normalized, /^\| Tipo \| Descripción \|$/mu);
assert.match(normalized, /^\| --- \| --- \|$/mu);
assert.match(normalized, /^\| Formales \| \*\*Lógica\*\* & matemática \|$/mu);
assert.match(normalized, /^\| Fácticas \| Observación y experimentación \|$/mu);
assert.doesNotMatch(normalized, /<\/?(?:table|tr|th|td)/iu);
assert.match(normalized, /### Tipos de ciencia/);
assert.match(normalized, /Ver en PDF · pág. 2/);

assert.equal(normalizeStudyHtmlTables('Sin tablas'), 'Sin tablas');
const unsafe = normalizeStudyHtmlTables(
  '<table><tr><th>Texto</th><th>Código</th></tr><tr><td><img src=x onerror=alert(1)>Ver</td><td>5 &lt; 9</td></tr></table>'
);
assert.doesNotMatch(unsafe, /onerror|<img|<table/iu);
assert.match(unsafe, /\| Ver \| 5 < 9 \|/u);

const richText = readFileSync('components/study-rich-text.tsx', 'utf8');
assert.match(richText, /normalizeStudyHtmlTables\(body\)/);
assert.doesNotMatch(richText, /dangerouslySetInnerHTML/);

const exam = readFileSync('components/student-material-exam.tsx', 'utf8');
const progress = readFileSync('components/dashboard/pdf-progress-panel.tsx', 'utf8');
const workspace = readFileSync('components/material-study-workspace.tsx', 'utf8');
const page = readFileSync('app/materiales/[id]/page.tsx', 'utf8');

assert.match(exam, /Tu respuesta está guardada en este navegador|Tu respuesta está guardada/);
assert.match(exam, /window\.localStorage\.setItem\(draftStorageKey, JSON\.stringify\(draft\)\)/);
assert.match(exam, /window\.location\.assign\(url\.toString\(\)\)/);
assert.match(exam, /studyTopic/);
assert.match(exam, /Practicar de nuevo/);
assert.doesNotMatch(exam, /Continuar mi práctica/);
assert.match(workspace, /initialPracticeSectionIndex/);
assert.match(workspace, /initialReinforce=\{topicReturn\?\.reinforce\}/);
assert.match(page, /query\.studyTopic/);
assert.match(progress, /Entender mis errores/);
assert.match(progress, /Tu próximo paso/);
console.log('study-flow-recovery.smoke: OK');
