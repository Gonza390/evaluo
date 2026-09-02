import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { buildPedagogicalArtifacts } from '@/lib/student-materials/pedagogy';
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
    return NextResponse.json({
      success: false,
      message: materialResult.error?.message ?? summaryResult.error?.message ?? glossaryResult.error?.message ?? chunksResult.error?.message ?? 'audit query failed',
    }, { status: 500 });
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
  const chunks = (chunksResult.data ?? []).map((chunk) => ({
    text: chunk.chunk_text,
    pageStart: chunk.page_start,
    pageEnd: chunk.page_end,
    sectionTitle: chunk.section_title,
    excerpt: chunk.chunk_text.slice(0, 220),
  }));
  const material = materialResult.data as unknown as { pedagogical_model?: unknown };
  const canonicalModel = (material.pedagogical_model ?? null) as CanonicalPedagogicalModel | null;
  const artifacts = buildPedagogicalArtifacts({ summary, glossary, chunks, canonicalModel });

  const counts = {
    total: artifacts.questions.length,
    byLevel: Object.fromEntries(['recordar','comprender','aplicar'].map((level) => [level, artifacts.questions.filter((q) => q.level === level).length])),
    byKind: Object.fromEntries(['concept','relationship','classification','process','formula','confusion','section'].map((kind) => [kind, artifacts.questions.filter((q) => q.kind === kind).length])),
    withPage: artifacts.questions.filter((q) => q.reference.pageStart !== null).length,
    open: artifacts.questions.filter((q) => q.type === 'open').length,
    multipleChoice: artifacts.questions.filter((q) => q.type === 'multiple_choice').length,
  };

  return NextResponse.json({
    success: true,
    counts,
    miniExam: artifacts.miniExamQuestionIds.map((id) => artifacts.questions.find((q) => q.id === id)).filter(Boolean),
    questions: artifacts.questions.map((q) => ({
      id: q.id,
      type: q.type,
      level: q.level,
      kind: q.kind,
      topic: q.topic,
      prompt: q.prompt,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      pageStart: q.reference.pageStart,
      pageEnd: q.reference.pageEnd,
      excerpt: q.reference.excerpt,
    })),
  });
}
