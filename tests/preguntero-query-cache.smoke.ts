import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const preguntero = readFileSync('lib/data/preguntero.ts', 'utf8');
const explorer = readFileSync('app/explorar/materia/[id]/page.tsx', 'utf8');
assert.ok(preguntero.includes("['preguntero-materia-stats-v1']"));
assert.ok(preguntero.includes('revalidate: 600'));
assert.ok(preguntero.includes('return cachedPregunteroMateriaStats(materiaId)'));
assert.ok(explorer.includes('getPregunteroMateriaStats(materiaId)'));
assert.ok(!explorer.includes(".from('preguntas_banco_public')"), 'No repetir COUNT por parcial en cada visita.');
assert.ok(explorer.includes('fetchSharedStudentMaterialsByMateria'), 'No cachear la lista de PDFs compartidos.');

console.log('Preguntero cache and Explore question count tests passed.');
