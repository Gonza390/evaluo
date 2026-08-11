const SIMULATOR_AUTO_RESUME_WINDOW_MINUTES = 15;

export function shouldAutoResumeSimulator(savedAt: string) {
  const savedAtMs = new Date(savedAt).getTime();
  if (!Number.isFinite(savedAtMs)) return false;

  const elapsedMs = Date.now() - savedAtMs;
  return elapsedMs >= 0 && elapsedMs <= SIMULATOR_AUTO_RESUME_WINDOW_MINUTES * 60 * 1000;
}

export function dedupeOptionsForView(options: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const option of options) {
    const clean = option.replace(/\s+/g, ' ').trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(clean);
  }
  return unique;
}

export function parseCorrectAnswers(raw: string) {
  return raw
    .split(/\s*(?:\||;)\s*/g)
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

export function isMultiAnswer(raw: string) {
  return parseCorrectAnswers(raw).length > 1;
}

export function normalizeForCompare(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}
