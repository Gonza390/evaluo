import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { exceedsFreePdfPageLimit } from '../lib/student-materials/pdf-page-count-client.ts';
import { sanitizeAnalyticsMetadata } from '../lib/analytics-metadata.ts';
import { isAllowedAnalyticsEventName } from '../lib/analytics-events.ts';

// Onboarding etapa 1: las subidas que fallan se registran, el PDF se valida antes
// del registro y la pantalla vacía muestra solo los formatos que se aceptan.
const read = (path: string) => readFileSync(path, 'utf8');

// Margen de una página (portada de Studocu), igual que el servidor.
assert.equal(exceedsFreePdfPageLimit(null, 100), false, 'Sin conteo no se bloquea la subida');
assert.equal(exceedsFreePdfPageLimit(100, 100), false);
assert.equal(exceedsFreePdfPageLimit(101, 100), false);
assert.equal(exceedsFreePdfPageLimit(102, 100), true);

assert.equal(isAllowedAnalyticsEventName('pdf_upload_failed'), true);
assert.deepEqual(
  sanitizeAnalyticsMetadata('pdf_upload_failed', {
    stage: 'transfer', source: 'dashboard', flow: 'manual', file_size_bytes: 1, page_count: 3,
    max_pages: null, error_message: 'x', file_name: 'no se guarda',
  }),
  { stage: 'transfer', source: 'dashboard', flow: 'manual', file_size_bytes: 1, page_count: 3, max_pages: null, error_message: 'x' }
);

const shell = read('components/dashboard/pdf-first-upload-shell.tsx');
assert.match(shell, /countPdfPagesInBrowser\(activeFile\)/);
assert.match(shell, /preparePdfFirstUploadAction\(\{ metadata, file: fileMetadata, declaredPageCount \}\)/);
assert.match(shell, /trackMarketingEvent\('pdf_upload_started', \{\n\s+source: uploadSource/,
  'pdf_upload_started se registra en toda subida, no solo al retomar el borrador');
for (const stage of ['plan_limit', 'page_limit', 'draft_restore', 'too_large']) {
  assert.match(shell, new RegExp(`'${stage}'`), `falta registrar ${stage}`);
}
assert.match(shell, /stage = 'transfer';/);
assert.match(shell, /stage = 'finalize';/);
assert.match(shell, /data-upload-error/, 'el error se muestra dentro del diálogo');
assert.match(shell, /Boolean\(uploadError\?\.blocking\)/, 'no se reintenta un archivo que va a fallar igual');

const actions = read('app/(es)/dashboard/materiales/pdf-first-upload-actions.ts');
assert.match(actions, /assertDeclaredPdfPageCountWithinLimit\(input\.declaredPageCount\)/);

for (const landing of ['components/marketing/home-pdf-picker-button.tsx', 'components/marketing/pdf-first-landing-uploader.tsx']) {
  const source = read(landing);
  assert.match(source, /stage: 'pre_signup_page_limit'/, `${landing}: validar páginas antes del registro`);
  assert.ok(
    source.indexOf('countPdfPagesInBrowser(file)') < source.indexOf('savePdfFirstDraft(file, source)'),
    `${landing}: contar páginas antes de guardar el borrador`
  );
}

const empty = read('components/dashboard/empty-study-space.tsx');
assert.doesNotMatch(empty, /Grabaciones|Presentaciones|'Libros'/, 'solo formatos aceptados');
assert.match(empty, /trackMarketingEvent\('first_pdf_cta_viewed', \{ location: 'dashboard_empty' \}\)/,
  'la pantalla vacía registra su vista');
assert.match(empty, /Solo PDF y Word \(\.docx\) · máximo 20 MB/);

console.log('[onboarding-etapa1] errores de subida registrados, validación previa al registro y formatos reales.');
