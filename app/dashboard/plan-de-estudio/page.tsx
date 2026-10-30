import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, CalendarDays, FileText, GraduationCap } from 'lucide-react';
import { createClientServer } from '@/lib/supabase-server';
import { fetchStudentMaterialsByUser } from '@/lib/data/student-materials';
import { StudyPlanWheel } from '@/components/dashboard/study-plan-wheel';
import { StudyPlanNext } from '@/components/dashboard/study-plan-next';
import { getTopicQuestionCounts } from '@/lib/student-materials/topic-practice';
import { getTopicStudyResources, tagGlossaryChapters } from '@/lib/student-materials/topic-study-resources';
import type { StudySummarySection, StudyGlossaryItem } from '@/lib/student-materials/types';
import type { StudyQuestion, StudyFlashcard } from '@/lib/student-materials/pedagogy';

export const metadata: Metadata = { title: 'Plan de estudio | Evaluo', robots: { index: false, follow: false } };

export default async function StudyPlanPage() {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard/plan-de-estudio');

  const materials = (await fetchStudentMaterialsByUser(supabase, user.id)).filter(
    material => material.processing_status === 'ready'
  );
  const first = materials[0] ?? null;
  let topicCount = 0;
  let topicActivities: Array<{questions:boolean;flashcards:boolean;glossary:boolean}> = [];
  if (first) {
    const [summaryResult, glossaryResult, cacheResult] = await Promise.all([
      supabase.from('student_material_summaries').select('summary_sections').eq('student_material_id', first.id).maybeSingle(),
      supabase.from('student_material_glossaries').select('glossary_items').eq('student_material_id', first.id).maybeSingle(),
      supabase.from('student_materials').select('pedagogical_artifacts').eq('id', first.id).maybeSingle(),
    ]);
    const sections = (Array.isArray(summaryResult.data?.summary_sections) ? summaryResult.data.summary_sections : []) as StudySummarySection[];
    topicCount = sections.length;
    const rawGlossary = glossaryResult.data?.glossary_items;
    const glossary = tagGlossaryChapters((Array.isArray(rawGlossary) ? rawGlossary : []) as StudyGlossaryItem[], sections);
    const artifacts = cacheResult.data?.pedagogical_artifacts as { questions?: StudyQuestion[]; flashcards?: StudyFlashcard[] } | null;
    const questions = Array.isArray(artifacts?.questions) ? artifacts.questions : [];
    const flashcards = Array.isArray(artifacts?.flashcards) ? artifacts.flashcards : [];
    const counts = getTopicQuestionCounts(sections, questions);
    topicActivities = sections.map((_, index) => {
      const resources = getTopicStudyResources(sections, glossary, flashcards, index);
      return { questions: counts[index] > 0, flashcards: resources.flashcards.length > 0, glossary: resources.concepts.length > 0 };
    });
  }

  return (
    <main className="mx-auto w-full max-w-[1240px] px-3 py-3 text-slate-900 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
      <div className="md:hidden rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-xl font-bold">Plan de estudio</h1>
        <p className="mt-2 text-sm text-slate-600">Estamos preparando esta sección para teléfonos. Por ahora podés usarla desde una computadora.</p>
        <Link href="/dashboard/explicaciones" className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold text-blue-600">Ir a Estudiar <ArrowRight className="size-4" /></Link>
      </div>
      <div className="hidden md:block">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold tracking-[-0.035em] lg:text-[24px]">Plan de estudio</h1>
          </div>
          <Link href="/calendario" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50">
            <CalendarDays className="size-4" /> Ver calendario
          </Link>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <div className="min-w-0 space-y-4">
            <section className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-[0_5px_24px_rgba(15,23,42,0.03)]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[14px] font-bold">Tu avance</h2>
              </div>
              {first ? <StudyPlanWheel materialId={first.id} title={first.title} topicCount={topicCount} topicActivities={topicActivities} /> : (
                <p className="text-[12px] text-slate-500">Subí un PDF desde Mi espacio para comenzar.</p>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[15px] font-bold tracking-tight">Lo que sigue</h2>
              </div>
              {first ? <StudyPlanNext materialId={first.id} topicCount={topicCount} /> : (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">Subí un PDF para comenzar con el tema 1.</div>
              )}
            </section>
          </div>

          <div className="min-w-0 space-y-4">
            <section className="relative overflow-hidden rounded-[18px] bg-[#eaf1ff] p-6 text-[#143c85]">
              <div className="absolute -right-6 -top-6 size-36 rounded-full bg-blue-200/50 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-700"><GraduationCap className="size-4" /> PRÓXIMO EXAMEN</div>
                <h2 className="mt-3 max-w-[300px] text-[21px] font-bold leading-[1.15] tracking-[-0.04em]">¿Cuándo rendís?</h2>
                <p className="mt-3 max-w-[330px] text-[12px] leading-5 text-[#5473a2]">Registrá la fecha en tu calendario. Después podremos distribuir los temas y repasos hasta el examen.</p>
                <Link href="/calendario" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-blue-700">Agregar fecha <ArrowRight className="size-4" /></Link>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between"><h2 className="text-[15px] font-bold tracking-tight">Tus materiales</h2><span className="text-xs text-slate-400">{materials.length} PDFs</span></div>
              <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-white">
                {materials.length ? materials.slice(0, 6).map(material => (
                  <Link key={material.id} href={`/materiales/${material.id}?tab=resumen`} className="flex items-center gap-3 border-b border-slate-100 px-3 py-2.5 transition last:border-0 hover:bg-slate-50">
                    <FileText className="size-4 shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{material.title}</span>
                    <ArrowRight className="size-4 shrink-0 text-slate-400" />
                  </Link>
                )) : <p className="p-5 text-sm text-slate-500">Tus PDFs aparecerán aquí cuando estén listos.</p>}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
