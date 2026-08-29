'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { logError } from '@/lib/observability';

const ALLOWED_REASONS = new Set([
  'more_questions',
  'better_explanations',
  'summaries',
  'exam_similarity',
  'confusing_experience',
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SimulatorFeedbackMode = 'regular' | 'errores' | 'premium' | 'ultimo_intento' | 'unknown';

function parseSimulatorPath(rawPath: string) {
  try {
    const url = new URL(rawPath, 'https://evaluo.local');
    const parts = url.pathname.split('/').filter(Boolean);
    const simulatorIndex = parts.indexOf('simulador');
    if (simulatorIndex < 0) {
      return { materiaId: null, parcial: null, mode: 'unknown' as SimulatorFeedbackMode };
    }

    const first = decodeURIComponent(parts[simulatorIndex + 1] ?? '');
    let materiaId = '';
    let parcial: number | null = null;
    let mode: SimulatorFeedbackMode = 'regular';

    if (first === 'errores') {
      materiaId = decodeURIComponent(parts[simulatorIndex + 2] ?? '');
      parcial = Number(url.searchParams.get('parcial')) || 1;
      mode = 'errores';
    } else if (first === 'premium') {
      materiaId = decodeURIComponent(parts[simulatorIndex + 2] ?? '');
      parcial = Number(parts[simulatorIndex + 3]) || 1;
      mode = 'premium';
    } else if (first === 'ultimo-intento') {
      materiaId = decodeURIComponent(parts[simulatorIndex + 2] ?? '');
      parcial = Number(parts[simulatorIndex + 3]) || 1;
      mode = 'ultimo_intento';
    } else {
      materiaId = first;
      parcial = Number(parts[simulatorIndex + 2]) || 1;
    }

    return {
      materiaId: UUID_RE.test(materiaId) ? materiaId : null,
      parcial: parcial && [1, 2, 3].includes(parcial) ? parcial : null,
      mode,
    };
  } catch {
    return { materiaId: null, parcial: null, mode: 'unknown' as SimulatorFeedbackMode };
  }
}

export async function submitSimulatorFeedback(data: {
  reason: string;
  comment?: string;
  path: string;
}) {
  try {
    if (!ALLOWED_REASONS.has(data.reason)) {
      return { success: false, message: 'Seleccioná una opción válida.' };
    }

    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // En demo anónima mantenemos el feedback de producto vía analytics, pero no
    // persistimos una fila imposible de asociar a un usuario real.
    if (!user) {
      return { success: true, persisted: false };
    }

    const path = (data.path || '/simulador').slice(0, 500);
    const comment = (data.comment ?? '').trim().slice(0, 1200) || null;
    const context = parseSimulatorPath(path);
    const admin = createAdminClient() as unknown as SupabaseClient;

    const { error } = await admin.from('simulator_feedback').insert({
      user_id: user.id,
      materia_id: context.materiaId,
      parcial: context.parcial,
      mode: context.mode,
      reason: data.reason,
      comment,
      path,
    });

    if (error) {
      logError('simulatorFeedback.insert', error, {
        userId: user.id,
        materiaId: context.materiaId,
        parcial: context.parcial,
        mode: context.mode,
      });
      return { success: false, message: 'No pudimos guardar tu comentario.' };
    }

    return { success: true, persisted: true };
  } catch (error) {
    logError('simulatorFeedback.submit', error);
    return { success: false, message: 'No pudimos guardar tu comentario.' };
  }
}
