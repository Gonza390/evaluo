import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { trackServerAnalyticsEvent } from '@/lib/server-analytics';

const MODES = new Set(['unir', 'completar', 'casos', 'mixto', 'simulacro', 'opciones']);
export async function POST(request: Request) {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  const p = payload as Record<string, unknown>;
  if (typeof p.materialId !== 'string' || !/^[0-9a-f-]{36}$/i.test(p.materialId) ||
      typeof p.mode !== 'string' || !MODES.has(p.mode) ||
      !Number.isInteger(p.total) || typeof p.total !== 'number' || p.total < 1 || p.total > 30 ||
      !Number.isInteger(p.correct) || typeof p.correct !== 'number' || p.correct < 0 || p.correct > p.total) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }
  const { data: material } = await supabase.from('student_materials').select('id').eq('id', p.materialId).eq('user_id', user.id).eq('processing_status', 'ready').maybeSingle();
  if (!material) return NextResponse.json({ error: 'material_not_found' }, { status: 404 });
  // Registro de interacción autodeclarado: NO es una nota verificada ni evidencia para dominio de temas.
  await trackServerAnalyticsEvent({
    eventName: 'practice_mode_session_completed', userId: user.id,
    path: '/dashboard/practicar/' + material.id + '/' + p.mode,
    metadata: { material_id: material.id, mode: p.mode, correct: p.correct, total: p.total, source: 'client_self_reported' },
  });
  return NextResponse.json({ ok: true });
}
