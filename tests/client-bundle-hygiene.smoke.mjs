import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Componentes de cliente que validan archivos antes de subirlos deben usar las reglas
// livianas (file-rules.ts). Importar validation.ts suma zod (~30 KB gzip) al bundle
// inicial: así la home pasó de 333 a 363 KB y rompió el presupuesto de performance.
const clientUploaders = [
  'components/marketing/home-pdf-picker-button.tsx',
  'components/marketing/pdf-first-landing-uploader.tsx',
  'components/dashboard/pdf-first-upload-shell.tsx',
];
for (const file of clientUploaders) {
  const source = readFileSync(file, 'utf8');
  assert.match(source, /^'use client'/, `${file} es un componente de cliente`);
  assert.doesNotMatch(source, /student-materials\/validation'/, `${file} no debe importar validation.ts (zod)`);
  assert.match(source, /student-materials\/file-rules'/, `${file} usa las reglas sin zod`);
}

const rules = readFileSync('lib/student-materials/file-rules.ts', 'utf8');
assert.doesNotMatch(rules, /from ['"]zod['"]/, 'file-rules.ts no puede depender de zod');
const validation = readFileSync('lib/student-materials/validation.ts', 'utf8');
assert.match(validation, /export \* from '\.\/file-rules'/, 'validation.ts reexporta las reglas para el servidor');

console.log('client-bundle-hygiene smoke ok');
