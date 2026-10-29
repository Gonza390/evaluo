import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workspace = readFileSync('components/material-study-workspace.tsx', 'utf8');
const richText = readFileSync('components/study-rich-text.tsx', 'utf8');
const styles = readFileSync('components/study/pdf-study-styles.ts', 'utf8');
const appLayout = readFileSync('components/ClientLayoutClient.tsx', 'utf8');

assert.match(appLayout, /isMaterialStudyRoute \? 'hidden md:block' : ''/,
  'On PDF routes the global Evaluo header should disappear only on mobile.');
assert.match(appLayout, /const isMaterialStudyRoute = pathname.startsWith\('\/materiales\/'\)/,
  'The mobile topbar exception must be restricted to PDF study routes.');
assert.match(workspace, /<h1 className="text-foreground min-w-0 truncate/,
  'Keep the primary PDF title in the reader navigation alongside Volver and Ver guía.');
assert.match(workspace, /<h2 className="text-foreground hidden max-w-\[1040px\].*md:block/,
  'Do not show the same PDF title again in the mobile summary.');
assert.match(workspace, /data-study-summary-intro/,
  'Hiding the duplicate title must not remove the introductory summary.');


assert.match(workspace, /data-study-summary-intro/,
  'El texto introductorio debe estar identificado para medir y controlar su altura.');
assert.match(workspace, /line-clamp-4 sm:line-clamp-none/,
  'La introducción larga sólo debe abreviarse en móvil.');
assert.match(workspace, /aria-expanded=\{summaryIntroExpanded\}/,
  'La descripción debe poder expandirse y contraerse de forma accesible.');
assert.match(workspace, /Leer introducción completa/,
  'El estudiante debe poder acceder a todo el contenido.');
assert.match(workspace, /max-w-\[1040px\] text-\[13px\] leading-\[1\.65\]/,
  'La introducción debe aprovechar más ancho con tipografía compacta.');
assert.match(workspace, /max-w-\[940px\] min-w-0/,
  'El lector de capítulos debe aprovechar el ancho disponible.');
assert.match(workspace, /text-\[16px\] leading-\[1\.4\] font-bold/,
  'Los títulos de capítulo deben mantener una jerarquía legible sin ocupar demasiado.');
assert.match(workspace, /border-b py-4 first:pt-0/,
  'Se deben reducir los espacios entre capítulos.');
assert.match(richText, /space-y-2\.5 \[&_h4\]:text-\[14\.5px\]/,
  'La densidad de los contenidos largos debe ser compacta.');
assert.match(richText, /\[&_p\]:text-\[13px\] \[&_p\]:leading-\[1\.6\]/,
  'El cuerpo de lectura debe ser legible y menos alto.');
assert.match(styles, /h-8 flex-none shrink-0 rounded-lg border px-2\.5 text-\[12px\]/,
  'Las pestañas del estudio deben ser compactas.');
assert.doesNotMatch(workspace, /transform:scale\(|zoom:/,
  'No usar zoom que distorsione los popups, controles o interacción.');

// La acción de Práctica debe ir después de las opciones, no taparlas en móvil.
assert.match(styles, /bg-card mt-4 flex justify-end border-t py-3/);
assert.doesNotMatch(styles, /sticky bottom-0/, 'Evitar un CTA flotante sobre las respuestas.');
const exam = readFileSync('components/student-material-exam.tsx', 'utf8');
assert.match(exam, /data-pdf-question-actions/);
assert.match(exam, /text-\[13px\] font-medium">{topicTitle}/);

console.log('Compact material study layout smoke: OK.');
