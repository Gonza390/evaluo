import { getAttributionSnapshot } from '@/lib/attribution';
import { trackSimulatorMarketingEvent } from '@/lib/marketing-analytics';

type SimulatorLifecycleEvent =
  | 'simulator_started'
  | 'simulator_resumed'
  | 'simulator_finished'
  | 'simulator_abandoned';

type SimulatorLoginGateEvent = 'simulator_login_gate_viewed' | 'simulator_login_gate_cta_clicked';

type SimulatorFunnelEvent =
  | 'simulator_ready'
  | 'simulator_progress_checkpoint'
  | 'simulator_needs_feedback';

type SimulatorAnalyticsPayload = {
  session_key: string;
  user_id: string | null;
  path: string;
  metadata: Record<string, unknown>;
};

type SimulatorEventContext = {
  userId: string | null;
  materiaId: string;
  parcial: number;
  carreraId?: string;
  universidadId?: string;
  mode: 'regular' | 'errores' | 'ultimo_intento';
  premiumOnly: boolean;
  path: string;
};

type SimulatorProgressSnapshot = {
  questionIndex: number;
  answeredCount: number;
  progressPercent: number;
  timeLeft: number;
};

export function getSimulatorAnalyticsSessionKey() {
  const key = 'evaluo_session_key';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const value = `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  window.localStorage.setItem(key, value);
  return value;
}

export async function trackSimulatorAnalyticsEvent(
  eventName: string,
  payload: SimulatorAnalyticsPayload
) {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        ...payload,
      }),
      keepalive: true,
    });
  } catch {
    // ignore tracking failures
  }
}

function buildSimulatorMetadata(
  context: SimulatorEventContext,
  progress: SimulatorProgressSnapshot,
  extra?: Record<string, unknown>
) {
  return {
    attribution: getAttributionSnapshot(),
    materia_id: context.materiaId,
    parcial: context.parcial,
    carrera_id: context.carreraId,
    universidad_id: context.universidadId,
    mode: context.mode,
    premium_only: context.premiumOnly,
    question_index: progress.questionIndex,
    answered_count: progress.answeredCount,
    progress_pct: progress.progressPercent,
    time_left_sec: progress.timeLeft,
    ...extra,
  };
}

export async function trackSimulatorLifecycleEvent(
  eventName: SimulatorLifecycleEvent,
  context: SimulatorEventContext,
  progress: SimulatorProgressSnapshot
) {
  const payload = {
    session_key: getSimulatorAnalyticsSessionKey(),
    user_id: context.userId,
    path: context.path,
    metadata: buildSimulatorMetadata(context, progress),
  };

  await trackSimulatorAnalyticsEvent(eventName, payload);

  if (eventName === 'simulator_started' || eventName === 'simulator_finished') {
    trackSimulatorMarketingEvent(eventName, {
      materia_id: context.materiaId,
      parcial: context.parcial,
      mode: context.mode,
      premium_only: context.premiumOnly,
      question_index: progress.questionIndex,
      answered_count: progress.answeredCount,
      progress_pct: progress.progressPercent,
    });
  }
}

export async function trackSimulatorLoginGateEvent(
  eventName: SimulatorLoginGateEvent,
  context: SimulatorEventContext,
  progress: Pick<SimulatorProgressSnapshot, 'answeredCount' | 'progressPercent' | 'timeLeft'>,
  cta?: 'login' | 'signup'
) {
  await trackSimulatorAnalyticsEvent(eventName, {
    session_key: getSimulatorAnalyticsSessionKey(),
    user_id: context.userId,
    path: context.path,
    metadata: buildSimulatorMetadata(
      context,
      {
        questionIndex: 0,
        answeredCount: progress.answeredCount,
        progressPercent: progress.progressPercent,
        timeLeft: progress.timeLeft,
      },
      cta ? { cta } : undefined
    ),
  });
}

export async function trackSimulatorFunnelEvent(
  eventName: SimulatorFunnelEvent,
  context: SimulatorEventContext,
  progress: SimulatorProgressSnapshot,
  extra?: Record<string, unknown>
) {
  await trackSimulatorAnalyticsEvent(eventName, {
    session_key: getSimulatorAnalyticsSessionKey(),
    user_id: context.userId,
    path: context.path,
    metadata: buildSimulatorMetadata(context, progress, extra),
  });
}

export async function trackSimulatorAbandonEvent(
  context: SimulatorEventContext,
  progress: SimulatorProgressSnapshot,
  lifecycleSource: 'pagehide' | 'beforeunload' | 'visibilitychange' | 'unmount'
) {
  await trackSimulatorAnalyticsEvent('simulator_abandoned', {
    session_key: getSimulatorAnalyticsSessionKey(),
    user_id: context.userId,
    path: context.path,
    metadata: buildSimulatorMetadata(context, progress, {
      lifecycle_source: lifecycleSource,
    }),
  });
}

export async function trackSimulatorShareEvent(
  context: SimulatorEventContext,
  extra?: Record<string, unknown>
) {
  await trackSimulatorAnalyticsEvent('simulator_result_shared', {
    session_key: getSimulatorAnalyticsSessionKey(),
    user_id: context.userId,
    path: context.path,
    metadata: {
      attribution: getAttributionSnapshot(),
      materia_id: context.materiaId,
      parcial: context.parcial,
      carrera_id: context.carreraId,
      universidad_id: context.universidadId,
      mode: context.mode,
      premium_only: context.premiumOnly,
      ...extra,
    },
  });
}
