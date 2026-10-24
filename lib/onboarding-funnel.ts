/** Analytics for the four-step first-PDF guide. Kept separate from the legacy summary flow. */
// V5 distingue el recorrido Entender → Practicar → Progreso → Reforzar del orden anterior.
export const FIRST_PDF_GUIDE_VERSION = 'first_pdf_guide_v5_20261024';
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
 * Cohorte de estudiantes únicos que iniciaron dentro del período consultado.
 * Varios intentos de la misma persona se combinan hasta la primera finalización;
 * saltar en un intento anterior no equivale a un abandono definitivo.
 * Eventos históricos y demos no forman parte del embudo.
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

  // La cohorte agrupa intentos por usuario. Un intento posterior completado debe
  // prevalecer sobre un abandono anterior, sin sumar dos estudiantes.
  const attemptsByActor = new Map<string, Run[]>();
  for (const run of runs.values()) {
    const list = attemptsByActor.get(run.actor) ?? [];
    list.push(run);
    attemptsByActor.set(run.actor, list);
  }
  const visits = Object.fromEntries(FIRST_PDF_GUIDE_STEPS.map((id) => [id, 0])) as Record<FirstPdfGuideStep, number>;
  const dropoffs = Object.fromEntries(FIRST_PDF_GUIDE_STEPS.map((id) => [id, 0])) as Record<FirstPdfGuideStep, number>;
  const actions: Record<string, number> = {};
  const times: number[] = [];
  let completed = 0, skipped = 0, mobileStarts = 0, firstActions = 0;
  const maxDuration = 30 * 60 * 1000;

  for (const attempts of attemptsByActor.values()) {
    attempts.sort((a, b) => a.startedAt - b.startedAt);
    if (attempts[0].device === 'mobile') mobileStarts++;
    const reached = new Set<FirstPdfGuideStep>();
    let finalAttempt: { skipped: boolean; lastViewed: FirstPdfGuideStep | null } | null = null;
    let completedRun: { run: Run; completedAt: number } | null = null;

    for (const run of attempts) {
      if (completedRun) break; // eventos posteriores a completar no generan un nuevo onboarding
      let completedAt: number | null = null;
      let skippedAt: number | null = null;
      let lastViewed: FirstPdfGuideStep | null = null;

      for (const event of run.events) {
        if (event.name === 'first_pdf_guide_step_viewed' && event.step &&
            completedAt === null && skippedAt === null) {
          reached.add(event.step);
          lastViewed = event.step;
        }
        if (event.name === 'first_pdf_guide_completed' &&
            completedAt === null && skippedAt === null) completedAt = event.at;
        if (event.name === 'first_pdf_guide_skipped' &&
            skippedAt === null && completedAt === null) skippedAt = event.at;
      }

      if (completedAt !== null) {
        completedRun = { run, completedAt };
      } else {
        finalAttempt = { skipped: skippedAt !== null, lastViewed };
      }
    }
    for (const step of reached) visits[step]++;

    if (completedRun) {
      completed++;
      const elapsed = completedRun.completedAt - completedRun.run.startedAt;
      if (elapsed >= 0 && elapsed <= maxDuration) times.push(elapsed / 1000);
      const action = completedRun.run.events.find((event) =>
        event.name === 'first_pdf_guide_post_action' &&
        event.at >= completedRun!.completedAt && event.action
      )?.action;
      if (action) {
        firstActions++;
        actions[action] = (actions[action] ?? 0) + 1;
      }
    } else if (finalAttempt) {
      if (finalAttempt.skipped) skipped++;
      if (finalAttempt.lastViewed) dropoffs[finalAttempt.lastViewed]++;
    }
  }
  times.sort((a, b) => a - b);
  const middle = Math.floor(times.length / 2);
  const medianDurationSeconds = times.length === 0 ? null :
    Math.round(times.length % 2 ? times[middle] : (times[middle - 1] + times[middle]) / 2);
  const started = attemptsByActor.size;
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
