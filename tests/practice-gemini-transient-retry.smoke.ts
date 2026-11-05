import assert from 'node:assert/strict';
import { requestGeminiJson, requestGeminiPdfJson } from '../lib/ai/providers.ts';

const keyNames = [
  'NODE_ENV', 'VERCEL_ENV', 'GEMINI_API_KEY',
  'GEMINI_PDF_API_KEY_2', 'GEMINI_PDF_API_KEY_3',
  'GEMINI_APP_API_KEY_1', 'GEMINI_APP_API_KEY_2',
  'GEMINI_APP_API_KEY_3', 'GEMINI_APP_API_KEY_4',
  'GEMINI_SUMMARY_API_KEY', 'GEMINI_API_KEY_FALLBACK',
  'GOOGLE_AI_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY',
] as const;
const previous = Object.fromEntries(keyNames.map((key) => [key, process.env[key]]));
const realFetch = globalThis.fetch;
const ok = () => new Response(JSON.stringify({
  candidates: [{ content: { parts: [{ text: '{"ok":true}' }] }, finishReason: 'STOP' }],
}), { status: 200 });
const transient = () => new Response('temporary overload', { status: 503 });
const call = () => requestGeminiJson({
  prompt: 'Devolvé un JSON válido.',
  temperature: 0,
  maxOutputTokens: 100,
});

try {
  for (const key of keyNames) delete process.env[key];
  process.env.NODE_ENV = 'development';
  process.env.VERCEL_ENV = 'development';
  process.env.GEMINI_API_KEY = 'test-pdf-key';

  let requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    return requests === 1 ? transient() : ok();
  };
  assert.equal((await call())?.content, '{"ok":true}');
  assert.equal(requests, 2, 'A 503 should recover using a bounded retry.');

  requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    return transient();
  };
  await assert.rejects(call(), /503/, 'A persistent 503 should propagate clearly.');
  assert.equal(requests, 3, 'No more than two transient retries per key.');

  requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    return new Response('invalid schema', { status: 400 });
  };
  await assert.rejects(call(), /400/);
  assert.equal(requests, 1, '4xx should never trigger the transient backoff.');

  // A real quota limit rotates keys immediately, without retrying the same key.
  delete process.env.GEMINI_API_KEY;
  process.env.GEMINI_SUMMARY_API_KEY = 'test-app-primary';
  process.env.GEMINI_API_KEY_FALLBACK = 'test-app-secondary';
  const usedKeys: string[] = [];
  globalThis.fetch = async (url) => {
    usedKeys.push(String(url));
    return usedKeys.length === 1
      ? new Response('rate limit', { status: 429 })
      : ok();
  };
  assert.equal((await call())?.content, '{"ok":true}');
  assert.equal(usedKeys.length, 2);
  assert.match(usedKeys[0], /key=test-app-primary/);
  assert.match(usedKeys[1], /key=test-app-secondary/);

  // Inline PDF generation receives the same protection without changing models.
  process.env.GEMINI_API_KEY = 'test-pdf-key';
  requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    return requests === 1 ? transient() : ok();
  };
  assert.equal((await requestGeminiPdfJson({
    prompt: 'Extracción estructurada',
    pdfBuffer: Buffer.from('test'),
    temperature: 0,
    maxOutputTokens: 50,
    geminiKeySlot: 'pdf_primary',
  }))?.content, '{"ok":true}');
  assert.equal(requests, 2);
} finally {
  globalThis.fetch = realFetch;
  for (const key of keyNames) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
}

console.log('Gemini 503 bounded retry, quota rotation, PDF recovery and non-transient 400 verified.');
