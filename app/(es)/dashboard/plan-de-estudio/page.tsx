import type { Metadata } from 'next';
import { accountAppLocale } from '@/lib/i18n/app-locale';
import { redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase-server';
import { MaterialCatalogSeed } from '@/components/materials/material-catalog-provider';
import { StudyPlanSetup } from '@/components/dashboard/study-plan-setup';
import { StudyPlanNextStep } from '@/components/dashboard/study-plan-next-step';
import { StudyPlanNext } from '@/components/dashboard/study-plan-next';
import { StudyPlanRoadmap } from '@/components/dashboard/study-plan-roadmap';
import { EmptyStudyPlan } from '@/components/dashboard/empty-study-plan';
import { StudyPlanExamCard } from '@/components/dashboard/study-plan-exam-card';
import { StudyPlanMaterialSelector } from '@/components/dashboard/study-plan-material-selector';
import { getTopicQuestionCounts } from '@/lib/student-materials/topic-practice';
import { getTopicStudyResources, tagGlossaryChapters } from '@/lib/student-materials/topic-study-resources';
import type { StudySummarySection, StudyGlossaryItem } from '@/lib/student-materials/types';
import type { StudyQuestion, StudyFlashcard } from '@/lib/student-materials/pedagogy';
import { completedPlanTopics, planPreparationProgress, type PlanPracticeCompletion } from '@/lib/student-materials/study-plan-completion';
import type { PlanDay } from '@/lib/student-materials/study-plan-distribution';
import { getSessionUser } from '@/lib/auth-session';

export const metadata: Metadata = { title: 'Plan de estudio | Evaluo', robots: { index: false, follow: false } };

export default async function StudyPlanPage({ searchParams }: { searchParams?: Promise<{ material?: string }> }) {
  const supabase = await createClientServer();
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/dashboard/plan-de-estudio');
  const locale = accountAppLocale(user.user_metadata) ?? 'es';
  const english = locale === 'en';

  // El tipo de vista y los PDFs son independientes: consultarlos en paralelo.
  // Proyección ligera: esta página solo necesita el id y título de los PDFs listos.
  // Aplicamos el límite antes de filtrar por estado, igual que el catálogo anterior.
  const [materialsResult, planResult, query] = await Promise.all([
    supabase.from('student_materials')
      .select('id,title,processing_status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(24),
    supabase.from('student_personal_study_plans' as never)
      .select('exam_date,daily_minutes,material_ids,preferences,schedule,updated_at').eq('user_id', user.id).maybeSingle(),
    searchParams,
  ]);
  if (materialsResult.error) throw materialsResult.error;
  if (planResult.error) throw planResult.error;
  const materials = (materialsResult.data ?? []).filter(
    material => material.processing_status === 'ready'
  );
  const hasSavedPlan = Boolean(planResult.data);
  const requested = query?.material;
  const first = materials.find(material => material.id === requested) ?? materials[0] ?? null;
  const catalog = materials.map(material => ({ id: material.id, title: material.title }));

  if (materials.length === 0) return <><MaterialCatalogSeed materials={[]} /><EmptyStudyPlan locale={locale} /></>;

  // El plan guardado no necesita descargar glosario ni banco de ejercicios.
  // Recuperamos los resúmenes de todos los PDFs con una única petición.
  if (hasSavedPlan) {
    const { data: summaryRows, error: summaryError } = await supabase
      .from('student_material_summaries')
      .select('student_material_id,summary_sections')
      .in('student_material_id', materials.map(material => material.id));
    if (summaryError) throw summaryError;
    const sectionsByMaterial = new Map(
      (summaryRows ?? []).map(row => [row.student_material_id, row.summary_sections])
    );
    const planMaterials = materials.map(material => {
      const raw = sectionsByMaterial.get(material.id);
      const sections = Array.isArray(raw) ? raw : [];
      const topics = sections.map((section: unknown, index: number) => {
        const item = section as { title?: string; body?: string };
        const words = (item.body ?? '').trim().split(/\s+/u).filter(Boolean).length;
        return {
          title: item.title?.trim() || `Tema ${index + 1}`,
          estimatedMinutes: Math.max(10, Math.ceil(words / 180) + 10),
        };
      });
      return { id: material.id, title: material.title, topicCount: topics.length, topics };
    });
    // Render Mi plan with actual server data, avoiding a second client-side loading screen.
    const plan = planResult.data as unknown as {
      exam_date: string;
      daily_minutes: number;
      material_ids: string[];
      preferences: string[];
      schedule: PlanDay[];
      updated_at: string;
    };
    const planIds = Array.isArray(plan.material_ids) ? plan.material_ids : [];
    let completedKeys: string[] = [];
    let planCompletedKeys: string[] = [];
    let preparationPercent = 0;
    if (planIds.length > 0) {
      const [readingResult, practiceResult] = await Promise.all([
        supabase.from('student_material_topic_activity_progress' as never)
          .select('material_id,topic_index').eq('user_id', user.id)
          .eq('activity', 'reading').in('material_id', planIds),
        supabase.from('student_personal_study_plan_practice_progress' as never)
          .select('material_id,topic_index,mode').eq('user_id', user.id)
          .in('material_id', planIds),
      ]);
      if (readingResult.error) throw readingResult.error;
      if (practiceResult.error && !['42P01', 'PGRST205'].includes(practiceResult.error.code ?? '')) {
        throw practiceResult.error;
      }
      completedKeys = ((readingResult.data ?? []) as Array<{material_id:string;topic_index:number}>)
        .map(row => `${row.material_id}:${row.topic_index}`);
      const practice = (practiceResult.data ?? []) as PlanPracticeCompletion[];
      planCompletedKeys = completedPlanTopics(plan.schedule, plan.preferences, plan.daily_minutes, completedKeys, practice);
      preparationPercent = planPreparationProgress(plan.schedule, plan.preferences, plan.daily_minutes, completedKeys, practice).percent;
    }
    return <><MaterialCatalogSeed materials={catalog} /><StudyPlanSetup
      materials={planMaterials} mode="view"
      initialPlanData={{ plan, completedKeys, planCompletedKeys, preparationProgress: { percent: preparationPercent } }}
    /></>;
  }

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
      <MaterialCatalogSeed materials={catalog} />
      <div className="xl:flex xl:h-full xl:min-h-0 xl:flex-col">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] xl:min-h-0 xl:flex-1 xl:overflow-hidden">
          <div className="min-w-0 xl:flex xl:min-h-0 xl:flex-col">
            <h1 className="mb-4 shrink-0 text-[20px] font-semibold tracking-[-0.035em] sm:text-[22px] lg:text-[24px]">{english ? 'Study plan' : 'Plan de estudio'}</h1>
            <div className="min-w-0 space-y-3 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:scroll-smooth xl:overscroll-contain xl:pr-2 xl:[scrollbar-width:none] xl:[&::-webkit-scrollbar]:hidden xl:[mask-image:linear-gradient(to_bottom,transparent,black_14px,black_calc(100%-18px),transparent)]">


            {first ? <StudyPlanRoadmap materialId={first.id} topicActivities={topicActivities} /> : null}

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[15px] font-normal tracking-tight">{english ? 'Keep making progress' : 'Seguí avanzando'}</h2>
              </div>
              {first ? <StudyPlanNext materialId={first.id} topicCount={topicCount} topicActivities={topicActivities} /> : (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">{english ? 'Upload a PDF to start topic 1.' : 'Subí un PDF para comenzar con el tema 1.'}</div>
              )}
            </section>
            </div>
          </div>

          <div className="min-w-0 space-y-3 xl:min-h-0 xl:overflow-hidden">
            <StudyPlanExamCard hasMaterials hasSavedPlan={hasSavedPlan} locale={locale} />

            <section className="rounded-2xl bg-white p-3.5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[14px] font-normal">{english ? 'Your next step' : 'Tu próximo paso'}</h2>
                {materials.length > 1 ? <StudyPlanMaterialSelector selectedId={first?.id ?? ""} materials={materials.map(material => ({ id: material.id, title: material.title }))} /> : null}
              </div>
              {first ? <StudyPlanNextStep materialId={first.id} topicActivities={topicActivities} /> : (
                <p className="text-[12px] text-slate-500">{english ? 'Upload a PDF to get started.' : 'Subí un PDF para empezar.'}</p>
              )}
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}
