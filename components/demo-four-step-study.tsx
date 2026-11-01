'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import {
  MaterialStudyWorkspace,
  type StudyTabId,
} from '@/components/material-study-workspace';
import { emptyTopicPracticeContext } from '@/lib/student-materials/topic-practice';
import { buildPedagogicalArtifacts, type StudyQuestion } from '@/lib/student-materials/pedagogy';
import type { StudyErrorsPageData } from '@/lib/study-errors';
import type { PdfTopicEvidence } from '@/lib/student-materials/progress';
import { findSummarySectionForQuestion } from '@/lib/student-materials/summary-checks';
import type { TopicPracticeOutcome } from '@/lib/student-materials/topic-practice-feedback';
import type { StudyGlossaryItem, StudentMaterialSummary } from '@/lib/student-materials/types';

// Estas pantallas sólo se usan cuando el estudiante avanza a práctica o progreso.
// Separarlas del bundle inicial reduce el JS de la demostración pública.
const PdfProgressPanel = dynamic(
  () => import('@/components/dashboard/pdf-progress-panel').then(mod => mod.PdfProgressPanel)
);
const StudentMaterialDiagnostic = dynamic(
  () => import('@/components/student-material-diagnostic').then(mod => mod.StudentMaterialDiagnostic)
);
const StudentMaterialExam = dynamic(
  () => import('@/components/student-material-exam').then(mod => mod.StudentMaterialExam)
);

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
  onPracticeTopic,
  initialTopicSectionIndex,
  lastPracticeOutcome,
}: {
  summary: StudentMaterialSummary;
  glossary: StudyGlossaryItem[];
  flashcards: ReturnType<typeof buildPedagogicalArtifacts>['flashcards'];
  questions: StudyQuestion[];
  answers: Record<string, DemoAnswer>;
  showOnboardingExample: boolean;
  showOnboardingTopic: boolean;
  onPractice: () => void;
  onPracticeTopic?: (index: number) => void;
  initialTopicSectionIndex?: number;
  lastPracticeOutcome?: TopicPracticeOutcome;
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
        initialTopicSectionIndex={initialTopicSectionIndex}
        lastPracticeOutcome={lastPracticeOutcome}
        glossary={glossary}
        flashcards={flashcards}
        sourcePdfHref={DEMO_PDF_URL}
        showOnboardingTopic={showOnboardingTopic}
        showOnboardingExample={showOnboardingExample}
        onPractice={onPractice}
        onPracticeTopic={onPracticeTopic ?? onPractice}
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
  const [demoTopicIndex, setDemoTopicIndex] = useState<number | null>(null);
  const [demoTopicFinished, setDemoTopicFinished] = useState<TopicPracticeOutcome | null>(null);
  const [demoProgressTopicIndex, setDemoProgressTopicIndex] = useState<number | null>(null);
  const artifacts = useMemo(
    () => buildPedagogicalArtifacts({ summary, glossary, pageCount }),
    [summary, glossary, pageCount]
  );

  const openPractice = () => {
    setDemoTopicFinished(null);
    setDemoProgressTopicIndex(null);
    setDemoTopicIndex(null);
    setProgressOpen(false);
    setActiveTab('ejercicios');
  };

  const openTopicPractice = (index: number | null) => {
    if (index === null) {
      openPractice();
      return;
    }
    setDemoTopicFinished(null);
    setDemoProgressTopicIndex(null);
    setDemoTopicIndex(index);
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
        onPracticeTopic: openTopicPractice,
        viewerVisible,
        onViewerChange: setViewerVisible,
        practice: demoTopicIndex !== null ? (
          <StudentMaterialExam
            key={`demo-topic-${demoTopicIndex}`}
            artifacts={artifacts}
            sections={summary.sections}
            materialId={DEMO_MATERIAL_ID}
            topicSectionIndex={demoTopicIndex}
            entrySource="topic_practice"
            onContinueToTopic={(index) => {
              setDemoTopicFinished(null);
              setDemoTopicIndex(index);
            }}
            onTopicFinished={setDemoTopicFinished}
            onStudyNextTopic={(index) => {
              setDemoTopicFinished(null);
              setDemoProgressTopicIndex(index);
              setProgressOpen(true);
            }}
            onViewAllTopics={() => {
              setDemoTopicFinished(null);
              setDemoProgressTopicIndex(null);
              setProgressOpen(true);
            }}
            onReturnToTopic={(_reinforce, outcome) => {
              if (outcome) {
                setDemoTopicFinished(outcome);
                setDemoProgressTopicIndex(outcome.sectionIndex);
                setProgressOpen(true);
              } else {
                setDemoTopicFinished(null);
                setDemoProgressTopicIndex(null);
                setDemoTopicIndex(null);
                setProgressOpen(false);
                setActiveTab('resumen');
              }
            }}
            simulation={{
              context: emptyTopicPracticeContext,
              onAnswer: (question, wasCorrect) => {
                setDemoAnswers((previous) => ({
                  ...previous,
                  [question.id]: {
                    question,
                    selected: wasCorrect ? question.answer : '',
                    answeredAt: new Date().toISOString(),
                  },
                }));
              },
              onProgress: () => setProgressOpen(true),
            }}
          />
        ) : (
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
            key={demoProgressTopicIndex === null ? 'demo-topic-list' : `demo-topic-${demoProgressTopicIndex}`}
            initialTopicSectionIndex={demoProgressTopicIndex ?? undefined}
            lastPracticeOutcome={demoTopicFinished ?? undefined}
            summary={summary}
            glossary={glossary}
            flashcards={artifacts.flashcards}
            questions={artifacts.questions}
            answers={demoAnswers}
            showOnboardingExample={showOnboardingExample}
            showOnboardingTopic={showOnboardingTopic}
            onPractice={openPractice}
            onPracticeTopic={openTopicPractice}
          />
        ),
        progressOpen,
        onProgressChange: setProgressOpen,
        onReinforce: () => setProgressOpen(true),
      }}
    />
  );
}
