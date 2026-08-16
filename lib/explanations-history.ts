import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';

export type ExplanationHistoryItem = {
  id: string;
  materiaNombre: string | null;
  parcial: number | null;
  preguntaId: string | null;
  enunciado: string;
  explicacion: string;
  provider: string | null;
  opciones: string[] | null;
  respuestaCorrecta: string | null;
  opcionElegida: number | null;
  vecesFallada: number;
  createdAt: string;
};

export async function recordExplanationsHistory(input: {
  userId: string;
  materiaId: string | null;
  parcial: number;
  items: Array<{
    preguntaId: string;
    enunciado: string;
    explicacion: string;
    provider: string;
    opciones?: string[] | null;
    respuestaCorrecta?: string | null;
    opcionElegida?: number | null;
  }>;
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

    const preguntaIds = input.items
      .map((item) => item.preguntaId)
      .filter((id): id is string => Boolean(id));

    const existingByQuestion = new Map<string, number>();
    if (preguntaIds.length > 0) {
      const { data: existingRows } = await admin
        .from('explanations_history')
        .select('pregunta_id, veces_fallada')
        .eq('user_id', input.userId)
        .in('pregunta_id', preguntaIds);

      for (const row of existingRows ?? []) {
        if (row.pregunta_id) {
          existingByQuestion.set(row.pregunta_id, row.veces_fallada);
        }
      }
    }

    const rows = input.items.map((item) => ({
      user_id: input.userId,
      materia_id: input.materiaId,
      materia_nombre: materiaNombre,
      parcial: input.parcial,
      pregunta_id: item.preguntaId,
      enunciado: item.enunciado,
      explicacion: item.explicacion,
      provider: item.provider,
      opciones: item.opciones ?? null,
      respuesta_correcta: item.respuestaCorrecta ?? null,
      opcion_elegida: item.opcionElegida ?? null,
      veces_fallada: (existingByQuestion.get(item.preguntaId) ?? 0) + 1,
    }));

    const { error } = await admin.from('explanations_history').upsert(rows, {
      onConflict: 'user_id,pregunta_id',
    });

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
      .select(
        'id, materia_nombre, parcial, pregunta_id, enunciado, explicacion, provider, opciones, respuesta_correcta, opcion_elegida, veces_fallada, created_at'
      )
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
      preguntaId: row.pregunta_id ?? null,
      enunciado: row.enunciado,
      explicacion: row.explicacion,
      provider: row.provider ?? null,
      opciones: Array.isArray(row.opciones)
        ? row.opciones.filter((option): option is string => typeof option === 'string')
        : null,
      respuestaCorrecta: row.respuesta_correcta ?? null,
      opcionElegida: row.opcion_elegida ?? null,
      vecesFallada: row.veces_fallada,
      createdAt: row.created_at,
    }));
  } catch (error) {
    logError('explanationsHistory.get', error, { userId });
    return [];
  }
}
