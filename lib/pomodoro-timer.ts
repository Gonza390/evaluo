/** Local-only, fixed 25-minute focus timer. No database or API calls. */
export const POMODORO_DURATION_SECONDS = 25 * 60;

export type PomodoroState = {
  phase: 'idle' | 'running' | 'paused' | 'finished';
  remainingSeconds: number;
  endsAt: number | null;
};

export const INITIAL_POMODORO: PomodoroState = {
  phase: 'idle',
  remainingSeconds: POMODORO_DURATION_SECONDS,
  endsAt: null,
};

const clampSeconds = (value: number) =>
  Math.max(0, Math.min(POMODORO_DURATION_SECONDS, Math.ceil(value)));

export function remainingPomodoroSeconds(state: PomodoroState, now: number): number {
  return state.phase === 'running' && state.endsAt !== null
    ? clampSeconds((state.endsAt - now) / 1000)
    : clampSeconds(state.remainingSeconds);
}

export function isPomodoroComplete(state: PomodoroState, now: number): boolean {
  return state.phase === 'running' && state.endsAt !== null && state.endsAt <= now;
}

export function finishedPomodoro(): PomodoroState {
  return { phase: 'finished', remainingSeconds: 0, endsAt: null };
}

export function beginPomodoro(state: PomodoroState, now: number): PomodoroState {
  const seconds = state.phase === 'paused'
    ? remainingPomodoroSeconds(state, now)
    : POMODORO_DURATION_SECONDS;
  return { phase: 'running', remainingSeconds: seconds, endsAt: now + seconds * 1000 };
}

export function pausePomodoro(state: PomodoroState, now: number): PomodoroState {
  if (state.phase !== 'running') return state;
  const seconds = remainingPomodoroSeconds(state, now);
  return seconds === 0 ? finishedPomodoro() : { phase: 'paused', remainingSeconds: seconds, endsAt: null };
}

export function restorePomodoro(raw: string | null, now: number): PomodoroState {
  if (!raw) return INITIAL_POMODORO;
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') return INITIAL_POMODORO;
    const value = data as Record<string, unknown>;
    if (value.phase === 'running' && typeof value.endsAt === 'number' &&
        Number.isFinite(value.endsAt) && value.endsAt > 0) {
      if (value.endsAt <= now) return finishedPomodoro();
      return {
        phase: 'running',
        remainingSeconds: clampSeconds((value.endsAt - now) / 1000),
        endsAt: value.endsAt,
      };
    }
    if (value.phase === 'paused' && typeof value.remainingSeconds === 'number' &&
        Number.isFinite(value.remainingSeconds)) {
      const remainingSeconds = clampSeconds(value.remainingSeconds);
      return remainingSeconds ? { phase: 'paused', remainingSeconds, endsAt: null } : finishedPomodoro();
    }
    if (value.phase === 'finished') return finishedPomodoro();
  } catch { /* Malformed or outdated browser state; start clean. */ }
  return INITIAL_POMODORO;
}

export function formatPomodoroTime(seconds: number): string {
  const safe = clampSeconds(seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}
