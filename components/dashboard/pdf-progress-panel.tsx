'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PdfMobileNavigation } from '@/components/study/pdf-mobile-navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Circle,
  FileText,
  Flag,
} from 'lucide-react';
import type { StudyErrorsPageData, StudyErrorView } from '@/lib/study-errors';
import {
  buildPdfProgress,
  topicAssessmentCount,
  type PdfProgressTopic,
  type PdfTopicEvidence,
} from '@/lib/student-materials/progress';
import type { StudyErrorConversation, StudyErrorReviewActions } from './study-error-detail';
import { PdfTourSpotlight } from '@/components/study/pdf-tour-spotlight';
import { finishStudyErrorOnboardingAction } from '@/lib/actions/study-errors';
import { getTopicStudyResources } from '@/lib/student-materials/topic-study-resources';
import type { StudyFlashcard } from '@/lib/student-materials/pedagogy';
import type { StudyGlossaryItem } from '@/lib/student-materials/types';
import { TopicStudySupport } from '@/components/study/topic-study-support';
import { StudyRichText } from '@/components/study-rich-text';
import {
  topicPracticeFeedback,
  type TopicPracticeOutcome,
} from '@/lib/student-materials/topic-practice-feedback';

const emptyGlossary: StudyGlossaryItem[] = [];
const emptyCards: StudyFlashcard[] = [];

const StudyErrorDetail = dynamic(
  () => import('./study-error-detail').then((module) => module.StudyErrorDetail),
  {
    loading: () => (
      <p role="status" className="text-muted-foreground p-6">
        Cargando el repaso…
      </p>
    ),
  }
);
const actionClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring';

function topicStatus(topic: PdfProgressTopic) {
  if (topic.errors.some((error) => error.status === 'pending'))
    return { label: 'Por reforzar', Icon: Flag, style: 'bg-destructive/10 text-destructive' };
  if (topic.errors.some((error) => error.status === 'resolved'))
    return {
      label: topic.evidence.some((item) => item.correct > 0)
        ? 'Repaso comprobado'
        : 'Seguir practicando',
      Icon: CheckCircle2,
      style: 'bg-primary/10 text-primary',
    };
  if (topicAssessmentCount(topic) > 0)
    return { label: 'Seguir practicando', Icon: CheckCircle2, style: 'bg-primary/10 text-primary' };
  if (topic.evidence.some((item) => item.selfReported > 0))
    return { label: 'Autoevaluado', Icon: Circle, style: 'bg-muted text-muted-foreground' };
  return {
    label: 'Sin evaluar',
    Icon: Circle,
    style: 'bg-muted text-muted-foreground',
  };
}

export function PdfProgressPanel({
  material,
  sections,
  data,
  summaryUnavailable,
  simulation,
  reviewActions,
  embedded = false,
  assessmentData,
  questionCounts,
  onPractice,
  onPracticeTopic,
  glossary = emptyGlossary,
  flashcards = emptyCards,
  sourcePdfHref,
  onErrorProgress,
  initialErrorId,
  initialTopicSectionIndex,
  initialReinforce = false,
  lastPracticeOutcome,
  onboardingErrorId,
  returnToErrors = false,
}: {
  material: { id: string; title: string };
  sections: unknown;
  data: StudyErrorsPageData;
  summaryUnavailable: boolean;
  initialErrorId?: string;
  initialTopicSectionIndex?: number;
  initialReinforce?: boolean;
  lastPracticeOutcome?: TopicPracticeOutcome;
  onboardingErrorId?: string | null;
  returnToErrors?: boolean;
  embedded?: boolean;
  assessmentData?: { items: PdfTopicEvidence[]; loadError?: boolean };
  questionCounts?: number[];
  onPractice?: () => void;
  onPracticeTopic?: (sectionIndex: number) => void;
  glossary?: StudyGlossaryItem[];
  flashcards?: StudyFlashcard[];
  sourcePdfHref?: string;
  onErrorProgress?: (id: string, changes: Partial<StudyErrorsPageData['pending'][number]>) => void;
} & (
  | { simulation?: undefined; reviewActions?: never }
  | { simulation: { pdfHref: string }; reviewActions: StudyErrorReviewActions }
)) {
  const panelId = useId();
  const [viewOverrides, setViewOverrides] = useState<Record<string, Partial<StudyErrorView>>>({});
  const views = [...data.pending, ...data.resolved].map((item) => ({
    ...item,
    ...viewOverrides[item.id],
  }));
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const initialTopic = buildPdfProgress(sections, [...data.pending, ...data.resolved]).topics.find(
    (topic) => topic.id === `section-${initialTopicSectionIndex}`
  );
  const initialTopicError = initialReinforce
    ? initialTopic?.errors.find((error) => error.status === 'pending')
    : undefined;
  const [reviewOpen, setReviewOpen] = useState(Boolean(initialErrorId || initialTopicError));
  const initialError = [...data.pending, ...data.resolved].find(
    (item) => item.id === initialErrorId
  );
  const [topicId, setTopicId] = useState<string | null>(() =>
    initialError
      ? (buildPdfProgress(sections, [...data.pending, ...data.resolved]).topics.find((topic) =>
          topic.errors.some((error) => error.id === initialError.id)
        )?.id ?? 'unmatched')
      : (initialTopic?.id ?? null)
  );
  const [errorId, setErrorId] = useState<string | null>(
    initialError?.id ??
      initialTopicError?.id ??
      initialTopic?.errors.find((error) => error.status === 'pending')?.id ??
      null
  );
  const [tourStep, setTourStep] = useState(
    onboardingErrorId && initialError?.status === 'pending' ? 0 : -1
  );
  const tourClosing = useRef(false);
  const [conversations, setConversations] = useState<Record<string, StudyErrorConversation>>({});
  const detailRef = useRef<HTMLElement>(null);
  const [evidence, setEvidence] = useState<PdfTopicEvidence[]>([]);
  const { topics, unmatched, unmatchedEvidence, evaluated } = buildPdfProgress(sections, views, [
    ...(assessmentData?.items ?? []),
    ...evidence,
  ]);
  const pending = views.filter((error) => error.status === 'pending');
  const next = pending[0];
  const recommendedTopic =
    topics.find((topic) => topic.errors.some((error) => error.id === next?.id)) ??
    topics.find((topic) => topicAssessmentCount(topic) === 0) ??
    topics[0];
  const selected = views.find((error) => error.id === errorId);
  const currentTopic = topics.find((topic) => topic.id === topicId);
  const currentSectionIndex = currentTopic ? Number(currentTopic.id.replace('section-', '')) : -1;
  const nextStudyTopic = currentTopic ? topics[topics.indexOf(currentTopic) + 1] : undefined;
  const currentSection = Array.isArray(sections) ? sections[currentSectionIndex] : null;
  const resources = useMemo(
    () =>
      getTopicStudyResources(
        Array.isArray(sections)
          ? sections.map((section) => ({
              title: typeof section?.title === 'string' ? section.title : '',
              body: typeof section?.body === 'string' ? section.body : '',
            }))
          : [],
        glossary,
        flashcards,
        currentSectionIndex
      ),
    [sections, glossary, flashcards, currentSectionIndex]
  );
  // No inventar objetivos académicos: usar sólo conceptos asociados de forma inequívoca.
  const focusConcepts = [...resources.concepts]
    .sort(
      (first, second) =>
        (first.importance === 'alta' ? 0 : 1) - (second.importance === 'alta' ? 0 : 1)
    )
    .slice(0, 3);
  const currentAnswered = currentTopic ? topicAssessmentCount(currentTopic) : 0;
  const currentCorrect =
    currentTopic?.evidence.reduce((total, item) => total + item.correct, 0) ?? 0;
  const currentQuestionCount = questionCounts?.[currentSectionIndex];
  const canPracticeTopic = Boolean(
    onPracticeTopic && currentTopic && currentQuestionCount && currentQuestionCount > 0
  );
  const summaryBody =
    currentSection && typeof currentSection.body === 'string' ? currentSection.body.trim() : '';
  const currentErrors = [
    ...(topicId === 'unmatched' ? unmatched : (currentTopic?.errors ?? [])),
  ].sort((first, second) => first.id.localeCompare(second.id));
  const lastOutcome =
    lastPracticeOutcome?.sectionIndex === currentSectionIndex ? lastPracticeOutcome : undefined;
  const topicPending = currentErrors.filter((error) => error.status === 'pending');
  const hasReinforced = currentErrors.some((error) => error.status === 'resolved');
  const lastWasReinforced = lastOutcome
    ? lastOutcome.incorrect > 0 &&
      lastOutcome.incorrectPrompts.every((prompt) =>
        currentErrors.some((error) => error.prompt === prompt && error.status === 'resolved')
      )
    : hasReinforced;
  const visibleTopics = topics.filter(
    (topic) =>
      topic.title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .includes(
          search
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
        ) &&
      (filter === 'Todos' ||
        (filter === 'Por reforzar'
          ? topic.errors.some((error) => error.status === 'pending')
          : topicAssessmentCount(topic) === 0))
  );
  const router = useRouter();
  const materialHref = simulation ? simulation.pdfHref : `/materiales/${material.id}`;
  const conversationKey = selected ? `${selected.id}:${selected.lastFailedAt}` : '';
  const initialConversation: StudyErrorConversation = {
    messages: [],
    source: selected?.recommendation ?? null,
    reviewed: Boolean(selected?.lastReviewedAt && selected.lastReviewedAt >= selected.lastFailedAt),
  };
  useEffect(() => {
    if (!initialErrorId && initialTopicSectionIndex === undefined) return;
    const frame = requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ block: 'start' });
      detailRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [initialErrorId, initialTopicSectionIndex]);
  useEffect(() => {
    if (!reviewOpen || !errorId) return;
    const frame = requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
    return () => cancelAnimationFrame(frame);
  }, [reviewOpen, errorId]);
  async function closeTour(outcome: 'completed' | 'skipped') {
    if (tourClosing.current || !onboardingErrorId) return;
    tourClosing.current = true;
    try {
      await finishStudyErrorOnboardingAction(onboardingErrorId, outcome);
    } finally {
      setTourStep(-1);
      tourClosing.current = false;
    }
  }

  function openTopic(id: string, preferredErrorId?: string) {
    const errors =
      id === 'unmatched' ? unmatched : (topics.find((topic) => topic.id === id)?.errors ?? []);
    setReviewOpen(Boolean(preferredErrorId));
    setTopicId(id);
    setErrorId(
      preferredErrorId ??
        errors.find((error) => error.status === 'pending')?.id ??
        errors[0]?.id ??
        null
    );
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      detailRef.current?.focus({ preventScroll: true });
    });
  }

  function closeTopic() {
    setTopicId(null);
    setErrorId(null);
    requestAnimationFrame(() => {
      document.getElementById(`${panelId}-heading`)?.focus();
    });
  }

  const topicDetail = topicId ? (
    <section
      id={`real-topic-detail-${panelId}`}
      ref={detailRef}
      tabIndex={-1}
      aria-labelledby={`real-detail-title-${panelId}`}
      className="bg-card focus-visible:outline-ring min-w-0 w-full py-4 focus-visible:outline-2"
    >
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id={`real-detail-title-${panelId}`} className="text-xl font-semibold break-words">
          {currentTopic?.title ?? 'Otros conceptos'}
        </h2>
        {!reviewOpen ? (
          <button
            type="button"
            onClick={closeTopic}
            className="text-muted-foreground hover:bg-muted min-h-10 rounded-lg px-3 text-xs"
          >
            Volver a los temas
          </button>
        ) : selected?.status !== 'resolved' ? (
          <button
            type="button"
            onClick={() => setReviewOpen(false)}
            className="text-primary min-h-10 rounded-lg px-2 text-xs font-semibold"
          >
            Volver al tema
          </button>
        ) : null}
      </div>
      {!reviewOpen && (
        <div className="mt-5">
          {(lastOutcome || topicPending.length > 0 || hasReinforced) && (
            <section
              className="border-primary/20 bg-primary/5 mb-6 rounded-xl border p-4 sm:p-5 xl:hidden"
              aria-label="Tu próxima actividad"
            >
              <h3 className="text-base font-semibold">Tu próxima actividad</h3>
              {lastOutcome && (
                <p className="text-foreground mt-2 text-sm!">
                  Última tanda: {lastOutcome.total}{' '}
                  {lastOutcome.total === 1 ? 'pregunta' : 'preguntas'} · {lastOutcome.correct}{' '}
                  {lastOutcome.correct === 1 ? 'correcta' : 'correctas'} · {lastOutcome.incorrect}{' '}
                  {lastOutcome.incorrect === 1 ? 'incorrecta' : 'incorrectas'}.
                </p>
              )}
              <p className="text-muted-foreground mt-2 text-sm!">
                {topicPracticeFeedback(lastOutcome, topicPending.length, lastWasReinforced)}
              </p>
              {topicPending.length > 0 && (
                <>
                  <p className="text-muted-foreground mt-2 text-xs!">
                    Pendientes del tema: {topicPending.length}{' '}
                    {topicPending.length === 1 ? 'pregunta' : 'preguntas'} de tus prácticas. Pueden
                    incluir intentos anteriores.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const nextError =
                        topicPending.find((error) =>
                          lastOutcome?.incorrectPrompts.includes(error.prompt)
                        ) ?? topicPending[0];
                      setErrorId(nextError.id);
                      setReviewOpen(true);
                    }}
                    className={actionClass + ' bg-primary text-primary-foreground mt-4'}
                  >
                    Reforzar las dificultades <ArrowRight size={16} />
                  </button>
                </>
              )}
            </section>
          )}
          {!lastOutcome && topicPending.length === 0 && !hasReinforced && (
            <p className="text-muted-foreground text-sm!">
              {currentTopic?.errors.some((error) => error.status === 'pending')
                ? 'Tus respuestas muestran una dificultad para repasar. Podés reforzarla con tu PDF o volver al contenido del tema.'
                : currentTopic && topicAssessmentCount(currentTopic) > 0
                  ? 'Ya practicaste este tema. Podés volver al contenido y seguir comprobando lo aprendido.'
                  : currentQuestionCount === 0
                    ? 'Empezá por el contenido y usá los conceptos y las tarjetas como apoyo.'
                    : 'Empezá por los conceptos principales. Después ponete a prueba con preguntas de tu PDF.'}
            </p>
          )}
          {!lastOutcome && topicPending.length === 0 && !hasReinforced && currentAnswered > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {selected?.status === 'pending' ? (
                <button
                  type="button"
                  onClick={() => setReviewOpen(true)}
                  className={actionClass + ' bg-primary text-primary-foreground'}
                >
                  Reforzar dificultades <ArrowRight size={16} />
                </button>
              ) : summaryBody ? (
                <a
                  href={`#${panelId}-topic-summary`}
                  className={
                    actionClass +
                    (currentTopic && topicAssessmentCount(currentTopic) > 0
                      ? ' border-border border'
                      : ' bg-primary text-primary-foreground')
                  }
                >
                  Estudiar este tema <ArrowRight size={16} />
                </a>
              ) : null}
              {canPracticeTopic ? (
                <button
                  type="button"
                  onClick={() => onPracticeTopic?.(currentSectionIndex)}
                  className={
                    actionClass +
                    (selected?.status === 'pending' ||
                    !currentTopic ||
                    topicAssessmentCount(currentTopic) === 0
                      ? ' border-border border'
                      : ' bg-primary text-primary-foreground')
                  }
                >
                  {currentTopic?.errors.some((error) => error.status === 'resolved')
                    ? 'Volver a comprobar'
                    : currentTopic && topicAssessmentCount(currentTopic) > 0
                      ? 'Comprobar lo aprendido'
                      : 'Practicar este tema'}
                </button>
              ) : onPractice ? (
                <button
                  type="button"
                  onClick={onPractice}
                  className={
                    actionClass +
                    (currentTopic &&
                    topicAssessmentCount(currentTopic) > 0 &&
                    selected?.status !== 'pending'
                      ? ' bg-primary text-primary-foreground'
                      : ' border-border border')
                  }
                >
                  Practicar el PDF
                </button>
              ) : (
                <Link
                  href={simulation ? materialHref : materialHref + '?tab=ejercicios'}
                  className={
                    actionClass +
                    (currentTopic &&
                    topicAssessmentCount(currentTopic) > 0 &&
                    selected?.status !== 'pending'
                      ? ' bg-primary text-primary-foreground'
                      : ' border-border border')
                  }
                >
                  Practicar el PDF
                </Link>
              )}
            </div>
          )}
          {(currentQuestionCount !== 0 ||
            selected?.status === 'pending' ||
            currentAnswered > 0) && (
            <p className="text-muted-foreground mt-2 text-xs!">
              {canPracticeTopic
                ? `${currentQuestionCount} ${currentQuestionCount === 1 ? 'pregunta disponible para este tema. Una respuesta no alcanza para evaluar todo el capítulo.' : 'preguntas disponibles para este tema. El resultado muestra tu desempeño en la tanda.'}`
                : 'La práctica general incluye distintos temas del PDF.'}
            </p>
          )}
          {currentQuestionCount === 0 && (
            <p role="status" className="border-border mt-4 rounded-lg border p-3 text-sm!">
              Podés estudiar este tema. Todavía no hay preguntas asociadas para evaluar su
              comprensión.
            </p>
          )}
          <section
            id={panelId + '-topic-summary'}
            className="border-border mt-6 scroll-mt-4 border-t pt-5"
            aria-label="Contenido de este tema"
          >
            <h3 className="text-base font-semibold">1 · Leé el resumen del tema</h3>
            {summaryBody && focusConcepts.length > 0 && (
              <div
                className="border-border bg-muted/30 mt-4 rounded-xl border p-4"
                aria-label="Guía de lectura del tema"
              >
                <h4 className="text-sm font-semibold">Antes de leer: en qué enfocarte</h4>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  Buscá cómo se explican estos conceptos en tu material. Después, intentá
                  explicarlos con tus palabras y sin mirar.
                </p>
                <ul
                  className="mt-3 flex flex-wrap gap-2"
                  aria-label="Conceptos para orientar la lectura"
                >
                  {focusConcepts.map((concept, index) => (
                    <li
                      key={`${concept.term}-${index}`}
                      className="border-border bg-card rounded-full border px-3 py-1.5 text-xs font-medium break-words"
                    >
                      {concept.term}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {summaryBody ? (
              <div className="mt-5 min-w-0 max-w-[78ch] [&_p]:text-[15px]! [&_p]:leading-7!">
                <StudyRichText body={summaryBody} />
              </div>
            ) : (
              <p className="text-muted-foreground mt-3">
                El contenido de este tema todavía no está disponible.
              </p>
            )}
          </section>
          {(sourcePdfHref ?? simulation?.pdfHref) && (
            <a
              href={sourcePdfHref ?? simulation?.pdfHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4"
            >
              <FileText size={16} /> Consultar el PDF original
            </a>
          )}
          <TopicStudySupport
            key={currentTopic?.id ?? 'unmatched'}
            concepts={resources.concepts}
            flashcards={resources.flashcards}
            pdfHref={sourcePdfHref ?? simulation?.pdfHref}
          />
          {currentTopic && (
            <section
              className="border-border border-t py-5"
              aria-label="Cómo continuar con tu estudio"
            >
              <h3 className="text-base font-semibold">3 · Elegí cómo continuar</h3>
              <p className="text-muted-foreground mt-2 text-sm!">
                {canPracticeTopic
                  ? nextStudyTopic
                    ? 'Podés comprobar lo que entendiste o seguir estudiando el siguiente tema. Vos elegís.'
                    : 'Podés comprobar lo que entendiste o volver a elegir otro tema del PDF.'
                  : nextStudyTopic
                    ? 'Podés seguir estudiando sin hacer una práctica. Este tema todavía no tiene preguntas disponibles.'
                    : 'Podés volver al contenido de cualquier tema. Este tema todavía no tiene preguntas disponibles.'}
              </p>
              <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                {canPracticeTopic && (
                  <button
                    type="button"
                    onClick={() => onPracticeTopic?.(currentSectionIndex)}
                    className={actionClass + ' bg-primary text-primary-foreground'}
                  >
                    Practicar este tema <ArrowRight size={16} />
                  </button>
                )}
                {nextStudyTopic ? (
                  <button
                    type="button"
                    onClick={() => openTopic(nextStudyTopic.id)}
                    className={
                      actionClass +
                      (canPracticeTopic
                        ? ' border-border border'
                        : ' bg-primary text-primary-foreground')
                    }
                  >
                    Seguir con el tema {topics.indexOf(nextStudyTopic) + 1} <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={closeTopic}
                    className={actionClass + ' border-border border'}
                  >
                    Volver a todos los temas
                  </button>
                )}
              </div>
              {canPracticeTopic && (
                <p className="text-muted-foreground mt-2 text-xs!">
                  {currentQuestionCount}{' '}
                  {currentQuestionCount === 1 ? 'pregunta disponible' : 'preguntas disponibles'} de
                  este tema
                </p>
              )}
              {nextStudyTopic ? (
                <p className="text-muted-foreground mt-3 text-sm! break-words">
                  Siguiente: {nextStudyTopic.title}
                </p>
              ) : (
                <p className="text-muted-foreground mt-3 text-sm!">
                  Llegaste al último tema del PDF. Podés volver a cualquiera para estudiar o
                  practicar.
                </p>
              )}
            </section>
          )}
          <details className="border-border border-t py-3 xl:hidden">
            <summary className="focus-visible:outline-ring min-h-11 cursor-pointer py-3 text-sm font-semibold focus-visible:outline-2">
              Tu aprendizaje
            </summary>
            {assessmentData?.loadError && (
              <p role="status" className="text-muted-foreground py-2 text-sm">
                No pudimos cargar todas tus respuestas. Esto no significa que no hayas practicado.
              </p>
            )}
            {currentAnswered > 0 && !assessmentData?.loadError && (
              <p className="text-foreground py-2 text-sm">
                {currentCorrect} de {currentAnswered} respuestas correctas registradas en prácticas
                y refuerzos.
              </p>
            )}
            {currentErrors.length > 0 ? (
              <div className="space-y-3 py-2">
                <p className="text-muted-foreground text-sm">
                  {currentErrors.filter((item) => item.status === 'pending').length} preguntas para
                  repasar · {currentErrors.filter((item) => item.status === 'resolved').length}{' '}
                  refuerzos comprobados.
                </p>
                <p className="text-muted-foreground text-xs">
                  Una comprobación después de una explicación no demuestra por sí sola el dominio de
                  todo el tema.
                </p>
                {currentErrors
                  .filter((item) => item.status === 'pending')
                  .slice(0, 4)
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setErrorId(item.id);
                        setReviewOpen(true);
                      }}
                      className="text-primary focus-visible:outline-ring block min-h-11 w-full py-3 text-left text-sm underline underline-offset-4 focus-visible:outline-2"
                    >
                      {item.prompt}
                    </button>
                  ))}
              </div>
            ) : currentAnswered === 0 && !assessmentData?.loadError ? (
              <p className="text-muted-foreground py-2 text-sm">
                Acá aparecerán tus resultados cuando practiques. Podés empezar por el contenido sin
                tener historial.
              </p>
            ) : null}
          </details>
        </div>
      )}
      {reviewOpen && currentErrors.length > 1 && (
        <details className="my-4">
          <summary className="text-muted-foreground min-h-11 cursor-pointer py-3 text-sm">
            Cambiar pregunta de repaso
          </summary>
          <div className="space-y-2">
            {currentErrors.map((error) => (
              <button
                type="button"
                key={error.id}
                aria-pressed={errorId === error.id}
                onClick={() => setErrorId(error.id)}
                className={actionClass + ' border-border w-full justify-start border text-left'}
              >
                {error.prompt}
              </button>
            ))}
          </div>
        </details>
      )}
      {reviewOpen && selected ? (
        <StudyErrorDetail
          embedded
          topicContext
          key={conversationKey}
          item={selected}
          materials={[{ ...material, materiaNombre: null }]}
          pendingCount={currentErrors.filter((error) => error.status === 'pending').length}
          conversation={conversations[conversationKey] ?? initialConversation}
          reviewActions={reviewActions}
          documentHref={simulation?.pdfHref}
          onConversationChange={(update) =>
            setConversations((current) => ({
              ...current,
              [conversationKey]: update(current[conversationKey] ?? initialConversation),
            }))
          }
          onProgress={(changes) => {
            onErrorProgress?.(selected.id, changes);
            const correct = changes.status === 'resolved' && selected.status !== 'resolved';
            const incorrect =
              changes.failureCount != null && changes.failureCount > selected.failureCount;
            if ((correct || incorrect) && !onErrorProgress) {
              const title =
                topics.find((topic) => topic.errors.some((error) => error.id === selected.id))
                  ?.title ?? selected.topic;
              setEvidence((current) => [
                ...current,
                {
                  topic: title,
                  sectionTitle: title,
                  correct: correct ? 1 : 0,
                  incorrect: incorrect ? 1 : 0,
                  selfReported: 0,
                  lastAnsweredAt:
                    changes.resolvedAt ?? changes.lastFailedAt ?? new Date().toISOString(),
                },
              ]);
            }
            if (!onErrorProgress)
              setViewOverrides((current) => ({
                ...current,
                [selected.id]: { ...current[selected.id], ...changes },
              }));
          }}
          onAssociate={() => {
            window.location.assign(`/dashboard/progreso?material=${material.id}`);
          }}
          onNext={() => {
            const other = currentErrors.find(
              (error) => error.id !== selected.id && error.status === 'pending'
            );
            if (other) {
              const topic = topics.find((item) =>
                item.errors.some((error) => error.id === other.id)
              );
              openTopic(topic?.id ?? 'unmatched', other.id);
            } else {
              setReviewOpen(false);
            }
          }}
          onFinish={() => setReviewOpen(false)}
        />
      ) : null}
    </section>
  ) : null;

  if (data.loadError)
    return (
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-3xl font-semibold">Tu progreso</h1>
        <p role="alert" className="mt-4">
          No pudimos cargar tus errores. Tus resultados siguen guardados.
        </p>
        <a
          href={`/dashboard/progreso?material=${material.id}`}
          className={`${actionClass} bg-primary text-primary-foreground mt-5`}
        >
          Volver a intentar
        </a>
      </div>
    );

  return (
    <div
      className={`${embedded ? 'w-full py-3 sm:py-4' : 'mx-auto w-full max-w-none px-1 py-3 sm:px-3 sm:py-4'} min-w-0 [&_p]:leading-5!`}
    >
      {tourStep >= 0 && selected && (
        <PdfTourSpotlight
          selector={
            tourStep === 0
              ? '[data-study-error-tour="error"]'
              : '[data-study-error-tour="understand"]'
          }
          title={tourStep === 0 ? 'Tu error está en Progreso' : 'Entendé y comprobá el concepto'}
          description={
            tourStep === 0
              ? 'Este tema reúne el concepto que te costó y su refuerzo.'
              : 'Revisá la explicación. Después respondé una pregunta diferente y volvé a tus temas.'
          }
          progress={`${tourStep + 1} de 2`}
          nextLabel={tourStep === 0 ? 'Siguiente' : 'Entendido'}
          onNext={() => (tourStep === 0 ? setTourStep(1) : void closeTour('completed'))}
          onBack={tourStep === 1 ? () => setTourStep(0) : undefined}
          onExit={() => void closeTour('skipped')}
          ariaLabel="Guía de Progreso"
          footerLabel="Tu primer error"
        />
      )}
      {!embedded && !simulation && (
        <PdfMobileNavigation
          hasPendingErrors={pending.length > 0}
          active="progreso"
          onSelect={(section) => {
            if (section !== 'progreso') router.push(`${materialHref}?tab=${section}`);
          }}
        />
      )}
      {embedded && returnToErrors && !simulation ? (
        <Link
          href="/dashboard/explicaciones"
          className="text-muted-foreground hover:text-primary mb-1 inline-flex min-h-10 items-center gap-2 text-sm"
        >
          <ArrowLeft size={16} />
          Volver a Progreso
        </Link>
      ) : null}
      {!embedded && (
        <Link
          href={
            simulation
              ? simulation.pdfHref
              : returnToErrors
                ? '/dashboard/explicaciones'
                : '/dashboard/progreso'
          }
          className="text-muted-foreground hover:text-primary inline-flex min-h-10 items-center gap-2 text-sm"
        >
          <ArrowLeft size={16} />
          {simulation
            ? 'Ver PDF real · 15 páginas'
            : returnToErrors
              ? 'Progreso'
              : 'Mis materiales'}
        </Link>
      )}
      {!embedded && (
        <div className="text-primary mt-2 flex items-center gap-2 text-xs font-medium">
          <FileText size={17} />
          <span className="break-words">{material.title}</span>
        </div>
      )}
      <h2
        id={`${panelId}-heading`}
        tabIndex={-1}
        className={`${embedded ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} mt-2 font-semibold tracking-tight ${reviewOpen ? 'sr-only' : ''}`}
      >
        Tu progreso
      </h2>
      {!reviewOpen && (
        <p className="text-muted-foreground mt-1 text-[13px]!">
          {simulation
            ? 'Elegí qué estudiar y avanzá tema por tema. Resultados de ejemplo.'
            : 'Elegí qué estudiar y avanzá tema por tema.'}
        </p>
      )}
      {summaryUnavailable && (
        <p role="status" className="text-muted-foreground mt-3 text-sm!">
          El resumen todavía no está disponible. Podés repasar las preguntas guardadas.
        </p>
      )}
      {!embedded && (
        <nav
          aria-label="Herramientas del PDF"
          className="border-border my-4 hidden gap-4 overflow-x-auto border-b text-xs sm:gap-6 sm:text-sm md:flex"
        >
          {!simulation &&
            [
              ['Resumen', 'resumen'],
              ['Flashcards', 'tarjetas'],
              ['Práctica', 'ejercicios'],
              ['Mapa', 'mapa'],
            ].map(([label, tab]) => (
              <Link
                key={tab}
                href={`${materialHref}?tab=${tab}`}
                className="text-muted-foreground hover:text-primary shrink-0 pb-4"
              >
                {label}
              </Link>
            ))}
          <span
            aria-current="page"
            className="border-primary text-primary border-b-2 pb-4 font-semibold"
          >
            Progreso
          </span>
        </nav>
      )}
      {assessmentData?.loadError && (
        <p role="alert" className="border-border bg-muted mt-3 rounded-xl border p-3 text-[13px]!">
          No pudimos cargar las respuestas. La cobertura no está disponible; no significa que no
          hayas practicado.
        </p>
      )}
      {data.truncated && (
        <p role="status" className="border-border bg-muted mb-5 rounded-xl border p-4 text-sm">
          Mostramos los últimos 300 registros de este PDF. Los contadores corresponden a esos
          registros y pueden ser parciales.
        </p>
      )}
      {topicId ? (
        <div className="mt-5 grid min-w-0 items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_260px] 2xl:grid-cols-[248px_minmax(0,1fr)_288px] 2xl:gap-7">
          <aside
            className="border-border bg-card hidden min-w-0 rounded-xl border p-3 lg:sticky lg:top-2 lg:block lg:max-h-[calc(100dvh-11rem)] lg:overflow-y-auto"
            aria-label="Navegación entre temas del PDF"
          >
            <div className="border-border mb-3 flex items-center justify-between gap-2 border-b pb-3">
              <h3 className="text-sm font-semibold">Temas del PDF</h3>
              <span className="text-muted-foreground text-xs">{topics.length}</span>
            </div>
            {topics.length >= 8 && (
              <label className="mb-3 block">
                <span className="sr-only">Buscar tema</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar tema"
                  className="border-border bg-background focus-visible:outline-ring min-h-10 w-full rounded-lg border px-3 text-xs"
                />
              </label>
            )}
            <nav aria-label="Índice de temas">
              <ul className="space-y-1">
                {topics
                  .filter((topic) =>
                    topic.title
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .toLowerCase()
                      .includes(
                        search
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .toLowerCase()
                          .trim()
                      )
                  )
                  .map((topic) => {
                    const state = topicStatus(topic);
                    const isActive = topic.id === topicId;
                    return (
                      <li key={topic.id}>
                        <button
                          type="button"
                          aria-current={isActive ? 'page' : undefined}
                          onClick={() => openTopic(topic.id)}
                          className={`focus-visible:outline-ring flex min-h-11 w-full items-start gap-2 rounded-lg px-2.5 py-2.5 text-left transition focus-visible:outline-2 ${isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/70'}`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] leading-5 font-medium break-words">
                              {topic.title}
                            </span>
                            <span className="text-muted-foreground mt-1 block text-[11px]">
                              {state.label}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
              {!topics.some((topic) =>
                topic.title
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .toLowerCase()
                  .includes(
                    search
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .toLowerCase()
                      .trim()
                  )
              ) && (
                <p className="text-muted-foreground px-2 py-3 text-xs">
                  No encontramos temas con ese nombre.
                </p>
              )}
            </nav>
          </aside>
          <div className="min-w-0">{topicDetail}</div>
          <aside
            className="hidden min-w-0 xl:sticky xl:top-2 xl:block xl:max-h-[calc(100dvh-11rem)] xl:overflow-y-auto"
            aria-label="Aprendizaje y próxima actividad del tema"
          >
            <div className="border-border bg-card space-y-4 rounded-xl border p-4">
              <div>
                <h3 className="text-sm font-semibold">{reviewOpen ? 'Refuerzo en curso' : 'Tu aprendizaje'}</h3>
                <p className="text-muted-foreground mt-1 text-xs">
                  {currentTopic?.title ?? 'Conceptos pendientes'}
                </p>
              </div>
              {!reviewOpen && lastOutcome && (
                <div className="border-border border-b pb-4">
                  <p className="text-muted-foreground text-xs">Última práctica</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {lastOutcome.correct}/{lastOutcome.total}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {lastOutcome.incorrect}{' '}
                    {lastOutcome.incorrect === 1 ? 'respuesta incorrecta' : 'respuestas incorrectas'}
                  </p>
                </div>
              )}
              {!reviewOpen && !lastOutcome && currentAnswered > 0 && !assessmentData?.loadError && (
                <div className="border-border border-b pb-4">
                  <p className="text-muted-foreground text-xs">Respuestas registradas</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {currentCorrect}/{currentAnswered}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Acumuladas, no una medición de dominio.
                  </p>
                </div>
              )}
              {!reviewOpen && assessmentData?.loadError && (
                <p role="status" className="text-muted-foreground text-xs">
                  No pudimos cargar tus respuestas. Esto no significa que no hayas practicado.
                </p>
              )}
              {topicPending.length > 0 && (
                <p className="text-sm font-medium">
                  {topicPending.length}{' '}
                  {topicPending.length === 1 ? 'dificultad pendiente' : 'dificultades pendientes'}
                </p>
              )}
              {reviewOpen ? (
                <p className="border-border text-muted-foreground border-t pt-3 text-xs leading-5">
                  Revisá la explicación y comprobá lo aprendido con una pregunta diferente.
                </p>
              ) : (
              <div className="border-border border-t pt-4">
                <h4 className="text-sm font-semibold">Tu próxima actividad</h4>
                <p className="text-muted-foreground mt-2 text-[13px] leading-5">
                  {topicPracticeFeedback(lastOutcome, topicPending.length, lastWasReinforced)}
                </p>
                {topicPending.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const nextError =
                        topicPending.find((error) =>
                          lastOutcome?.incorrectPrompts.includes(error.prompt)
                        ) ?? topicPending[0];
                      setErrorId(nextError.id);
                      setReviewOpen(true);
                    }}
                    className={actionClass + ' bg-primary text-primary-foreground mt-4 w-full'}
                  >
                    Reforzar dificultades <ArrowRight size={16} />
                  </button>
                ) : canPracticeTopic ? (
                  <button
                    type="button"
                    onClick={() => onPracticeTopic?.(currentSectionIndex)}
                    className={actionClass + ' bg-primary text-primary-foreground mt-4 w-full'}
                  >
                    Practicar el tema <ArrowRight size={16} />
                  </button>
                ) : (
                  <p className="text-muted-foreground mt-3 text-xs">
                    Podés continuar leyendo aunque no haya preguntas de este tema.
                  </p>
                )}
              </div>
              )}
              {!reviewOpen && nextStudyTopic && (
                <button
                  type="button"
                  onClick={() => openTopic(nextStudyTopic.id)}
                  className="text-primary focus-visible:outline-ring flex min-h-11 w-full items-center justify-between gap-2 border-t pt-3 text-left text-xs font-semibold focus-visible:outline-2"
                >
                  Siguiente tema <ArrowRight size={15} />
                </button>
              )}
            </div>
          </aside>
        </div>
      ) : (
        <div className="mt-5">
          <div className={
              recommendedTopic
                ? 'grid gap-5 lg:grid-cols-[minmax(270px,0.75fr)_minmax(0,1.25fr)] lg:items-start'
                : 'space-y-4'
            }>
            {recommendedTopic && (
              <section
                className="border-primary/20 bg-primary/5 rounded-2xl border p-5 sm:p-6 lg:sticky lg:top-2"
                aria-label="Actividad recomendada"
              >
                <p className="text-primary text-xs font-semibold">
                  {next
                    ? 'Para seguir avanzando'
                    : evaluated === 0
                      ? 'Empezá por este tema'
                      : 'Tu próxima actividad'}
                </p>
                <h2 className="mt-2 text-lg font-semibold break-words">{recommendedTopic.title}</h2>
                <p className="text-muted-foreground mt-2 text-sm!">
                  {next
                    ? 'Retomá una dificultad con tu material y comprobá lo aprendido.'
                    : 'Conocé los conceptos principales y después comprobá cuánto entendiste.'}
                </p>
                <button
                  type="button"
                  onClick={() => openTopic(recommendedTopic.id)}
                  className={actionClass + ' bg-primary text-primary-foreground mt-4'}
                >
                  {next ? 'Continuar estudiando' : 'Comenzar a estudiar'} <ArrowRight size={16} />
                </button>
              </section>
            )}
            <section
              className="border-border bg-card overflow-hidden rounded-2xl border"
              aria-labelledby={`real-topics-title-${panelId}`}
            >
              <div className="p-4 pb-2">
                <h2 id={`real-topics-title-${panelId}`} className="text-base font-semibold">
                  Contenido de tu PDF
                </h2>
                {topics.length >= 8 && (
                  <label className="mt-4 block text-sm">
                    <span className="text-muted-foreground">Buscar tema</span>
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Nombre del tema o capítulo"
                      className="border-border bg-background focus-visible:outline-ring mt-2 min-h-11 w-full rounded-lg border px-3"
                    />
                  </label>
                )}
                <div className="mt-3 flex flex-wrap gap-2" aria-label="Filtrar temas">
                  {['Todos', 'Por reforzar', 'Sin evaluar'].map((label) => (
                    <button
                      type="button"
                      key={label}
                      aria-pressed={filter === label}
                      disabled={label === 'Sin evaluar' && assessmentData?.loadError}
                      onClick={() => {
                        setFilter(label);
                        setTopicId(null);
                        setErrorId(null);
                      }}
                      className={`focus-visible:outline-ring min-h-10 rounded-full px-4 text-xs font-medium focus-visible:outline-2 ${filter === label ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <ul className="divide-border divide-y">
                {visibleTopics.map((topic) => {
                  const questionIndex = topics.findIndex((item) => item.id === topic.id);
                  const unavailable =
                    questionCounts?.[questionIndex] === 0 &&
                    topicAssessmentCount(topic) === 0 &&
                    !topic.errors.length;
                  const status = topicStatus(topic);
                  const { Icon, style } = status;
                  const label = unavailable
                    ? 'Sin evaluar'
                    : assessmentData?.loadError && !topic.errors.length
                      ? 'Evaluación no disponible'
                      : status.label;
                  const pendingCount = topic.errors.filter(
                    (error) => error.status === 'pending'
                  ).length;
                  const correctCount = topic.evidence.reduce(
                    (total, item) => total + item.correct,
                    0
                  );
                  const incorrectCount = topic.evidence.reduce(
                    (total, item) => total + item.incorrect,
                    0
                  );
                  const selfReportedCount = topic.evidence.reduce(
                    (total, item) => total + item.selfReported,
                    0
                  );
                  return (
                    <li key={topic.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (topicId === topic.id) {
                            setTopicId(null);
                            setErrorId(null);
                          } else openTopic(topic.id);
                        }}
                        aria-expanded={topicId === topic.id}
                        aria-controls={`${panelId}-topic-detail-${topic.id}`}
                        className={`hover:bg-muted/50 focus-visible:outline-ring flex w-full items-center gap-2.5 px-4 py-2.5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 ${topicId === topic.id ? 'bg-primary/5' : ''}`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style}`}
                        >
                          <Icon size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium break-words">
                            {topic.title}
                          </span>
                          <span className="text-muted-foreground mt-0.5 block text-xs">
                            {assessmentData?.loadError
                              ? 'Evaluación no disponible'
                              : unavailable
                                ? 'Aún no hay preguntas para este tema'
                                : topicAssessmentCount(topic) > 0
                                  ? `${correctCount} de ${correctCount + incorrectCount} ${correctCount + incorrectCount === 1 ? 'respuesta correcta' : 'respuestas correctas'}`
                                  : selfReportedCount > 0
                                    ? `${selfReportedCount} autoevaluaciones · falta comprobar con una pregunta`
                                    : pendingCount
                                      ? `${pendingCount} ${pendingCount === 1 ? 'pregunta para repasar' : 'preguntas para repasar'}`
                                      : topic.errors.length
                                        ? `${topic.errors.length} ${topic.errors.length === 1 ? 'error resuelto' : 'errores resueltos'}`
                                        : 'Todavía sin preguntas corregidas'}
                          </span>
                          <span
                            className={`mt-2 inline-block rounded-full px-2 py-1 text-[11px] sm:hidden ${style}`}
                          >
                            {label}
                          </span>
                        </span>
                        <span
                          className={`hidden shrink-0 rounded-full px-2 py-1 text-[11px] font-medium sm:block ${style}`}
                        >
                          {label}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-muted-foreground shrink-0 transition-transform ${topicId === topic.id ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <div id={`${panelId}-topic-detail-${topic.id}`} hidden={topicId !== topic.id}>
                        {topicId === topic.id ? topicDetail : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {!visibleTopics.length && (
                <p className="text-muted-foreground px-6 pb-6 text-sm">
                  {topics.length
                    ? 'No hay temas en este filtro.'
                    : 'Todavía no hay temas disponibles para mostrar.'}
                </p>
              )}
            </section>
            {unmatched.length > 0 && (
              <section className="border-border bg-card rounded-3xl border p-6 lg:col-span-2">
                <h2 className="font-semibold">Otros conceptos con errores</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  {unmatched.length} registros de este PDF no tienen una coincidencia única con los
                  temas del resumen. No los sumamos al indicador por tema.
                </p>
                <button
                  type="button"
                  onClick={() => openTopic('unmatched')}
                  className={`${actionClass} border-border text-foreground mt-4 border`}
                >
                  Ver estos conceptos
                  <ArrowRight size={16} />
                </button>
                {topicId === 'unmatched' ? topicDetail : null}
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
