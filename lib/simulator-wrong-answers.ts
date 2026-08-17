import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';
import { generateTutorExplanation } from '@/lib/ai-tutor';
import { truncateUtf8Text } from '@/lib/ai/safety';
import {
  hydrateChunksForMateria,
  selectTopRagContextChunks,
  type RagChunkRow,
} from '@/lib/rag';
import { buildStudentMaterialContextsForQuestions } from '@/lib/student-materials/simulator-context';
import { recordExplanationsHistory } from '@/lib/explanations-history';
import { checkDailyLimit, incrementDailyUsage } from '@/lib/ai/daily-limit';

export type WrongAnswerExplanation = {
  preguntaId: string;
  enunciado: string;
  explicacion: string;
  provider: string;
  source: 'cache' | 'generated';
  opciones?: string[];
  respuestaCorrecta?: string;
  opcionElegida?: number | null;
};

// Cap de coste para el path demo (sin login): acota cuánto contexto se envía
// al modelo por explicación. La inferencia de pago se dispara sin cuenta, así
// que limitamos enunciado + fuentes para evitar gasto arbitrario.
const DEMO_MAX_ENUNCIADO_CHARS = 600;
const DEMO_MAX_CONTEXT_CHUNKS = 3;
const DEMO_MAX_CONTEXT_CHARS = 1_600;

function capDemoContextChunks(chunks: string[]): string[] {
  let remaining = DEMO_MAX_CONTEXT_CHARS;
  const capped: string[] = [];
  for (const chunk of chunks.slice(0, DEMO_MAX_CONTEXT_CHUNKS)) {
    if (remaining <= 0) break;
    const text = chunk.slice(0, remaining);
    capped.push(text);
    remaining -= text.length;
  }
  return capped;
}

function extractStringOptions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function normalizeChosenAnswer(value: number | number[] | null | undefined): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'number' && value[0] >= 0) {
    return value[0];
  }
  return null;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]);
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function buildWrongAnswersExplanations(input: {
  materiaId: string;
  parcial: number;
  wrongQuestionIds: string[];
  userId?: string;
  chosenAnswers?: Record<string, number | number[] | null>;
  /** Incluye preguntas premium (modo "ultimo intento"). false en el path demo. */
  includePremium?: boolean;
  /** Devuelve `respuestaCorrecta` en el payload. false en el path demo. */
  includeCorrectAnswer?: boolean;
  /** Modo demo: además de lo anterior, recorta el contexto enviado al modelo. */
  demo?: boolean;
}) {
  const includePremium = input.includePremium ?? true;
  const includeCorrectAnswer = input.includeCorrectAnswer ?? true;
  const isDemo = input.demo ?? false;

  const admin = createAdminClient();

  await hydrateChunksForMateria(input.materiaId);

  // Resuelve preguntas tanto del banco como premium (modo "ultimo intento").
  // El path demo excluye por completo `premium_questions`.
  const fetchQuestionsByIds = async (ids: string[]) => {
    const [bancoRows, premiumRows] = await Promise.all([
      admin
        .from('preguntas_banco')
        .select('id, enunciado, opciones, respuesta_correcta, materia_id, material_id, carrera_id, universidad_id')
        .in('id', ids),
      includePremium
        ? admin
            .from('premium_questions')
            .select('id, enunciado, opciones, respuesta_correcta')
            .in('id', ids)
        : Promise.resolve({
            data: [] as Array<{
              id: string;
              enunciado: string;
              opciones: unknown;
              respuesta_correcta: string;
            }>,
            error: null,
          }),
    ]);

    const merged = new Map<
      string,
      {
        id: string;
        enunciado: string;
        opciones: unknown;
        respuesta_correcta: string;
        materia_id: string | null;
        material_id: string | null;
        carrera_id: string | null;
        universidad_id: string | null;
      }
    >();
    for (const row of bancoRows.data ?? []) {
      merged.set(row.id, row);
    }
    for (const row of premiumRows.data ?? []) {
      merged.set(row.id, {
        ...row,
        materia_id: input.materiaId,
        material_id: null,
        carrera_id: null,
        universidad_id: null,
      });
    }
    return merged;
  };

  const { data: cacheRows } = await admin
    .from('rag_explanations_cache')
    .select('pregunta_id, explicacion, provider')
    .in('pregunta_id', input.wrongQuestionIds);

  const cacheMap = new Map((cacheRows ?? []).map((row) => [row.pregunta_id, row]));
  const missing = input.wrongQuestionIds.filter((id) => !cacheMap.has(id));

  const results: WrongAnswerExplanation[] = [];
  let cacheHits = 0;
  let generatedCount = 0;

  if (cacheRows?.length) {
    const questionMap = await fetchQuestionsByIds(
      cacheRows.map((row) => row.pregunta_id)
    );

    for (const row of cacheRows) {
      const question = questionMap.get(row.pregunta_id);
      if (!question) continue;

      results.push({
        preguntaId: row.pregunta_id,
        enunciado: question.enunciado,
        explicacion: row.explicacion,
        provider: row.provider ?? 'cache',
        source: 'cache',
        opciones: extractStringOptions(question.opciones),
        respuestaCorrecta: includeCorrectAnswer ? question.respuesta_correcta : undefined,
        opcionElegida: normalizeChosenAnswer(input.chosenAnswers?.[row.pregunta_id]),
      });
      cacheHits += 1;
    }
  }

  let dailyLimitReached = false;

  if (missing.length > 0) {
    // Check daily AI limit before generating new explanations (skip for demo).
    if (!isDemo && input.userId) {
      const limit = await checkDailyLimit(input.userId);
      if (!limit.allowed) {
        dailyLimitReached = true;
        // Return cached explanations only; skip all AI generation.
      }
    }

    if (!dailyLimitReached) {
      const questionMap = await fetchQuestionsByIds(missing);
      const questions = Array.from(questionMap.values());
      const { data: chunks } = await admin
        .from('rag_document_chunks')
        .select('chunk_text, source_title')
        .eq('materia_id', input.materiaId)
        .limit(250);

      const studentMaterialContextByQuestion = await buildStudentMaterialContextsForQuestions({
        admin,
        materiaId: input.materiaId,
        userId: input.userId ?? '',
        questions,
      });

      const processQuestion = async (
        question: (typeof questions)[number]
      ): Promise<WrongAnswerExplanation | null> => {
        try {
          // Per-question daily limit check (for logged-in non-demo users).
          if (!isDemo && input.userId) {
            const limit = await checkDailyLimit(input.userId);
            if (!limit.allowed) {
              dailyLimitReached = true;
              return null;
            }
          }

          const enunciado = isDemo
            ? truncateUtf8Text(question.enunciado, DEMO_MAX_ENUNCIADO_CHARS)
            : question.enunciado;
          const joinedQuery = `${enunciado} ${question.respuesta_correcta}`;
          const studentMaterialContext = studentMaterialContextByQuestion.get(question.id);
          const materiaTopChunks = selectTopRagContextChunks(
            (chunks ?? []) as RagChunkRow[],
            joinedQuery
          );
          let topChunks =
            studentMaterialContext?.context.length
              ? [...studentMaterialContext.context, ...materiaTopChunks].slice(0, 6)
              : materiaTopChunks;

          if (isDemo) {
            topChunks = capDemoContextChunks(topChunks);
          }

          const optionsArray = Array.isArray(question.opciones)
            ? (question.opciones.filter((option) => typeof option === 'string') as string[])
            : [];

          const generated = await generateTutorExplanation({
            question: enunciado,
            options: optionsArray,
            correctAnswer: question.respuesta_correcta,
            context: topChunks,
          });

          // Increment daily usage after successful AI call.
          if (input.userId) {
            await incrementDailyUsage(input.userId);
          }

          await admin.from('rag_explanations_cache').upsert(
            {
              pregunta_id: question.id,
              materia_id: question.materia_id,
              parcial: input.parcial,
              explicacion: generated.text,
              provider: generated.provider,
              source_used: studentMaterialContext?.context.length
                ? 'student-material-rag'
                : topChunks.length > 0
                  ? 'supabase-rag'
                  : 'general-academic-fallback',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'pregunta_id' }
          );

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
            metadata: {
              context_chunks: topChunks.length,
              student_material_chunks: studentMaterialContext?.context.length ?? 0,
              linked_student_material_ids: studentMaterialContext?.matchedMaterialIds ?? [],
            },
          });

          return {
            preguntaId: question.id,
            enunciado: question.enunciado,
            explicacion: generated.text,
            provider: generated.provider,
            source: 'generated',
            opciones: extractStringOptions(question.opciones),
            respuestaCorrecta: includeCorrectAnswer ? question.respuesta_correcta : undefined,
            opcionElegida: normalizeChosenAnswer(input.chosenAnswers?.[question.id]),
          };
        } catch (error) {
          logError('simulatorWrongAnswers.question', error, { preguntaId: question.id });
          return null;
        }
      };

      const generatedResults = await mapWithConcurrency(questions, 3, processQuestion);
      for (const result of generatedResults) {
        if (!result) continue;
        results.push(result);
        generatedCount += 1;
      }
    }
  }

  if (input.userId) {
    await recordExplanationsHistory({
      userId: input.userId,
      materiaId: input.materiaId,
      parcial: input.parcial,
      items: results.map((result) => ({
        preguntaId: result.preguntaId,
        enunciado: result.enunciado,
        explicacion: result.explicacion,
        provider: result.provider,
        opciones: result.opciones ?? null,
        respuestaCorrecta: result.respuestaCorrecta ?? null,
        opcionElegida: result.opcionElegida ?? null,
      })),
    });
  }

  return { explanations: results, metrics: { cacheHits, generatedCount }, dailyLimitReached };
}
