const enabled = process.env.AI_KEY_SMOKE_TEST === '1';

if (!enabled) {
  console.log('[ai-key-smoke] skipped');
  process.exit(0);
}

const TIMEOUT_MS = 20_000;

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function configured(name) {
  return typeof process.env[name] === 'string' && process.env[name].trim().length > 0;
}

async function checkGemini(name) {
  const key = process.env[name];
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=' +
    encodeURIComponent(key);

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Respondé únicamente: OK' }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 4 },
    }),
  });

  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }
}

async function checkGroq(name) {
  const key = process.env[name];
  const response = await fetchWithTimeout(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + key,
      },
      body: JSON.stringify({
        model: process.env.GROQ_SUMMARY_MODEL || 'openai/gpt-oss-20b',
        temperature: 0,
        max_tokens: 4,
        messages: [{ role: 'user', content: 'Reply only OK' }],
      }),
    }
  );

  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }
}

async function checkNvidia(name) {
  const key = process.env[name];
  const response = await fetchWithTimeout(
    process.env.NVIDIA_URL || 'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + key,
      },
      body: JSON.stringify({
        model: process.env.NVIDIA_CHAT_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b',
        temperature: 0,
        max_tokens: 4,
        messages: [{ role: 'user', content: 'Reply only OK' }],
      }),
    }
  );

  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }
}

const checks = [
  ['GEMINI_API_KEY', checkGemini],
  ['GEMINI_PDF_API_KEY_2', checkGemini],
  ['GEMINI_APP_API_KEY_1', checkGemini],
  ['GEMINI_APP_API_KEY_2', checkGemini],
  ['GEMINI_APP_API_KEY_3', checkGemini],
  ['GEMINI_APP_API_KEY_4', checkGemini],
  ['GROQ_APP_API_KEY', checkGroq],
  ['GROQ_API_KEY', checkGroq],
  ['GROQ_API_KEY_FALLBACK', checkGroq],
  ['NVIDIA_API_KEY', checkNvidia],
].filter(([name]) => configured(name));

const required = [
  'GEMINI_API_KEY',
  'GEMINI_PDF_API_KEY_2',
  'GEMINI_APP_API_KEY_1',
  'GEMINI_APP_API_KEY_2',
  'GEMINI_APP_API_KEY_3',
  'GEMINI_APP_API_KEY_4',
  'GROQ_APP_API_KEY',
];

const missing = required.filter((name) => !configured(name));
if (missing.length > 0) {
  for (const name of missing) {
    console.error('[ai-key-smoke] ' + name + ' MISSING');
  }
  process.exit(1);
}

let failures = 0;

for (const [name, check] of checks) {
  try {
    await check(name);
    console.log('[ai-key-smoke] ' + name + ' OK');
  } catch (error) {
    failures += 1;
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error('[ai-key-smoke] ' + name + ' FAIL (' + message + ')');
  }
}

if (failures > 0) {
  console.error('[ai-key-smoke] failed: ' + failures);
  process.exit(1);
}

console.log('[ai-key-smoke] all configured AI credentials passed');
