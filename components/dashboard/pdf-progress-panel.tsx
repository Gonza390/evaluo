'use client';

import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { studyUiText } from '@/lib/i18n/study-ui-copy';


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
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring';

function topicStatus(topic: PdfProgressTopic, english = false) {
  const tr = (es:string,en:string) => english ? en : es;
  if (topic.errors.some((error) => error.status === 'pending'))
    return { label: tr("Por reforzar","Needs review"), Icon: Flag, style: 'bg-destructive/10 text-destructive' };
  if (topic.errors.some((error) => error.status === 'resolved'))
    return {
      label: topic.evidence.some((item) => item.correct > 0)
        ? 'Repaso comprobado'
        : tr("Repasado","Reviewed"),
      Icon: CheckCircle2,
      style: 'bg-primary/10 text-primary',
    };
  if (topicAssessmentCount(topic) > 0)
    return { label: tr("Con preguntas","With questions"), Icon: CheckCircle2, style: 'bg-primary/10 text-primary' };
  if (topic.evidence.some((item) => item.selfReported > 0))
    return { label: tr("Autoevaluado","Self-assessed"), Icon: Circle, style: 'bg-muted text-muted-foreground' };
  return {
    label: tr("Sin evaluar","Not assessed"),
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
  showOnboardingExample = false,
  showOnboardingTopic = false,
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
  returnToErrors?: boolean;
  embedded?: boolean;
  showOnboardingExample?: boolean;
  showOnboardingTopic?: boolean;
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
  const locale = useOptionalAppLocale();
  const english = locale === 'en';
  const tr = (es:string,en:string) => english ? en : es;
  const t = (v: string) => studyUiText(locale, v);
  const panelId = useId();
  const [viewOverrides, setViewOverrides] = useState<Record<string, Partial<StudyErrorView>>>({});
  const views = [...data.pending, ...data.resolved].map((item) => ({
    ...item,
    ...viewOverrides[item.id],
  }));
  const [search, setSearch] = useState('');
  const initialTopic = buildPdfProgress(sections, [...data.pending, ...data.resolved]).topics.find(
    (topic) => topic.id === `section-${initialTopicSectionIndex}`
  );
  const initialTopicError = initialReinforce
    ? (initialTopic?.errors.find(
        (error) =>
          error.status === 'pending' &&
          lastPracticeOutcome?.incorrectPrompts.includes(error.prompt)
      ) ?? initialTopic?.errors.find((error) => error.status === 'pending'))
    : undefined;
  const [reviewOpen, setReviewOpen] = useState(Boolean(initialErrorId || initialTopicError));
  const initialError = [...data.pending, ...data.resolved].find(
    (item) => item.id === initialErrorId
  );
  const [selectedTopicId, setTopicId] = useState<string | null>(() =>
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
  const [conversations, setConversations] = useState<Record<string, StudyErrorConversation>>({});
  const detailRef = useRef<HTMLElement>(null);
  const [evidence, setEvidence] = useState<PdfTopicEvidence[]>([]);
  const { topics, unmatched, unmatchedEvidence, evaluated } = buildPdfProgress(sections, views, [
    ...(assessmentData?.items ?? []),
    ...evidence,
  ]);
  // El tutorial presenta la vista real de un capítulo y luego la lista general.
  // Nunca modifica evidencias, errores ni selecciones guardadas por el estudiante.
  const topicId = showOnboardingTopic
    ? topics[0]?.id ?? null
    : showOnboardingExample
      ? null
      : selectedTopicId;
  const pending = views.filter((error) => error.status === 'pending');
  const next = pending[0];
  const recommendedTopic =
    topics.find((topic) => topic.errors.some((error) => error.id === next?.id)) ??
    topics.find((topic) => topicAssessmentCount(topic) === 0) ??
    topics[0];
  const recommendedNeedsReview = Boolean(recommendedTopic?.errors.some((error) => error.status === 'pending'));
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
  // Coverage is based on actual study events, not a prediction of topic mastery.
  const topicStates = topics.map((topic) => {
    if (topic.errors.some((error) => error.status === 'pending')) return 'review' as const;
    if (topicAssessmentCount(topic) > 0) return 'assessed' as const;
    if (topic.evidence.some((item) => item.selfReported > 0)) return 'self' as const;
    if (topic.errors.some((error) => error.status === 'resolved')) return 'reviewed' as const;
    return 'none' as const;
  });
  const touchedTopics = topicStates.filter((state) => state !== 'none').length;
  const assessedTopics = topics.filter((topic) => topicAssessmentCount(topic) > 0).length;
  const visibleTopics = topics.filter((topic) =>
    topic.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(
      search.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    )
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
      data-onboarding-topic-detail
      tabIndex={-1}
      aria-labelledby={`real-detail-title-${panelId}`}
      className="bg-card focus-visible:outline-ring min-w-0 w-full py-4 focus-visible:outline-2"
    >
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id={`real-detail-title-${panelId}`} className="text-[16px] leading-[1.4] font-semibold break-words">
          {currentTopic?.title ?? tr("Otros conceptos","Other concepts")}
        </h2>
        {!reviewOpen ? (
          <button
            type="button"
            onClick={closeTopic}
            className="text-muted-foreground hover:bg-muted min-h-10 rounded-lg px-3 text-xs"
          >
            {tr("Volver a los temas","Back to topics")}
          </button>
        ) : null}
      </div>
      {!reviewOpen && (
        <div className="mt-5">
          {(lastOutcome || topicPending.length > 0 || hasReinforced) && (
            <section
              className="border-primary/20 bg-primary/5 mb-6 rounded-xl border p-4 sm:p-5 xl:hidden"
              aria-label={tr("Tu próxima actividad","Your next activity")}
            >
              <h3 className="text-[16px] font-medium">{t("Tu próxima actividad")}</h3>
              {lastOutcome && (
                <p className="text-foreground mt-2 text-sm!">
                  {tr('Última tanda:','Latest session:')} {lastOutcome.total}{' '}
                  {lastOutcome.total === 1 ? tr('pregunta','question') : tr('preguntas','questions')} · {lastOutcome.correct}{' '}
                  {lastOutcome.correct === 1 ? tr('correcta','correct') : tr('correctas','correct')} · {lastOutcome.incorrect}{' '}
                  {lastOutcome.incorrect === 1 ? tr('incorrecta','incorrect') : tr('incorrectas','incorrect')}.
                </p>
              )}
              <p className="text-muted-foreground mt-2 text-sm!">
                {topicPracticeFeedback(lastOutcome, topicPending.length, lastWasReinforced, locale)}
              </p>
              {topicPending.length > 0 && (
                <>
                  <p className="text-muted-foreground mt-2 text-xs!">
                    {tr('Pendientes del tema:','Pending in this topic:')} {topicPending.length}{' '}
                    {topicPending.length === 1 ? tr('pregunta','question') : tr('preguntas','questions')}{' '}
                    {tr('de tus prácticas. Pueden incluir intentos anteriores.','from your practice sessions, including previous attempts.')}
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
                    {tr("Reforzar las dificultades","Review difficult questions")} <ArrowRight size={16} />
                  </button>
                </>
              )}
            </section>
          )}
          {!lastOutcome && topicPending.length === 0 && !hasReinforced && (
            <p className="text-muted-foreground text-sm!">
              {currentTopic?.errors.some((error) => error.status === 'pending')
                ? tr("Tus respuestas muestran una dificultad para repasar. Podés reforzarla con tu PDF o volver al contenido del tema.","Your answers show something to review. Use your PDF to reinforce it or return to the topic.")
                : currentTopic && topicAssessmentCount(currentTopic) > 0
                  ? tr("Ya practicaste este tema. Podés volver al contenido y seguir comprobando lo aprendido.","You have practiced this topic. Return to the content or check your understanding again.")
                  : currentQuestionCount === 0
                    ? tr("Empezá por el contenido y usá los conceptos y las tarjetas como apoyo.","Start with the content and use concepts and cards as study aids.")
                    : tr("Empezá por los conceptos principales. Después ponete a prueba con preguntas de tu PDF.","Start with the key concepts. Then test yourself with questions from your PDF.")}
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
                  {tr("Reforzar dificultades","Review difficulties")} <ArrowRight size={16} />
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
                  {tr('Estudiar este tema','Study this topic')} <ArrowRight size={16} />
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
                  {tr("Practicar el PDF","Practice the PDF")}
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
                  {tr("Practicar el PDF","Practice the PDF")}
                </Link>
              )}
            </div>
          )}
          {currentQuestionCount === 0 && (
            <p role="status" className="border-border mt-4 rounded-lg border p-3 text-sm!">
              {tr('Podés estudiar este tema. Todavía no hay preguntas asociadas para evaluar su comprensión.','You can study this topic. There are no linked questions yet to check your understanding.')}
            </p>
          )}
          <section
            id={panelId + '-topic-summary'}
            className="border-border mt-6 scroll-mt-4 border-t pt-5"
            aria-label={tr("Contenido de este tema","Topic content")}
          >
            <h3 className="text-[16px] font-medium">{t("1 · Leé el resumen del tema")}</h3>
            {summaryBody && focusConcepts.length > 0 && (
              <div
                className="border-border bg-muted/30 mt-4 rounded-xl border p-4"
                aria-label={tr("Guía de lectura del tema","Topic reading guide")}
              >
                <h4 className="text-sm font-medium">{t("Antes de leer: en qué enfocarte")}</h4>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {tr('Buscá cómo se explican estos conceptos en tu material. Después, intentá explicarlos con tus palabras y sin mirar.','Find how these concepts are explained in your material. Then try to explain them in your own words without looking.')}
                </p>
                <ul
                  className="mt-3 flex flex-wrap gap-2"
                  aria-label={tr("Conceptos para orientar la lectura","Concepts to guide your reading")}
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
              <div className="mt-5 min-w-0 max-w-[78ch] [&_p]:text-[14px]! sm:[&_p]:text-[13px]! [&_p]:leading-5!">
                <StudyRichText body={summaryBody} />
              </div>
            ) : (
              <p className="text-muted-foreground mt-3">
                {tr("El contenido de este tema todavía no está disponible.","The content for this topic is not available yet.")}
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
              <FileText size={16} /> {tr("Consultar el PDF original","View original PDF")}
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
              aria-label={tr("Cómo continuar con tu estudio","How to continue studying")}
            >
              <h3 className="text-[16px] font-medium">{t("3 · Tu próximo paso")}</h3>
              <p className="text-muted-foreground mt-2 text-sm!">
                {topicPending.length > 0
                  ? tr("Primero repasá tus respuestas incorrectas. Después podrás volver a practicar.","Review incorrect answers first. Then you can practice again.")
                  : currentAnswered > 0 && nextStudyTopic
                    ? tr("Ya practicaste este tema: seguí con el siguiente o elegí practicar de nuevo.","You have practiced this topic: move to the next one or practice again.")
                    : canPracticeTopic
                      ? tr("Comprobá lo que entendiste con preguntas de este tema.","Check what you learned with questions from this topic.")
                      : nextStudyTopic
                        ? tr("Podés continuar con el siguiente tema, aunque este todavía no tenga preguntas.","You can move to the next topic even though it does not have questions yet.")
                        : tr("Volvé a la lista de temas para seguir estudiando.","Return to the topic list to continue studying.")}
              </p>
              <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                {topicPending.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const error =
                        topicPending.find((item) =>
                          lastOutcome?.incorrectPrompts.includes(item.prompt)
                        ) ?? topicPending[0];
                      setErrorId(error.id);
                      setReviewOpen(true);
                    }}
                    className={actionClass + ' bg-primary text-primary-foreground xl:hidden'}
                  >
                    {tr('Entender mis errores','Understand my mistakes')} <ArrowRight size={16} />
                  </button>
                )}
                {topicPending.length === 0 && nextStudyTopic && currentAnswered > 0 && (
                  <button
                    type="button"
                    onClick={() => openTopic(nextStudyTopic.id)}
                    className={actionClass + ' bg-primary text-primary-foreground xl:hidden'}
                  >
                    {tr('Seguir con el tema','Continue with topic')} {topics.indexOf(nextStudyTopic) + 1}
                    <ArrowRight size={16} />
                  </button>
                )}
                {topicPending.length === 0 && canPracticeTopic && (
                  <button
                    type="button"
                    onClick={() => onPracticeTopic?.(currentSectionIndex)}
                    className={
                      actionClass +
                      (nextStudyTopic && currentAnswered > 0
                        ? ' border-border border'
                        : ' bg-primary text-primary-foreground') +
                      ' xl:hidden'
                    }
                  >
                    {currentAnswered > 0 ? tr("Practicar de nuevo","Practice again") : 'Practicar este tema'}
                    <ArrowRight size={16} />
                  </button>
                )}
                {topicPending.length === 0 &&
                  nextStudyTopic &&
                  currentAnswered === 0 && (
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
                      {tr('Seguir con el tema','Continue with topic')} {topics.indexOf(nextStudyTopic) + 1}
                      <ArrowRight size={16} />
                    </button>
                  )}
              </div>
              {nextStudyTopic ? (
                <p className="text-muted-foreground mt-3 text-sm! break-words">
                  {tr('Siguiente:','Next:')} {nextStudyTopic.title}
                </p>
              ) : (
                <p className="text-muted-foreground mt-3 text-sm!">
                  {tr('Llegaste al último tema del PDF. Podés volver a cualquiera para estudiar o practicar.','You have reached the final topic. You can revisit any topic to study or practice.')}
                </p>
              )}
            </section>
          )}
          <details className="border-border border-t py-3 xl:hidden">
            <summary className="focus-visible:outline-ring min-h-11 cursor-pointer py-3 text-sm font-semibold focus-visible:outline-2">
              {tr("Tu aprendizaje","Your learning")}
            </summary>
            {assessmentData?.loadError && (
              <p role="status" className="text-muted-foreground py-2 text-sm">
                {tr("No pudimos cargar todas tus respuestas. Esto no significa que no hayas practicado.","We could not load all your answers. Your practice sessions have not been deleted.")}
              </p>
            )}
            {currentAnswered > 0 && !assessmentData?.loadError && (
              <p className="text-foreground py-2 text-sm">
                {currentCorrect} {tr('de','of')} {currentAnswered} {tr('respuestas correctas registradas en prácticas y refuerzos.','correct answers recorded in practice and review.')}
              </p>
            )}
            {currentErrors.length > 0 ? (
              <div className="space-y-3 py-2">
                <p className="text-muted-foreground text-sm">
                  {currentErrors.filter((item) => item.status === 'pending').length} {tr('preguntas para repasar','questions to review')} · {currentErrors.filter((item) => item.status === 'resolved').length}{' '}
                  {tr('refuerzos comprobados.','confirmed reviews.')}
                </p>
                <p className="text-muted-foreground text-xs">
                  {tr('Una comprobación después de una explicación no demuestra por sí sola el dominio de todo el tema.','One correct answer after an explanation does not demonstrate mastery of the topic.')}
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
                {tr('Acá aparecerán tus resultados cuando practiques. Podés empezar por el contenido sin tener historial.','Your results will appear here once you practice. You can start with the content without previous sessions.')}
              </p>
            ) : null}
          </details>
        </div>
      )}
      {reviewOpen && selected ? (
        <StudyErrorDetail
          embedded
          topicContext
          key={conversationKey}
          item={selected}
          glossary={glossary}
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
        <h1 className="text-[20px] font-semibold tracking-[-0.035em] sm:text-[22px] lg:text-[24px]">{t("Tu progreso")}</h1>
        <p role="alert" className="mt-4">
          {tr("No pudimos cargar tus errores. Tus resultados siguen guardados.","We could not load your mistakes. Your results are still saved.")}
        </p>
        <a
          href={`/dashboard/progreso?material=${material.id}`}
          className={`${actionClass} bg-primary text-primary-foreground mt-5`}
        >
          {tr("Volver a intentar","Try again")}
        </a>
      </div>
    );

  return (
    <div
      className={`${embedded ? 'mx-auto w-full max-w-[1000px] py-2 sm:py-3' : 'mx-auto w-full max-w-[1000px] px-1 py-2 sm:px-3 sm:py-3'} min-w-0 [&_p]:leading-5!`}
    >
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
          {tr("Volver a Progreso","Back to Progress")}
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
            ? tr("Ver PDF real · 15 páginas","View real PDF · 15 pages")
            : returnToErrors
              ? tr("Progreso","Progress")
              : tr("Mis materiales","My materials")}
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
        className={`${embedded ? 'text-[19px] sm:text-[20px]' : 'text-[20px] sm:text-[22px]'} mt-2 font-semibold tracking-[-0.035em] ${reviewOpen ? 'sr-only' : ''}`}
      >
        {t("Tu progreso")}
      </h2>
      {!reviewOpen && (
        <p className="text-muted-foreground mt-1 text-[13px]!">
          {simulation
            ? tr("Elegí qué estudiar y avanzá tema por tema. Resultados de ejemplo.","Choose what to study and progress topic by topic. Sample results.")
            : tr("Elegí qué estudiar y avanzá tema por tema.","Choose what to study and progress topic by topic.")}
        </p>
      )}
      {summaryUnavailable && (
        <p role="status" className="text-muted-foreground mt-3 text-sm!">
          {tr("El resumen todavía no está disponible. Podés repasar las preguntas guardadas.","The summary is not available yet. You can review saved questions.")}
        </p>
      )}
      {!embedded && (
        <nav
          aria-label={tr("Herramientas del PDF","PDF tools")}
          className="border-border my-4 hidden gap-4 overflow-x-auto border-b text-xs sm:gap-6 sm:text-sm md:flex"
        >
          {!simulation &&
            [
              [tr("Resumen","Summary"), 'resumen'],
              ['Flashcards', 'tarjetas'],
              [tr("Práctica","Practice"), 'ejercicios'],
              [tr("Mapa","Mind map"), 'mapa'],
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
            className="border-primary text-primary border-b-2 pb-4 font-medium"
          >
            {t("Progreso")}
          </span>
        </nav>
      )}
      {assessmentData?.loadError && (
        <p role="alert" className="border-border bg-muted mt-3 rounded-xl border p-3 text-[13px]!">
          {tr('No pudimos cargar las respuestas. La cobertura no está disponible; no significa que no hayas practicado.','We could not load your answers. Coverage information is unavailable, but your practice history is saved.')}
        </p>
      )}
      {data.truncated && (
        <p role="status" className="border-border bg-muted mb-5 rounded-xl border p-4 text-sm">
          {tr('Mostramos los últimos 300 registros de este PDF. Los contadores corresponden a esos registros y pueden ser parciales.','We show the most recent 300 records for this PDF. Counts may be partial.')}
        </p>
      )}
      {topicId ? (
        <div
          data-reinforcement-focus={reviewOpen ? 'true' : undefined}
          className={
            reviewOpen
              ? 'mx-auto mt-5 w-full max-w-[980px] min-w-0'
              : 'mt-5 grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_260px] 2xl:grid-cols-[minmax(0,1fr)_288px] 2xl:gap-7'
          }
        >
          <div className="min-w-0">{topicDetail}</div>
          {!reviewOpen && (
            <aside
              className="hidden min-w-0 xl:sticky xl:top-2 xl:block xl:max-h-[calc(100dvh-11rem)] xl:overflow-y-auto"
              aria-label={tr("Aprendizaje y próxima actividad del tema","Learning and next topic activity")}
            >
              <div className="border-border bg-card space-y-3 rounded-xl border p-3.5">
                <div>
                  <h3 className="text-[13px] font-medium">{reviewOpen ? tr("Refuerzo en curso","Review in progress") : tr("Tu aprendizaje","Your learning")}</h3>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {currentTopic?.title ?? tr("Conceptos pendientes","Pending concepts")}
                  </p>
                </div>
                {!reviewOpen && lastOutcome && (
                  <div className="border-border border-b pb-3">
                    <p className="text-muted-foreground text-xs">{t("Última práctica")}</p>
                    <p className="mt-1 text-[20px] font-semibold tabular-nums">
                      {lastOutcome.correct}/{lastOutcome.total}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {lastOutcome.incorrect}{' '}
                      {lastOutcome.incorrect === 1 ? tr('respuesta incorrecta','incorrect answer') : tr('respuestas incorrectas','incorrect answers')}
                    </p>
                  </div>
                )}
                {!reviewOpen && !lastOutcome && currentAnswered > 0 && !assessmentData?.loadError && (
                  <div className="border-border border-b pb-3">
                    <p className="text-muted-foreground text-xs">{t("Respuestas registradas")}</p>
                    <p className="mt-1 text-[20px] font-semibold tabular-nums">
                      {currentCorrect}/{currentAnswered}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {tr("Acumuladas, no una medición de dominio.","Cumulative totals, not a mastery measure.")}
                    </p>
                  </div>
                )}
                {!reviewOpen && assessmentData?.loadError && (
                  <p role="status" className="text-muted-foreground text-xs">
                    {tr("No pudimos cargar tus respuestas. Esto no significa que no hayas practicado.","We could not load your answers. Your practice history is still saved.")}
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
                    {tr("Revisá la explicación y comprobá lo aprendido con una pregunta diferente.","Review the explanation, then test yourself with a different question.")}
                  </p>
                ) : (
                <div className="border-border border-t pt-3">
                  <h4 className="text-[13px] font-medium">{t("Tu próxima actividad")}</h4>
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
                      {tr("Reforzar dificultades","Review difficulties")} <ArrowRight size={16} />
                    </button>
                  ) : nextStudyTopic && currentAnswered > 0 ? (
                    <button
                      type="button"
                      onClick={() => openTopic(nextStudyTopic.id)}
                      className={actionClass + ' bg-primary text-primary-foreground mt-4 w-full'}
                    >
                      {tr("Seguir con el siguiente tema","Continue with next topic")} <ArrowRight size={16} />
                    </button>
                  ) : canPracticeTopic ? (
                    <button
                      type="button"
                      onClick={() => onPracticeTopic?.(currentSectionIndex)}
                      className={actionClass + ' bg-primary text-primary-foreground mt-4 w-full'}
                    >
                      {t("Practicar este tema")} <ArrowRight size={16} />
                    </button>
                  ) : (
                    <p className="text-muted-foreground mt-3 text-xs">
                      {tr("Podés continuar leyendo aunque no haya preguntas de este tema.","You can keep reading even if there are no questions for this topic.")}
                    </p>
                  )}
                </div>
                )}
              </div>
            </aside>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {!showOnboardingExample && (
            <div data-progress-overview className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
              <section aria-label={tr("Resumen de tu progreso","Your progress summary")} className="flex min-w-0 flex-col items-start gap-4 rounded-2xl border border-[#E7EBF4] bg-white p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
                <svg className="size-[82px] shrink-0 sm:size-[90px]" viewBox="0 0 100 100" role="img"
                  aria-label={touchedTopics + ' de ' + topics.length + ' temas con actividad registrada'}>
                  <circle cx="50" cy="50" r="40" stroke="#E7EBF4" strokeWidth="9" fill="none" />
                  <circle cx="50" cy="50" r="40" stroke="#456DBD" strokeWidth="9" strokeLinecap="round" fill="none"
                    strokeDasharray={String(topics.length ? Math.round((touchedTopics / topics.length) * 251.3) : 0) + ' 251.3'}
                    transform="rotate(-90 50 50)" />
                  <text x="50" y="56" fontSize="20" fontWeight="700" textAnchor="middle" fill="#0F1B3D">
                    {touchedTopics}/{topics.length}
                  </text>
                </svg>
                <div className="w-full min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-[#66758D]">{t("Temas con actividad")}</p>
                  <p className="mt-1 text-[13px] font-semibold text-[#0F1B3D] sm:text-[14px]">
                    {assessmentData?.loadError
                      ? tr("Comprobación con preguntas no disponible","Question-based assessment unavailable")
                      : assessedTopics + ' de ' + topics.length + ' comprobados con preguntas'}
                  </p>
                  {topics.length > 0 && (
                    <div className="mt-3 flex gap-1" role="img" aria-label={tr("Estado de actividad de cada tema","Activity state for each topic")}>
                      {topicStates.map((state, index) => (
                        <span key={topics[index].id} title={topics[index].title}
                          className={'h-1.5 min-w-0 flex-1 rounded-full ' +
                            (state === 'review' ? 'bg-[#BA5649]' : state === 'assessed' ? 'bg-[#456DBD]' :
                              state === 'self' ? 'bg-[#A6C5FA]' : state === 'reviewed' ? 'bg-[#8CCBA9]' : 'bg-[#E7EBF4]')} />
                      ))}
                    </div>
                  )}
                  <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] font-medium text-[#66758D] sm:text-[11px]">
                    {[
                      { label: tr("Con preguntas","With questions"), color: 'bg-[#456DBD]' },
                      { label: tr("Autoevaluado","Self-assessed"), color: 'bg-[#A6C5FA]' },
                      { label: tr("Repasado","Reviewed"), color: 'bg-[#8CCBA9]' },
                      { label: tr("Por reforzar","Needs review"), color: 'bg-[#BA5649]' },
                      { label: tr("Sin evaluar","Not assessed"), color: 'bg-[#E7EBF4]' },
                    ].map((item) => (
                      <span key={item.label} className="inline-flex items-center gap-1.5">
                        <span className={'size-2 rounded-full ' + item.color} />{item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
              {recommendedTopic && (
                <section aria-label={tr("Actividad recomendada","Recommended activity")} className="rounded-2xl border border-[#D9E6FF] bg-[#F4F8FF] p-4 sm:p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#456DBD]">
                    {recommendedNeedsReview ? tr("Para seguir avanzando","To keep making progress") : evaluated === 0 ? tr("Empezá por este tema","Start with this topic") : tr("Tu próxima actividad","Your next activity")}
                  </p>
                  <h2 className="mt-2 break-words text-[15px] font-semibold leading-[1.4] text-[#0F1B3D] sm:text-[16px]">
                    {recommendedTopic.title}
                  </h2>
                  <p className="mt-2 text-[12px] leading-[1.6] text-[#42506A]">
                    {recommendedNeedsReview
                      ? tr("Retomá la dificultad que registraste y comprobá lo aprendido.","Return to your saved difficulty and check what you learned.")
                      : tr("Leé el tema y comprobá lo aprendido con una práctica.","Read the topic and check your understanding with practice.")}
                  </p>
                  <button type="button" onClick={() => openTopic(recommendedTopic.id)}
                    className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#456DBD] px-4 text-[12px] font-semibold text-white transition-colors hover:bg-[#3A5CA8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#456DBD]">
                    {recommendedNeedsReview ? tr("Continuar estudiando","Continue studying") : tr("Comenzar a estudiar","Start studying")} <ArrowRight className="size-4" aria-hidden="true" />
                  </button>
                </section>
              )}
            </div>
          )}
          <div className="space-y-3">
            <section
              data-recommended-topics
              className="overflow-hidden rounded-2xl border border-[#E7EBF4] bg-white"
              aria-labelledby={String(panelId) + '-topics-heading'}
            >
              <div className="px-4 pb-3 pt-4 sm:px-5">
                <h2 id={String(panelId) + '-topics-heading'} className="text-[15px] font-semibold text-[#0F1B3D] sm:text-[16px]">
                  {showOnboardingExample ? tr("Así vas a ver tu progreso","How your progress will look") : tr("Contenido de tu PDF","Your PDF content")}
                </h2>
                {showOnboardingExample && (
                  <p data-tour-progress-disclaimer role="status" className="mt-2 rounded-lg bg-[#EEF2FF] px-3 py-2 text-[12px] leading-5 text-[#254C98]">
                    {tr("Los estados de los tres temas siguientes son ejemplos ilustrativos, no resultados reales.","The statuses of the three topics below are examples, not real study results.")}
                  </p>
                )}
                {!showOnboardingExample && topics.length >= 8 && (
                  <label className="mt-3 block max-w-[420px] text-[12px] text-[#42506A]">
                    <span>{t("Buscar tema")}</span>
                    <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
                      placeholder={tr("Nombre del tema o capítulo","Topic or chapter name")}
                      className="mt-1.5 min-h-10 w-full rounded-lg border border-[#E7EBF4] bg-white px-3 text-[12px] text-[#0F1B3D] outline-none focus-visible:border-[#456DBD] focus-visible:ring-1 focus-visible:ring-[#456DBD]" />
                  </label>
                )}
              </div>
              <ul className="divide-y divide-[#EEF1F6]">
                {showOnboardingExample && topics.slice(0, 3).map((topic, index) => {
                  const mastered = index === 0;
                  const needsReview = index === 1;
                  const stateStyle = mastered
                    ? 'bg-emerald-100 text-emerald-800'
                    : needsReview
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-slate-100 text-slate-700';
                  return (
                    <li key={topic.id} data-tour-example-topic className="flex min-w-0 items-center gap-3 px-4 py-3">
                      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${stateStyle}`}>
                        {mastered
                          ? <CheckCircle2 size={17} aria-hidden="true" />
                          : needsReview
                            ? <Flag size={17} aria-hidden="true" />
                            : <Circle size={17} aria-hidden="true" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-foreground block text-[13px] font-medium break-words">{topic.title}</span>
                        <span className="text-muted-foreground mt-0.5 block text-xs">
                          {mastered
                            ? tr("Ejemplo: concepto comprendido","Example: concept understood")
                            : needsReview
                              ? tr("Ejemplo: conviene repasar","Example: needs review")
                              : tr("Ejemplo: todavía sin evaluar","Example: not yet assessed")}
                        </span>
                      </span>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${stateStyle}`}>
                        {mastered ? tr("Dominado","Mastered") : needsReview ? tr("Reforzar","Review") : tr("Sin evaluar","Not assessed")}
                      </span>
                    </li>
                  );
                })}
                {!showOnboardingExample && visibleTopics.map((topic) => {
                  const questionIndex = topics.findIndex((item) => item.id === topic.id);
                  const pendingCount = topic.errors.filter((error) => error.status === 'pending').length;
                  const assessedCount = topicAssessmentCount(topic);
                  const correctCount = topic.evidence.reduce((total, item) => total + item.correct, 0);
                  const incorrectCount = topic.evidence.reduce((total, item) => total + item.incorrect, 0);
                  const selfReportedCount = topic.evidence.reduce((total, item) => total + item.selfReported, 0);
                  const { Icon, style } = topicStatus(topic, english);
                  const statusLabel = assessmentData?.loadError && !topic.errors.length && assessedCount === 0 && selfReportedCount === 0
                    ? tr("Evaluación no disponible","Assessment unavailable")
                    : topicStatus(topic, english).label;
                  const actionLabel = pendingCount > 0 ? tr("Reforzar","Review") : assessedCount > 0 ? tr("Practicar de nuevo","Practice again")
                    : selfReportedCount > 0 ? tr("Comprobar","Check") : tr("Evaluar","Assess");
                  const shouldPracticeDirectly = pendingCount === 0 && Boolean(
                    onPracticeTopic && (questionCounts?.[questionIndex] ?? 0) > 0
                  );
                  const nextAction = () => {
                    if (shouldPracticeDirectly) onPracticeTopic?.(questionIndex);
                    else openTopic(topic.id);
                  };
                  const activityText = pendingCount > 0
                    ? pendingCount + (pendingCount === 1 ? ' dificultad pendiente' : ' dificultades pendientes')
                    : assessmentData?.loadError
                      ? tr("Resultados de preguntas temporalmente no disponibles","Question results temporarily unavailable")
                      : assessedCount > 0
                      ? correctCount + tr(' de ',' of ') + (correctCount + incorrectCount) + tr(' respuestas correctas registradas',' correct answers recorded')
                      : selfReportedCount > 0
                        ? selfReportedCount + (selfReportedCount === 1 ? ' autoevaluación' : ' autoevaluaciones') + ' · falta comprobar con preguntas'
                        : tr("Todavía sin preguntas corregidas","No graded questions yet");
                  return (
                    <li key={topic.id} data-progress-topic-row>
                      <div className="grid min-w-0 grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1.5 px-3 py-3 sm:grid-cols-[30px_minmax(0,1fr)_auto_auto] sm:gap-x-3 sm:px-4">
                        <span className={'flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold sm:size-[30px] ' +
                          (pendingCount > 0 ? 'bg-[#FEF3F2] text-[#A04034]' :
                            assessedCount > 0 ? 'bg-[#EAF1FF] text-[#2F549A]' :
                              selfReportedCount > 0 ? 'bg-[#EAF1FF] text-[#2F549A]' :
                                'bg-[#F1F4F9] text-[#66758D]')}>
                          {pendingCount > 0 ? <Flag className="size-4" aria-hidden="true" /> : questionIndex + 1}
                        </span>
                        <button type="button" onClick={() => openTopic(topic.id)}
                          aria-expanded={topicId === topic.id}
                          aria-controls={String(panelId) + '-topic-detail-' + topic.id}
                          className="min-w-0 text-left focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#456DBD]">
                          <span className="block break-words text-[12px] font-semibold leading-[1.45] text-[#0F1B3D] sm:text-[13px]">
                            {topic.title}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-[1.5] text-[#66758D]">{activityText}</span>
                          <span className={'mt-1 inline-flex items-center gap-1 text-[10px] font-medium sm:hidden ' +
                            (pendingCount > 0 ? 'text-[#A04034]' : 'text-[#66758D]')}>
                            <Icon className="size-3" aria-hidden="true" />{statusLabel}
                          </span>
                        </button>
                        <span className={'hidden min-w-[85px] items-center gap-1 text-[11px] font-semibold sm:inline-flex ' +
                          (pendingCount > 0 ? 'text-[#A04034]' : 'text-[#42506A]')}>
                          <span className={'flex size-5 items-center justify-center rounded-full ' + style}>
                            <Icon className="size-3" aria-hidden="true" />
                          </span>{statusLabel}
                        </span>
                        <button type="button" onClick={nextAction}
                          className={'inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg px-2.5 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#456DBD] sm:min-w-[90px] sm:px-3 sm:text-[12px] ' +
                            (pendingCount > 0 ? 'bg-[#456DBD] text-white hover:bg-[#3A5CA8]' :
                              'text-[#456DBD] hover:bg-[#EEF2FF]')}>
                          {actionLabel}
                        </button>
                      </div>
                      <div id={String(panelId) + '-topic-detail-' + topic.id} hidden={topicId !== topic.id}>
                        {topicId === topic.id ? topicDetail : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {!showOnboardingExample && !visibleTopics.length && (
                <p className="text-muted-foreground px-6 pb-6 text-sm">
                  {topics.length
                    ? tr("No encontramos temas con ese nombre.","No topics match that search.")
                    : tr("Todavía no hay temas disponibles para mostrar.","No topics available yet.")}
                </p>
              )}
              {showOnboardingExample && topics.length === 0 && (
                <p className="text-muted-foreground px-4 py-3 text-sm">
                  {tr("Todavía no hay capítulos disponibles para armar un ejemplo.","No chapters available to build an example.")}
                </p>
              )}
            </section>
            {unmatched.length > 0 && !showOnboardingExample && (
              <section className="flex flex-col items-start gap-3 rounded-2xl border border-[#E7EBF4] bg-white p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[14px] font-semibold text-[#0F1B3D]">{t("Otros conceptos con errores")}</h2>
                  <p className="mt-1 text-[12px] leading-[1.6] text-[#42506A]">
                    {unmatched.length} {unmatched.length === 1 ? tr('registro de este PDF no coincide','record from this PDF does not match') : tr('registros de este PDF no coinciden','records from this PDF do not match')} {tr('con un tema del resumen. Por eso no se incluyen en el avance por tema.','a topic in the summary, so they are not included in topic progress.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openTopic('unmatched')}
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-[#D9E6FF] bg-white px-4 text-[12px] font-semibold text-[#456DBD] hover:bg-[#EEF2FF]"
                >
                  {tr('Ver estos conceptos','View these concepts')}
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
