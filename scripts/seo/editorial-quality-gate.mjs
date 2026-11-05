/**
 * Evaluo SEO editorial two-tier approval policy.
 * Grounded, fail-closed decision support; never confuses Bing with Google volume.
 *
 * The scheduled ChatGPT tasks research candidates, supply evidence, run this gate
 * where a Node environment is available, and develop only two passing topics.
 * This module does NOT publish pages or call external services.
 */
export const CHECKS = Object.freeze([
  'intent', 'market', 'competition', 'cannibalization',
  'evaluoFit', 'pedagogicalValue', 'sources'
]);
export const TARGET_COUNTRIES = Object.freeze(['AR', 'ES', 'MX', 'CO']);
const DAY = 86400000;
const MAX_AGE_DAYS = 90;

export function normalizeKeyword(text) {
  return typeof text === 'string'
    ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es').replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ').trim()
    : '';
}
const keyEqual = (a, b) => normalizeKeyword(a) !== '' && normalizeKeyword(a) === normalizeKeyword(b);
const validCountry = (country) => TARGET_COUNTRIES.includes(country);
function fresh(value, now) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) return false;
  const d = new Date(value);
  return Number.isFinite(d.getTime())
    && d.getTime() <= now.getTime() + DAY
    && now.getTime() - d.getTime() <= MAX_AGE_DAYS * DAY;
}
const validUrl = (url) => {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && Boolean(parsed.hostname);
  } catch { return false; }
};
const googleSources = new Set(['UBERSUGGEST_GOOGLE', 'GOOGLE_KEYWORD_PLANNER_EXACT']);

function checkGoogleEvidence(record, topic, now) {
  const e = record?.google;
  if (!e || !keyEqual(e.keyword, topic.keyword)
      || e.country !== topic.country
      || !googleSources.has(e.source)
      || !fresh(e.measuredAt, now)
      || e.isGroupedVolume === true || e.isRange === true
      || e.phraseVerified !== true || !Number.isFinite(e.monthlyVolume)) return false;
  return e.monthlyVolume >= 500;
}
function checkBingEvidence(e, topic, now) {
  return e && e.source === 'BING_WEBMASTER'
    && keyEqual(e.keyword, topic.keyword)
    && e.country === topic.country
    && fresh(e.observedAt, now)
    && Number.isFinite(e.monthlyEstimate)
    && e.monthlyEstimate >= 50
    && Number.isInteger(e.observations) && e.observations >= 4;
}
function checkGscEvidence(e, topic, now) {
  return e && e.source === 'GOOGLE_SEARCH_CONSOLE'
    && e.site === 'evaluoapp.com'
    && keyEqual(e.keyword, topic.keyword)
    && e.country === topic.country
    && fresh(e.observedAt, now)
    && Number.isInteger(e.impressions) && e.impressions >= 10
    && Number.isInteger(e.windowDays) && e.windowDays > 0 && e.windowDays <= 90;
}
function checkAutocomplete(e, topic, now) {
  if (!e || e.source !== 'GOOGLE_AUTOCOMPLETE'
    || e.country !== topic.country
    || !fresh(e.observedAt, now)
    || !Array.isArray(e.suggestions)) return false;
  const normalized = normalizeKeyword(topic.keyword);
  return e.suggestions.some((s) => {
    const suggestion = normalizeKeyword(s);
    return suggestion === normalized || suggestion.startsWith(normalized + ' ')
      || suggestion.endsWith(' ' + normalized);
  });
}
function checkSerp(e, topic, now) {
  if (!e || e.source !== 'PUBLIC_SERP'
    || !keyEqual(e.keyword, topic.keyword)
    || e.country !== topic.country || !fresh(e.observedAt, now)
    || !Array.isArray(e.results)) return false;
  const hosts = new Set(e.results.filter((r) => r?.intentMatches === true && validUrl(r.url))
    .map((r) => new URL(r.url).hostname.replace(/^www\./, '')));
  return hosts.size >= 3;
}

/**
 * Each of 7 human/editorial controls needs pass + auditable explanation, plus
 * one demand control (Tier 1 or Tier 2). Two topics = 16 PASS total.
 */
export function evaluateTopic(topic, { now = new Date() } = {}) {
  const reasons = [];
  if (!topic || typeof topic !== 'object') return { state: 'BLOCKED', tier: null, passCount: 0, reasons: ['missing topic'] };
  if (!normalizeKeyword(topic.keyword) || !validCountry(topic.country)) reasons.push('invalid target keyword/country');
  if (!topic.slugEs?.startsWith('/blog/') || !topic.slugEn?.startsWith('/en/blog/')) reasons.push('missing ES/EN blog slugs');
  let reviewsPassed = 0;
  for (const check of CHECKS) {
    const evidence = topic.review?.[check];
    if (evidence?.pass === true && typeof evidence.rationale === 'string' && evidence.rationale.trim().length >= 20) {
      reviewsPassed++;
    } else {
      reasons.push('editorial review missing: ' + check);
    }
  }
  const google = checkGoogleEvidence(topic.signals, topic, now);
  const alternative = checkAutocomplete(topic.signals?.autocomplete, topic, now)
    && checkSerp(topic.signals?.serp, topic, now)
    && (checkBingEvidence(topic.signals?.bing, topic, now)
      || checkGscEvidence(topic.signals?.gsc, topic, now));
  const tier = google ? 'T1_GOOGLE' : alternative ? 'T2_TRIANGULATED' : null;
  if (!tier) reasons.push('no qualifying Tier 1 Google volume or Tier 2 independent signals');
  const passCount = reviewsPassed + Number(Boolean(tier));
  const approved = reasons.length === 0 && passCount === 8;
  return {
    state: approved ? 'READY_FOR_DEVELOPMENT' : 'BLOCKED',
    tier: approved ? tier : null,
    demandVerified: Boolean(tier),
    googleMonthlyVolume: google ? topic.signals.google.monthlyVolume : null,
    passCount,
    reasons,
  };
}
export function evaluateBatch(topics, { now = new Date(), reserved = [] } = {}) {
  if (!Array.isArray(topics) || topics.length !== 2) {
    return { state: 'BLOCKED', reason: 'A batch must have exactly two distinct topics (2 ES + 2 EN)', results: [] };
  }
  const seen = new Set(reserved.map(normalizeKeyword));
  const duplicates = [];
  for (const topic of topics) {
    const identifiers = [topic.keyword, topic.slugEs, topic.slugEn].map(normalizeKeyword);
    for (const id of identifiers) {
      if (!id || seen.has(id)) duplicates.push(id);
      seen.add(id);
    }
  }
  const results = topics.map((topic) => evaluateTopic(topic, { now }));
  const approved = !duplicates.length && results.every((r) => r.state === 'READY_FOR_DEVELOPMENT');
  return {
    state: approved ? 'LISTO_PARA_DESARROLLO' : 'BLOQUEADO',
    passCount: results.reduce((acc, r) => acc + r.passCount, 0),
    tiers: results.map((r) => r.tier),
    duplicates,
    results,
    productionAuthorized: false,
  };
}
