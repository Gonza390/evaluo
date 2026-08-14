import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';
import { generateTutorExplanation } from '@/lib/ai-tutor';
import {
  hydrateChunksForMateria,
  selectTopRagContextChunks,
  type RagChunkRow,
} from '@/lib/rag';
import { buildStudentMaterialContextsForQuestions } from '@/lib/student-materials/simulator-context';
import { recordExplanationsHistory } from '@/lib/explanations-history';

export type WrongAnswerExplanation = {
  preguntaId: string;
  enunciado: string;
  explicacion: string;
  provider: string;
  source: 'cache' | 'generated';
};

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
  userId: string;
}) {
  const admin = createAdminClient();

  await hydrateChunksForMateria(input.materiaId);

  // Resuelve preguntas tanto del banco como premium (modo "ultimo intento").
  const fetchQuestionsByIds = async (ids: string[]) => {
    const [bancoRows, premiumRows] = await Promise.all([
      admin
        .from('preguntas_banco')
        .select('id, enunciado, opciones, respuesta_correcta, materia_id, material_id, carrera_id, universidad_id')
        .in('id', ids),
      admin
        .from('premium_questions')
        .select('id, enunciado, opciones, respuesta_correcta')
        .in('id', ids),
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
      });
      cacheHits += 1;
    }
  }

  if (missing.length > 0) {
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
      userId: input.userId,
      questions,
    });

    const processQuestion = async (
      question: (typeof questions)[number]
    ): Promise<WrongAnswerExplanation | null> => {
      try {
        const joinedQuery = `${question.enunciado} ${question.respuesta_correcta}`;
        const studentMaterialContext = studentMaterialContextByQuestion.get(question.id);
        const materiaTopChunks = selectTopRagContextChunks(
          (chunks ?? []) as RagChunkRow[],
          joinedQuery
        );
        const topChunks =
          studentMaterialContext?.context.length
            ? [...studentMaterialContext.context, ...materiaTopChunks].slice(0, 6)
            : materiaTopChunks;
        const optionsArray = Array.isArray(question.opciones)
          ? (question.opciones.filter((option) => typeof option === 'string') as string[])
          : [];

        const generated = await generateTutorExplanation({
          question: question.enunciado,
          options: optionsArray,
          correctAnswer: question.respuesta_correcta,
          context: topChunks,
        });

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

  await recordExplanationsHistory({
    userId: input.userId,
    materiaId: input.materiaId,
    parcial: input.parcial,
    items: results.map((result) => ({
      preguntaId: result.preguntaId,
      enunciado: result.enunciado,
      explicacion: result.explicacion,
      provider: result.provider,
    })),
  });

  return { explanations: results, metrics: { cacheHits, generatedCount } };
}
