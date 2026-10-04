import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';
import { buildStudentMaterialContextsForQuestions } from '@/lib/student-materials/simulator-context';
import { trackServerAnalyticsEvent } from '@/lib/server-analytics';

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
  parcial: number | null;
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
  materials: Array<{ id: string; title: string; materiaNombre: string | null }>;
  loadError?: boolean;
};

function clean(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function fallbackTopic(prompt: string) {
  const normalized = clean(prompt);
  if (normalized.length <= 72) return normalized;
  return `${normalized.slice(0, 69).trimEnd()}…`;
}

export async function getPendingStudyErrorTopicCount(userId: string) {
  const admin = createAdminClient();
  // study_errors todavía no forma parte de los tipos generados.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  try {
    const { data, error } = await db
      .from('study_errors')
      .select('topic')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .limit(300);

    if (error) throw error;

    const rows = (data ?? []) as Array<{ topic: string | null }>;
    const topics = new Set(
      rows.map((row) => clean(row.topic).toLocaleLowerCase('es-AR')).filter(Boolean)
    );

    return topics.size || rows.length;
  } catch (error) {
    logError('studyErrors.pendingTopicCount', error, { userId });
    return 0;
  }
}

async function claimFirstStudyErrorOnboarding(
  // La tabla interna todavía no forma parte de los tipos generados.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  userId: string,
  errorId: string
) {
  const { data: demoExposure, error: demoExposureError } = await db
    .from('analytics_events')
    .select('id')
    .eq('user_id', userId)
    .eq('event_name', 'demo_checkpoint_reached')
    .contains('metadata', { source: 'first-pdf-demo', stage: 'errors_viewed' })
    .limit(1)
    .maybeSingle();

  if (demoExposureError) {
    logError('studyErrors.onboarding.demoExposure', demoExposureError, { userId, errorId });
  }

  if (demoExposure?.id) {
    const now = new Date().toISOString();
    const { error: legacyError } = await db.from('study_error_onboarding_state').insert({
      user_id: userId,
      pending_error_id: null,
      seen_at: now,
      outcome: 'legacy',
      updated_at: now,
    });

    if (legacyError && String(legacyError.code ?? '') !== '23505') {
      logError('studyErrors.onboarding.demoLegacy', legacyError, { userId, errorId });
    }
    return false;
  }

  const { data, error } = await db
    .from('study_error_onboarding_state')
    .insert({
      user_id: userId,
      pending_error_id: errorId,
      updated_at: new Date().toISOString(),
    })
    .select('pending_error_id')
    .maybeSingle();

  if (error) {
    // Una fila existente significa que el usuario ya tuvo errores o ya vio/omitió el onboarding.
    if (String(error.code ?? '') === '23505') return false;
    logError('studyErrors.onboarding.claim', error, { userId, errorId });
    return false;
  }

  return data?.pending_error_id === errorId;
}

export async function getPendingStudyErrorOnboarding(
  userId: string,
  expectedErrorId?: string | null
) {
  const admin = createAdminClient();
  // Esta tabla es interna: sólo se consulta con service_role.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  try {
    const { data, error } = await db
      .from('study_error_onboarding_state')
      .select('pending_error_id, seen_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data || data.seen_at || !data.pending_error_id) return null;
    if (expectedErrorId && data.pending_error_id !== expectedErrorId) return null;
    return data.pending_error_id as string;
  } catch (error) {
    logError('studyErrors.onboarding.pending', error, { userId, expectedErrorId });
    return null;
  }
}

export async function finishStudyErrorOnboarding(input: {
  userId: string;
  errorId: string;
  outcome: 'completed' | 'skipped' | 'legacy';
}) {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const now = new Date().toISOString();

  try {
    const { data, error } = await db
      .from('study_error_onboarding_state')
      .update({
        pending_error_id: null,
        seen_at: now,
        outcome: input.outcome,
        updated_at: now,
      })
      .eq('user_id', input.userId)
      .eq('pending_error_id', input.errorId)
      .is('seen_at', null)
      .select('user_id')
      .maybeSingle();

    if (error) throw error;
    if (!data?.user_id) return false;

    if (input.outcome !== 'legacy') {
      await trackServerAnalyticsEvent({
        eventName:
          input.outcome === 'completed'
            ? 'study_error_onboarding_completed'
            : 'study_error_onboarding_skipped',
        userId: input.userId,
        path: '/dashboard/explicaciones',
        metadata: { study_error_id: input.errorId },
      });
    }

    return true;
  } catch (error) {
    logError('studyErrors.onboarding.finish', error, {
      userId: input.userId,
      errorId: input.errorId,
      outcome: input.outcome,
    });
    return false;
  }
}

export async function getSimulatorQuestionTopicLabels(
  admin: ReturnType<typeof createAdminClient>,
  questionIds: string[]
) {
  const ids = Array.from(new Set(questionIds.filter(Boolean)));
  const labels = new Map<string, string>();
  if (ids.length === 0) return labels;

  // Las tablas de memoria de temas todavía no están en los tipos generados.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const { data: links, error } = await db
    .from('simulator_question_topic_links')
    .select('pregunta_id, topic_id, subtopic_id')
    .in('pregunta_id', ids);

  if (error || !links?.length) {
    if (error) {
      logError('studyErrors.topicLabels.links', error, { questionCount: ids.length });
    }
    return labels;
  }

  const topicIds = Array.from(
    new Set(links.map((row: { topic_id: string | null }) => row.topic_id).filter(Boolean))
  ) as string[];
  const subtopicIds = Array.from(
    new Set(links.map((row: { subtopic_id: string | null }) => row.subtopic_id).filter(Boolean))
  ) as string[];

  const [{ data: topics }, { data: subtopics }] = await Promise.all([
    topicIds.length
      ? db.from('simulator_topics').select('id, title').in('id', topicIds)
      : Promise.resolve({ data: [] }),
    subtopicIds.length
      ? db.from('simulator_subtopics').select('id, title').in('id', subtopicIds)
      : Promise.resolve({ data: [] }),
  ]);

  const topicById = new Map<string, string>(
    (topics ?? []).map((row: { id: string; title: string }) => [row.id, clean(row.title)])
  );
  const subtopicById = new Map<string, string>(
    (subtopics ?? []).map((row: { id: string; title: string }) => [row.id, clean(row.title)])
  );

  for (const link of links as Array<{
    pregunta_id: string;
    topic_id: string | null;
    subtopic_id: string | null;
  }>) {
    const label =
      (link.subtopic_id ? subtopicById.get(link.subtopic_id) : null) ||
      (link.topic_id ? topicById.get(link.topic_id) : null);
    if (label) labels.set(link.pregunta_id, label);
  }

  return labels;
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
      .select('id, failure_count, status')
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

      if (existing.status !== 'pending') {
        await trackServerAnalyticsEvent({
          eventName: 'study_error_created',
          userId: input.userId,
          metadata: {
            study_error_id: existing.id,
            source_type: input.sourceType,
            materia_id: input.materiaId ?? null,
            material_id: input.studentMaterialId ?? null,
            failure_count: payload.failure_count,
            reopened: true,
          },
        });
      }

      return existing.id as string;
    }

    const { data, error } = await db
      .from('study_errors')
      .insert({ ...payload, first_failed_at: now })
      .select('id')
      .single();

    if (error) throw error;

    if (data?.id) {
      await trackServerAnalyticsEvent({
        eventName: 'study_error_created',
        userId: input.userId,
        metadata: {
          study_error_id: data.id,
          source_type: input.sourceType,
          materia_id: input.materiaId ?? null,
          material_id: input.studentMaterialId ?? null,
          failure_count: payload.failure_count,
          reopened: false,
        },
      });

      await claimFirstStudyErrorOnboarding(db, input.userId, data.id);
    }

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
      .select(
        'id, status, last_failed_at, last_reviewed_at, materia_id, student_material_id, failure_count'
      )
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
    const { data: updated, error: updateError } = await db
      .from('study_errors')
      .update({ status: 'resolved', resolved_at: now })
      .eq('id', existing.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updated?.id) return false;

    await trackServerAnalyticsEvent({
      eventName: 'study_error_resolved',
      userId: input.userId,
      metadata: {
        study_error_id: existing.id,
        source_type: input.sourceType,
        materia_id: existing.materia_id ?? null,
        material_id: existing.student_material_id ?? null,
        failure_count: existing.failure_count ?? 1,
      },
    });

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

export async function markStudyErrorReviewed(
  userId: string,
  errorId: string,
  expectedFailedAt?: string
) {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  try {
    let query = db
      .from('study_errors')
      .update({ last_reviewed_at: new Date().toISOString() })
      .eq('id', errorId)
      .eq('user_id', userId)
      .eq('status', 'pending');
    if (expectedFailedAt) query = query.eq('last_failed_at', expectedFailedAt);
    const { data, error } = await query
      .select('id, source_type, materia_id, student_material_id, failure_count')
      .maybeSingle();

    if (error) throw error;
    if (!data?.id) return false;

    await trackServerAnalyticsEvent({
      eventName: 'study_error_reviewed',
      userId,
      metadata: {
        study_error_id: data.id,
        source_type: data.source_type,
        materia_id: data.materia_id ?? null,
        material_id: data.student_material_id ?? null,
        failure_count: data.failure_count ?? 1,
      },
    });

    return true;
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
    const [{ data, error }, { data: availableMaterials, error: materialsError }] =
      await Promise.all([
        db
          .from('study_errors')
          .select(
            'id, user_id, materia_id, student_material_id, source_type, source_key, question_id, topic, prompt, explanation, correct_answer, selected_answer, failure_count, status, reference_page_start, reference_page_end, reference_section_title, reference_excerpt, first_failed_at, last_failed_at, last_reviewed_at, resolved_at, metadata'
          )
          .eq('user_id', userId)
          .order('last_failed_at', { ascending: false })
          .limit(300),
        admin
          .from('student_materials')
          .select('id, title, materia_id')
          .eq('user_id', userId)
          .eq('processing_status', 'ready')
          .order('updated_at', { ascending: false })
          .limit(100),
      ]);

    if (error) throw error;
    if (materialsError) throw materialsError;
    const materials = (availableMaterials ?? []).map((material) => ({
      id: material.id,
      title: material.title,
      materiaNombre: null as string | null,
    }));

    const rows = (data ?? []) as RawStudyError[];
    if (rows.length === 0) {
      return { pending: [], resolved: [], materials };
    }

    const simulatorTopicLabels = await getSimulatorQuestionTopicLabels(
      admin,
      rows
        .filter((row) => row.source_type === 'simulator')
        .map((row) => row.question_id)
        .filter((value): value is string => Boolean(value))
    );

    const materiaIds = Array.from(
      new Set(rows.map((row) => row.materia_id).filter((value): value is string => Boolean(value)))
    );
    const materialIds = Array.from(
      new Set(
        rows
          .map(
            (row) =>
              row.student_material_id ??
              (typeof row.metadata?.review_material_id === 'string'
                ? row.metadata.review_material_id
                : null)
          )
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
      const linkedMaterialId =
        row.student_material_id ??
        (typeof row.metadata?.review_material_id === 'string'
          ? row.metadata.review_material_id
          : null);
      if (!linkedMaterialId) continue;
      const material = ownMaterials.get(linkedMaterialId);
      if (!material || material.processing_status !== 'ready') continue;

      recommendations.set(row.id, {
        primary: {
          materialId: material.id,
          materialTitle: material.title,
          pageStart: row.reference_page_start,
          pageEnd: row.reference_page_end,
          sectionTitle: row.reference_section_title,
          excerpt: row.reference_excerpt,
          relation: row.student_material_id ? 'origin' : 'best',
        },
        alternatives: [],
      });
    }

    const pendingSimulatorByMateria = new Map<string, RawStudyError[]>();
    for (const row of rows) {
      if (
        row.status !== 'pending' ||
        row.source_type !== 'simulator' ||
        !row.materia_id ||
        recommendations.has(row.id)
      )
        continue;
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
            .select(
              'id, enunciado, opciones, respuesta_correcta, material_id, carrera_id, universidad_id'
            )
            .in('id', questionIds)
        : { data: [] };

      const bancoById = new Map<
        string,
        {
          id: string;
          enunciado: string;
          opciones: unknown;
          respuesta_correcta: string;
          material_id: string | null;
          carrera_id: string | null;
          universidad_id: string | null;
        }
      >(
        (bancoQuestions ?? []).map(
          (question: {
            id: string;
            enunciado: string;
            opciones: unknown;
            respuesta_correcta: string;
            material_id: string | null;
            carrera_id: string | null;
            universidad_id: string | null;
          }) => [question.id, question]
        )
      );

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
        (row.question_id ? clean(simulatorTopicLabels.get(row.question_id)) : '') ||
        clean(recommendation.primary?.sectionTitle) ||
        fallbackTopic(row.prompt);

      const parcialValue = Number(row.metadata?.parcial);
      const parcial = Number.isInteger(parcialValue) && parcialValue > 0 ? parcialValue : null;

      return {
        id: row.id,
        materiaId: row.materia_id,
        parcial,
        materiaNombre: row.materia_id ? (materiaNames.get(row.materia_id) ?? null) : null,
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

    for (const material of materials) {
      const original = availableMaterials?.find((item) => item.id === material.id);
      material.materiaNombre = original?.materia_id
        ? (materiaNames.get(original.materia_id) ?? null)
        : null;
    }
    return { pending, resolved, materials };
  } catch (error) {
    logError('studyErrors.getPageData', error, { userId });
    return { pending: [], resolved: [], materials: [], loadError: true };
  }
}
