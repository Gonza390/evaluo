import { readFileSync, writeFileSync } from 'node:fs';
import { analyzePdfDocument, extractPdfTextAndPageCount } from '@/lib/student-materials/text';

const files = [
  '01-texto-nativo.pdf',
  '02-diapositivas.pdf',
  '03-hibrido.pdf',
  '04-escaneado.pdf',
  '05-largo.pdf',
  '06-con-ruido.pdf',
  '07-columnas.pdf',
];

const rows: string[] = [];
for (const file of files) {
  try {
    const buffer = readFileSync(`test-data/${file}`);
    const { text, pageCount } = await extractPdfTextAndPageCount(buffer);
    const a = analyzePdfDocument(buffer, text, pageCount);
    rows.push(JSON.stringify({
      file,
      ok: true,
      pageCount,
      textLength: text.length,
      documentType: a.documentType,
      processingStrategy: a.processingStrategy,
      requiresOcr: a.requiresOcr,
      hasSelectableText: a.hasSelectableText,
      hasEmbeddedImages: a.hasEmbeddedImages,
      structureQuality: a.structureQuality,
      headingCount: a.headingCount,
      bulletCount: a.bulletCount,
    }));
  } catch (error) {
    rows.push(JSON.stringify({
      file,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }));
  }
}

const report = rows.join('\n') + '\n';
writeFileSync('test-data/analysis-report.json', report, 'utf8');
console.log(`OK -> ${rows.length} fixtures analizados`);
