import assert from 'node:assert/strict';
import {
  isReusableSource, isValidOcrPage, selectMissingOcrPages,
  type CachedSource,
} from '../lib/student-materials/checkpoint-contract.ts';

// Simula un escaneo de 14 páginas: 1-4 fueron guardadas en un intento fallido.
const cached = [1, 2, 3, 4].map((pageNumber) => ({
  pageNumber,
  content: 'Definiciones, fórmulas y explicaciones reconstruidas con fidelidad de la página ' + pageNumber + '.',
  confidence: 'alta' as const,
  origin: 'vision' as const,
  hasMath: false,
}));
assert.deepEqual(selectMissingOcrPages(
  Array.from({ length: 14 }, (_, i) => i + 1), cached
), Array.from({ length: 10 }, (_, i) => i + 5), 'Un reintento no vuelve a procesar páginas ya guardadas.');

const withBlank = [...cached, { pageNumber: 5, content: '', confidence: 'alta' as const, origin: 'blank' as const, hasMath: false }];
assert.equal(isValidOcrPage(withBlank[4]), true, 'Las páginas físicamente vacías pueden conservarse sin OCR.');
assert.deepEqual(selectMissingOcrPages([4, 5, 6], withBlank), [6]);
assert.equal(isValidOcrPage({ ...cached[0], confidence: 'baja' }), false);
assert.equal(isValidOcrPage({ ...cached[0], content: 'corto' }), false);
assert.equal(isValidOcrPage({ ...cached[0], origin: 'blank', content: 'texto' }), false);

const source: CachedSource = {
  text: 'Contenido académico extraído y validado de dos páginas.',
  pages: ['Contenido académico extraído.', 'Y contenido de la segunda página.'],
  pageCount: 2,
  visionUsed: true,
  visionPageNumbers: [1, 2],
  documentAnalysis: {
    documentType: 'scanned',
    processingStrategy: 'ocr_recommended',
    requiresOcr: true,
  } as CachedSource['documentAnalysis'],
};
const input = { cachedHash: 'a'.repeat(64), currentHash: 'a'.repeat(64),
  cachedVersion: 'source-v1', currentVersion: 'source-v1', source };
assert.equal(isReusableSource(input), true);
assert.equal(isReusableSource({ ...input, currentHash: 'b'.repeat(64) }), false, 'Cambio de archivo invalida OCR.');
assert.equal(isReusableSource({ ...input, currentVersion: 'source-v2' }), false, 'Cambio de pipeline invalida checkpoint.');
assert.equal(isReusableSource({ ...input, source: { ...source, pages: ['una página'] } }), false, 'Nunca se guarda cobertura parcial.');
assert.equal(isReusableSource({ ...input, source: { ...source, text: '' } }), false, 'Nunca se guarda fuente vacía.');

console.log('PDF stage and per-page OCR checkpoint smoke tests passed.');
