'use server';

import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { loadReviewContext, reviewIdPattern } from '@/lib/study-error-review-context';
import { generateTutorQuickHelp, generateStudyErrorReviewQuestion } from '@/lib/ai-tutor';
import { markStudyErrorReviewed } from '@/lib/study-errors';
import { hasPremiumAccess } from '@/lib/premium';
import { enforceStrictRateLimit } from '@/lib/rate-limit';
import { logError } from '@/lib/observability';
import { trackServerAnalyticsEvent } from '@/lib/server-analytics';
import {
  publicReviewQuestion,
  isCompleteReviewHelp,
  type ReviewHelpKind,
  type ReviewQuestion,
  type ReviewAnswerResult,
} from '@/lib/study-error-review-contract';
import type { StudyErrorPdfRecommendation } from '@/lib/study-errors';

async function currentUser() {
  const client = await createClientServer();
  return (await client.auth.getUser()).data.user;
}

async function generationLimit(userId: string, purpose: 'help' | 'check' = 'help') {
  const burst = await enforceStrictRateLimit({
    key: `study-errors:generation-burst:${userId}`,
    limit: 6,
    windowMs: 60_000,
  });
  if (!burst.allowed) return 'Esperá un minuto antes de pedir otra ayuda.';
  if (await hasPremiumAccess(userId)) return null;
  const rate = await enforceStrictRateLimit({
    key:
      purpose === 'help'
        ? `study-errors:quick-help:${userId}`
        : `study-errors:review-check:${userId}`,
    limit: 5,
    windowMs: 3 * 60 * 60 * 1000,
  });
  return rate.allowed
    ? null
    : purpose === 'help'
      ? 'Usaste las ayudas con IA incluidas en Free para este período. Podés seguir leyendo las ayudas guardadas y el fragmento de tu PDF.'
      : 'Usaste las comprobaciones con IA incluidas en Free para este período. Podés seguir repasando y volver a la actividad original.';
}

function validInput(errorId: string, materialId: string | null) {
  return reviewIdPattern.test(errorId) && (!materialId || reviewIdPattern.test(materialId));
}

export async function generateReviewHelpAction(
  errorId: string,
  kind: ReviewHelpKind,
  materialId: string | null = null
): Promise<{
  success: boolean;
  text?: string;
  message?: string;
  source?: StudyErrorPdfRecommendation | null;
}> {
  const user = await currentUser();
  if (
    !user ||
    !validInput(errorId, materialId) ||
    !['why_wrong', 'simpler', 'example'].includes(kind)
  ) {
    return { success: false, message: 'Sesión o solicitud no válida.' };
  }
  try {
    const context = await loadReviewContext(user.id, errorId, materialId);
    if (!context || context.row.status !== 'pending')
      return { success: false, message: 'Este error ya no está pendiente. Actualizá la pantalla.' };
    const { row, source, contextKey, helpContextKey } = context;
    if (source && !source.excerpt)
      return {
        success: false,
        message:
          'No encontramos un fragmento suficiente para explicar este concepto con ese PDF. Podés abrir el material o elegir otro.',
      };
    const admin = createAdminClient();
    const { data: cached, error: cacheError } = await admin
      .from('study_error_help_cache')
      .select('help_text, context_key')
      .eq('error_id', errorId)
      .eq('user_id', user.id)
      .in('context_key', [helpContextKey, contextKey])
      .eq('kind', kind)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cacheError) throw cacheError;
    // Las explicaciones de la actividad se reutilizan cuando no se promete una fuente PDF.
    const reusableCache = cached?.help_text && isCompleteReviewHelp(cached.help_text);
    let text = reusableCache
      ? cached.help_text
      : !source && kind === 'why_wrong'
        ? row.explanation
        : null;
    if (!text) {
      const limitMessage = await generationLimit(user.id);
      if (limitMessage) return { success: false, message: limitMessage };
      const result = await generateTutorQuickHelp({
        kind,
        question: row.prompt.slice(0, 2000),
        selectedAnswer: row.selected_answer?.slice(0, 1000),
        correctAnswer: row.correct_answer?.slice(0, 1000),
        explanation: row.explanation?.slice(0, 1600),
        context: source?.excerpt ? [source.excerpt] : [],
      });
      if (result.provider === 'fallback-local' || !result.text)
        return {
          success: false,
          message: 'No pudimos generar la ayuda ahora. Podés leer el fragmento o reintentar.',
        };
      text = result.text;
      const { error } = await admin
        .from('study_error_help_cache')
        .upsert(
          {
            error_id: errorId,
            user_id: user.id,
            context_key: helpContextKey,
            kind,
            help_text: text,
          },
          { onConflict: 'error_id,context_key,kind' }
        );
      if (error) throw error;
    }
    if (reusableCache && cached.context_key !== helpContextKey) {
      const { error } = await admin
        .from('study_error_help_cache')
        .upsert(
          {
            error_id: errorId,
            user_id: user.id,
            context_key: helpContextKey,
            kind,
            help_text: text,
          },
          { onConflict: 'error_id,context_key,kind', ignoreDuplicates: true }
        );
      if (error) throw error;
    }
    if (!(await markStudyErrorReviewed(user.id, errorId, row.last_failed_at)))
      return {
        success: false,
        message:
          'El error cambió mientras lo repasabas. Actualizá la pantalla y volvé a intentarlo.',
      };
    await trackServerAnalyticsEvent({
      eventName: 'study_error_explanation_reviewed',
      userId: user.id,
      path: '/dashboard/explicaciones',
      metadata: {
        study_error_id: errorId,
        source_type: row.source_type,
        materia_id: row.materia_id,
        material_id: source?.materialId ?? null,
        help_kind: kind,
        cached: Boolean(reusableCache),
      },
    });
    return { success: true, text, source };
  } catch (error) {
    logError('studyErrors.reviewHelp', error, { userId: user.id, errorId, kind });
    return { success: false, message: 'No pudimos cargar esta ayuda. Intentá nuevamente.' };
  }
}

export async function generateReviewCheckAction(
  errorId: string,
  materialId: string
): Promise<{
  success: boolean;
  question?: ReviewQuestion;
  message?: string;
}> {
  const user = await currentUser();
  if (!user || !validInput(errorId, materialId))
    return { success: false, message: 'Sesión o solicitud no válida.' };
  try {
    const context = await loadReviewContext(user.id, errorId, materialId);
    if (!context || context.row.status !== 'pending')
      return { success: false, message: 'Este error ya no está pendiente. Actualizá la pantalla.' };
    const { row, source, contextKey } = context;
    if (!source?.excerpt || source.excerpt.trim().length < 60 || !row.correct_answer) {
      return {
        success: false,
        message:
          'Todavía no hay suficiente evidencia en este PDF para hacer una comprobación confiable. Repasá el material y volvé a la actividad original.',
      };
    }
    if (!row.last_reviewed_at || new Date(row.last_reviewed_at) < new Date(row.last_failed_at)) {
      return { success: false, message: 'Primero repasá la explicación o el fragmento del PDF.' };
    }
    const admin = createAdminClient();
    const { data: cached, error: cacheError } = await admin
      .from('study_error_review_checks')
      .select('id, question, options')
      .eq('error_id', errorId)
      .eq('user_id', user.id)
      .eq('context_key', contextKey)
      .eq('status', 'open')
      .maybeSingle();
    if (cacheError) throw cacheError;
    if (cached) return { success: true, question: publicReviewQuestion(cached) };
    // Pedir más ayuda no debe consumir las comprobaciones necesarias para cerrar el repaso.
    const limitMessage = await generationLimit(user.id, 'check');
    if (limitMessage) return { success: false, message: limitMessage };
    const { data: previous } = await admin
      .from('study_error_review_checks')
      .select('question')
      .eq('error_id', errorId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const generated = await generateStudyErrorReviewQuestion({
      question: row.prompt.slice(0, 2000),
      topic: row.topic ?? '',
      correctAnswer: row.correct_answer.slice(0, 1000),
      source: source.excerpt,
      previousQuestion: previous?.question,
    });
    if (!generated)
      return {
        success: false,
        message:
          'No pudimos crear una pregunta bien respaldada por este fragmento. El error sigue pendiente; podés repasar o volver a la actividad original.',
      };
    const { data: inserted, error } = await admin
      .from('study_error_review_checks')
      .insert({
        error_id: errorId,
        user_id: user.id,
        material_id: materialId,
        context_key: contextKey,
        source_failed_at: row.last_failed_at,
        question: generated.question,
        options: generated.options,
        correct_index: generated.correctIndex,
        feedback: generated.feedback,
        evidence_quote: generated.evidenceQuote,
      })
      .select('id, question, options')
      .single();
    if (error?.code === '23505') {
      const { data: concurrent } = await admin
        .from('study_error_review_checks')
        .select('id, question, options')
        .eq('error_id', errorId)
        .eq('user_id', user.id)
        .eq('context_key', contextKey)
        .eq('status', 'open')
        .single();
      if (concurrent) return { success: true, question: publicReviewQuestion(concurrent) };
    }
    if (error || !inserted) throw error ?? new Error('Comprobación no guardada');
    await trackServerAnalyticsEvent({
      eventName: 'study_error_check_started',
      userId: user.id,
      path: '/dashboard/explicaciones',
      metadata: { study_error_id: errorId, material_id: materialId },
    });
    return { success: true, question: publicReviewQuestion(inserted) };
  } catch (error) {
    logError('studyErrors.reviewCheck', error, { userId: user.id, errorId });
    return { success: false, message: 'No pudimos preparar la comprobación. Intentá nuevamente.' };
  }
}

export async function submitReviewCheckAction(
  checkId: string,
  selectedIndex: number
): Promise<ReviewAnswerResult> {
  const user = await currentUser();
  if (
    !user ||
    !reviewIdPattern.test(checkId) ||
    !Number.isInteger(selectedIndex) ||
    selectedIndex < 0 ||
    selectedIndex > 2
  ) {
    return { success: false, message: 'Elegí una respuesta válida.' };
  }
  try {
    const rate = await enforceStrictRateLimit({
      key: `study-errors:check-submit:${user.id}`,
      limit: 30,
      windowMs: 60_000,
    });
    if (!rate.allowed)
      return { success: false, message: 'Esperá unos segundos antes de volver a confirmar.' };
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('submit_study_error_review_check', {
      p_user_id: user.id,
      p_check_id: checkId,
      p_selected_index: selectedIndex,
    });
    if (error) throw error;
    const result = data as ReviewAnswerResult | null;
    if (!result) throw new Error('Resultado vacío');
    if (result.success && !result.replayed) {
      const { data: check } = await admin
        .from('study_error_review_checks')
        .select('error_id, material_id')
        .eq('id', checkId)
        .eq('user_id', user.id)
        .single();
      if (check) {
        const metadata = {
          study_error_id: check.error_id,
          material_id: check.material_id,
          correct: result.correct,
        };
        await trackServerAnalyticsEvent({
          eventName: 'study_error_check_answered',
          userId: user.id,
          path: '/dashboard/explicaciones',
          metadata,
        });
        if (result.correct)
          await trackServerAnalyticsEvent({
            eventName: 'study_error_resolved',
            userId: user.id,
            path: '/dashboard/explicaciones',
            metadata,
          });
      }
    }
    return result;
  } catch (error) {
    logError('studyErrors.reviewSubmit', error, { userId: user.id, checkId });
    return {
      success: false,
      message: 'No pudimos guardar tu respuesta. Reintentá; tu error todavía no cambió.',
    };
  }
}

export async function openReviewSourceAction(
  errorId: string,
  materialId: string
): Promise<{
  success: boolean;
  source?: StudyErrorPdfRecommendation;
  message?: string;
}> {
  const user = await currentUser();
  if (!user || !validInput(errorId, materialId))
    return { success: false, message: 'Solicitud no válida.' };
  try {
    const context = await loadReviewContext(user.id, errorId, materialId);
    if (!context?.source?.excerpt)
      return {
        success: false,
        message: 'No encontramos un fragmento suficiente. Podés abrir el PDF completo.',
      };
    if (
      context.row.status === 'pending' &&
      !(await markStudyErrorReviewed(user.id, errorId, context.row.last_failed_at))
    ) {
      return {
        success: false,
        message: 'No pudimos guardar el repaso. Actualizá e intentá nuevamente.',
      };
    }
    await trackServerAnalyticsEvent({
      eventName: 'study_error_pdf_review_started',
      userId: user.id,
      path: '/dashboard/explicaciones',
      metadata: {
        study_error_id: errorId,
        material_id: materialId,
        has_page_reference: Boolean(context.source.pageStart),
      },
    });
    return { success: true, source: context.source };
  } catch (error) {
    logError('studyErrors.reviewSource', error, { userId: user.id, errorId });
    return { success: false, message: 'No pudimos cargar la fuente. Intentá nuevamente.' };
  }
}

export async function associateReviewPdfAction(
  errorId: string,
  materialId: string
): Promise<{
  success: boolean;
  source?: StudyErrorPdfRecommendation;
  message?: string;
}> {
  const user = await currentUser();
  if (!user || !validInput(errorId, materialId))
    return { success: false, message: 'Solicitud no válida.' };
  try {
    const context = await loadReviewContext(user.id, errorId, materialId);
    if (!context || context.row.status !== 'pending' || context.row.student_material_id) {
      return { success: false, message: 'No podemos cambiar el PDF de origen de esta actividad.' };
    }
    if (!context.source?.excerpt)
      return {
        success: false,
        message: 'Ese PDF no tiene evidencia suficiente para este concepto. Elegí otro material.',
      };
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('study_errors')
      .update({
        metadata: { ...context.row.metadata, review_material_id: materialId },
        reference_excerpt: context.source.excerpt,
        reference_page_start: context.source.pageStart,
        reference_page_end: context.source.pageEnd,
        reference_section_title: context.source.sectionTitle,
      })
      .eq('id', errorId)
      .eq('user_id', user.id)
      .eq('updated_at', context.row.updated_at)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data)
      return { success: false, message: 'El error cambió. Actualizá antes de asociar el PDF.' };
    return { success: true, source: context.source };
  } catch (error) {
    logError('studyErrors.reviewAssociate', error, { userId: user.id, errorId });
    return { success: false, message: 'No pudimos asociar el PDF. Intentá nuevamente.' };
  }
}
