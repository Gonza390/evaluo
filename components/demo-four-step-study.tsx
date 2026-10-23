'use client';

import { useMemo, useState } from 'react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { PdfProgressPanel } from '@/components/dashboard/pdf-progress-panel';
import {
  MaterialStudyWorkspace,
  type StudyTabId,
} from '@/components/material-study-workspace';
import { StudentMaterialDiagnostic } from '@/components/student-material-diagnostic';
import { buildPedagogicalArtifacts, type StudyQuestion } from '@/lib/student-materials/pedagogy';
import type { StudyErrorsPageData } from '@/lib/study-errors';
import type { PdfTopicEvidence } from '@/lib/student-materials/progress';
import { findSummarySectionForQuestion } from '@/lib/student-materials/summary-checks';
import type { StudyGlossaryItem, StudentMaterialSummary } from '@/lib/student-materials/types';

const DEMO_MATERIAL_ID = 'demo-material';
const DEMO_TITLE = 'IA y nuevas tecnologías';
const DEMO_PDF_URL = '/material-general-prueba.pdf';

// La muestra utiliza el panel real, pero nunca consulta ni guarda progreso de cuentas.
const emptyDemoProgress: StudyErrorsPageData = {
  pending: [],
  resolved: [],
  materials: [{ id: DEMO_MATERIAL_ID, title: DEMO_TITLE, materiaNombre: null }],
};

type DemoAnswer = {
  question: StudyQuestion;
  selected: string;
  answeredAt: string;
};

function normalizeAnswer(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

/**
 * La misma pantalla de Progreso que usan los PDFs reales, sin consultas al servidor.
 * Los estados ilustrativos del cuarto paso los dibuja PdfProgressPanel: no hay
 * resultados inventados almacenados, y solo se refleja lo respondido en esta demo.
 */
function DemoProgress({
  summary,
  glossary,
  flashcards,
  questions,
  answers,
  showOnboardingExample,
  showOnboardingTopic,
  onPractice,
}: {
  summary: StudentMaterialSummary;
  glossary: StudyGlossaryItem[];
  flashcards: ReturnType<typeof buildPedagogicalArtifacts>['flashcards'];
  questions: StudyQuestion[];
  answers: Record<string, DemoAnswer>;
  showOnboardingExample: boolean;
  showOnboardingTopic: boolean;
  onPractice: () => void;
}) {
  const { counts, evidence } = useMemo(() => {
    const counts = summary.sections.map(() => 0);
    for (const question of questions) {
      const section = findSummarySectionForQuestion(question, summary.sections);
      if (section >= 0) counts[section] += 1;
    }
    const evidence: PdfTopicEvidence[] = Object.values(answers).flatMap((answer) => {
      const section = findSummarySectionForQuestion(answer.question, summary.sections);
      if (section < 0) return [];
      const correct = normalizeAnswer(answer.selected) === normalizeAnswer(answer.question.answer);
      return [{
        topic: null,
        sectionTitle: summary.sections[section].title,
        correct: correct ? 1 : 0,
        incorrect: correct ? 0 : 1,
        selfReported: 0,
        lastAnsweredAt: answer.answeredAt,
      }];
    });
    return { counts, evidence };
  }, [answers, questions, summary.sections]);

  return (
    <PdfProgressPanel
        embedded
        material={{ id: DEMO_MATERIAL_ID, title: DEMO_TITLE }}
        sections={summary.sections}
        data={emptyDemoProgress}
        summaryUnavailable={false}
        assessmentData={{ items: evidence }}
        questionCounts={counts}
        glossary={glossary}
        flashcards={flashcards}
        sourcePdfHref={DEMO_PDF_URL}
        showOnboardingTopic={showOnboardingTopic}
        showOnboardingExample={showOnboardingExample}
        onPractice={onPractice}
        onPracticeTopic={onPractice}
      />
  );
}

/** Demo pública del onboarding real de cuatro pasos, sin efectos en perfiles. */
export function DemoFourStepStudy({
  guided = true,
  summary,
  glossary,
  pageCount,
  initialTab = 'resumen',
  internationalSource,
}: {
  guided?: boolean;
  summary: StudentMaterialSummary;
  glossary: StudyGlossaryItem[];
  pageCount: number;
  initialTab?: StudyTabId;
  internationalSource?: string;
}) {
  const [activeTab, setActiveTab] = useState<StudyTabId>(initialTab);
  const market = internationalSource?.replace('international-study-', '');
  const [viewerVisible, setViewerVisible] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [demoAnswers, setDemoAnswers] = useState<Record<string, DemoAnswer>>({});
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
      materialId={DEMO_MATERIAL_ID}
      isOwner={false}
      pageCount={pageCount}
      title={DEMO_TITLE}
      viewerUrl={DEMO_PDF_URL}
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
            materialId={DEMO_MATERIAL_ID}
            guided
            demo
            onDemoAnswer={(question, selected) => {
              if (internationalSource) {
                trackMarketingEvent('international_study_demo_pdf_answered', {
                  source: internationalSource,
                  market,
                  demo_only: true,
                });
              }
              setDemoAnswers((previous) => ({
                ...previous,
                [question.id]: { question, selected, answeredAt: new Date().toISOString() },
              }));
            }}
            onExit={() => setActiveTab('resumen')}
            onReviewTopics={() => {
              if (internationalSource) {
                trackMarketingEvent('international_study_demo_pdf_progress_viewed', {
                  source: internationalSource,
                  market,
                  demo_only: true,
                  answered_count: Object.keys(demoAnswers).length,
                });
              }
              setProgressOpen(true);
            }}
            onReinforce={() => setProgressOpen(true)}
          />
        ),
        progress: ({ showOnboardingExample, showOnboardingTopic }) => (
          <DemoProgress
            summary={summary}
            glossary={glossary}
            flashcards={artifacts.flashcards}
            questions={artifacts.questions}
            answers={demoAnswers}
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
