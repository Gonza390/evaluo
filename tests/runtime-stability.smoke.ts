import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyBackendPath, classifyBackendScope } from '../lib/backend-flow.ts';

// Los modelos y credenciales son ficticios: las solicitudes se interceptan.
// La prueba verifica que AbortError no bloquee el fallback al modelo secundario.
process.env.GROQ_APP_API_KEY = 'test-key-not-valid';
process.env.GROQ_SUMMARY_MODEL = 'test-primary';
process.env.GROQ_FALLBACK_MODEL = 'test-secondary';

const { requestGroqJson, requestGroqText } = await import('../lib/ai/providers.ts');

async function checkFallback(kind: 'json' | 'text') {
  const originalFetch = globalThis.fetch;
  const models: string[] = [];
  try {
    globalThis.fetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as { model: string };
      models.push(request.model);
      if (models.length === 1) {
        throw new DOMException('The operation was aborted', 'AbortError');
      }
      const content = kind === 'json' ? '{"topic":"aprobado"}' : 'Respuesta util';
      return new Response(
        JSON.stringify({ choices: [{ message: { content }, finish_reason: 'stop' }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    const input = { prompt: 'Prueba sin red', system: 'Test', temperature: 0, maxTokens: 30 };
    const result = kind === 'json' ? await requestGroqJson(input) : await requestGroqText(input);
    assert.equal(result?.model, 'test-secondary');
    assert.deepEqual(models, ['test-primary', 'test-secondary']);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

await checkFallback('json');
await checkFallback('text');
const studyErrorsSource = readFileSync(new URL('../lib/actions/study-errors.ts', import.meta.url), 'utf8');
assert.match(studyErrorsSource, /if \(!user \|\| !isUuid\(materialId\)\) return \{ count: 0 \}/);
const flashcardSource = readFileSync(new URL('../app/(es)/dashboard/materiales/actions.ts', import.meta.url), 'utf8');
assert.match(flashcardSource, /logError\('flashcard_progress_load', error, \{ materialId \}\)/);
assert.match(flashcardSource, /logError\('flashcard_progress_save', error, \{ materialId \}\)/);
console.log('AI fallback and production error guard regression tests passed.');

// Las rutas SEO no cuentan como uso del producto basado en PDFs.
assert.equal(classifyBackendPath('/pregunteros/derecho'), 'seo_public');
assert.equal(classifyBackendPath('/simulador/fixture/1'), 'seo_public');
assert.equal(classifyBackendPath('/api/student-materials/fixture/processing-state'), 'pdf_private');
assert.equal(classifyBackendPath('/dashboard/materiales'), 'pdf_private');
assert.equal(classifyBackendPath('/dashboard'), 'other');
assert.equal(classifyBackendScope('pedagogy.localReduce.map'), 'pdf_private');
assert.equal(classifyBackendScope('simulatorTopicMemory.aiClassification'), 'seo_public');
