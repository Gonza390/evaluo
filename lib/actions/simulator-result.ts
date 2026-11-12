'use server';

import { createClientServer } from '@/lib/supabase-server';
import { logError } from '@/lib/observability';
import {
  FREE_ERRORS_REVIEWS_PER_WEEK,
  countErroresAttemptsThisWeek,
  getNextFreeErrorsReviewDate,
  hasPremiumAccess,
} from '@/lib/premium';
import {
  estimateReviewMinutes,
  getAttemptWrongPrompts,
  getPendingSimulatorErrors,
} from '@/lib/simulator-error-review';

export type SimulatorResultContext = {
  /** Errores pendientes de la materia (los que va a preguntar el repaso). */
  pendingCount: number;
  /** Hasta 3 enunciados: del intento (resultado normal) o pendientes (resultado del repaso). */
  prompts: string[];
  reviewMinutes: number;
  /** Si hoy puede hacer el repaso (Premium o no usó el gratis de la semana). */
  reviewAvailable: boolean;
  /** AAAA-MM-DD en que vuelve el repaso gratis, si hoy no tiene. */
  nextFreeReviewDate: string | null;
};

const EMPTY: SimulatorResultContext = {
  pendingCount: 0,
  prompts: [],
  reviewMinutes: 1,
  reviewAvailable: true,
  nextFreeReviewDate: null,
};

export async function getSimulatorResultContextAction(input: {
  materiaId: string;
  parcial: number;
  attemptId: string | null;
  mode: 'regular' | 'errores' | 'ultimo_intento';
}): Promise<SimulatorResultContext> {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return EMPTY;

    const [pending, attemptPrompts, isPremium] = await Promise.all([
      getPendingSimulatorErrors(user.id, input.materiaId, input.parcial),
      input.mode !== 'errores' && input.attemptId
        ? getAttemptWrongPrompts(user.id, input.attemptId, 3)
        : Promise.resolve([] as string[]),
      hasPremiumAccess(user.id),
    ]);

    let reviewAvailable = true;
    let nextFreeReviewDate: string | null = null;
    if (!isPremium) {
      const used = await countErroresAttemptsThisWeek(user.id);
      reviewAvailable = used < FREE_ERRORS_REVIEWS_PER_WEEK;
      if (!reviewAvailable) nextFreeReviewDate = await getNextFreeErrorsReviewDate(user.id);
    }

    const prompts =
      input.mode === 'errores'
        ? pending.map((row) => row.prompt).filter(Boolean).slice(0, 3)
        : attemptPrompts;

    return {
      pendingCount: pending.length,
      prompts,
      reviewMinutes: estimateReviewMinutes(pending.length),
      reviewAvailable,
      nextFreeReviewDate,
    };
  } catch (error) {
    logError('actions.simulatorResultContext', error, { materiaId: input.materiaId });
    return EMPTY;
  }
}
