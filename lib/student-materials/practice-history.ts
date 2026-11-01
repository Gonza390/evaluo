import 'server-only';
import { createAdminClient } from '@/lib/supabase-admin';

export type PracticeHistoryAnswer = {
  prompt: string;
  selectedAnswer: string;
  correctAnswer: string;
  correct: boolean;
};
export type PracticeHistoryEntry = {
  id: string;
  materialId: string;
  mode: string;
  correct: number;
  total: number;
  completedAt: string;
  answers: PracticeHistoryAnswer[] | null;
};

const MODES = new Set(['unir', 'completar', 'casos', 'mixto', 'simulacro', 'opciones', 'flashcards']);
const isText = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const isScore = (correct: unknown, total: unknown): correct is number =>
  typeof correct === 'number' && Number.isInteger(correct) && correct >= 0 &&
  typeof total === 'number' && Number.isInteger(total) && total >= 1 && total <= 100 && correct <= total;
function safeAnswers(value: unknown): PracticeHistoryAnswer[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  return value.flatMap((a) => {
    if (!a || typeof a !== 'object') return [];
    const item = a as Record<string, unknown>;
    if (typeof item.prompt !== 'string' || typeof item.selectedAnswer !== 'string' ||
        typeof item.correctAnswer !== 'string' || typeof item.correct !== 'boolean') return [];
    return [{
      prompt: item.prompt, selectedAnswer: item.selectedAnswer,
      correctAnswer: item.correctAnswer, correct: item.correct,
    }];
  });
}

/** Historial privado: nuevas sesiones detalladas y sesiones antiguas solo con puntuación. */
export async function getPracticeHistory(userId: string, allowedMaterialIds: string[]): Promise<PracticeHistoryEntry[]> {
  if (allowedMaterialIds.length === 0) return [];
  const allowed = new Set(allowedMaterialIds);
  const admin = createAdminClient();
  // La tabla es nueva: el cliente generado de Supabase se actualizará con la próxima regeneración.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newSessions = (admin as unknown as { from: (name: string) => any }).from('practice_mode_sessions')
    .select('id,material_id,mode,correct,total,answers,completed_at')
    .eq('user_id', userId).in('material_id', allowedMaterialIds)
    .order('completed_at', { ascending: false }).limit(500);
  const legacyEvents = admin.from('analytics_events')
    .select('id,metadata,created_at').eq('user_id', userId)
    .eq('event_name', 'practice_mode_session_completed')
    .order('created_at', { ascending: false }).limit(500);
  const [recent, legacy] = await Promise.all([newSessions, legacyEvents]);
  // No presentar una pantalla "sin prácticas" cuando falló la consulta real.
  if (recent.error) throw new Error('practice_history_unavailable');
  const saved: PracticeHistoryEntry[] = (recent.error ? [] : recent.data ?? []).flatMap((row: Record<string, unknown>) => {
    if (!isText(row.id) || !isText(row.material_id) || !allowed.has(row.material_id) ||
        !isText(row.mode) || !MODES.has(row.mode) || !isScore(row.correct, row.total) ||
        !isText(row.completed_at)) return [];
    return [{
      id: row.id, materialId: row.material_id, mode: row.mode,
      correct: row.correct, total: row.total as number, completedAt: row.completed_at,
      answers: safeAnswers(row.answers),
    }];
  });
  const old: PracticeHistoryEntry[] = (legacy.error ? [] : legacy.data ?? []).flatMap((event) => {
    const metadata = event.metadata;
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return [];
    const m = metadata as Record<string, unknown>;
    if (!isText(m.material_id) || !allowed.has(m.material_id) || !isText(m.mode) ||
        !MODES.has(m.mode) || !isScore(m.correct, m.total)) return [];
    const when = Date.parse(event.created_at);
    // No duplicar el evento analítico de un intento ya guardado en la nueva tabla.
    const storedId = m.history_session_id;
    if (isText(storedId) && saved.some(row => row.id === storedId)) return [];
    // Eventos anteriores a la inclusión de ID: comparar el instante de guardado,
    // nunca fusionar resultados repetidos que se hicieron minutos después.
    if (!isText(storedId) && saved.some((row) => row.materialId === m.material_id && row.mode === m.mode &&
        row.correct === m.correct && row.total === m.total &&
        Math.abs(Date.parse(row.completedAt) - when) < 5_000)) return [];
    return [{
      id: 'legacy-' + event.id, materialId: m.material_id, mode: m.mode,
      correct: m.correct, total: m.total as number,
      completedAt: event.created_at, answers: null,
    }];
  });
  return [...saved, ...old]
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
    .slice(0, 500);
}
