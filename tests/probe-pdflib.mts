import { readFileSync, writeFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';

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
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    rows.push(JSON.stringify({ file, ok: true, pages: doc.getPageCount() }));
  } catch (error) {
    rows.push(JSON.stringify({
      file,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }));
  }
}

writeFileSync('test-data/pdf-lib-check.json', rows.join('\n') + '\n', 'utf8');
console.log('OK');
