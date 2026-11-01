import assert from 'node:assert/strict';
import { requestGeminiJson } from '../lib/ai/providers.ts';

// The local and preview deployments can have only GEMINI_API_KEY. Production
// must keep the independent app key pool and never consume PDF quota for UI.
const keys = [
  'NODE_ENV', 'VERCEL_ENV', 'GEMINI_API_KEY', 'GEMINI_PDF_API_KEY_2',
  'GEMINI_PDF_API_KEY_3', 'GEMINI_APP_API_KEY_1', 'GEMINI_APP_API_KEY_2',
  'GEMINI_APP_API_KEY_3', 'GEMINI_APP_API_KEY_4',
  'GEMINI_SUMMARY_API_KEY', 'GEMINI_API_KEY_FALLBACK',
  'GOOGLE_AI_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY',
] as const;
const previous = Object.fromEntries(keys.map(k => [k, process.env[k]]));
const realFetch = globalThis.fetch;
const requests: string[] = [];
try {
  for (const key of keys) delete process.env[key];
  process.env.GEMINI_API_KEY = 'sandbox-fake-pdf-key';
  globalThis.fetch = async (input) => {
    requests.push(String(input));
    return new Response(JSON.stringify({
      candidates: [{
        content: { parts: [{ text: '{"ok":true}' }] },
        finishReason: 'STOP',
      }],
    }), { status: 200, headers: { 'Content-Type':'application/json' } });
  };
  const call = () => requestGeminiJson({
    prompt:'Respondé con un objeto JSON.',
    temperature:0,
    maxOutputTokens:100,
  });
  process.env.NODE_ENV = 'development';
  assert.equal((await call())?.content, '{"ok":true}', 'Local app calls use available key.');
  assert.match(requests.at(-1)!, /key=sandbox-fake-pdf-key/);

  process.env.NODE_ENV = 'production';
  process.env.VERCEL_ENV = 'preview';
  assert.equal((await call())?.content, '{"ok":true}', 'Vercel preview calls use available key.');
  assert.match(requests.at(-1)!, /key=sandbox-fake-pdf-key/);

  process.env.VERCEL_ENV = 'production';
  const before = requests.length;
  assert.equal(await call(), null, 'Production without app keys must fail closed.');
  assert.equal(requests.length, before, 'Production must not send PDF key in app requests.');
} finally {
  globalThis.fetch = realFetch;
  for (const key of keys) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
}
console.log('Gemini practice API-key isolation: dev/preview fallback works, production remains isolated.');
