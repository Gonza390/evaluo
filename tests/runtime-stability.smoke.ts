import assert from 'node:assert/strict';

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
console.log('AI network fallback regression tests passed.');
