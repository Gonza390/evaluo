import { createAdminClient } from '@/lib/supabase-admin';
import { generateTutorExplanation } from '@/lib/ai-tutor';
import {
  hydrateChunksForMateria,
  selectTopRagContextChunks,
  type RagChunkRow,
} from '@/lib/rag';
import { buildStudentMaterialContextsForQuestions } from '@/lib/student-materials/simulator-context';

export type WrongAnswerExplanation = {
  preguntaId: string;
  enunciado: string;
  explicacion: string;
  provider: string;
  source: 'cache' | 'generated';
};

export async function buildWrongAnswersExplanations(input: {
  materiaId: string;
  parcial: number;
  wrongQuestionIds: string[];
  userId: string;
}) {
  const admin = createAdminClient();

  await hydrateChunksForMateria(input.materiaId);

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
    const { data: cachedQuestions } = await admin
      .from('preguntas_banco')
      .select('id, enunciado')
      .in(
        'id',
        cacheRows.map((row) => row.pregunta_id)
      );
    const questionMap = new Map((cachedQuestions ?? []).map((question) => [question.id, question]));

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
    const [{ data: questions }, { data: chunks }] = await Promise.all([
      admin
        .from('preguntas_banco')
        .select('id, enunciado, opciones, respuesta_correcta, materia_id, material_id, carrera_id, universidad_id')
        .in('id', missing),
      admin
        .from('rag_document_chunks')
        .select('chunk_text, source_title')
        .eq('materia_id', input.materiaId)
        .limit(250),
    ]);

    const studentMaterialContextByQuestion = await buildStudentMaterialContextsForQuestions({
      admin,
      materiaId: input.materiaId,
      userId: input.userId,
      questions: (questions ?? []).map((question) => ({
        id: question.id,
        enunciado: question.enunciado,
        opciones: question.opciones,
        respuesta_correcta: question.respuesta_correcta,
        material_id: question.material_id,
        carrera_id: question.carrera_id,
        universidad_id: question.universidad_id,
      })),
    });

    for (const question of questions ?? []) {
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

  return { explanations: results, metrics: { cacheHits, generatedCount } };
}
