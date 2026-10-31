import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { createClientServer } from '@/lib/supabase-server';
import { fetchStudentMaterialsByUser } from '@/lib/data/student-materials';
import { StudyPlanNextStep } from '@/components/dashboard/study-plan-next-step';
import { StudyPlanNext } from '@/components/dashboard/study-plan-next';
import { StudyPlanRoadmap } from '@/components/dashboard/study-plan-roadmap';
import { StudyPlanMaterialSelector } from '@/components/dashboard/study-plan-material-selector';
import { getTopicQuestionCounts } from '@/lib/student-materials/topic-practice';
import { getTopicStudyResources, tagGlossaryChapters } from '@/lib/student-materials/topic-study-resources';
import type { StudySummarySection, StudyGlossaryItem } from '@/lib/student-materials/types';
import type { StudyQuestion, StudyFlashcard } from '@/lib/student-materials/pedagogy';

export const metadata: Metadata = { title: 'Plan de estudio | Evaluo', robots: { index: false, follow: false } };

export default async function StudyPlanPage({ searchParams }: { searchParams?: Promise<{ material?: string }> }) {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard/plan-de-estudio');

  const materials = (await fetchStudentMaterialsByUser(supabase, user.id)).filter(
    material => material.processing_status === 'ready'
  );
  const requested = (await searchParams)?.material;
  const first = materials.find(material => material.id === requested) ?? materials[0] ?? null;
  let topicCount = 0;
  let topicActivities: Array<{questions:boolean;flashcards:boolean;glossary:boolean;readingMinutes:number;questionsMinutes:number;flashcardsMinutes:number;glossaryMinutes:number;title:string}> = [];
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
    topicActivities = sections.map((section, index) => {
      const resources = getTopicStudyResources(sections, glossary, flashcards, index);
      return { title: section.title || `Tema ${index + 1}`, questions: counts[index] > 0, flashcards: resources.flashcards.length > 0, glossary: resources.concepts.length > 0, readingMinutes: Math.max(1, Math.ceil((section.body?.trim().split(/\s+/u).filter(Boolean).length ?? 0) / 180)), questionsMinutes: Math.max(1, Math.ceil(counts[index] * 1.5)), flashcardsMinutes: Math.max(1, Math.ceil(resources.flashcards.length * 0.6)), glossaryMinutes: Math.max(1, Math.ceil(resources.concepts.length * 0.35)) };
    });
  }

  return (
    <main className="mx-auto w-full max-w-[1240px] px-3 py-3 text-slate-900 sm:px-4 sm:py-4 lg:px-6 lg:py-5 xl:h-[calc(100dvh-52px)] xl:overflow-hidden">
      <div className="xl:flex xl:h-full xl:min-h-0 xl:flex-col">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] xl:min-h-0 xl:flex-1 xl:overflow-hidden">
          <div className="min-w-0 xl:flex xl:min-h-0 xl:flex-col">
            <h1 className="mb-4 shrink-0 text-[20px] font-semibold tracking-[-0.035em] sm:text-[22px] lg:text-[24px]">Plan de estudio</h1>
            <div className="min-w-0 space-y-3 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:scroll-smooth xl:overscroll-contain xl:pr-2 xl:[scrollbar-width:none] xl:[&::-webkit-scrollbar]:hidden xl:[mask-image:linear-gradient(to_bottom,transparent,black_14px,black_calc(100%-18px),transparent)]">


            {first ? <StudyPlanRoadmap materialId={first.id} topicActivities={topicActivities} /> : null}

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[15px] font-normal tracking-tight">Seguí avanzando</h2>
              </div>
              {first ? <StudyPlanNext materialId={first.id} topicCount={topicCount} topicActivities={topicActivities} /> : (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">Subí un PDF para comenzar con el tema 1.</div>
              )}
            </section>
            </div>
          </div>

          <div className="min-w-0 space-y-3 xl:min-h-0 xl:overflow-hidden">
            <section className="relative min-h-[210px] overflow-hidden rounded-[18px] bg-[#eaf1ff] px-4 py-6 text-[#143c85] sm:min-h-[218px] sm:px-5 sm:py-7">
              <div className="absolute -right-6 -top-6 size-36 rounded-full bg-blue-200/50 blur-2xl" />
              <div className="relative flex min-h-[162px] items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-blue-700"><Sparkles className="size-4" /> Prepará tu examen</div>
                  <h2 className="mt-2 text-[18px] font-medium leading-[1.15] tracking-[-0.04em] sm:text-[19px]">Tu estudio, organizado hasta el examen.</h2>
                  <p className="mt-2 text-[11px] leading-[18px] text-[#5473a2]">Elegí la fecha para organizar tus temas y prácticas.</p>
                  <Link href="/calendario" className="mt-2.5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-[12px] font-medium text-white transition hover:bg-blue-700">Armar mi plan <ArrowRight className="size-4" /></Link>
                </div>
                <div aria-hidden="true" className="relative hidden h-[116px] w-[94px] shrink-0 items-center justify-center min-[420px]:flex sm:h-[132px] sm:w-[106px]">
                  <div className="absolute inset-2 rotate-6 rounded-xl bg-[#c9dcff]/55" />
                  <div className="relative flex h-[110px] w-[82px] -rotate-3 flex-col rounded-[10px] border border-[#bad0f3] bg-white/95 px-3 pt-4 shadow-[0_8px_22px_rgba(33,79,151,0.12)] sm:h-[124px] sm:w-[92px]">
                    <div className="mb-3 h-1.5 w-10 rounded-full bg-[#4f5dff]/65" />
                    <div className="mb-1.5 h-1 w-full rounded-full bg-[#d8e3f5]" />
                    <div className="mb-1.5 h-1 w-4/5 rounded-full bg-[#d8e3f5]" />
                    <div className="mb-3 h-1 w-11/12 rounded-full bg-[#d8e3f5]" />
                    <div className="flex items-center gap-1.5">
                      <div className="flex size-3.5 shrink-0 items-center justify-center rounded-[4px] bg-[#e4edff] text-[#4f5dff]"><span className="text-[10px] leading-none">✓</span></div>
                      <div className="h-1 w-8 rounded-full bg-[#afc5ea]" />
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="size-3.5 shrink-0 rounded-[4px] border border-[#c5d6ef]" />
                      <div className="h-1 w-7 rounded-full bg-[#d8e3f5]" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-3.5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[14px] font-normal">Tu próximo paso</h2>
                {materials.length > 1 ? <StudyPlanMaterialSelector selectedId={first?.id ?? ""} materials={materials.map(material => ({ id: material.id, title: material.title }))} /> : null}
              </div>
              {first ? <StudyPlanNextStep materialId={first.id} topicActivities={topicActivities} /> : (
                <p className="text-[12px] text-slate-500">Subí un PDF para empezar.</p>
              )}
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}
