import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { ensureStudentMaterialStudyArtifacts } from '@/lib/student-material-summary';
import { loadOrBuildPedagogicalArtifacts } from '@/lib/data/student-material-pedagogical-cache';
import { tagGlossaryChapters } from '@/lib/student-materials/topic-study-resources';
import { PracticeSession } from '@/components/dashboard/practice-session';
import { buildSourceBackedCases } from '@/lib/student-materials/practice-modes';
import {
  PRACTICE_BANK_VERSION, safePracticeBank, sourceFingerprint,
} from '@/lib/student-materials/practice-on-demand';
import type { CanonicalPedagogicalModel } from '@/lib/student-materials/types';

export default async function PracticeModePage({ params }: { params: Promise<{ id: string; mode: string }> }) {
  const { id, mode } = await params;
  const supported = ['unir', 'completar', 'casos', 'mixto', 'simulacro'];
  if (!supported.includes(mode) || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=' + encodeURIComponent('/dashboard/practicar/' + id + '/' + mode));
  const { data: material } = await supabase.from('student_materials')
    .select('id,title,file_name,file_path,processing_status,content_fingerprint,pedagogical_artifacts_version')
    .eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!material || material.processing_status !== 'ready') notFound();

  const admin = createAdminClient();
  const { studySummary, studyGlossary } = await ensureStudentMaterialStudyArtifacts({
    admin, studentMaterialId: material.id, filePath: material.file_path,
    title: material.title, allowOnDemandRegeneration: false,
  });
  if (studySummary.status !== 'ready') {
    return <main className="mx-auto max-w-3xl p-6"><p>El material todavía se está preparando.</p><Link className="text-blue-600 underline" href="/dashboard/practicar">Volver a Practicar</Link></main>;
  }
  const glossary = tagGlossaryChapters(studyGlossary, studySummary.sections);
  const artifacts = await loadOrBuildPedagogicalArtifacts({
    admin, materialId: material.id, summary: studySummary, glossary,
  });
  const { data: modelRow } = mode === 'casos' || mode === 'mixto'
    ? await admin.from('student_materials').select('pedagogical_model').eq('id', material.id).maybeSingle()
    : { data: null };
  const cases = buildSourceBackedCases((modelRow?.pedagogical_model ?? null) as CanonicalPedagogicalModel | null);
  // A missing bank table during rollout is safe: keep the original source-backed practice.
  // Never modify the source model or the existing study artifacts.
  let savedBank = null as ReturnType<typeof safePracticeBank>;
  if (process.env.PRACTICE_BANK_ENABLED === '1') {
    const practiceDb = admin as unknown as {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- optional additive practice table, not yet in generated Supabase types
      from: (table: string) => any;
    };
    const { data: bankRow, error: bankError } = await practiceDb
      .from('student_material_practice_banks')
      .select('payload,source_fingerprint')
      .eq('material_id', material.id)
      .eq('user_id', user.id)
      .eq('mode', mode)
      .eq('version', PRACTICE_BANK_VERSION)
      .maybeSingle();
    if (!bankError && bankRow && 'source_fingerprint' in bankRow && 'payload' in bankRow &&
        bankRow.source_fingerprint === sourceFingerprint(material.content_fingerprint, material.id, material.pedagogical_artifacts_version) + ':editorial:2:ai:' + String(process.env.PRACTICE_PEDAGOGICAL_AI_ENABLED === '1')) {
      savedBank = safePracticeBank(bankRow.payload);
    }
  }
  return <PracticeSession key={mode + ':' + id} mode={mode as 'unir' | 'completar' | 'casos' | 'mixto' | 'simulacro'}
    materialId={material.id} materialTitle={material.title} cases={savedBank?.cases.length ? savedBank.cases : cases}
    aiAvailable={mode === 'casos' || (process.env.PRACTICE_PEDAGOGICAL_AI_ENABLED === '1' && process.env.PRACTICE_BANK_ENABLED === '1')}
    isWord={material.file_name.toLowerCase().endsWith('.docx')}
    glossary={glossary.map(item => ({ term: item.term, definition: item.definition, chapterTitle: item.chapterTitle ?? null, englishTerm: item.englishTerm ?? null }))}
    questions={savedBank?.questions.length ? savedBank.questions : artifacts.questions.filter(q => q.type === 'multiple_choice' && q.options.length >= 2).map(q => ({
      id: q.id, prompt: q.prompt, options: q.options, answer: q.answer,
      explanation: q.explanation, level: q.level, pageStart: q.reference.pageStart,
      chapterTitle: q.chapterTitle ?? null, kind: q.kind ?? undefined,
    }))} />;
}
