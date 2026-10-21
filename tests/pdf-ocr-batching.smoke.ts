import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { renderPdfPagesToPngs } from '../lib/student-materials/pdf-render.ts';
import { selectVisionPageNumbers, selectVisionBatchSize } from '../lib/student-materials/vision-extract.ts';

// PDF real pero generado localmente: no accede a datos de estudiantes ni a APIs.
const pdf = await PDFDocument.create();
pdf.addPage([420, 595]); // portada en blanco
const pageWithText = pdf.addPage([420, 595]);
const font = await pdf.embedFont(StandardFonts.Helvetica);
pageWithText.drawText('Este documento tiene texto legible en la pagina dos.', {
  x: 35, y: 500, size: 14, font,
});
pdf.addPage([420, 595]);
const buffer = Buffer.from(await pdf.save());

const firstBatch = await renderPdfPagesToPngs(buffer, {
  pageNumbers: [1, 2],
  batchSize: 2,
  scale: 1,
});
const secondBatch = await renderPdfPagesToPngs(buffer, {
  pageNumbers: [3],
  batchSize: 2,
  scale: 1,
});
assert.deepEqual(firstBatch.renderedPageNumbers, [1, 2]);
assert.deepEqual(secondBatch.renderedPageNumbers, [3]);
assert.equal(firstBatch.images.length, 2);
assert.equal(secondBatch.images.length, 1);
assert.ok(firstBatch.blankPageNumbers.includes(1), 'Una página completamente vacía debe identificarse.');
assert.ok(!firstBatch.blankPageNumbers.includes(2), 'El OCR nunca debe descartar la página que tiene texto.');

assert.equal(selectVisionBatchSize(true), 2, 'Los lotes de escaneos completos deben ser pequeños.');
assert.equal(selectVisionBatchSize(false), 4, 'La extracción selectiva mantiene su capacidad.');

const scanAnalysis = {
  documentType: 'scanned' as const,
  processingStrategy: 'ocr_recommended' as const,
  requiresOcr: true,
};
for (const total of [14, 46]) {
  const pages = Array.from({ length: total }, () => '');
  const selected = selectVisionPageNumbers({
    analysis: scanAnalysis as Parameters<typeof selectVisionPageNumbers>[0]['analysis'],
    pages,
    pageCount: total,
  });
  assert.equal(selected.length, total, 'Un escaneo debe conservar todas sus páginas.');
  assert.equal(selected[0], 1);
  assert.equal(selected.at(-1), total);
}
console.log('PDF OCR batch rendering and coverage smoke tests passed.');
