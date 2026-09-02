import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  buildPedagogicalArtifacts,
  type StudyQuestion,
} from '@/lib/student-materials/pedagogy';
import type {
  CanonicalPedagogicalModel,
  StudyGlossaryItem,
  StudentMaterialSummary,
} from '@/lib/student-materials/types';

export const dynamic = 'force-dynamic';

const MATERIAL_ID = 'b8165194-ca17-4911-bba3-2dd493408de9';
const ONE_TIME_TOKEN = 'exam-audit-8xY3Jm2F1qL9';

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeAnswer(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeForSearch(value: string) {
  return normalizeAnswer(value).replace(/[^a-z0-9áéíóúñü\s]/gi, ' ');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasExplicitClassificationEvidence(question: StudyQuestion) {
  if (question.kind !== 'classification') return true;
  const answer = question.answer.trim();
  const excerpt = question.reference.excerpt;
  if (!answer || !excerpt) return false;
  return new RegExp(`${escapeRegExp(answer)}\\s*:`, 'i').test(excerpt);
}

function hasGroundedComparisonAnswer(question: StudyQuestion) {
  if (question.type !== 'open' || question.kind !== 'relationship') return true;
  const topic = normalizeForSearch(question.topic ?? '');
  const answer = normalizeForSearch(question.answer);
  const stopWords = new Set([
    'segun', 'material', 'entre', 'frente', 'estructura', 'estructural', 'funcional',
  ]);
  const keywords = Array.from(new Set(topic.split(/\s+/).filter((word) => word.length >= 4 && !stopWords.has(word))));
  if (keywords.length === 0) return Boolean(answer);
  const matches = keywords.filter((word) => answer.includes(word)).length;
  return matches >= Math.min(2, keywords.length);
}

function isEligibleExamQuestion(question: StudyQuestion) {
  if (question.kind === 'confusion') return false;
  if (!hasExplicitClassificationEvidence(question)) return false;
  if (!hasGroundedComparisonAnswer(question)) return false;
  if (question.type === 'multiple_choice') {
    if (question.options.length < 3) return false;
    const answer = normalizeAnswer(question.answer);
    if (!question.options.some((option) => normalizeAnswer(option) === answer)) return false;
  }
  return Boolean(question.prompt.trim() && question.answer.trim());
}

function resolveExamQuestions(
  questions: StudyQuestion[],
  preferredQuestionIds: string[],
  targetCount: number
) {
  const selected: StudyQuestion[] = [];
  const selectedIds = new Set<string>();
  const selectedTopics = new Set<string>();
  const selectedPages = new Set<number>();
  const selectedKinds = new Set<StudyQuestion['kind']>();
  const preferredIds = new Set(preferredQuestionIds);
  const levelSequence: StudyQuestion['level'][] = ['recordar', 'comprender', 'aplicar', 'comprender', 'aplicar'];
  const maxOpenQuestions = Math.max(1, Math.round(targetCount * 0.15));

  const score = (question: StudyQuestion) => {
    let value = preferredIds.has(question.id) ? 4 : 0;
    if (question.type === 'multiple_choice') value += 4;
    if (question.topic && !selectedTopics.has(normalizeAnswer(question.topic))) value += 6;
    if (question.reference.pageStart && !selectedPages.has(question.reference.pageStart)) value += 5;
    if (question.kind && !selectedKinds.has(question.kind)) value += 3;
    return value;
  };

  const pickBest = (level?: StudyQuestion['level']) =>
    questions
      .filter((question) => !selectedIds.has(question.id))
      .filter((question) => !level || question.level === level)
      .filter((question) => question.type !== 'open' || selected.filter((item) => item.type === 'open').length < maxOpenQuestions)
      .map((question, index) => ({ question, index, score: score(question) }))
      .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.question;

  const push = (question: StudyQuestion | undefined) => {
    if (!question || selectedIds.has(question.id) || selected.length >= targetCount) return;
    selected.push(question);
    selectedIds.add(question.id);
    if (question.topic) selectedTopics.add(normalizeAnswer(question.topic));
    if (question.reference.pageStart) selectedPages.add(question.reference.pageStart);
    if (question.kind) selectedKinds.add(question.kind);
  };

  for (let index = 0; index < targetCount; index += 1) {
    const desiredLevel = levelSequence[index % levelSequence.length];
    push(pickBest(desiredLevel) ?? pickBest());
  }
  while (selected.length < targetCount) {
    const match = pickBest();
    if (!match) break;
    push(match);
  }
  return selected.slice(0, targetCount);
}

function summarizeSelection(questions: StudyQuestion[]) {
  return {
    count: questions.length,
    levels: Object.fromEntries(['recordar', 'comprender', 'aplicar'].map((level) => [level, questions.filter((q) => q.level === level).length])),
    kinds: Object.fromEntries(['concept', 'relationship', 'classification', 'process', 'formula', 'confusion', 'section'].map((kind) => [kind, questions.filter((q) => q.kind === kind).length])),
    open: questions.filter((q) => q.type === 'open').length,
    pages: Array.from(new Set(questions.map((q) => q.reference.pageStart).filter((page): page is number => page !== null))).sort((a, b) => a - b),
    questions: questions.map((q) => ({ id: q.id, level: q.level, kind: q.kind, topic: q.topic, prompt: q.prompt, options: q.options, answer: q.answer, pageStart: q.reference.pageStart })),
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('token') !== ONE_TIME_TOKEN) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const admin = createAdminClient();
  const [materialResult, summaryResult, glossaryResult, chunksResult] = await Promise.all([
    admin.from('student_materials').select('*').eq('id', MATERIAL_ID).maybeSingle(),
    admin.from('student_material_summaries').select('status,summary_short,key_points,summary_sections,provider,error_message,source_chunks_count').eq('student_material_id', MATERIAL_ID).maybeSingle(),
    admin.from('student_material_glossaries').select('status,glossary_items,provider,error_message').eq('student_material_id', MATERIAL_ID).maybeSingle(),
    admin.from('student_material_chunks').select('chunk_index,chunk_text,page_start,page_end,section_title').eq('student_material_id', MATERIAL_ID).order('chunk_index'),
  ]);

  if (materialResult.error || summaryResult.error || glossaryResult.error || chunksResult.error) {
    return NextResponse.json({ success: false, message: materialResult.error?.message ?? summaryResult.error?.message ?? glossaryResult.error?.message ?? chunksResult.error?.message ?? 'audit query failed' }, { status: 500 });
  }
  if (!materialResult.data || !summaryResult.data || !glossaryResult.data) {
    return NextResponse.json({ success: false, message: 'material artifacts not found' }, { status: 404 });
  }

  const summary: StudentMaterialSummary = {
    shortSummary: summaryResult.data.summary_short ?? '',
    keyPoints: safeArray<string>(summaryResult.data.key_points),
    sections: safeArray<{ title: string; body: string }>(summaryResult.data.summary_sections),
    hasContent: Boolean(summaryResult.data.summary_short || safeArray(summaryResult.data.summary_sections).length),
    status: summaryResult.data.status === 'ready' ? 'ready' : summaryResult.data.status === 'error' ? 'error' : 'pending',
    provider: summaryResult.data.provider ?? '',
    errorMessage: summaryResult.data.error_message,
    sourceChunksCount: summaryResult.data.source_chunks_count ?? 0,
  };
  const glossary = safeArray<StudyGlossaryItem>(glossaryResult.data.glossary_items);
  const chunks = (chunksResult.data ?? []).map((chunk) => ({ text: chunk.chunk_text, pageStart: chunk.page_start, pageEnd: chunk.page_end, sectionTitle: chunk.section_title, excerpt: chunk.chunk_text.slice(0, 220) }));
  const material = materialResult.data as unknown as { pedagogical_model?: unknown };
  const canonicalModel = (material.pedagogical_model ?? null) as CanonicalPedagogicalModel | null;
  const artifacts = buildPedagogicalArtifacts({ summary, glossary, chunks, canonicalModel });
  const eligible = artifacts.questions.filter(isEligibleExamQuestion);
  const eligibleIds = new Set(eligible.map((question) => question.id));
  const preferredIds = artifacts.miniExamQuestionIds.filter((id) => eligibleIds.has(id));

  return NextResponse.json({
    success: true,
    rawCount: artifacts.questions.length,
    eligibleCount: eligible.length,
    filteredIds: artifacts.questions.filter((q) => !eligibleIds.has(q.id)).map((q) => q.id),
    delivered: {
      10: summarizeSelection(resolveExamQuestions(eligible, preferredIds, 10)),
      15: summarizeSelection(resolveExamQuestions(eligible, preferredIds, 15)),
      20: summarizeSelection(resolveExamQuestions(eligible, preferredIds, 20)),
    },
  });
}
