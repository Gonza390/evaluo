import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isTransientSimulatorCatalogError } from '../lib/simulator-catalog-retry.ts';

const preguntero = readFileSync('lib/data/preguntero.ts', 'utf8');
const explorer = readFileSync('app/(es)/explorar/materia/[id]/page.tsx', 'utf8');
assert.ok(preguntero.includes("['preguntero-materia-stats-v1']"));
assert.ok(preguntero.includes('revalidate: 600'));
assert.ok(preguntero.includes('return cachedPregunteroMateriaStats(materiaId)'));
assert.ok(explorer.includes('getPregunteroMateriaStats(materiaId)'));
assert.ok(!explorer.includes(".from('preguntas_banco_public')"), 'No repetir COUNT por parcial en cada visita.');
assert.ok(explorer.includes('fetchSharedStudentMaterialsByMateria'), 'No cachear la lista de PDFs compartidos.');


const simulatorLanding = readFileSync('app/(es)/simulador/page.tsx', 'utf8');
const simulatorDetail = readFileSync('app/(es)/simulador/[materia_id]/[parcial]/page.tsx', 'utf8');
assert.ok(simulatorLanding.includes(".from('preguntas_banco')"));
assert.ok(simulatorLanding.includes(".order('creado_at', { ascending: false })"));
assert.ok(!simulatorLanding.includes(".order('created_at', { ascending: false })"));
assert.ok(simulatorLanding.includes('if (fallbackError)'));
assert.ok(simulatorLanding.includes("logError('simulador.defaultMateria'"));
assert.ok(simulatorLanding.includes('fallbackLookupFailed ? ('));
assert.ok(simulatorLanding.includes('href="/simulador"'));
assert.ok(simulatorLanding.includes('href="/explorar"'));
assert.ok(simulatorDetail.includes('isTransientSimulatorCatalogError(error)'));
assert.ok(simulatorDetail.includes('queryPublicMateriaExists(materiaId, 2500)'));
assert.ok(simulatorDetail.includes("['public-simulator-materia-exists-v2']"));
assert.equal(isTransientSimulatorCatalogError(new Error('TimeoutError: The operation was aborted due to timeout')), true);
assert.equal(isTransientSimulatorCatalogError({ message: 'TypeError: fetch failed' }), true);
assert.equal(isTransientSimulatorCatalogError({ message: 'ECONNRESET' }), true);
assert.equal(isTransientSimulatorCatalogError({ code: '42703', message: 'column created_at does not exist' }), false);
assert.equal(isTransientSimulatorCatalogError({ code: 'PGRST301', message: 'JWT expired' }), false);
assert.equal(isTransientSimulatorCatalogError({ message: 'permission denied for table materias' }), false);
assert.equal(isTransientSimulatorCatalogError(null), false);


const publicViewHardeningSql = readFileSync('supabase/migrations/20261031204119_restrict_public_question_bank_scans.sql', 'utf8');
const pregunteroSeo = readFileSync('lib/seo-content-signals.ts', 'utf8');
const catalogData = readFileSync('lib/data/catalog.ts', 'utf8');
// Limitar las lecturas del banco a consultas filtradas en el servidor y RPC de estadísticas.
assert.ok(preguntero.includes("admin.from('preguntas_banco')") || preguntero.includes("admin\n          .from('preguntas_banco')"));
assert.ok(preguntero.includes(".eq('es_demo', false)"));
assert.ok(preguntero.includes(".eq('materia_id', materiaId)"));
assert.ok(preguntero.includes('.limit(10)'));
assert.ok(!preguntero.includes(".from('preguntas_banco_public')"));
assert.ok(pregunteroSeo.includes('getPregunteroMateriaStats(materiaId)'));
assert.ok(!pregunteroSeo.includes(".from('preguntas_banco_public')"));
assert.ok(catalogData.includes("rpc('get_public_preguntero_catalog')"));
assert.ok(!catalogData.includes(".from('preguntas_banco_public')"));
assert.match(publicViewHardeningSql, /revoke\s+all\s+on\s+public\.preguntas_banco_public\s+from\s+public,\s*anon,\s*authenticated/i);
assert.match(publicViewHardeningSql, /service_role/i);

console.log('Preguntero cache and Explore question count tests passed.');
