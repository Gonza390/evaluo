import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { ensureStudentMaterialStudyArtifacts } from '@/lib/student-material-summary';
import { loadOrBuildPedagogicalArtifacts } from '@/lib/data/student-material-pedagogical-cache';
import { tagGlossaryChapters } from '@/lib/student-materials/topic-study-resources';
import { PracticeSession } from '@/components/dashboard/practice-session';

export default async function PracticeModePage({ params }: { params: Promise<{ id: string; mode: string }> }) {
  const { id, mode } = await params;
  const supported = ['unir', 'completar', 'casos', 'mixto', 'simulacro'];
  if (!supported.includes(mode) || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=' + encodeURIComponent('/dashboard/practicar/' + id + '/' + mode));
  const { data: material } = await supabase.from('student_materials')
    .select('id,title,file_path,processing_status')
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
  return <PracticeSession key={mode + ':' + id} mode={mode as 'unir' | 'completar' | 'casos' | 'mixto' | 'simulacro'}
    materialId={material.id} materialTitle={material.title}
    glossary={glossary.map(item => ({ term: item.term, definition: item.definition, chapterTitle: item.chapterTitle ?? null }))}
    questions={artifacts.questions.filter(q => q.type === 'multiple_choice' && q.options.length >= 2).map(q => ({
      id: q.id, prompt: q.prompt, options: q.options, answer: q.answer,
      explanation: q.explanation, level: q.level, pageStart: q.reference.pageStart,
    }))} />;
}
