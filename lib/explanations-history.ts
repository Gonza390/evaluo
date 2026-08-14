import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';

export type ExplanationHistoryItem = {
  id: string;
  materiaNombre: string | null;
  parcial: number | null;
  enunciado: string;
  explicacion: string;
  provider: string | null;
  createdAt: string;
};

export async function recordExplanationsHistory(input: {
  userId: string;
  materiaId: string | null;
  parcial: number;
  items: Array<{ preguntaId: string; enunciado: string; explicacion: string; provider: string }>;
}) {
  if (input.items.length === 0) {
    return;
  }

  try {
    const admin = createAdminClient();

    const { data: materiaRow } = await admin
      .from('materias')
      .select('id, nombre')
      .eq('id', input.materiaId ?? '')
      .maybeSingle<{ id: string; nombre: string }>();

    const materiaNombre = materiaRow?.nombre ?? null;
    const rows = input.items.map((item) => ({
      user_id: input.userId,
      materia_id: input.materiaId,
      materia_nombre: materiaNombre,
      parcial: input.parcial,
      pregunta_id: item.preguntaId,
      enunciado: item.enunciado,
      explicacion: item.explicacion,
      provider: item.provider,
    }));

    const { error } = await admin.from('explanations_history').insert(rows);
    if (error) {
      logError('explanationsHistory.record', error, { userId: input.userId });
    }
  } catch (error) {
    logError('explanationsHistory.record', error, { userId: input.userId });
  }
}

export async function getExplanationHistory(userId: string): Promise<ExplanationHistoryItem[]> {
  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('explanations_history')
      .select('id, materia_nombre, parcial, enunciado, explicacion, provider, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      logError('explanationsHistory.get', error, { userId });
      return [];
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      materiaNombre: row.materia_nombre ?? null,
      parcial: row.parcial ?? null,
      enunciado: row.enunciado,
      explicacion: row.explicacion,
      provider: row.provider ?? null,
      createdAt: row.created_at,
    }));
  } catch (error) {
    logError('explanationsHistory.get', error, { userId });
    return [];
  }
}
