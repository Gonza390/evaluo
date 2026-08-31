import assert from 'node:assert/strict';
import { sanitizeStudocuExtractedText } from '../lib/student-materials/studocu-sanitizer.ts';

const mixedLine = sanitizeStudocuExtractedText(
  'Resumen Marketing I (Universidad Siglo 21) Scan to open on Studocu Studocu is not sponsored or endorsed by any college or university'
);
assert.equal(mixedLine, 'Resumen Marketing I (Universidad Siglo 21)');

const tokenizedCover = sanitizeStudocuExtractedText(
  'Título académico messages.pdf_cover_qr_code_label messages.studocu_not_sponsored_or_endorsed_by_college'
);
assert.equal(tokenizedCover, 'Título académico');

const footerNoise = sanitizeStudocuExtractedText(
  'This document is available on\nmessages.downloaded_by\nDescargado por alumno@example.com\nContenido académico útil'
);
assert.equal(footerNoise, 'Contenido académico útil');

const legacyWatermark = sanitizeStudocuExtractedText(
  'Concepto importante lOMoAR cPSD\nOtra explicación académica'
);
assert.equal(legacyWatermark, 'Concepto importante\nOtra explicación académica');

const paragraphStructure = sanitizeStudocuExtractedText(
  'Primer párrafo académico.\n\nScan to open on Studocu\n\nSegundo párrafo académico.'
);
assert.equal(
  paragraphStructure,
  'Primer párrafo académico.\n\nSegundo párrafo académico.'
);

console.log('studocu-sanitizer.smoke: ok');
