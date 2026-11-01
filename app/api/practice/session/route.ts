import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { trackServerAnalyticsEvent } from '@/lib/server-analytics';

const MODES = new Set(['unir', 'completar', 'casos', 'mixto', 'simulacro', 'opciones', 'flashcards']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type HistoryAnswer = { prompt: string; selectedAnswer: string; correctAnswer: string; correct: boolean };
function isHistoryAnswer(value: unknown): value is HistoryAnswer {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const a = value as Record<string, unknown>;
  return typeof a.prompt === 'string' && a.prompt.length <= 2000 &&
    typeof a.selectedAnswer === 'string' && a.selectedAnswer.length <= 2000 &&
    typeof a.correctAnswer === 'string' && a.correctAnswer.length <= 2000 &&
    typeof a.correct === 'boolean';
}

export async function POST(request: Request) {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const p = payload as Record<string, unknown>;
  if (typeof p.materialId !== 'string' || !UUID.test(p.materialId) ||
      typeof p.mode !== 'string' || !MODES.has(p.mode) ||
      typeof p.total !== 'number' || !Number.isInteger(p.total) || p.total < 1 || p.total > 100 ||
      typeof p.correct !== 'number' || !Number.isInteger(p.correct) || p.correct < 0 || p.correct > p.total ||
      (p.sessionId !== undefined && (typeof p.sessionId !== 'string' || !UUID.test(p.sessionId)))) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const answers = p.answers === undefined ? [] : p.answers;
  if (!Array.isArray(answers) || answers.length > 100 || answers.length > p.total ||
      !answers.every(isHistoryAnswer) || JSON.stringify(answers).length > 120_000) {
    return NextResponse.json({ error: 'invalid_answers' }, { status: 400 });
  }
  const { data: material, error: materialError } = await supabase.from('student_materials')
    .select('id').eq('id', p.materialId).eq('user_id', user.id).eq('processing_status', 'ready').maybeSingle();
  if (materialError || !material) return NextResponse.json({ error: 'material_not_found' }, { status: 404 });

  // Los resultados son autodeclarados por el cliente y no sirven para acreditar dominio.
  // El ID por intento hace que los reintentos de red sean idempotentes.
  const db = createAdminClient() as unknown as {
    from: (table: string) => {
      insert: (value: Record<string, unknown>) => PromiseLike<{ error: { code?: string; message: string } | null }>;
    };
  };
  const attemptId = p.sessionId ?? crypto.randomUUID();
  const { error } = await db.from('practice_mode_sessions').insert({
    id: attemptId,
    user_id: user.id, material_id: material.id, mode: p.mode,
    correct: p.correct, total: p.total, answers,
    source: 'client_self_reported',
  });
  if (error && error.code !== '23505') {
    return NextResponse.json({ error: 'save_failed' }, { status: 503 });
  }
  if (!error) {
    await trackServerAnalyticsEvent({
      eventName: 'practice_mode_session_completed', userId: user.id,
      path: '/dashboard/practicar/' + material.id + '/' + p.mode,
      metadata: { material_id: material.id, mode: p.mode, correct: p.correct, total: p.total, history_session_id: attemptId, source: 'client_self_reported' },
    });
  }
  return NextResponse.json({ ok: true });
}
