/** Analytics for the four-step first-PDF guide. Kept separate from the legacy summary flow. */
export const FIRST_PDF_GUIDE_VERSION = 'first_pdf_guide_v4_20261020';
export const FIRST_PDF_GUIDE_STEPS = ['summary', 'practice', 'topic', 'errors'] as const;
export type FirstPdfGuideStep = (typeof FIRST_PDF_GUIDE_STEPS)[number];

export type FirstPdfGuideEvent = {
  event_name: string;
  user_id: string | null;
  session_key: string | null;
  device_type: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type FirstPdfOnboardingStats = {
  version: string;
  started: number;
  steps: Array<{ id: FirstPdfGuideStep; reached: number; dropoffs: number }>;
  completed: number;
  skipped: number;
  incomplete: number;
  completionPct: number;
  skipPct: number;
  medianDurationSeconds: number | null;
  mobileStarts: number;
  desktopStarts: number;
  firstActions: number;
  firstActionPct: number;
  actions: Record<string, number>;
};

/**
 * Daily cohort: each logged-in student contributes only their first tour start of the day.
 * A run is joined by its unique run ID and version, not by an event count. Historical
 * onboarding and simulated preview events never enter this funnel.
 */
export function summarizeFirstPdfOnboarding(events: FirstPdfGuideEvent[]): FirstPdfOnboardingStats {
  type Run = {
    startedAt: number;
    actor: string;
    runId: string;
    device: string | null;
    events: Array<{ name: string; at: number; step: FirstPdfGuideStep | null; action: string | null }>;
  };
  const runs = new Map<string, Run>();
  const sorted = [...events].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const knownSteps = new Set<string>(FIRST_PDF_GUIDE_STEPS);

  for (const row of sorted) {
    const meta = row.metadata;
    if (!meta || meta.guide_version !== FIRST_PDF_GUIDE_VERSION ||
        typeof meta.guide_run_id !== 'string' || !meta.guide_run_id ||
        !row.user_id || !row.session_key) continue;
    const runId = meta.guide_run_id;
    const at = Date.parse(row.created_at);
    if (!Number.isFinite(at)) continue;
    if (row.event_name === 'first_pdf_guide_started' && !runs.has(runId)) {
      runs.set(runId, {
        startedAt: at, actor: row.user_id, runId, device: row.device_type, events: [],
      });
    }
    const run = runs.get(runId);
    if (!run || run.actor !== row.user_id || at < run.startedAt) continue;
    const step = typeof meta.step === 'string' && knownSteps.has(meta.step)
      ? meta.step as FirstPdfGuideStep : null;
    run.events.push({
      name: row.event_name,
      at,
      step,
      action: typeof meta.action === 'string' ? meta.action : null,
    });
  }

  const firstPerActor = new Map<string, Run>();
  for (const run of runs.values()) {
    const existing = firstPerActor.get(run.actor);
    if (!existing || run.startedAt < existing.startedAt) firstPerActor.set(run.actor, run);
  }
  const chosen = [...firstPerActor.values()];
  const visits = Object.fromEntries(FIRST_PDF_GUIDE_STEPS.map((id) => [id, 0])) as Record<FirstPdfGuideStep, number>;
  const dropoffs = Object.fromEntries(FIRST_PDF_GUIDE_STEPS.map((id) => [id, 0])) as Record<FirstPdfGuideStep, number>;
  const actions: Record<string, number> = {};
  const times: number[] = [];
  let completed = 0, skipped = 0, mobileStarts = 0, firstActions = 0;

  for (const run of chosen) {
    if (run.device === 'mobile') mobileStarts++;
    const reached = new Set<FirstPdfGuideStep>();
    let lastViewed: FirstPdfGuideStep | null = null;
    let completedAt: number | null = null;
    let skippedAt: number | null = null;
    const maxDuration = 30 * 60 * 1000; // protect duration from idle/background tabs

    for (const event of run.events) {
      if (event.name === 'first_pdf_guide_step_viewed' && event.step &&
          completedAt === null && skippedAt === null) {
        reached.add(event.step);
        lastViewed = event.step;
      }
      if (event.name === 'first_pdf_guide_completed' && completedAt === null && skippedAt === null) {
        completedAt = event.at;
      }
      if (event.name === 'first_pdf_guide_skipped' && skippedAt === null && completedAt === null) {
        skippedAt = event.at;
      }
    }
    for (const step of reached) visits[step]++;
    if (completedAt !== null) {
      completed++;
      const elapsed = completedAt - run.startedAt;
      if (elapsed >= 0 && elapsed <= maxDuration) times.push(elapsed / 1000);
      const action = run.events.find((e) =>
        e.name === 'first_pdf_guide_post_action' &&
        e.at >= completedAt! && e.action
      )?.action;
      if (action) {
        firstActions++;
        actions[action] = (actions[action] ?? 0) + 1;
      }
    } else {
      if (skippedAt !== null) skipped++;
      if (lastViewed) dropoffs[lastViewed]++;
    }
  }
  times.sort((a, b) => a - b);
  const middle = Math.floor(times.length / 2);
  const medianDurationSeconds = times.length === 0 ? null :
    Math.round(times.length % 2 ? times[middle] : (times[middle - 1] + times[middle]) / 2);
  const started = chosen.length;
  return {
    version: FIRST_PDF_GUIDE_VERSION,
    started,
    steps: FIRST_PDF_GUIDE_STEPS.map((id) => ({
      id, reached: visits[id], dropoffs: dropoffs[id],
    })),
    completed, skipped,
    incomplete: Math.max(0, started - completed - skipped),
    completionPct: started ? Math.round((completed / started) * 1000) / 10 : 0,
    skipPct: started ? Math.round((skipped / started) * 1000) / 10 : 0,
    medianDurationSeconds,
    mobileStarts,
    desktopStarts: started - mobileStarts,
    firstActions,
    firstActionPct: completed ? Math.round((firstActions / completed) * 1000) / 10 : 0,
    actions,
  };
}
