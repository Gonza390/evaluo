import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';
import { buildStudentMaterialContextsForQuestions } from '@/lib/student-materials/simulator-context';

export type StudyErrorSource = 'simulator' | 'flashcard' | 'exercise' | 'diagnostic';
export type StudyErrorStatus = 'pending' | 'resolved';

type ReferenceInput = {
  pageStart?: number | null;
  pageEnd?: number | null;
  sectionTitle?: string | null;
  excerpt?: string | null;
};

export type StudyErrorFailureInput = {
  userId: string;
  materiaId?: string | null;
  studentMaterialId?: string | null;
  sourceType: StudyErrorSource;
  sourceKey: string;
  questionId?: string | null;
  topic?: string | null;
  prompt: string;
  explanation?: string | null;
  correctAnswer?: string | null;
  selectedAnswer?: string | null;
  reference?: ReferenceInput | null;
  metadata?: Record<string, unknown>;
};

type RawStudyError = {
  id: string;
  user_id: string;
  materia_id: string | null;
  student_material_id: string | null;
  source_type: StudyErrorSource;
  source_key: string;
  question_id: string | null;
  topic: string | null;
  prompt: string;
  explanation: string | null;
  correct_answer: string | null;
  selected_answer: string | null;
  failure_count: number;
  status: StudyErrorStatus;
  reference_page_start: number | null;
  reference_page_end: number | null;
  reference_section_title: string | null;
  reference_excerpt: string | null;
  first_failed_at: string;
  last_failed_at: string;
  last_reviewed_at: string | null;
  resolved_at: string | null;
  metadata: Record<string, unknown> | null;
};

export type StudyErrorPdfRecommendation = {
  materialId: string;
  materialTitle: string;
  pageStart: number | null;
  pageEnd: number | null;
  sectionTitle: string | null;
  excerpt: string | null;
  relation: 'origin' | 'best';
};

export type StudyErrorView = {
  id: string;
  materiaId: string | null;
  materiaNombre: string | null;
  sourceType: StudyErrorSource;
  sourceKey: string;
  questionId: string | null;
  topic: string;
  prompt: string;
  explanation: string | null;
  correctAnswer: string | null;
  selectedAnswer: string | null;
  failureCount: number;
  status: StudyErrorStatus;
  lastFailedAt: string;
  lastReviewedAt: string | null;
  resolvedAt: string | null;
  recommendation: StudyErrorPdfRecommendation | null;
  alternatives: StudyErrorPdfRecommendation[];
};

export type StudyErrorsPageData = {
  pending: StudyErrorView[];
  resolved: StudyErrorView[];
};

function clean(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function fallbackTopic(prompt: string) {
  const normalized = clean(prompt);
  if (normalized.length <= 72) return normalized;
  return `${normalized.slice(0, 69).trimEnd()}…`;
}

export async function recordStudyErrorFailure(input: StudyErrorFailureInput) {
  const admin = createAdminClient();
  // study_errors es una migración nueva; el cast mantiene el cambio aislado hasta regenerar tipos.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const now = new Date().toISOString();

  try {
    const { data: existing, error: existingError } = await db
      .from('study_errors')
      .select('id, failure_count')
      .eq('user_id', input.userId)
      .eq('source_type', input.sourceType)
      .eq('source_key', input.sourceKey)
      .maybeSingle();

    if (existingError) throw existingError;

    const payload = {
      user_id: input.userId,
      materia_id: input.materiaId ?? null,
      student_material_id: input.studentMaterialId ?? null,
      source_type: input.sourceType,
      source_key: input.sourceKey,
      question_id: input.questionId ?? null,
      topic: clean(input.topic) || null,
      prompt: clean(input.prompt),
      explanation: clean(input.explanation) || null,
      correct_answer: clean(input.correctAnswer) || null,
      selected_answer: clean(input.selectedAnswer) || null,
      failure_count: (existing?.failure_count ?? 0) + 1,
      status: 'pending',
      reference_page_start: input.reference?.pageStart ?? null,
      reference_page_end: input.reference?.pageEnd ?? input.reference?.pageStart ?? null,
      reference_section_title: clean(input.reference?.sectionTitle) || null,
      reference_excerpt: clean(input.reference?.excerpt) || null,
      last_failed_at: now,
      last_reviewed_at: null,
      resolved_at: null,
      metadata: input.metadata ?? {},
    };

    if (existing?.id) {
      const { error } = await db.from('study_errors').update(payload).eq('id', existing.id);
      if (error) throw error;
      return existing.id as string;
    }

    const { data, error } = await db
      .from('study_errors')
      .insert({ ...payload, first_failed_at: now })
      .select('id')
      .single();

    if (error) throw error;
    return data?.id as string | undefined;
  } catch (error) {
    logError('studyErrors.recordFailure', error, {
      userId: input.userId,
      sourceType: input.sourceType,
      sourceKey: input.sourceKey,
    });
    return null;
  }
}

export async function recordStudyErrorCorrect(input: {
  userId: string;
  sourceType: StudyErrorSource;
  sourceKey: string;
}) {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  try {
    const { data: existing, error } = await db
      .from('study_errors')
      .select('id, status, last_failed_at, last_reviewed_at')
      .eq('user_id', input.userId)
      .eq('source_type', input.sourceType)
      .eq('source_key', input.sourceKey)
      .maybeSingle();

    if (error) throw error;
    if (!existing || existing.status !== 'pending' || !existing.last_reviewed_at) {
      return false;
    }

    const reviewedAt = new Date(existing.last_reviewed_at).getTime();
    const failedAt = new Date(existing.last_failed_at).getTime();
    if (!Number.isFinite(reviewedAt) || !Number.isFinite(failedAt) || reviewedAt < failedAt) {
      return false;
    }

    const now = new Date().toISOString();
    const { error: updateError } = await db
      .from('study_errors')
      .update({ status: 'resolved', resolved_at: now })
      .eq('id', existing.id)
      .eq('status', 'pending');

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    logError('studyErrors.recordCorrect', error, {
      userId: input.userId,
      sourceType: input.sourceType,
      sourceKey: input.sourceKey,
    });
    return false;
  }
}

export async function markStudyErrorReviewed(userId: string, errorId: string) {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  try {
    const { data, error } = await db
      .from('study_errors')
      .update({ last_reviewed_at: new Date().toISOString() })
      .eq('id', errorId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (error) throw error;
    return Boolean(data?.id);
  } catch (error) {
    logError('studyErrors.markReviewed', error, { userId, errorId });
    return false;
  }
}

export async function attachStudyErrorExplanation(input: {
  userId: string;
  questionId: string;
  explanation: string;
  correctAnswer?: string | null;
  selectedAnswer?: string | null;
}) {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  try {
    const { error } = await db
      .from('study_errors')
      .update({
        explanation: clean(input.explanation) || null,
        correct_answer: clean(input.correctAnswer) || null,
        selected_answer: clean(input.selectedAnswer) || null,
      })
      .eq('user_id', input.userId)
      .eq('source_type', 'simulator')
      .eq('question_id', input.questionId);

    if (error) throw error;
  } catch (error) {
    logError('studyErrors.attachExplanation', error, {
      userId: input.userId,
      questionId: input.questionId,
    });
  }
}

export async function getStudyErrorsPageData(userId: string): Promise<StudyErrorsPageData> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  try {
    const { data, error } = await db
      .from('study_errors')
      .select(
        'id, user_id, materia_id, student_material_id, source_type, source_key, question_id, topic, prompt, explanation, correct_answer, selected_answer, failure_count, status, reference_page_start, reference_page_end, reference_section_title, reference_excerpt, first_failed_at, last_failed_at, last_reviewed_at, resolved_at, metadata'
      )
      .eq('user_id', userId)
      .order('last_failed_at', { ascending: false })
      .limit(300);

    if (error) throw error;

    const rows = (data ?? []) as RawStudyError[];
    if (rows.length === 0) {
      return { pending: [], resolved: [] };
    }

    const materiaIds = Array.from(
      new Set(rows.map((row) => row.materia_id).filter((value): value is string => Boolean(value)))
    );
    const materialIds = Array.from(
      new Set(
        rows
          .map((row) => row.student_material_id)
          .filter((value): value is string => Boolean(value))
      )
    );

    const [{ data: materiaRows }, { data: materialRows }] = await Promise.all([
      materiaIds.length
        ? db.from('materias').select('id, nombre').in('id', materiaIds)
        : Promise.resolve({ data: [] }),
      materialIds.length
        ? db
            .from('student_materials')
            .select('id, title, materia_id, processing_status, user_id')
            .in('id', materialIds)
            .eq('user_id', userId)
        : Promise.resolve({ data: [] }),
    ]);

    const materiaNames = new Map<string, string>(
      (materiaRows ?? []).map((row: { id: string; nombre: string }) => [row.id, row.nombre])
    );
    const ownMaterials = new Map<
      string,
      { id: string; title: string; materia_id: string | null; processing_status: string }
    >(
      (materialRows ?? []).map(
        (row: {
          id: string;
          title: string;
          materia_id: string | null;
          processing_status: string;
        }) => [row.id, row]
      )
    );

    const recommendations = new Map<
      string,
      { primary: StudyErrorPdfRecommendation | null; alternatives: StudyErrorPdfRecommendation[] }
    >();

    for (const row of rows) {
      if (!row.student_material_id) continue;
      const material = ownMaterials.get(row.student_material_id);
      if (!material || material.processing_status !== 'ready') continue;

      recommendations.set(row.id, {
        primary: {
          materialId: material.id,
          materialTitle: material.title,
          pageStart: row.reference_page_start,
          pageEnd: row.reference_page_end,
          sectionTitle: row.reference_section_title,
          excerpt: row.reference_excerpt,
          relation: 'origin',
        },
        alternatives: [],
      });
    }

    const pendingSimulatorByMateria = new Map<string, RawStudyError[]>();
    for (const row of rows) {
      if (row.status !== 'pending' || row.source_type !== 'simulator' || !row.materia_id) continue;
      const group = pendingSimulatorByMateria.get(row.materia_id) ?? [];
      group.push(row);
      pendingSimulatorByMateria.set(row.materia_id, group);
    }

    for (const [materiaId, group] of pendingSimulatorByMateria) {
      const questionIds = group
        .map((row) => row.question_id)
        .filter((value): value is string => Boolean(value));

      const { data: bancoQuestions } = questionIds.length
        ? await db
            .from('preguntas_banco')
            .select('id, enunciado, opciones, respuesta_correcta, material_id, carrera_id, universidad_id')
            .in('id', questionIds)
        : { data: [] };

      const bancoById = new Map<string, {
        id: string;
        enunciado: string;
        opciones: unknown;
        respuesta_correcta: string;
        material_id: string | null;
        carrera_id: string | null;
        universidad_id: string | null;
      }>((bancoQuestions ?? []).map((question: {
        id: string;
        enunciado: string;
        opciones: unknown;
        respuesta_correcta: string;
        material_id: string | null;
        carrera_id: string | null;
        universidad_id: string | null;
      }) => [question.id, question]));

      const contexts = await buildStudentMaterialContextsForQuestions({
        admin,
        materiaId,
        userId,
        ownedOnly: true,
        questions: group.map((row) => {
          const banco = row.question_id ? bancoById.get(row.question_id) : null;
          return {
            id: row.id,
            enunciado: banco?.enunciado ?? row.prompt,
            respuesta_correcta: banco?.respuesta_correcta ?? row.correct_answer ?? '',
            opciones: banco?.opciones ?? [],
            material_id: banco?.material_id ?? null,
            carrera_id: banco?.carrera_id ?? null,
            universidad_id: banco?.universidad_id ?? null,
          };
        }),
      });

      for (const row of group) {
        const matches = contexts.get(row.id)?.matches ?? [];
        if (matches.length === 0) continue;

        const mapMatch = (match: (typeof matches)[number]): StudyErrorPdfRecommendation => ({
          materialId: match.materialId,
          materialTitle: match.materialTitle,
          pageStart: match.pageStart,
          pageEnd: match.pageEnd,
          sectionTitle: match.sectionTitle,
          excerpt: match.excerpt,
          relation: match.relation,
        });

        recommendations.set(row.id, {
          primary: mapMatch(matches[0]),
          alternatives: matches.slice(1, 3).map(mapMatch),
        });
      }
    }

    const views: StudyErrorView[] = rows.map((row) => {
      const recommendation = recommendations.get(row.id) ?? { primary: null, alternatives: [] };
      const topic =
        clean(row.topic) ||
        clean(recommendation.primary?.sectionTitle) ||
        fallbackTopic(row.prompt);

      return {
        id: row.id,
        materiaId: row.materia_id,
        materiaNombre: row.materia_id ? materiaNames.get(row.materia_id) ?? null : null,
        sourceType: row.source_type,
        sourceKey: row.source_key,
        questionId: row.question_id,
        topic,
        prompt: row.prompt,
        explanation: row.explanation,
        correctAnswer: row.correct_answer,
        selectedAnswer: row.selected_answer,
        failureCount: row.failure_count,
        status: row.status,
        lastFailedAt: row.last_failed_at,
        lastReviewedAt: row.last_reviewed_at,
        resolvedAt: row.resolved_at,
        recommendation: recommendation.primary,
        alternatives: recommendation.alternatives,
      };
    });

    const pending = views
      .filter((item) => item.status === 'pending')
      .sort((a, b) => {
        if (a.failureCount !== b.failureCount) return b.failureCount - a.failureCount;
        return new Date(b.lastFailedAt).getTime() - new Date(a.lastFailedAt).getTime();
      });

    const resolved = views
      .filter((item) => item.status === 'resolved')
      .sort(
        (a, b) =>
          new Date(b.resolvedAt ?? b.lastFailedAt).getTime() -
          new Date(a.resolvedAt ?? a.lastFailedAt).getTime()
      );

    return { pending, resolved };
  } catch (error) {
    logError('studyErrors.getPageData', error, { userId });
    return { pending: [], resolved: [] };
  }
}
