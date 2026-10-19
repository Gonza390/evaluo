import {
  registrarRespuestaUsuario as registrarRespuestaUsuarioFallback,
  type GradeQuestionServerResult,
} from './simulador-server';

export * from './simulador-server';

type GradeRpcRow = {
  status: string;
  success: boolean;
  correct: boolean | null;
  correct_indexes: number[] | null;
};

type GradeRpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => PromiseLike<{ data: GradeRpcRow[] | null; error: { message: string } | null }>;
};

export async function registrarRespuestaUsuario(data: {
  usuario_id: string;
  pregunta_id: string;
  materia_id: string;
  respuesta_seleccionada: string | string[];
}): Promise<GradeQuestionServerResult> {
  if (typeof window !== 'undefined') {
    try {
      const { supabase } = await import('@/lib/supabase-client');
      const answers = Array.isArray(data.respuesta_seleccionada)
        ? data.respuesta_seleccionada
        : [data.respuesta_seleccionada];

      const { data: rows, error } = await (supabase as unknown as GradeRpcClient).rpc(
        'grade_simulator_question',
        {
          p_pregunta_id: data.pregunta_id,
          p_materia_id: data.materia_id,
          p_respuestas: answers,
        }
      );
      const row = rows?.[0] ?? null;

      if (!error && row?.status === 'ok' && row.success && typeof row.correct === 'boolean') {
        return {
          success: true,
          correct: row.correct,
          correct_indexes: row.correct_indexes ?? [],
        };
      }

      if (!error && row?.status === 'rate_limited') {
        return {
          success: false,
          message: 'Demasiados intentos. Volvé a intentar en unos segundos.',
        };
      }

      if (!error && row?.status && row.status !== 'not_found') {
        return {
          success: false,
          message:
            row.status === 'unauthorized'
              ? 'Sesion no valida.'
              : 'No se pudo registrar la respuesta.',
        };
      }
    } catch {
      // El Server Action existente queda como fallback de disponibilidad.
    }
  }

  // Las preguntas premium no viven en preguntas_banco. El fallback conserva
  // su validacion actual y tambien cubre indisponibilidad transitoria del RPC.
  return registrarRespuestaUsuarioFallback(data);
}
