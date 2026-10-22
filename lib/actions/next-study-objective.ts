'use server';

import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';
import { isUuid } from '@/lib/uuid';
import type { StudySummarySection } from '@/lib/student-materials/types';

export type NextStudyObjective = {
  id: string;
  kind: 'reinforce' | 'practice' | 'consolidate';
  topicTitle: string | null;
  reviewOn: string;
};

function normalize(value: string | null | undefined) {
  return (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

function reviewDate(examDate: string | null) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  const today = `${get('year')}-${get('month')}-${get('day')}`;
  const daysToExam = examDate
    ? Math.round((Date.parse(`${examDate}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000)
    : null;
  const days = daysToExam !== null && daysToExam > 0 && daysToExam <= 4 ? 1 : 3;
  const next = new Date(`${today}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export async function saveNextStudyObjectiveAction(input: {
  materialId: string;
  sessionId: string;
  answerIds: string[];
}): Promise<{ success: boolean; objective?: NextStudyObjective }> {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !input || !isUuid(input.materialId) || !isUuid(input.sessionId) ||
      !Array.isArray(input.answerIds) || input.answerIds.length < 1 || input.answerIds.length > 300 ||
      input.answerIds.some((id) => !isUuid(id)) || new Set(input.answerIds).size !== input.answerIds.length) {
    return { success: false };
  }
  try {
    const admin = createAdminClient();
    // exam_date existe en producción pero aún no en el tipo generado.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const materialDb = admin as any;
    const { data: material, error: materialError } = await materialDb.from('student_materials')
      .select('id, exam_date, processing_status').eq('id', input.materialId)
      .eq('user_id', user.id).maybeSingle();
    if (materialError || !material || material.processing_status !== 'ready') return { success: false };
    const { data: savedAnswers, error: answersError } = await admin.from('student_material_answer_events')
      .select('id, item_key, topic, evidence_kind, was_correct, answered_at')
      .eq('user_id', user.id).eq('material_id', material.id)
      .eq('source_type', 'exercise').in('id', input.answerIds);
    if (answersError || !savedAnswers || savedAnswers.length !== input.answerIds.length) return { success: false };
    const rows = savedAnswers;
    if (new Set(rows.map((row) => row.item_key)).size !== rows.length) return { success: false };
    const finishedAt = rows.reduce((latest, row) => row.answered_at > latest ? row.answered_at : latest, rows[0]!.answered_at);
    if (Date.now() - Date.parse(finishedAt) > 14 * 86_400_000 ||
        rows.some((row) => Date.parse(row.answered_at) > Date.now() + 60_000)) return { success: false };

    const { data: summary } = await admin.from('student_material_summaries')
      .select('summary_sections').eq('student_material_id', material.id).maybeSingle();
    const sections = (Array.isArray(summary?.summary_sections) ? summary.summary_sections : []) as unknown as StudySummarySection[];
    const assessed = rows.filter((row) => row.evidence_kind === 'assessed');
    const missed = new Map<string, { title: string; count: number }>();
    for (const answer of assessed) {
      if (answer.was_correct || !answer.topic?.trim()) continue;
      const key = normalize(answer.topic);
      const item = missed.get(key) ?? { title: answer.topic.trim(), count: 0 };
      item.count++;
      missed.set(key, item);
    }
    const mostDifficult = [...missed.values()].sort((a, b) => b.count - a.count)[0] ?? null;
    const assessedTopics = new Set(assessed.map((row) => normalize(row.topic)));
    const nextIndex = sections.findIndex((section) => section?.title && !assessedTopics.has(normalize(section.title)));
    const kind: NextStudyObjective['kind'] = mostDifficult ? 'reinforce' : nextIndex >= 0 ? 'practice' : 'consolidate';
    const topicTitle = mostDifficult?.title ?? (nextIndex >= 0 ? sections[nextIndex]!.title : null);
    const topicSectionIndex = topicTitle
      ? sections.findIndex((section) => normalize(section?.title) === normalize(topicTitle)) : -1;

    // Tabla nueva: se accede sólo desde servidor con usuario autenticado y PDF propio.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any;
    const { data: existing, error: readError } = await db.from('study_next_objectives')
      .select('id, session_id, source_finished_at, kind, topic_title, review_on')
      .eq('user_id', user.id).eq('material_id', material.id).maybeSingle();
    if (readError) throw readError;
    if (existing && (existing.session_id === input.sessionId ||
        Date.parse(existing.source_finished_at) > Date.parse(finishedAt))) {
      return { success: true, objective: { id: existing.id, kind: existing.kind,
        topicTitle: existing.topic_title, reviewOn: existing.review_on } };
    }
    const { data: saved, error: saveError } = await db.from('study_next_objectives').upsert({
      user_id: user.id, material_id: material.id, session_id: input.sessionId,
      kind, topic_title: topicTitle?.slice(0, 500) ?? null,
      topic_section_index: topicSectionIndex >= 0 ? topicSectionIndex : null,
      review_on: reviewDate(material.exam_date), source_finished_at: finishedAt,
      status: 'pending', created_at: new Date().toISOString(),
    }, { onConflict: 'user_id,material_id' }).select('id, kind, topic_title, review_on').single();
    if (saveError || !saved) throw saveError ?? new Error('No se pudo guardar el objetivo');
    return { success: true, objective: { id: saved.id, kind: saved.kind,
      topicTitle: saved.topic_title, reviewOn: saved.review_on } };
  } catch (error) {
    logError('studyNextObjective.save', error, { userId: user.id, materialId: input.materialId });
    return { success: false };
  }
}
