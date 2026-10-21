'use client';

import { useMemo, useState } from 'react';
import { BookOpenText, BrainCircuit, ChartNoAxesColumnIncreasing } from 'lucide-react';
import {
  MaterialStudyWorkspace,
  type StudyTabId,
} from '@/components/material-study-workspace';
import { StudentMaterialDiagnostic } from '@/components/student-material-diagnostic';
import { buildPedagogicalArtifacts } from '@/lib/student-materials/pedagogy';
import type { StudyGlossaryItem, StudentMaterialSummary } from '@/lib/student-materials/types';

function DemoProgress({
  title,
  summary,
  reviewTopics,
  showOnboardingTopic,
  showOnboardingExample,
  onPractice,
}: {
  title: string;
  summary: StudentMaterialSummary;
  reviewTopics: string[];
  showOnboardingTopic: boolean;
  showOnboardingExample: boolean;
  onPractice: () => void;
}) {
  const chapters = summary.sections.slice(0, 4);
  const suggested = reviewTopics[0] || chapters[0]?.title || 'Conceptos fundamentales';
  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-3 py-4 sm:px-6 sm:py-6">
      <div className="border-b border-slate-200 pb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600">
          Progreso de ejemplo
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
          Tu progreso con este PDF
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Una demostración del seguimiento por capítulo. No modifica tus resultados reales.
        </p>
      </div>
      <section data-onboarding-topic-detail className={
        'rounded-2xl border p-4 sm:p-5 ' +
        (showOnboardingTopic ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-white')
      }>
        <div className="flex items-start gap-3">
          <BookOpenText className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Estudiar por tema
            </p>
            <h3 className="mt-1 text-base font-bold text-slate-900">
              {chapters[0]?.title || title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Abrí un capítulo, repasá sus conceptos y practicá preguntas vinculadas a ese tema.
            </p>
            <button type="button" onClick={onPractice}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              <BrainCircuit className="h-4 w-4" aria-hidden="true" /> Practicar con este PDF
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {chapters.slice(0, 4).map((chapter, i) => (
            <div key={chapter.title} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
              <span className="mr-2 font-semibold text-blue-600">{i + 1}.</span>{chapter.title}
            </div>
          ))}
        </div>
      </section>
      <section data-recommended-topics className={
        'rounded-2xl border p-4 sm:p-5 ' +
        (showOnboardingExample ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-white')
      }>
        <div className="flex items-start gap-3">
          <ChartNoAxesColumnIncreasing className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Progreso y refuerzo
            </p>
            <h3 className="mt-1 text-base font-bold text-slate-900">
              Descubrí qué temas necesitás reforzar
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Cuando respondés preguntas, Evaluo identifica los temas que dominás y aquellos en los que conviene volver a practicar.
            </p>
            <p className="mt-3 rounded-xl bg-white px-3 py-2.5 text-sm text-slate-700">
              Tema de ejemplo: <strong>{suggested}</strong>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Demostración pública del MISMO recorrido principal de cuatro pasos.
 * Muestra datos de ejemplo y nunca escribe respuestas o progreso en una cuenta.
 */
export function DemoFourStepStudy({
  guided = true,
  summary,
  glossary,
  pageCount,
}: {
  guided?: boolean;
  summary: StudentMaterialSummary;
  glossary: StudyGlossaryItem[];
  pageCount: number;
}) {
  const [activeTab, setActiveTab] = useState<StudyTabId>('resumen');
  const [viewerVisible, setViewerVisible] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [reviewTopics, setReviewTopics] = useState<string[]>([]);
  const artifacts = useMemo(
    () => buildPedagogicalArtifacts({ summary, glossary, pageCount }),
    [summary, glossary, pageCount]
  );

  const openPractice = () => {
    setProgressOpen(false);
    setActiveTab('ejercicios');
  };

  return (
    <MaterialStudyWorkspace
      backHref="/"
      canRegenerate={false}
      fileName="IA y nuevas tecnologías - Material de estudio.pdf"
      isPremium
      materialId="demo-material"
      isOwner={false}
      pageCount={pageCount}
      title="IA y nuevas tecnologías"
      viewerUrl="/material-general-prueba.pdf"
      visibility="private"
      studyGlossary={glossary}
      studySummary={summary}
      pedagogicalArtifacts={artifacts}
      recommendedStudyAvailable={guided}
      initialRecommendedStudy={guided}
      demo={{
        activeTab,
        onTabChange: setActiveTab,
        viewerVisible,
        onViewerChange: setViewerVisible,
        practice: (
          <StudentMaterialDiagnostic
            artifacts={artifacts}
            sections={summary.sections}
            materialId="demo-material"
            guided
            demo
            onExit={() => setActiveTab('resumen')}
            onReviewTopics={(topics) => {
              setReviewTopics(topics);
              setProgressOpen(true);
            }}
            onReinforce={() => setProgressOpen(true)}
          />
        ),
        progress: ({ showOnboardingExample, showOnboardingTopic }) => (
          <DemoProgress
            title="IA y nuevas tecnologías"
            summary={summary}
            reviewTopics={reviewTopics}
            showOnboardingExample={showOnboardingExample}
            showOnboardingTopic={showOnboardingTopic}
            onPractice={openPractice}
          />
        ),
        progressOpen,
        onProgressChange: setProgressOpen,
        onReinforce: () => setProgressOpen(true),
      }}
    />
  );
}
