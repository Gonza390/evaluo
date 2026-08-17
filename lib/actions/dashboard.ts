'use server';

import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { logError } from '@/lib/observability';
import {
  defaultDashboardAnalytics,
  parseDashboardAnalytics,
  parseDashboardMateriaStates,
  serializeDashboardAnalytics,
  serializeDashboardMateriaStates,
  type DashboardAnalytics,
  type DashboardMateriaState,
} from '@/lib/dashboard-state';
import { enforceServerActionRateLimit, getServerActionClientKey } from '@/lib/rate-limit';

export interface DashboardState {
  lastSubject: DashboardMateriaState | null;
  activeSubjects: DashboardMateriaState[];
  finishedSubjects: DashboardMateriaState[];
  analytics: DashboardAnalytics;
}

export interface PartialStudyInsights {
  materiaId: string;
  parcial: number;
  totalPreguntasParcial: number;
  preguntasRespondidasParcial: number;
  preguntasAcertadasParcial: number;
  coberturaPorcentaje: number;
  modelosEstimadosRealizados: number;
  promedioAciertoPorcentaje: number;
  probabilidadAprobar: number;
}

export interface StudyRecommendation {
  materiaId: string;
  materiaNombre: string;
  examDate: string;
  daysUntil: number;
  examInstance: '1' | '2' | 'integrador';
  parcial: number;
  totalPreguntasParcial: number;
  preguntasRespondidasParcial: number;
  coberturaPorcentaje: number;
  modelosEstimadosRealizados: number;
  promedioAciertoPorcentaje: number;
  probabilidadAprobar: number;
  reason: 'falta-practica' | 'falta-cobertura' | 'listo';
  simulatedHref: string;
}

export interface DashboardLastAttempt {
  materiaId: string;
  parcial: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  mode: string;
  createdAt: string;
  previousAttempt: {
    totalQuestions: number;
    correctAnswers: number;
    createdAt: string;
  } | null;
}

const defaultDashboardState: DashboardState = {
  lastSubject: null,
  activeSubjects: [],
  finishedSubjects: [],
  analytics: defaultDashboardAnalytics,
};

function examInstanceToParcial(instance: string | null): number {
  if (instance === '1') return 1;
  if (instance === '2') return 2;
  return 3;
}

function examInstanceLabel(instance: string | null): '1' | '2' | 'integrador' {
  if (instance === '1') return '1';
  if (instance === '2') return '2';
  return 'integrador';
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysUntilDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const target = new Date(year, (month ?? 1) - 1, day ?? 1, 12);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.round((target.getTime() - today.getTime()) / msPerDay));
}

export async function getDashboardState(): Promise<DashboardState> {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    const userId = user?.id;
    if (!userId) {
      return defaultDashboardState;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(
        'last_subject_id, last_subject_name, active_subjects, finished_subjects, dashboard_analytics'
      )
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return {
      lastSubject:
        data?.last_subject_id && data.last_subject_name
          ? { id: data.last_subject_id, name: data.last_subject_name }
          : null,
      activeSubjects: parseDashboardMateriaStates(data?.active_subjects),
      finishedSubjects: parseDashboardMateriaStates(data?.finished_subjects),
      analytics: parseDashboardAnalytics(data?.dashboard_analytics),
    };
  } catch (error) {
    logError('actions.getDashboardState', error);
    return defaultDashboardState;
  }
}

export async function saveDashboardState(payload: DashboardState) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    const userId = user?.id;
    if (!userId) {
      throw new Error('No se encontró una sesión activa.');
    }

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      last_subject_id: payload.lastSubject?.id ?? null,
      last_subject_name: payload.lastSubject?.name ?? null,
      active_subjects: serializeDashboardMateriaStates(payload.activeSubjects),
      finished_subjects: serializeDashboardMateriaStates(payload.finishedSubjects),
      dashboard_analytics: serializeDashboardAnalytics(payload.analytics),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    logError('actions.saveDashboardState', error, {
      activeSubjects: payload.activeSubjects.length,
      finishedSubjects: payload.finishedSubjects.length,
    });
    return { success: false };
  }
}

export async function getPartialStudyInsights(
  materiaId: string,
  parcial: number
): Promise<PartialStudyInsights | null> {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return null;
    }

    // El banco se lee con service_role (RLS de preguntas_banco es admin-only).
    const admin = createAdminClient();

    const { count: totalPreguntasParcial } = await admin
      .from('preguntas_banco')
      .select('*', { count: 'exact', head: true })
      .eq('materia_id', materiaId)
      .eq('parcial', parcial);

    const { data: historialRows } = await supabase
      .from('historial_respuestas')
      .select('pregunta_id, es_correcta')
      .eq('usuario_id', user.id)
      .eq('materia_id', materiaId)
      .not('pregunta_id', 'is', null)
      .limit(5000);

    const uniqueQuestionIds = Array.from(
      new Set((historialRows ?? []).map((row) => row.pregunta_id).filter(Boolean))
    ) as string[];

    let preguntasParcialRespondidas = 0;
    let respuestasParcialTotal = 0;
    let respuestasParcialCorrectas = 0;

    if (uniqueQuestionIds.length > 0) {
      const { data: parcialQuestions } = await admin
        .from('preguntas_banco')
        .select('id')
        .in('id', uniqueQuestionIds)
        .eq('parcial', parcial)
        .eq('materia_id', materiaId);

      const partialIds = new Set((parcialQuestions ?? []).map((q) => q.id));
      preguntasParcialRespondidas = partialIds.size;

      for (const row of historialRows ?? []) {
        const questionId = row.pregunta_id;
        if (!questionId || !partialIds.has(questionId)) continue;
        respuestasParcialTotal += 1;
        if (row.es_correcta) respuestasParcialCorrectas += 1;
      }
    }

    const total = totalPreguntasParcial ?? 0;
    const coberturaPorcentaje =
      total > 0 ? Math.round((preguntasParcialRespondidas / total) * 100) : 0;
    const modelosEstimadosRealizados = Math.max(0, Math.floor(respuestasParcialTotal / 30));
    const promedioAciertoPorcentaje =
      respuestasParcialTotal > 0
        ? Number(((respuestasParcialCorrectas / respuestasParcialTotal) * 100).toFixed(1))
        : 0;

    const practiceFactor = Math.min(100, modelosEstimadosRealizados * 20);
    const probabilityRaw =
      promedioAciertoPorcentaje * 0.5 + coberturaPorcentaje * 0.3 + practiceFactor * 0.2;
    const probabilidadAprobar = Math.max(5, Math.min(95, Math.round(probabilityRaw)));

    return {
      materiaId,
      parcial,
      totalPreguntasParcial: total,
      preguntasRespondidasParcial: preguntasParcialRespondidas,
      preguntasAcertadasParcial: respuestasParcialCorrectas,
      coberturaPorcentaje,
      modelosEstimadosRealizados,
      promedioAciertoPorcentaje,
      probabilidadAprobar,
    };
  } catch (error) {
    logError('actions.getPartialStudyInsights', error, { materiaId, parcial });
    return null;
  }
}

export async function getBestPartialStudyInsights(
  materiaId: string
): Promise<PartialStudyInsights | null> {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return null;
    }

    const clientKey = await getServerActionClientKey();
    const rateResult = await enforceServerActionRateLimit({
      key: `insights:best:${user.id}:${clientKey}`,
      limit: 20,
      windowMs: 60_000,
    });
    if (!rateResult.allowed) {
      return null;
    }

    // El banco se lee con service_role (RLS de preguntas_banco es admin-only).
    const admin = createAdminClient();

    // Total por parcial con count exacto (sin descargar filas del banco completo).
    const [countP1, countP2, countP3] = await Promise.all(
      [1, 2, 3].map((parcial) =>
        admin
          .from('preguntas_banco')
          .select('id', { count: 'exact', head: true })
          .eq('materia_id', materiaId)
          .eq('parcial', parcial)
      )
    );
    const totalByParcial = new Map<number, number>([
      [1, countP1.count ?? 0],
      [2, countP2.count ?? 0],
      [3, countP3.count ?? 0],
    ]);

    const { data: historialRows } = await supabase
      .from('historial_respuestas')
      .select('pregunta_id, es_correcta')
      .eq('usuario_id', user.id)
      .eq('materia_id', materiaId)
      .not('pregunta_id', 'is', null)
      .limit(1000);

    const uniqueQuestionIds = Array.from(
      new Set(
        (historialRows ?? [])
          .map((row) => row.pregunta_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    // Mapeo parcial de SOLO las preguntas respondidas (acotado a uniqueQuestionIds).
    const parcialByQuestionId = new Map<string, number>();
    if (uniqueQuestionIds.length > 0) {
      const { data: bancoRows } = await admin
        .from('preguntas_banco')
        .select('id, parcial')
        .eq('materia_id', materiaId)
        .in('id', uniqueQuestionIds);
      for (const row of bancoRows ?? []) {
        parcialByQuestionId.set(row.id, Number(row.parcial ?? 1));
      }
    }

    const answeredRowsByParcial = new Map<number, number>();
    const correctRowsByParcial = new Map<number, number>();
    const respondedIdsByParcial = new Map<number, Set<string>>();

    for (const row of historialRows ?? []) {
      const questionId = row.pregunta_id;
      if (!questionId) continue;
      const parcial = parcialByQuestionId.get(questionId);
      if (!parcial) continue;
      answeredRowsByParcial.set(parcial, (answeredRowsByParcial.get(parcial) ?? 0) + 1);
      if (row.es_correcta) {
        correctRowsByParcial.set(parcial, (correctRowsByParcial.get(parcial) ?? 0) + 1);
      }
      const respondedIds = respondedIdsByParcial.get(parcial) ?? new Set<string>();
      respondedIds.add(questionId);
      respondedIdsByParcial.set(parcial, respondedIds);
    }

    let bestParcial = 1;
    let bestAnsweredRows = 0;
    for (const [parcial, count] of answeredRowsByParcial) {
      if (count > bestAnsweredRows) {
        bestParcial = parcial;
        bestAnsweredRows = count;
      }
    }

    const preguntasParcialRespondidas = respondedIdsByParcial.get(bestParcial)?.size ?? 0;
    const respuestasParcialTotal = answeredRowsByParcial.get(bestParcial) ?? 0;
    const respuestasParcialCorrectas = correctRowsByParcial.get(bestParcial) ?? 0;
    const total = totalByParcial.get(bestParcial) ?? 0;

    const coberturaPorcentaje =
      total > 0 ? Math.round((preguntasParcialRespondidas / total) * 100) : 0;
    const modelosEstimadosRealizados = Math.max(0, Math.floor(respuestasParcialTotal / 30));
    const promedioAciertoPorcentaje =
      respuestasParcialTotal > 0
        ? Number(((respuestasParcialCorrectas / respuestasParcialTotal) * 100).toFixed(1))
        : 0;

    const practiceFactor = Math.min(100, modelosEstimadosRealizados * 20);
    const probabilityRaw =
      promedioAciertoPorcentaje * 0.5 + coberturaPorcentaje * 0.3 + practiceFactor * 0.2;
    const probabilidadAprobar = Math.max(5, Math.min(95, Math.round(probabilityRaw)));

    return {
      materiaId,
      parcial: bestParcial,
      totalPreguntasParcial: total,
      preguntasRespondidasParcial: preguntasParcialRespondidas,
      preguntasAcertadasParcial: respuestasParcialCorrectas,
      coberturaPorcentaje,
      modelosEstimadosRealizados,
      promedioAciertoPorcentaje,
      probabilidadAprobar,
    };
  } catch (error) {
    logError('actions.getBestPartialStudyInsights', error, { materiaId });
    return null;
  }
}

export async function getStudyRecommendations(horizonDays = 21): Promise<StudyRecommendation[]> {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return [];
    }

    const todayKey = toDateKey(new Date());
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + horizonDays);
    const horizonKey = toDateKey(horizon);

    const { data: events, error: eventsError } = await supabase
      .from('study_calendar_events')
      .select('id, title, materia_id, materia_nombre, event_date, exam_instance')
      .eq('user_id', user.id)
      .eq('event_type', 'exam')
      .not('materia_id', 'is', null)
      .gte('event_date', todayKey)
      .lte('event_date', horizonKey)
      .order('event_date', { ascending: true });

    if (eventsError) {
      logError('actions.getStudyRecommendations.events', eventsError, { userId: user.id });
      return [];
    }

    const uniqueMaterias = Array.from(
      new Set((events ?? []).map((event) => String(event.materia_id ?? '')).filter(Boolean))
    ) as string[];

    const insightsByMateria = new Map<string, PartialStudyInsights | null>();
    if (uniqueMaterias.length > 0) {
      const results = await Promise.all(
        uniqueMaterias.map(async (materiaId) => {
          const insight = await getBestPartialStudyInsights(materiaId);
          return [materiaId, insight] as const;
        })
      );
      for (const [materiaId, insight] of results) {
        insightsByMateria.set(materiaId, insight);
      }
    }

    const recommendations: StudyRecommendation[] = [];

    for (const event of events ?? []) {
      const materiaId = String(event.materia_id ?? '');
      if (!materiaId) continue;

      const examInstance = examInstanceLabel(event.exam_instance);
      const parcial = examInstanceToParcial(event.exam_instance);
      const insight = insightsByMateria.get(materiaId);
      const eventDate = event.event_date ?? '';
      const daysUntil = daysUntilDate(eventDate);

      const cobertura = insight?.coberturaPorcentaje ?? 0;
      const modelos = insight?.modelosEstimadosRealizados ?? 0;
      const acierto = insight?.promedioAciertoPorcentaje ?? 0;
      const probabilidad = insight?.probabilidadAprobar ?? 0;

      let reason: StudyRecommendation['reason'] = 'listo';
      if (cobertura < 40 || modelos === 0) {
        reason = 'falta-cobertura';
      } else if (acierto < 60) {
        reason = 'falta-practica';
      }

      recommendations.push({
        materiaId,
        materiaNombre: event.materia_nombre?.trim() || event.title?.trim() || 'Materia',
        examDate: eventDate,
        daysUntil,
        examInstance,
        parcial,
        totalPreguntasParcial: insight?.totalPreguntasParcial ?? 0,
        preguntasRespondidasParcial: insight?.preguntasRespondidasParcial ?? 0,
        coberturaPorcentaje: cobertura,
        modelosEstimadosRealizados: modelos,
        promedioAciertoPorcentaje: acierto,
        probabilidadAprobar: probabilidad,
        reason,
        simulatedHref: `/simulador/${materiaId}/${parcial}`,
      });
    }

    return recommendations.sort((a, b) => a.daysUntil - b.daysUntil);
  } catch (error) {
    logError('actions.getStudyRecommendations', error);
    return [];
  }
}

export async function getDashboardLastAttempts(
  materiaIds: string[]
): Promise<Record<string, DashboardLastAttempt | null>> {
  try {
    if (materiaIds.length === 0) {
      return {};
    }

    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return {};
    }

    const { data, error } = await supabase
      .from('simulator_attempts')
      .select(
        'materia_id, parcial, total_questions, correct_answers, wrong_answers, mode, created_at'
      )
      .eq('user_id', user.id)
      .in('materia_id', materiaIds)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return {};
    }

    const attemptsByMateria = new Map<string, typeof data>();
    for (const row of data) {
      const current = attemptsByMateria.get(row.materia_id) ?? [];
      current.push(row);
      attemptsByMateria.set(row.materia_id, current);
    }

    const result: Record<string, DashboardLastAttempt | null> = {};

    for (const [materiaId, attempts] of attemptsByMateria) {
      const latest = attempts[0];
      const previous = attempts[1];

      if (!latest) {
        result[materiaId] = null;
        continue;
      }

      result[materiaId] = {
        materiaId: latest.materia_id,
        parcial: latest.parcial,
        totalQuestions: latest.total_questions ?? 0,
        correctAnswers: latest.correct_answers ?? 0,
        wrongAnswers: latest.wrong_answers ?? 0,
        mode: latest.mode ?? 'regular',
        createdAt: latest.created_at ?? new Date().toISOString(),
        previousAttempt: previous
          ? {
              totalQuestions: previous.total_questions ?? 0,
              correctAnswers: previous.correct_answers ?? 0,
              createdAt: previous.created_at ?? new Date().toISOString(),
            }
          : null,
      };
    }

    return result;
  } catch (error) {
    logError('actions.getDashboardLastAttempts', error, { materiaIds });
    return {};
  }
}
