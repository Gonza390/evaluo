import type { GradedPreguntaResult, Pregunta } from '@/app/actions';

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
  feedback?: Record<number, GradedPreguntaResult>;
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

const DEMO_STORAGE_MARKER = 'evaluo_simulador_in_progress:demo:';
export const DEMO_MIGRATION_FLAG_KEY = 'evaluo_demo_migration_pending';

/**
 * Convierte los snapshots de un simulador de muestra (demo, sin sesión) en
 * snapshots "full" ligados al usuario. Se usa cuando un usuario crea la cuenta
 * después de llegar por un link al simulador: conserva sus respuestas en vez
 * de empezar de cero. Devuelve los snapshots migrados, ordenados por fecha.
 */
export function migrateDemoToFullSnapshots(userId: string): SimuladorPersistedState[] {
  try {
    const migrated: SimuladorPersistedState[] = [];
    const keysToRemove: string[] = [];

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !key.startsWith(DEMO_STORAGE_MARKER)) continue;

      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw) as Partial<SimuladorPersistedState> | null;
      if (
        !parsed ||
        parsed.version !== 2 ||
        parsed.userId !== null ||
        typeof parsed.materiaId !== 'string' ||
        !parsed.materiaId ||
        Number(parsed.parcial) <= 0 ||
        (parsed.mode !== 'regular' && parsed.mode !== 'errores' && parsed.mode !== 'ultimo_intento') ||
        !Array.isArray(parsed.preguntas) ||
        parsed.preguntas.length === 0
      ) {
        continue;
      }

      const fullKey = key.replace(':demo:', ':full:');
      const existingFull = readPersistedSimulatorState(fullKey);
      if (existingFull) {
        // No pisamos un intento full existente; solo descartamos el demo huérfano.
        keysToRemove.push(key);
        continue;
      }

      const migratedState: SimuladorPersistedState = {
        ...(parsed as SimuladorPersistedState),
        userId,
        savedAt: new Date().toISOString(),
      };
      writePersistedSimulatorState(fullKey, migratedState);
      keysToRemove.push(key);
      migrated.push(migratedState);
    }

    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }

    window.localStorage.removeItem(DEMO_MIGRATION_FLAG_KEY);

    return migrated.sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
  } catch {
    return [];
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
