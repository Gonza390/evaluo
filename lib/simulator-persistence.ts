import type { Pregunta } from '@/app/actions';

export type SimuladorPersistedState = {
  version: 2;
  userId: string | null;
  materiaId: string;
  parcial: number;
  mode: 'regular' | 'errores' | 'ultimo_intento';
  preguntas: Pregunta[];
  currentQuestionIndex: number;
  timeLeft: number;
  selectedAnswers: Record<number, number | number[]>;
  flaggedQuestions: number[];
  hasStarted: boolean;
  savedAt: string;
};

export function listPersistedSimulatorStates(userId: string) {
  try {
    const prefix = 'evaluo_simulador_in_progress:';
    const found: SimuladorPersistedState[] = [];

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !key.startsWith(prefix)) continue;

      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw) as Partial<SimuladorPersistedState> | null;
      if (
        parsed &&
        parsed.version === 2 &&
        parsed.userId === userId &&
        typeof parsed.materiaId === 'string' &&
        Number(parsed.parcial) > 0
      ) {
        found.push(parsed as SimuladorPersistedState);
      }
    }

    return found.sort((a, b) => {
      const aTime = new Date(a.savedAt || 0).getTime();
      const bTime = new Date(b.savedAt || 0).getTime();
      return bTime - aTime;
    });
  } catch {
    return [];
  }
}

export function readPersistedSimulatorState(storageKey: string) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as SimuladorPersistedState;
  } catch {
    return null;
  }
}

export function writePersistedSimulatorState(
  storageKey: string,
  payload: SimuladorPersistedState
) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
}

export function clearPersistedSimulatorState(storageKey: string) {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // ignore storage errors
  }
}

export function saveLastSimulatorContext(materiaId: string, parcial: number) {
  try {
    window.localStorage.setItem(
      'evaluo_last_simulador_context',
      JSON.stringify({ materiaId, parcial })
    );
  } catch {
    // ignore storage errors
  }
}
