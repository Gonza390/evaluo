'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { MaterialStudyWorkspace, type StudyTabId } from '@/components/material-study-workspace';
import { AppShellProviders } from '@/components/app-shell-providers';
import { StudentMaterialExam } from '@/components/student-material-exam';
import type { StudentMaterialSummary, StudyGlossaryItem } from '@/lib/student-material-summary';
import type { PedagogicalArtifacts } from '@/lib/student-materials/pedagogy';
import { PdfProgressPanel } from '@/components/dashboard/pdf-progress-panel';
import type { StudyErrorReviewActions } from '@/components/dashboard/study-error-detail';
import type { StudyErrorView, StudyErrorsPageData } from '@/lib/study-errors';
import type { PdfTopicEvidence } from '@/lib/student-materials/progress';
import { findSummarySectionForQuestion } from '@/lib/student-materials/summary-checks';
import { getTopicQuestionCounts } from '@/lib/student-materials/topic-practice';
import {
  REVIEW_DELAY_MS,
  type IndependentPracticeAnswer,
} from '@/lib/student-materials/delayed-review';

const material = { id: 'preview-ia-tecnologias', title: 'IA y nuevas tecnologías.pdf' };
const pdfHref = '/material-general-prueba.pdf';

// Preguntas y resultados preparados para esta simulación; las citas provienen del PDF público.
const examples = [
  {
    section: 1,
    page: 3,
    resolved: false,
    prompt:
      'Un modelo obtiene resultados excelentes durante el entrenamiento, pero falla con datos nuevos. ¿Qué está ocurriendo?',
    selected: 'Generalización correcta',
    answer: 'Sobreajuste',
    quote:
      'Sobreajuste: ocurre cuando el modelo memoriza demasiado los datos de entrenamiento y rinde peor en casos nuevos.',
    explanation:
      'Confundiste memorizar los ejemplos con generalizar. Un buen resultado en entrenamiento no alcanza: hay que evaluar el modelo con datos que no haya visto.',
    simple:
      'Es como memorizar las respuestas de una guía y no poder resolver un ejercicio diferente. El modelo debe aprender patrones que sirvan fuera de los ejemplos iniciales.',
    example:
      'Un detector de spam reconoce los correos con los que se entrenó, pero clasifica mal correos nuevos. Esa diferencia es una señal de sobreajuste.',
    check:
      'Un sistema responde perfectamente las consultas usadas para entrenarlo, pero falla con reclamos nuevos. ¿Qué explica esa diferencia?',
    options: [
      'Generaliza correctamente porque acertó durante el entrenamiento.',
      'Memorizó demasiado los ejemplos y no generaliza bien ante casos nuevos.',
      'Todavía no aprendió los ejemplos originales, por eso falla con datos nuevos.',
    ],
    correct: 1,
  },
  {
    section: 1,
    page: 3,
    resolved: false,
    prompt:
      '¿Cómo se llama el uso de un modelo ya entrenado para producir una salida ante una entrada nueva?',
    selected: 'Entrenamiento',
    answer: 'Inferencia',
    quote:
      'Inferencia: uso del modelo ya entrenado para producir una salida ante una entrada nueva.',
    explanation:
      'Entrenamiento e inferencia son etapas diferentes. Durante el entrenamiento se ajustan parámetros; en la inferencia se utiliza lo aprendido.',
    simple:
      'Entrenar es aprender. Hacer inferencia es usar ese aprendizaje para responder un caso nuevo.',
    example:
      'Cuando una aplicación usa su modelo entrenado para clasificar una foto que acabás de subir, está haciendo inferencia.',
    check:
      'Una aplicación usa un modelo ya entrenado para transcribir un audio nuevo. ¿Qué está haciendo?',
    options: [
      'Aplicando lo aprendido a una entrada nueva: inferencia.',
      'Ajustando el modelo con ejemplos: entrenamiento.',
      'Asignando respuestas a ejemplos para preparar datos: etiquetado.',
    ],
    correct: 0,
  },
  {
    section: 2,
    page: 4,
    resolved: false,
    prompt:
      '¿Una respuesta convincente de un modelo de lenguaje garantiza que la información sea correcta?',
    selected: 'Sí, si está bien redactada',
    answer: 'No: puede contener errores o datos inventados',
    quote:
      'Sus respuestas pueden parecer razonadas, pero el modelo sigue siendo susceptible de errores, contradicciones y datos inventados.',
    explanation:
      'La fluidez de una respuesta no demuestra su exactitud. El material advierte que los modelos pueden producir información plausible que no está respaldada.',
    simple:
      'Que una respuesta suene segura no la vuelve verdadera. Hay que contrastarla con el material y fuentes confiables.',
    example:
      'Un modelo puede inventar el título de un estudio y presentarlo de forma convincente. Revisar la fuente permite detectar ese error.',
    check:
      'Una IA cita un estudio que no podés encontrar. ¿Qué harías antes de utilizar esa información?',
    options: [
      'Confiar porque la redacción es clara',
      'Repetir la cita sin verificarla',
      'Verificar la fuente y contrastar la afirmación',
    ],
    correct: 2,
  },
  {
    section: 3,
    page: 8,
    resolved: true,
    prompt: '¿Qué describe la latencia en una red?',
    selected: 'La cantidad de dispositivos conectados',
    answer: 'El tiempo que tarda un dato en viajar y recibir respuesta',
    quote: 'La latencia es el tiempo que tarda un dato en viajar y recibir respuesta.',
    explanation:
      'Después del repaso, distinguiste la latencia de la cantidad de dispositivos conectados.',
    simple: 'La latencia es el tiempo de espera de la comunicación.',
    example: 'Una latencia baja ayuda a que un sistema industrial reaccione rápidamente.',
    check:
      'Un sistema necesita responder rápidamente a los datos de un sensor. ¿Qué característica de la red conviene reducir?',
    options: ['La latencia', 'La seguridad', 'La autenticación'],
    correct: 0,
  },
  {
    section: 7,
    page: 14,
    resolved: true,
    prompt: '¿La brecha digital se limita a no tener conexión a internet?',
    selected: 'Sí, solo depende de la conexión',
    answer: 'No: también incluye acceso, habilidades y capacidad de aprovechar la tecnología',
    quote:
      'La brecha digital es la desigualdad en acceso, habilidades y capacidad de aprovechar la tecnología.',
    explanation:
      'Después del repaso, reconociste que la conexión no es la única barrera para aprovechar la tecnología.',
    simple: 'Tener internet no alcanza si no tenés las herramientas o habilidades para usarlo.',
    example:
      'Una persona puede tener conexión y aun así encontrar barreras de idioma o accesibilidad.',
    check:
      'Una persona tiene internet, pero no puede utilizar un servicio porque no es accesible. ¿Existe una barrera digital?',
    options: [
      'Sí, el acceso efectivo también depende de la accesibilidad',
      'No, ya tiene conexión',
      'Solo si su equipo está apagado',
    ],
    correct: 0,
  },
];

export function RealPdfProgressPreview({
  summary,
  glossary,
  artifacts,
}: {
  summary: StudentMaterialSummary;
  glossary: StudyGlossaryItem[];
  artifacts: PedagogicalArtifacts;
}) {
  const [version, setVersion] = useState(0);
  const [practiceEvidence, setPracticeEvidence] = useState<PdfTopicEvidence[]>([]);
  const [answeredItemKeys, setAnsweredItemKeys] = useState<string[]>([]);
  const [independentAnswers, setIndependentAnswers] = useState<IndependentPracticeAnswer[]>([]);
  const [nextDay, setNextDay] = useState(false);
  const [firstVisit, setFirstVisit] = useState(false);
  const [tab, setTab] = useState<StudyTabId>('resumen');
  const [progressOpen, setProgressOpen] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const initialViews: StudyErrorView[] = examples.map((example, index) => ({
    id: `preview-pdf-error-${index}`,
    materiaId: null,
    parcial: null,
    materiaNombre: null,
    sourceType: 'exercise',
    sourceKey: `preview-pdf:${index}`,
    questionId: null,
    topic: summary.sections[example.section].title,
    prompt: example.prompt,
    explanation: example.explanation,
    correctAnswer: example.answer,
    selectedAnswer: example.selected,
    failureCount: index === 0 ? 3 : 1,
    status: example.resolved ? 'resolved' : 'pending',
    lastFailedAt: '2026-10-09T10:00:00.000Z',
    lastReviewedAt: example.resolved ? '2026-10-09T11:00:00.000Z' : null,
    resolvedAt: example.resolved ? '2026-10-09T11:05:00.000Z' : null,
    recommendation: {
      materialId: material.id,
      materialTitle: material.title,
      pageStart: example.page,
      pageEnd: example.page,
      sectionTitle: summary.sections[example.section].title,
      excerpt: example.quote,
      relation: 'origin',
    },
    alternatives: [],
  }));
  const [views, setViews] = useState(initialViews);
  // Caso adicional preparado, exclusivo del preview: permite probar recuperación posterior.
  const previewArtifacts: PedagogicalArtifacts = {
    ...artifacts,
    questions: [
      ...artifacts.questions,
      {
        id: 'preview-delayed-overfitting',
        type: 'multiple_choice',
        level: 'aplicar',
        kind: 'concept',
        topic: summary.sections[1].title,
        prompt:
          'Un modelo predice perfectamente las ventas del conjunto con el que aprendió, pero se equivoca con registros nuevos. ¿Qué problema muestra?',
        answer: 'Sobreajuste',
        options: [
          'Sobreajuste',
          'Generalización correcta',
          'Falta de aprendizaje de los ejemplos originales',
        ],
        explanation: examples[0].explanation,
        reference: {
          sectionTitle: summary.sections[1].title,
          pageStart: 3,
          pageEnd: 3,
          excerpt: examples[0].quote,
        },
      },
    ],
  };
  const byId = (id: string) => {
    const index = examples.findIndex((_, index) => id === `preview-pdf-error-${index}`);
    const error = views.find((item) => item.id === id);
    return index >= 0 && error ? { error, example: examples[index] } : null;
  };
  const reviewActions: StudyErrorReviewActions = {
    markReviewed: async () => ({ success: true }),
    generateHelp: async (id, kind) => {
      const item = byId(id);
      if (!item) return { success: false, message: 'No encontramos este ejemplo.' };
      return {
        success: true,
        text:
          kind === 'why_wrong'
            ? item.example.explanation
            : kind === 'simpler'
              ? item.example.simple
              : item.example.example,
        source: item.error.recommendation,
      };
    },
    openSource: async (id) => {
      const item = byId(id);
      return item
        ? { success: true, source: item.error.recommendation! }
        : { success: false, message: 'No encontramos el fragmento.' };
    },
    generateCheck: async (id) => {
      const item = byId(id);
      return item
        ? {
            success: true,
            question: {
              id: `local-check:${id}`,
              question: item.example.check,
              options: item.example.options,
            },
          }
        : { success: false, message: 'No encontramos la pregunta.' };
    },
    submitCheck: async (id, answer) => {
      const item = id.startsWith('local-check:') ? byId(id.slice('local-check:'.length)) : null;
      if (!item || !Number.isInteger(answer) || answer < 0 || answer >= item.example.options.length)
        return { success: false, message: 'Elegí una respuesta válida.' };
      const correct = answer === item.example.correct;
      return {
        success: true,
        correct,
        correctIndex: item.example.correct,
        feedback: correct
          ? `Bien. ${item.example.explanation} El refuerzo se actualiza solo en esta simulación.`
          : `Todavía no. ${item.example.explanation} Podés volver al repaso y probar otra vez.`,
        resolvedAt: correct ? new Date().toISOString() : null,
      };
    },
    associatePdf: async () => ({
      success: false,
      message: 'Este ejemplo ya está asociado al PDF público de prueba.',
    }),
  };
  const data: StudyErrorsPageData = {
    pending: views.filter((error) => error.status === 'pending'),
    resolved: views.filter((error) => error.status === 'resolved'),
    materials: [{ ...material, materiaNombre: null }],
  };
  const assessmentData = {
    items: [
      ...(firstVisit
        ? []
        : examples.map((example) => ({
            topic: summary.sections[example.section].title,
            sectionTitle: summary.sections[example.section].title,
            correct: example.resolved ? 1 : 0,
            incorrect: 1,
            selfReported: 0,
            lastAnsweredAt: '2026-10-09T11:05:00.000Z',
          }))),
      // Un acierto desde el primer intento también debe aparecer, sin crear un error ficticio.
      ...(firstVisit
        ? []
        : [
            {
              topic: summary.sections[0].title,
              sectionTitle: summary.sections[0].title,
              correct: 1,
              incorrect: 0,
              selfReported: 0,
              lastAnsweredAt: '2026-10-09T11:10:00.000Z',
            },
          ]),
      ...practiceEvidence,
    ],
  };

  return (
    <div
      className={`bg-muted/30 flex h-dvh min-h-0 flex-col ${progressOpen ? 'overflow-hidden' : 'overflow-y-auto'}`}
    >
      <div className="border-border bg-card shrink-0 border-b px-5 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <p className="!text-muted-foreground !text-xs">
            <strong className="text-foreground">PDF real · Resultados simulados</strong> · Sin login
            · No se guarda progreso ni se llama a IA
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setFirstVisit(true);
                setPracticeEvidence([]);
                setAnsweredItemKeys([]);
                setIndependentAnswers([]);
                setNextDay(false);
                setViews([]);
                setVersion((current) => current + 1);
                setProgressOpen(false);
                setTab('resumen');
              }}
              className="text-primary focus-visible:outline-ring min-h-10 rounded-lg px-3 text-xs font-medium focus-visible:outline-2"
            >
              Simular primera visita
            </button>
            <button
              type="button"
              disabled={!data.resolved.length}
              onClick={() => {
                setNextDay(true);
                setVersion((current) => current + 1);
                setProgressOpen(false);
                setTab('ejercicios');
              }}
              className="text-primary focus-visible:outline-ring min-h-10 rounded-lg px-3 text-xs font-medium focus-visible:outline-2 disabled:opacity-50"
            >
              Simular repaso al día siguiente
            </button>
            <button
              type="button"
              onClick={() => {
                setVersion((current) => current + 1);
                setPracticeEvidence([]);
                setAnsweredItemKeys([]);
                setIndependentAnswers([]);
                setNextDay(false);
                setViews(initialViews);
                setFirstVisit(false);
              }}
              className="text-muted-foreground hover:bg-muted focus-visible:outline-ring inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs focus-visible:outline-2"
            >
              <RotateCcw size={14} />
              Reiniciar simulación
            </button>
          </div>
          {nextDay && (
            <p className="text-muted-foreground text-xs">
              Tiempo simulado: pasaron 24 horas desde el refuerzo. Se usa un caso adicional
              preparado del mismo concepto cuando está disponible.
            </p>
          )}
        </div>
      </div>
      <AppShellProviders>
        <div className="min-h-0 flex-1 overflow-hidden">
          <MaterialStudyWorkspace
            key={version}
            backHref="/preview/progreso-pdf"
            materialId={material.id}
            title="IA y nuevas tecnologías"
            fileName={material.title}
            pageCount={15}
            viewerUrl={pdfHref}
            visibility="private"
            isOwner={false}
            isPremium
            canRegenerate={false}
            studySummary={summary}
            studyGlossary={glossary}
            pedagogicalArtifacts={artifacts}
            demo={{
              activeTab: tab,
              onTabChange: setTab,
              viewerVisible,
              onViewerChange: setViewerVisible,
              progressOpen,
              onProgressChange: setProgressOpen,
              progress: (
                <PdfProgressPanel
                  embedded
                  material={material}
                  sections={summary.sections}
                  data={data}
                  assessmentData={assessmentData}
                  questionCounts={getTopicQuestionCounts(
                    summary.sections,
                    previewArtifacts.questions
                  )}
                  onPractice={() => {
                    setProgressOpen(false);
                    setTab('ejercicios');
                  }}
                  onErrorProgress={(id, changes) => {
                    const previous = views.find((item) => item.id === id);
                    if (
                      previous &&
                      changes.status === 'resolved' &&
                      previous.status !== 'resolved'
                    ) {
                      setPracticeEvidence((current) => [
                        ...current,
                        {
                          topic: previous.topic,
                          sectionTitle: previous.recommendation?.sectionTitle ?? null,
                          correct: 1,
                          incorrect: 0,
                          selfReported: 0,
                          lastAnsweredAt: new Date().toISOString(),
                        },
                      ]);
                    }
                    setViews((current) =>
                      current.map((item) => (item.id === id ? { ...item, ...changes } : item))
                    );
                  }}
                  summaryUnavailable={false}
                  simulation={{ pdfHref }}
                  reviewActions={reviewActions}
                />
              ),
              practice: (
                <StudentMaterialExam
                  artifacts={previewArtifacts}
                  sections={summary.sections}
                  materialId={material.id}
                  simulation={{
                    context: {
                      evidence: assessmentData.items,
                      answeredItemKeys,
                      pendingTopics: data.pending.map((item) => item.topic ?? ''),
                      independentAnswers,
                      reviewFollowups: data.resolved.flatMap((item) => {
                        const example = byId(item.id)?.example;
                        if (!example || !item.resolvedAt || !item.correctAnswer) return [];
                        return [
                          {
                            errorId: item.id,
                            topic: item.topic ?? '',
                            correctAnswer: item.correctAnswer,
                            originalPrompt: item.prompt,
                            reviewPrompt: example.check,
                            reinforcedAt: new Date(
                              Date.parse(item.resolvedAt) - (nextDay ? REVIEW_DELAY_MS : 0)
                            ).toISOString(),
                          },
                        ];
                      }),
                    },
                    onProgress: () => setProgressOpen(true),
                    onAnswer: (question, correct) => {
                      const index = findSummarySectionForQuestion(question, summary.sections);
                      const title = summary.sections[index]?.title ?? question.topic ?? null;
                      setAnsweredItemKeys((current) => [...current, `exercise:${question.id}`]);
                      if (question.type === 'multiple_choice')
                        setIndependentAnswers((current) => [
                          ...current,
                          {
                            itemKey: `exercise:${question.id}`,
                            answeredAt: new Date().toISOString(),
                          },
                        ]);
                      setPracticeEvidence((current) => [
                        ...current,
                        {
                          topic: title,
                          sectionTitle: title,
                          correct: question.type === 'multiple_choice' && correct ? 1 : 0,
                          incorrect: question.type === 'multiple_choice' && !correct ? 1 : 0,
                          selfReported: question.type === 'open' ? 1 : 0,
                          lastAnsweredAt: new Date().toISOString(),
                        },
                      ]);
                      const key = `preview-practice:${question.id}`;
                      setViews((current) => {
                        const previous = current.find((item) => item.id === key);
                        if (correct)
                          return current.map((item) =>
                            item.id === key
                              ? {
                                  ...item,
                                  status: 'resolved',
                                  resolvedAt: new Date().toISOString(),
                                }
                              : item
                          );
                        const error: StudyErrorView = {
                          id: key,
                          topic: title,
                          prompt: question.prompt,
                          explanation: question.explanation,
                          correctAnswer: question.answer,
                          selectedAnswer: 'Respuesta de práctica simulada',
                          status: 'pending',
                          failureCount: (previous?.failureCount ?? 0) + 1,
                          lastFailedAt: new Date().toISOString(),
                          lastReviewedAt: null,
                          resolvedAt: null,
                          materiaId: null,
                          parcial: null,
                          materiaNombre: null,
                          sourceType: 'exercise',
                          sourceKey: key,
                          questionId: null,
                          recommendation: {
                            materialId: material.id,
                            materialTitle: material.title,
                            ...question.reference,
                            sectionTitle: title,
                            relation: 'origin',
                          },
                          alternatives: [],
                        };
                        return previous
                          ? current.map((item) => (item.id === key ? error : item))
                          : [...current, error];
                      });
                    },
                  }}
                />
              ),
            }}
          />
        </div>
      </AppShellProviders>
    </div>
  );
}
