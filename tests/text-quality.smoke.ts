import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const roots = ['app', 'components', 'lib', 'services'];
const allowedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.md', '.json']);
const suspiciousPattern =
  /Ã|�|TodavÃ|AsÃ|InformaciÃ|ConfiguraciÃ|sesiÃ|acadÃ|mÃ¡s|prÃ¡|TÃ­t|DuraciÃ|resÃº|MÃ³|exÃ¡|bÃ¡|Ãš|gestiÃ|organizaciÃ|ComprensiÃ|aplicaciÃ|resoluciÃ|investigaciÃ|construcciÃ|rÃ¡p/;

function walk(dir: string, files: string[] = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    if (allowedExtensions.has(extname(fullPath))) {
      files.push(fullPath);
    }
  }

  return files;
}

const matches: string[] = [];

for (const root of roots) {
  for (const file of walk(root)) {
    const content = readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (suspiciousPattern.test(line)) {
        matches.push(`${file}:${index + 1}: ${line.trim()}`);
      }
    });
  }
}

assert.equal(
  matches.length,
  0,
  `Se detectaron textos con encoding roto:\n${matches.join('\n')}`
);

console.log('Text quality smoke tests passed.');
