import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { aiSourceFromReferrer } from '../lib/geo-attribution.ts';

const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
assert.equal(aiSourceFromReferrer('https://chatgpt.com/c/123?private=1'), 'chatgpt.com');
assert.equal(aiSourceFromReferrer('https://chat.openai.com/'), 'chatgpt.com');
assert.equal(aiSourceFromReferrer('https://www.perplexity.ai/search?q=test'), 'perplexity.ai');
assert.equal(aiSourceFromReferrer('https://claude.ai/chat/'), 'claude.ai');
assert.equal(aiSourceFromReferrer('https://gemini.google.com/app'), 'gemini');
assert.equal(aiSourceFromReferrer('https://copilot.microsoft.com/'), 'copilot');
assert.equal(aiSourceFromReferrer('https://fakechatgpt.com/'), undefined);
assert.equal(aiSourceFromReferrer('https://chatgpt.com.evil.example/'), undefined);
assert.equal(aiSourceFromReferrer('javascript:alert(1)'), undefined);
assert.equal(aiSourceFromReferrer(null), undefined);

const qa = read('app/(es)/recursos/verificar-preguntas-ia/page.tsx');
const method = read('app/(es)/recursos/metodo-estudio-pdf-practica-activa/page.tsx');
const sitemap = read('app/sitemap.ts');
const hub = read('lib/student-seo-content.ts');
const llms = read('public/llms.txt');
const tracking = read('docs/seo/geo-measurement-2026.md');
const attribution = read('lib/attribution.ts');

for (const [text,slug] of [[qa,'verificar-preguntas-ia'],[method,'metodo-estudio-pdf-practica-activa']]) {
  assert.match(text, /StudentArticleLayout/);
  assert.match(text, /['"]@type['"]\s*:\s*['"]Article['"]/);
  assert.match(text, /2026-11-06/);
  assert.match(text, /doi\.org/);
  assert.ok(sitemap.includes('/recursos/'+slug));
  assert.ok(hub.includes('/recursos/'+slug));
  assert.ok(llms.includes('/recursos/'+slug));
}
assert.match(qa,/no es un indicador estadístico de fiabilidad/);
assert.match(method,/40 minutos/);
assert.match(method,/no evaluaron Evaluo/);
assert.match(attribution,/aiSourceFromReferrer\(normalized\)/);
assert.equal((tracking.match(/^\d+\. ¿/gm)||[]).length,10);
console.log('GEO original content, citations, referrer attribution and prompt protocol: OK');
