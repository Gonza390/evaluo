import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Onboarding etapa 3: resultado del simulador SEO (bancos de preguntas, no los apuntes propios).
const read = (path: string) => readFileSync(path, 'utf8');

const result = read('components/simulador/SimulatorFinishedResult.tsx');
assert.match(result, /const reviewHref = `\/simulador\/errores\/\$\{materiaId\}\?parcial=\$\{parcial\}`;/,
  'el botón principal lleva al repaso de errores que ya existe');
assert.match(result, /cta_name: 'review_errors_now'/);
assert.match(result, /Repasá \$\{pendingCount === 1 \? 'tu error' : `tus \$\{pendingCount\} errores`\} ahora/);
assert.match(result, /promptList\(prompts, wrong, 'wrong'\)/, 'muestra las preguntas que falló');
assert.match(result, /unos \{resultContext\?\.reviewMinutes \?\? 1\} min/, 'dice cuánto lleva el repaso');
assert.match(result, /Resolviste \$\{aciertos\} de tus \$\{safeTotal\} errores/, 'resultado propio del repaso');
assert.match(result, /Resolviste todos tus errores/);
assert.match(result, /LOS QUE QUEDAN/);
assert.match(result, /Sin errores\. Confirmalo con otro intento/);
assert.match(result, /simulator_result_primary_pdf_activation/);

const errorsCore = read('lib/study-errors.ts');
assert.match(errorsCore, /resolveWithoutReview\?: boolean;/);
assert.match(errorsCore, /if \(!input\.resolveWithoutReview\) \{/, 'fuera del repaso sigue pidiendo revisar antes de resolver');

const server = read('lib/actions/simulador-server.ts');
assert.match(server, /resolveWithoutReview: data\.mode === 'errores'/, 'acertar en el repaso resuelve el error');
assert.match(server, /getPendingSimulatorErrorQuestionIds\(user\.id, materiaId\)/, 'el repaso pregunta los errores pendientes');
assert.match(server, /if \(parcial === 1 \|\| parcial === 2\) \{\n\s+query = query\.eq\('parcial', parcial\);/,
  'el mixto (parcial 3) no filtra por parcial');

const review = read('lib/simulator-error-review.ts');
assert.match(review, /\.eq\('source_type', 'simulator'\)/);
assert.match(review, /\.eq\('status', 'pending'\)/);

const premium = read('lib/premium.ts');
assert.match(premium, /export async function getNextFreeErrorsReviewDate\(/);

const limit = read('components/premium/errors-review-limit.tsx');
assert.match(limit, /Ya usaste tu repaso gratis de esta semana/);
assert.match(limit, /Repasar sin límite con Premium/);
assert.match(limit, /Estudiar esos temas en mi apunte/);
const page = read('app/(es)/simulador/errores/[materia_id]/page.tsx');
assert.match(page, /nextFreeReviewDate=\{nextFreeReviewDate\}/);

console.log('[onboarding-etapa3] resultado del simulador: repaso primero, errores que se resuelven y límite semanal claro.');
