'use server';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { generateTutorExplanation } from '@/lib/ai-tutor';
import { revalidatePath } from 'next/cache';
import pdf from 'pdf-parse-fork';
import type { DashboardAnalytics, DashboardMateriaState } from '@/types/supabase';
import { requirePremiumUser } from '@/lib/premium';

export interface Pregunta {
  id: string;
  enunciado: string;
  opciones: string[];
  respuesta_correcta: string;
  materia_id: string;
  parcial: number;
}

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
  coberturaPorcentaje: number;
  modelosEstimadosRealizados: number;
  promedioAciertoPorcentaje: number;
  probabilidadAprobar: number;
}

const defaultDashboardAnalytics: DashboardAnalytics = {
  subjectsCompleted: 0,
  lastUpdatedAt: null,
};

const defaultDashboardState: DashboardState = {
  lastSubject: null,
  activeSubjects: [],
  finishedSubjects: [],
  analytics: defaultDashboardAnalytics,
};

/**
 * Obtiene 30 preguntas aleatorias de la base de datos para una materia y parcial específicos.
 */
export async function getPreguntasSimulador(
  materiaId: string,
  parcial: number,
  universidadId?: string,
  carreraId?: string
): Promise<Pregunta[]> {
  try {
    const supabase = await createClientServer();

    let query = supabase
      .from('preguntas_banco')
      .select('*')
      .eq('materia_id', materiaId)
      .eq('parcial', parcial);

    if (universidadId) {
      query = query.eq('universidad_id', universidadId);
    }

    if (carreraId) {
      query = query.eq('carrera_id', carreraId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching preguntas:', error);
      throw new Error('No se pudieron obtener las preguntas.');
    }

    if (!data || data.length === 0) {
      return [];
    }

    const shuffled = [...data].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 30) as Pregunta[];
  } catch (error) {
    console.error('Error in getPreguntasSimulador:', error);
    return [];
  }
}

export async function getPreguntasSimuladorErrores(materiaId: string): Promise<Pregunta[]> {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: wrongHistory, error: wrongError } = await supabase
      .from('historial_respuestas')
      .select('pregunta_id')
      .eq('usuario_id', user.id)
      .eq('materia_id', materiaId)
      .eq('es_correcta', false)
      .order('fecha_respuesta', { ascending: false })
      .limit(500);

    if (wrongError || !wrongHistory || wrongHistory.length === 0) {
      return [];
    }

    const frequencies = new Map<string, number>();
    for (const row of wrongHistory) {
      const questionId = row.pregunta_id ?? '';
      if (!questionId) continue;
      frequencies.set(questionId, (frequencies.get(questionId) ?? 0) + 1);
    }

    const rankedIds = Array.from(frequencies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 60)
      .map(([id]) => id);

    if (rankedIds.length === 0) return [];

    const { data: questions, error: questionError } = await supabase
      .from('preguntas_banco')
      .select('*')
      .in('id', rankedIds);

    if (questionError || !questions || questions.length === 0) {
      return [];
    }

    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 30) as Pregunta[];
  } catch (error) {
    console.error('Error in getPreguntasSimuladorErrores:', error);
    return [];
  }
}

export async function getPreguntasSimuladorPremium(
  materiaId: string,
  parcial: number
): Promise<Pregunta[]> {
  try {
    const premiumCheck = await requirePremiumUser();
    if (!premiumCheck.ok) return [];
    const admin = createAdminClient();

    const { data: setRow } = await admin
      .from('premium_question_sets')
      .select('id')
      .eq('materia_id', materiaId)
      .eq('parcial', parcial)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!setRow?.id) return [];

    const { data: rows } = await admin
      .from('premium_questions')
      .select('id, enunciado, opciones, respuesta_correcta')
      .eq('set_id', setRow.id)
      .order('orden', { ascending: true })
      .limit(50);

    return ((rows ?? []) as Array<{ id: string; enunciado: string; opciones: unknown; respuesta_correcta: string }>).map((row) => ({
      id: row.id,
      enunciado: row.enunciado,
      opciones: Array.isArray(row.opciones)
        ? (row.opciones.filter((o: unknown) => typeof o === 'string') as string[])
        : [],
      respuesta_correcta: row.respuesta_correcta,
      materia_id: materiaId,
      parcial,
    }));
  } catch (error) {
    console.error('Error in getPreguntasSimuladorPremium:', error);
    return [];
  }
}

/**
 * Actualiza el perfil del usuario con WhatsApp y carrera.
 */
export async function updateProfile(
  userId: string,
  data: { whatsapp: string; carrera_id: string }
) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || user.id !== userId) {
      throw new Error('No se encontro una sesion valida para actualizar el perfil.');
    }

    const whatsappValue = String(data.whatsapp ?? '').trim();
    const carreraIdValue = String(data.carrera_id ?? '').trim();

    if (!whatsappValue || !carreraIdValue) {
      throw new Error('WhatsApp y carrera son obligatorios.');
    }

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      whatsapp: whatsappValue,
      carrera_id: carreraIdValue,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Supabase error updating profile:', error);
      throw error;
    }

    revalidatePath('/');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error };
  }
}

/**
 * Verifica si el usuario tiene el perfil completo.
 */
export async function checkProfileStatus(userId: string) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || user.id !== userId) {
      return { isComplete: false };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('whatsapp, carrera_id')
      .eq('id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking profile status:', error);
      return { isComplete: false };
    }

    const whatsappValue = String(data?.whatsapp ?? '').trim();
    const carreraIdValue = String(data?.carrera_id ?? '').trim();

    if (!data || !whatsappValue || !carreraIdValue) {
      return { isComplete: false };
    }

    return { isComplete: true };
  } catch (error) {
    console.error('Error in checkProfileStatus:', error);
    return { isComplete: false };
  }
}

/**
 * Registra la respuesta de un usuario a una pregunta en el historial.
 * Se realiza de forma silenciosa para el usuario.
 */
export async function registrarRespuestaUsuario(data: {
  usuario_id: string;
  pregunta_id: string;
  materia_id: string;
  es_correcta: boolean;
}) {
  try {
    const supabase = await createClientServer();

    const peso = data.es_correcta ? 1 : 3;

    const { error } = await supabase.from('historial_respuestas').insert({
      usuario_id: data.usuario_id,
      pregunta_id: data.pregunta_id,
      materia_id: data.materia_id,
      es_correcta: data.es_correcta,
      peso,
      fecha_respuesta: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error al registrar respuesta del usuario:', error);
    return { success: false, error };
  }
}

export async function finalizarSimuladorAction(data: {
  usuario_id: string;
  materia_id: string;
  parcial: number;
  total_preguntas: number;
  respuestas_correctas: number;
  tiempo_restante: number;
}) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || user.id !== data.usuario_id) {
      return { success: false, message: 'Sesion no valida.' };
    }

    return {
      success: true,
      finishedAt: new Date().toISOString(),
      summary: {
        materia_id: data.materia_id,
        parcial: data.parcial,
        total_preguntas: data.total_preguntas,
        respuestas_correctas: data.respuestas_correctas,
        tiempo_restante: data.tiempo_restante,
      },
    };
  } catch (error) {
    console.error('Error al finalizar simulador:', error);
    return { success: false, message: 'No se pudo finalizar el simulador.' };
  }
}

export async function getDashboardState(): Promise<DashboardState> {
  try {
    const supabase = await createClientServer();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user?.id;
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
      activeSubjects: data?.active_subjects ?? [],
      finishedSubjects: data?.finished_subjects ?? [],
      analytics: data?.dashboard_analytics ?? defaultDashboardAnalytics,
    };
  } catch (error) {
    console.error('Error getting dashboard state:', error);
    return defaultDashboardState;
  }
}

export async function saveDashboardState(payload: DashboardState) {
  try {
    const supabase = await createClientServer();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user?.id;
    if (!userId) {
      throw new Error('No se encontro una sesion activa.');
    }

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      last_subject_id: payload.lastSubject?.id ?? null,
      last_subject_name: payload.lastSubject?.name ?? null,
      active_subjects: payload.activeSubjects,
      finished_subjects: payload.finishedSubjects,
      dashboard_analytics: payload.analytics,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error saving dashboard state:', error);
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

    const { count: totalPreguntasParcial } = await supabase
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
      const { data: parcialQuestions } = await supabase
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
    const coberturaPorcentaje = total > 0 ? Math.round((preguntasParcialRespondidas / total) * 100) : 0;
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
      coberturaPorcentaje,
      modelosEstimadosRealizados,
      promedioAciertoPorcentaje,
      probabilidadAprobar,
    };
  } catch (error) {
    console.error('Error in getPartialStudyInsights:', error);
    return null;
  }
}

type WrongAnswerExplanation = {
  preguntaId: string;
  enunciado: string;
  explicacion: string;
  provider: string;
  source: 'cache' | 'generated';
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitIntoChunks(text: string, chunkSize = 1400, overlap = 200) {
  const chunks: string[] = [];
  const clean = text.replace(/\s+/g, ' ').trim();
  let index = 0;

  while (index < clean.length) {
    const end = Math.min(clean.length, index + chunkSize);
    chunks.push(clean.slice(index, end));
    if (end >= clean.length) break;
    index = Math.max(0, end - overlap);
  }

  return chunks;
}

function scoreChunk(chunkText: string, query: string) {
  const chunkTokens = new Set(normalizeText(chunkText).split(' '));
  const queryTokens = normalizeText(query).split(' ');

  let score = 0;
  for (const token of queryTokens) {
    if (token.length < 4) continue;
    if (chunkTokens.has(token)) score += 1;
  }
  return score;
}

async function hydrateChunksForMateria(materiaId: string) {
  const admin = createAdminClient();

  const { count } = await admin
    .from('rag_document_chunks')
    .select('*', { count: 'exact', head: true })
    .eq('materia_id', materiaId);

  if ((count ?? 0) > 0) return;

  const { data: recursos } = await admin
    .from('recursos')
    .select('id, materia_id, url_archivo, tipo, nombre')
    .eq('materia_id', materiaId)
    .ilike('tipo', '%pdf%')
    .order('creado_at', { ascending: false })
    .limit(6);

  for (const recurso of recursos ?? []) {
    const path = (recurso.url_archivo ?? '').trim();
    if (!path) continue;

    const { data: fileData, error: downloadError } = await admin.storage
      .from('biblioteca')
      .download(path);
    if (downloadError || !fileData) continue;

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const pdfData = await pdf(buffer);
    const text = (pdfData.text ?? '').trim();
    if (text.length < 120) continue;

    const chunks = splitIntoChunks(text);
    const rows = chunks.map((chunk, index) => ({
      materia_id: materiaId,
      source_table: 'recursos',
      source_id: recurso.id,
      source_title: recurso.nombre,
      chunk_index: index,
      chunk_text: chunk,
    }));

    if (rows.length > 0) {
      await admin.from('rag_document_chunks').insert(rows);
    }
  }
}

export async function getWrongAnswersExplanations(data: {
  materia_id: string;
  parcial: number;
  wrong_question_ids: string[];
}) {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: 'Debes iniciar sesion para ver explicaciones premium.' };
    }

    const materiaId = data.materia_id;
    if (!materiaId) {
      return { success: false, message: 'Materia no especificada.' };
    }

    const wrongIds = Array.from(new Set(data.wrong_question_ids.filter(Boolean)));
    if (wrongIds.length === 0) {
      return { success: true, explanations: [] as WrongAnswerExplanation[] };
    }

    const admin = createAdminClient();

    await hydrateChunksForMateria(materiaId);

    const { data: cacheRows } = await admin
      .from('rag_explanations_cache')
      .select('pregunta_id, explicacion, provider')
      .in('pregunta_id', wrongIds);

    const cacheMap = new Map((cacheRows ?? []).map((row) => [row.pregunta_id, row]));
    const missing = wrongIds.filter((id) => !cacheMap.has(id));

    const results: WrongAnswerExplanation[] = [];
    let cacheHits = 0;
    let generatedCount = 0;

    if (cacheRows?.length) {
      const { data: cachedQuestions } = await admin
        .from('preguntas_banco')
        .select('id, enunciado')
        .in(
          'id',
          cacheRows.map((c) => c.pregunta_id)
        );
      const questionMap = new Map((cachedQuestions ?? []).map((q) => [q.id, q]));

      for (const row of cacheRows) {
        const question = questionMap.get(row.pregunta_id);
        if (!question) continue;
        results.push({
          preguntaId: row.pregunta_id,
          enunciado: question.enunciado,
          explicacion: row.explicacion,
          provider: row.provider ?? 'cache',
          source: 'cache',
        });
        cacheHits += 1;
      }
    }

    if (missing.length > 0) {
      const { data: questions } = await admin
        .from('preguntas_banco')
        .select('id, enunciado, opciones, respuesta_correcta, materia_id')
        .in('id', missing);

      const { data: chunks } = await admin
        .from('rag_document_chunks')
        .select('chunk_text, source_title')
        .eq('materia_id', materiaId)
        .limit(250);

      for (const question of questions ?? []) {
        const joinedQuery = `${question.enunciado} ${question.respuesta_correcta}`;
        const topChunks = [...(chunks ?? [])]
          .map((chunk) => ({
            text: chunk.chunk_text,
            score: scoreChunk(chunk.chunk_text, joinedQuery),
            title: chunk.source_title,
          }))
          .sort((a, b) => b.score - a.score)
          .filter((item) => item.score > 0)
          .slice(0, 4)
          .map((item) => `${item.title ? `[${item.title}] ` : ''}${item.text}`);

        const optionsArray = Array.isArray(question.opciones)
          ? (question.opciones.filter((o) => typeof o === 'string') as string[])
          : [];

        const generated = await generateTutorExplanation({
          question: question.enunciado,
          options: optionsArray,
          correctAnswer: question.respuesta_correcta,
          context: topChunks,
        });

        const explanationRow = {
          pregunta_id: question.id,
          materia_id: question.materia_id,
          parcial: data.parcial,
          explicacion: generated.text,
          provider: generated.provider,
          source_used: topChunks.length > 0 ? 'supabase-rag' : 'general-academic-fallback',
          updated_at: new Date().toISOString(),
        };

        await admin.from('rag_explanations_cache').upsert(explanationRow, { onConflict: 'pregunta_id' });
        const { data: currentStat } = await admin
          .from('rag_question_stats')
          .select('id, veces_fallada')
          .eq('pregunta_id', question.id)
          .maybeSingle();

        if (currentStat?.id) {
          await admin
            .from('rag_question_stats')
            .update({
              veces_fallada: (currentStat.veces_fallada ?? 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentStat.id);
        } else {
          await admin.from('rag_question_stats').insert({
            pregunta_id: question.id,
            materia_id: question.materia_id,
            veces_fallada: 1,
            updated_at: new Date().toISOString(),
          });
        }

        await admin.from('rag_generation_logs').insert({
          pregunta_id: question.id,
          materia_id: question.materia_id,
          provider: generated.provider,
          status: 'ok',
          metadata: { context_chunks: topChunks.length },
        });

        results.push({
          preguntaId: question.id,
          enunciado: question.enunciado,
          explicacion: generated.text,
          provider: generated.provider,
          source: 'generated',
        });
        generatedCount += 1;
      }
    }

    return { success: true, explanations: results, metrics: { cacheHits, generatedCount } };
  } catch (error) {
    console.error('Error en getWrongAnswersExplanations:', error);
    return { success: false, message: 'No se pudieron generar las explicaciones.' };
  }
}
