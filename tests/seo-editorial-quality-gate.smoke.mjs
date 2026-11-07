import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { evaluateTopic, evaluateBatch, normalizeKeyword, CHECKS } from '../scripts/seo/editorial-quality-gate.mjs';

const now = new Date('2026-11-05T13:00:00.000Z');
const make = (keyword, slug, tier = 'two') => {
  const topic = {
    keyword, country: 'ES', slugEs: '/blog/' + slug, slugEn: '/en/blog/' + slug,
    review: Object.fromEntries(CHECKS.map((c) => [c, { pass: true, rationale: 'Source-checked editorial review with page and topic analysis: ' + c }])),
    signals: {
      bing: { source: 'BING_WEBMASTER', keyword, country: 'ES', observedAt: '2026-11-04', monthlyEstimate: 80, observations: 6 },
      autocomplete: { source: 'GOOGLE_AUTOCOMPLETE', country: 'ES', observedAt: '2026-11-04', suggestions: [keyword + ' para estudiar'] },
      serp: { source: 'PUBLIC_SERP', keyword, country: 'ES', observedAt: '2026-11-04', results: [
        {url:'https://universidad.edu/consejos',intentMatches:true},
        {url:'https://guia.es/tema',intentMatches:true},
        {url:'https://otros.org/tema',intentMatches:true}
      ]},
    },
  };
  if (tier === 'one') topic.signals.google = {
    source: 'UBERSUGGEST_GOOGLE', keyword, country: 'ES', measuredAt: '2026-11-04',
    monthlyVolume: 620, phraseVerified: true, isGroupedVolume: false, isRange: false,
  };
  return topic;
};
const cornell = make('metodo cornell', 'metodo-cornell');
const feynman = make('tecnica feynman', 'tecnica-feynman','one');
assert.equal(evaluateTopic(cornell,{now}).tier,'T2_TRIANGULATED');
assert.equal(evaluateTopic(feynman,{now}).tier,'T1_GOOGLE');
assert.equal(evaluateBatch([cornell,feynman],{now}).state,'LISTO_PARA_DESARROLLO');
assert.equal(evaluateBatch([cornell,feynman],{now}).passCount,16);
assert.equal(evaluateBatch([cornell,feynman],{now}).productionAuthorized,false);
assert.equal(evaluateBatch([cornell,cornell],{now}).state,'BLOQUEADO');
assert.equal(evaluateBatch([cornell,feynman],{now,reserved:['tecnica feynman']}).state,'BLOQUEADO');
assert.equal(normalizeKeyword('  TÉCNICA FeynMan!'),'tecnica feynman');
const wrongBrand = structuredClone(cornell);
wrongBrand.signals.bing.keyword = 'cornell'; // cannot borrow generic brand's volume
assert.equal(evaluateTopic(wrongBrand,{now}).state,'BLOCKED');
const wrongCountry = structuredClone(cornell);
wrongCountry.signals.bing.country = 'MX';
assert.equal(evaluateTopic(wrongCountry,{now}).state,'BLOCKED');
// English-first US research is permitted only with US-specific evidence. The examples are synthetic.
const usTopic = make('open book exam preparation', 'how-to-prepare-for-open-book-exams', 'one');
usTopic.country='US';
usTopic.signals.google.country='US';
usTopic.signals.bing.country='US';
usTopic.signals.autocomplete.country='US';
usTopic.signals.autocomplete.suggestions=['open book exam preparation tips'];
usTopic.signals.serp.country='US';
assert.equal(evaluateTopic(usTopic,{now}).tier,'T1_GOOGLE');
const wrongUsEvidence = structuredClone(usTopic);
wrongUsEvidence.signals.google.country='ES'; // cannot transfer a foreign-country volume
wrongUsEvidence.signals.bing.country='ES';
wrongUsEvidence.signals.autocomplete.country='ES';
wrongUsEvidence.signals.serp.country='ES';
assert.equal(evaluateTopic(wrongUsEvidence,{now}).state,'BLOCKED');
const unsupportedCountry = structuredClone(usTopic);
unsupportedCountry.country='AU'; // additional markets require an explicit policy change
assert.equal(evaluateTopic(unsupportedCountry,{now}).state,'BLOCKED');
const stale = structuredClone(cornell);
stale.signals.bing.observedAt = '2025-08-20';
assert.equal(evaluateTopic(stale,{now}).state,'BLOCKED');
const weak = structuredClone(cornell);
weak.signals.bing.monthlyEstimate = 20;
assert.equal(evaluateTopic(weak,{now}).state,'BLOCKED');
const googleWrongPhrase = structuredClone(feynman);
googleWrongPhrase.signals.google.keyword = 'feynman';
googleWrongPhrase.signals.bing.keyword='feynman';
assert.equal(evaluateTopic(googleWrongPhrase,{now}).state,'BLOCKED');
const rangeGoogle = structuredClone(feynman);
rangeGoogle.signals.google.isRange = true;
rangeGoogle.signals.bing.monthlyEstimate = 0;
assert.equal(evaluateTopic(rangeGoogle,{now}).state,'BLOCKED');
const missingSerp = structuredClone(cornell);
missingSerp.signals.serp.results=[missingSerp.signals.serp.results[0]];
assert.equal(evaluateTopic(missingSerp,{now}).state,'BLOCKED');
const noFacts = structuredClone(cornell);
noFacts.review.pedagogicalValue={pass:true,rationale:'ok'};
assert.equal(evaluateTopic(noFacts,{now}).state,'BLOCKED');

const competitor = make('practica intercalada', 'practica-intercalada');
delete competitor.signals.bing;
delete competitor.signals.autocomplete;
delete competitor.signals.serp;
competitor.signals.competitors = {
  source: 'COMPETITOR_EDITORIAL', topicKeyword: competitor.keyword, country: 'ES',
  observedAt: '2026-11-05',
  originalAngle: 'Original pedagogical case comparing mixed practice and topic-by-topic exercises, including explanations of misconceptions.',
  articles: [
    {url: 'https://competitor-a.example/blog/practice', title: 'Practical guide to mixed exam practice', publishedAt: '2026-10-30', intentMatches: true,
      identifiedGap: 'Does not provide a topic-by-topic correction plan connected to the student own material.'},
    {url: 'https://competitor-b.example/resources/testing', title: 'Assessments from your university notes', publishedAt: '2026-07-01', intentMatches: true,
      identifiedGap: 'Does not show an original worked example comparing why distractor answers are incorrect.'},
  ],
};
assert.equal(evaluateTopic(competitor,{now}).tier,'T3_COMPETITOR_GAP');
assert.equal(evaluateTopic(competitor,{now}).googleMonthlyVolume,null);
assert.equal(evaluateTopic(competitor,{now}).demandVerified,false);
assert.equal(evaluateBatch([competitor,feynman],{now}).state,'LISTO_PARA_DESARROLLO');
const oneRival = structuredClone(competitor);
oneRival.signals.competitors.articles.pop();
assert.equal(evaluateTopic(oneRival,{now}).state,'BLOCKED');
const oneDomain = structuredClone(competitor);
oneDomain.signals.competitors.articles[1].url = 'https://competitor-a.example/other';
assert.equal(evaluateTopic(oneDomain,{now}).state,'BLOCKED');
const undated = structuredClone(competitor);
for (const article of undated.signals.competitors.articles) delete article.publishedAt;
assert.equal(evaluateTopic(undated,{now}).state,'BLOCKED');
const unoriginal = structuredClone(competitor);
unoriginal.signals.competitors.originalAngle = 'Same article';
assert.equal(evaluateTopic(unoriginal,{now}).state,'BLOCKED');
const wrongTopic = structuredClone(competitor);
wrongTopic.signals.competitors.topicKeyword = 'flashcards';
assert.equal(evaluateTopic(wrongTopic,{now}).state,'BLOCKED');
const competitorNoEditorial = structuredClone(competitor);
competitorNoEditorial.review.cannibalization.pass = false;
assert.equal(evaluateTopic(competitorNoEditorial,{now}).state,'BLOCKED');
console.log('PASS: Tier 3 competitor-led fallback requires distinct sources, freshness, original angle, no cannibalization and NO invented Google volume');

console.log('PASS: Tier 1, Tier 2, Tier 3, 16 PASS, fail-closed, country, keyword, freshness, duplicate, Google-range and production protections');

// CLI round trip: ephemeral, intentionally synthetic evidence. No real keyword is approved here.
const tmp = mkdtempSync(join(tmpdir(), 'seo-quality-gate-'));
try {
  const file = join(tmp, 'sample-batch.json');
  const script = fileURLToPath(new URL('../scripts/seo/editorial-quality-gate.mjs', import.meta.url));
  writeFileSync(file, JSON.stringify({ topics: [cornell, feynman], reserved: [] }));
  const passed = spawnSync(process.execPath, [script, '--file=' + file, '--now=2026-11-05T13:00:00.000Z'], { encoding: 'utf8' });
  assert.equal(passed.status, 0, passed.stderr || passed.stdout);
  assert.equal(JSON.parse(passed.stdout).state, 'LISTO_PARA_DESARROLLO');
  writeFileSync(file, JSON.stringify({ topics: [cornell, cornell], reserved: [] }));
  const blocked = spawnSync(process.execPath, [script, '--file=' + file, '--now=2026-11-05T13:00:00.000Z'], { encoding: 'utf8' });
  assert.equal(blocked.status, 2, blocked.stderr || blocked.stdout);
  assert.equal(JSON.parse(blocked.stdout).state, 'BLOQUEADO');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
console.log('PASS: editorial gate CLI exit codes and JSON output');
