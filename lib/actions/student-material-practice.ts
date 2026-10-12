'use server';

import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getPdfAssessmentData } from '@/lib/student-materials/answer-events';
import { getStudyErrorsPageData } from '@/lib/study-errors';
import {
  emptyTopicPracticeContext,
  type TopicPracticeContext,
} from '@/lib/student-materials/topic-practice';
import { enforceStrictRateLimit } from '@/lib/rate-limit';
import { isUuid } from '@/lib/uuid';
import { logError } from '@/lib/observability';

export async function getStudentMaterialPracticeContextAction(
  materialId: string
): Promise<TopicPracticeContext> {
  const unavailable = { ...emptyTopicPracticeContext, loadError: true };
  if (!isUuid(materialId)) return unavailable;
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unavailable;
  const rate = await enforceStrictRateLimit({
    key: `material-practice-context:${user.id}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rate.allowed) return unavailable;
  // Consultar respuestas solo después de comprobar que el PDF pertenece al usuario actual.
  const { data: material, error } = await supabase
    .from('student_materials')
    .select('id')
    .eq('id', materialId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error || !material) return unavailable;
  try {
    const [coverage, answers, errors, checks] = await Promise.all([
      getPdfAssessmentData(user.id, materialId),
      createAdminClient()
        .from('student_material_answer_events')
        .select('item_key, answered_at, source_type')
        .eq('user_id', user.id)
        .eq('material_id', materialId)
        .eq('evidence_kind', 'assessed')
        .order('answered_at', { ascending: false })
        .limit(1000),
      getStudyErrorsPageData(user.id, materialId),
      createAdminClient()
        .from('study_error_review_checks')
        .select('error_id, question, answered_at')
        .eq('user_id', user.id)
        .eq('material_id', materialId)
        .eq('status', 'correct')
        .order('answered_at', { ascending: false })
        .limit(200),
    ]);
    if (coverage.loadError || answers.error || errors.loadError || checks.error) return unavailable;
    const latestChecks = new Set<string>();
    const reviewFollowups = (checks.data ?? []).flatMap((check) => {
      if (latestChecks.has(check.error_id)) return [];
      latestChecks.add(check.error_id);
      const error = errors.resolved.find((item) => item.id === check.error_id);
      if (!error?.correctAnswer || !check.answered_at) return [];
      // Nunca programar un acierto anterior a un fallo más reciente del mismo error.
      if (Date.parse(check.answered_at) < Date.parse(error.lastFailedAt)) return [];
      return [
        {
          errorId: error.id,
          topic: error.recommendation?.sectionTitle ?? error.topic,
          correctAnswer: error.correctAnswer,
          originalPrompt: error.prompt,
          reviewPrompt: check.question,
          reinforcedAt: check.answered_at,
        },
      ];
    });
    return {
      evidence: coverage.items,
      answeredItemKeys: [...new Set((answers.data ?? []).map((answer) => answer.item_key))],
      reviewFollowups,
      independentAnswers: (answers.data ?? [])
        .filter((answer) => answer.source_type === 'exercise')
        .map((answer) => ({ itemKey: answer.item_key, answeredAt: answer.answered_at })),
      pendingTopics: [
        ...new Set(
          errors.pending
            .map((item) => item.recommendation?.sectionTitle ?? item.topic ?? '')
            .filter(Boolean)
        ),
      ],
    };
  } catch (error) {
    logError('materialPractice.context', error, { userId: user.id, materialId });
    return unavailable;
  }
}
