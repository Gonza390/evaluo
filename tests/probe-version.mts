import { readFileSync, writeFileSync } from 'node:fs';
import pdf from 'pdf-parse-fork';

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
for (const version of ['v1.10.100', 'v1.10.88', 'v2.0.550']) {
  for (const file of files) {
    try {
      const buffer = readFileSync(`test-data/${file}`);
      const parsed = await pdf(buffer, { version });
      rows.push(JSON.stringify({
        version,
        file,
        ok: true,
        pages: parsed.numpages,
        textLength: (parsed.text ?? '').length,
        sample: (parsed.text ?? '').replace(/\n+/g, ' ').slice(0, 60),
      }));
    } catch (error) {
      rows.push(JSON.stringify({
        version,
        file,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }
}

writeFileSync('test-data/pdf-version-report.json', rows.join('\n') + '\n', 'utf8');
console.log('OK');
