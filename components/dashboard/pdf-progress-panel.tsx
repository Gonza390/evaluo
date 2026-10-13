'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PdfMobileNavigation } from '@/components/study/pdf-mobile-navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Circle,
  FileText,
  Flag,
  Target,
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
        ? 'Refuerzo comprobado'
        : 'Sin errores pendientes',
      Icon: CheckCircle2,
      style: 'bg-primary/10 text-primary',
    };
  if (topicAssessmentCount(topic) > 0)
    return { label: 'En evaluación', Icon: CheckCircle2, style: 'bg-primary/10 text-primary' };
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
  onErrorProgress,
  initialErrorId,
  onboardingErrorId,
  returnToErrors = false,
}: {
  material: { id: string; title: string };
  sections: unknown;
  data: StudyErrorsPageData;
  summaryUnavailable: boolean;
  initialErrorId?: string;
  onboardingErrorId?: string | null;
  returnToErrors?: boolean;
  embedded?: boolean;
  assessmentData?: { items: PdfTopicEvidence[]; loadError?: boolean };
  questionCounts?: number[];
  onPractice?: () => void;
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
  const initialError = [...data.pending, ...data.resolved].find(
    (item) => item.id === initialErrorId
  );
  const [topicId, setTopicId] = useState<string | null>(() =>
    initialError
      ? (buildPdfProgress(sections, [...data.pending, ...data.resolved]).topics.find((topic) =>
          topic.errors.some((error) => error.id === initialError.id)
        )?.id ?? 'unmatched')
      : null
  );
  const [errorId, setErrorId] = useState<string | null>(initialError?.id ?? null);
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
  const resolved = views.filter((error) => error.status === 'resolved');
  const pendingTopics = topics.filter((topic) =>
    topic.errors.some((error) => error.status === 'pending')
  );
  const next = pending[0];
  const selected = views.find((error) => error.id === errorId);
  const currentTopic = topics.find((topic) => topic.id === topicId);
  const currentSectionIndex = currentTopic ? Number(currentTopic.id.replace('section-', '')) : -1;
  const currentSection = Array.isArray(sections) ? sections[currentSectionIndex] : null;
  const summaryBody =
    currentSection && typeof currentSection.body === 'string' ? currentSection.body.trim() : '';
  const currentErrors = [
    ...(topicId === 'unmatched' ? unmatched : (currentTopic?.errors ?? [])),
  ].sort((first, second) => first.id.localeCompare(second.id));
  const visibleTopics = topics.filter(
    (topic) =>
      filter === 'Todos' ||
      (filter === 'Por reforzar'
        ? topic.errors.some((error) => error.status === 'pending')
        : topicAssessmentCount(topic) === 0)
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
    if (!initialErrorId) return;
    const frame = requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ block: 'start' });
      detailRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [initialErrorId]);
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
  function reinforce() {
    if (!next) return;
    const topic = topics.find((item) => item.errors.some((error) => error.id === next.id));
    openTopic(topic?.id ?? 'unmatched', next.id);
  }

  function closeTopic() {
    const trigger = topicId
      ? document.getElementById(`${panelId}-topic-detail-${topicId}`)?.previousElementSibling
      : null;
    setTopicId(null);
    setErrorId(null);
    requestAnimationFrame(() => {
      if (trigger instanceof HTMLElement) {
        trigger.focus({ preventScroll: true });
        trigger.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  const topicDetail = topicId ? (
    <section
      id={`real-topic-detail-${panelId}`}
      ref={detailRef}
      tabIndex={-1}
      aria-labelledby={`real-detail-title-${panelId}`}
      className="border-primary/20 bg-primary/5 focus-visible:outline-ring border-t px-4 py-3 text-[13px] focus-visible:outline-2 [&_a]:text-[13px]! [&_blockquote]:text-[13px]! [&_blockquote]:leading-5! [&_button]:text-[13px]! [&_h2]:text-sm! [&_h2]:leading-5! [&_h3]:text-sm! [&_h3]:leading-5! [&_p]:text-[13px]! [&_p]:leading-5!"
    >
      <div className="flex items-center justify-end">
        <h2 id={`real-detail-title-${panelId}`} className="sr-only">
          {currentTopic?.title ?? 'Otros conceptos'}
        </h2>
        <button
          type="button"
          onClick={closeTopic}
          className="text-muted-foreground hover:bg-muted min-h-10 rounded-lg px-3 text-xs"
        >
          Cerrar detalle
        </button>
      </div>
      {currentErrors.length > 1 && (
        <div className="my-2 flex flex-wrap gap-1.5" aria-label="Errores del tema">
          {currentErrors.map((error, index) => (
            <button
              type="button"
              key={error.id}
              aria-pressed={errorId === error.id}
              onClick={() => setErrorId(error.id)}
              className={`focus-visible:outline-ring min-h-9 rounded-lg border px-2.5 py-1 focus-visible:outline-2 sm:min-h-8 ${errorId === error.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
            >
              <span className="text-[11px] leading-4">
                Concepto {index + 1} · {error.status === 'pending' ? 'Pendiente' : 'Resuelto'}
              </span>
            </button>
          ))}
        </div>
      )}
      {selected ? (
        <StudyErrorDetail
          embedded
          key={conversationKey}
          item={selected}
          materials={[{ ...material, materiaNombre: null }]}
          pendingCount={pending.length}
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
            const other = pending.find((error) => error.id !== selected.id);
            if (other) {
              const topic = topics.find((item) =>
                item.errors.some((error) => error.id === other.id)
              );
              openTopic(topic?.id ?? 'unmatched', other.id);
            } else {
              closeTopic();
            }
          }}
          onFinish={closeTopic}
        />
      ) : (
        <div className="mt-3">
          {summaryBody && (
            <div className="border-border mb-3 rounded-lg border p-3">
              <p className="text-foreground mb-2 font-medium">Repasá este tema con tu resumen</p>
              <p className="text-foreground whitespace-pre-line">{summaryBody.slice(0, 700)}</p>
              {summaryBody.length > 700 && (
                <details className="mt-2">
                  <summary className="text-primary min-h-9 cursor-pointer py-2 text-xs">
                    Seguir leyendo
                  </summary>
                  <p className="text-foreground whitespace-pre-line">{summaryBody.slice(700)}</p>
                </details>
              )}
            </div>
          )}
          <p className="text-muted-foreground text-[13px]">
            {currentTopic && topicAssessmentCount(currentTopic) > 0
              ? 'Seguí practicando este tema.'
              : currentTopic &&
                  questionCounts?.[topics.findIndex((topic) => topic.id === currentTopic.id)] === 0
                ? 'Aún no hay preguntas para este tema.'
                : 'Este tema sigue sin evaluar. La próxima práctica prioriza los temas que faltan.'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {onPractice ? (
              <button
                type="button"
                onClick={onPractice}
                className={`${actionClass} bg-primary text-primary-foreground`}
              >
                Ir a la práctica del PDF <ArrowRight size={16} />
              </button>
            ) : (
              <Link
                href={`${materialHref}?tab=ejercicios`}
                className={`${actionClass} bg-primary text-primary-foreground`}
              >
                Ir a la práctica del PDF <ArrowRight size={16} />
              </Link>
            )}
            <Link
              href={simulation ? materialHref : `${materialHref}?tab=resumen`}
              className={`${actionClass} border-border text-foreground border`}
            >
              <BookOpen size={17} />
              {simulation ? 'Ver PDF original' : 'Volver al resumen'}
            </Link>
          </div>
          <p className="text-muted-foreground mt-2 text-xs!">
            La práctica incluye distintos temas de este PDF.
          </p>
        </div>
      )}
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
      className={`${embedded ? 'w-full py-3 sm:py-4' : 'mx-auto max-w-6xl px-1 py-3 sm:px-3 sm:py-4'} [&_p]:leading-5!`}
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
        className={`${embedded ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} mt-2 font-semibold tracking-tight`}
      >
        Tu progreso en este PDF
      </h2>
      <p className="text-muted-foreground mt-1 text-[13px]!">
        {simulation
          ? 'Temas y contenido del PDF real · Errores y resoluciones simulados.'
          : 'Los temas de tu resumen y lo que registraste al practicar.'}
      </p>
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
      {unmatchedEvidence.length > 0 && (
        <p role="status" className="text-muted-foreground mt-3 text-xs!">
          Hay respuestas sin una asociación única con los temas actuales. Las conservamos, pero no
          las sumamos a la cobertura.
        </p>
      )}
      {data.truncated && (
        <p role="status" className="border-border bg-muted mb-5 rounded-xl border p-4 text-sm">
          Mostramos los últimos 300 registros de este PDF. Los contadores corresponden a esos
          registros y pueden ser parciales.
        </p>
      )}
      <div
        className={`mt-4 grid items-start gap-4 ${topicId ? '' : 'lg:grid-cols-[minmax(0,1fr)_280px]'}`}
      >
        <div className="space-y-4">
          <section
            className="border-border bg-card rounded-2xl border p-4 sm:p-5"
            aria-labelledby={`real-coverage-title-${panelId}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id={`real-coverage-title-${panelId}`} className="text-base font-semibold">
                Tu recorrido hasta ahora
              </h2>
              <Target className="text-primary" size={18} />
            </div>
            {summaryUnavailable ? (
              <p className="text-muted-foreground mt-4 text-sm">
                El resumen todavía no está disponible. Podés repasar los errores guardados mientras
                tanto.
              </p>
            ) : topics.length ? (
              <>
                <div className="mt-3 flex flex-wrap items-baseline gap-2">
                  <strong className="text-3xl font-semibold">
                    {assessmentData?.loadError ? '—' : evaluated}
                    <span className="text-muted-foreground text-xl font-normal">
                      {' '}
                      / {topics.length}
                    </span>
                  </strong>
                  <span className="text-muted-foreground text-[13px]">temas evaluados</span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Temas con al menos una pregunta corregida; no mide dominio"
                  aria-valuenow={assessmentData?.loadError ? undefined : evaluated}
                  aria-valuetext={assessmentData?.loadError ? 'Cobertura no disponible' : undefined}
                  aria-valuemin={0}
                  aria-valuemax={topics.length}
                  className="bg-muted mt-3 h-2 overflow-hidden rounded-full"
                >
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{
                      width: `${(assessmentData?.loadError ? 0 : evaluated / topics.length) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-muted-foreground mt-2 text-[13px]!">
                  {pendingTopics.length} {pendingTopics.length === 1 ? 'tema' : 'temas'} para
                  reforzar
                  {!assessmentData?.loadError && <> · {topics.length - evaluated} por evaluar</>}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground mt-4 text-sm">
                No encontramos temas en el resumen guardado. Tus errores siguen disponibles abajo.
              </p>
            )}
            {resolved.length > 0 && (
              <p className="text-muted-foreground mt-2 text-xs!">
                <CheckCircle2
                  className="text-primary mr-1.5 inline-block"
                  size={14}
                  aria-hidden="true"
                />
                {resolved.length} {resolved.length === 1 ? 'error resuelto' : 'errores resueltos'}{' '}
                después del repaso
              </p>
            )}
            <details className="text-muted-foreground mt-2 text-xs">
              <summary className="focus-visible:outline-ring min-h-9 w-fit cursor-pointer py-2 focus-visible:outline-2">
                ¿Cómo se mide el progreso?
              </summary>
              <p className="mt-1 text-xs!">
                Un tema se cuenta como evaluado cuando respondiste al menos una pregunta con
                corrección, bien o mal. Leer, autoevaluarte o resolver un refuerzo no demuestra
                dominio de todo el tema.
              </p>
            </details>
            {topics.some(
              (topic) => topic.errors.length > 0 && topicAssessmentCount(topic) === 0
            ) && (
              <p className="text-muted-foreground mt-2 text-xs!">
                Conservamos tus errores anteriores. La cobertura solo cuenta respuestas corregidas
                que quedaron registradas.
              </p>
            )}
          </section>
          <section
            className="border-border bg-card overflow-hidden rounded-2xl border"
            aria-labelledby={`real-topics-title-${panelId}`}
          >
            <div className="p-4 pb-2">
              <h2 id={`real-topics-title-${panelId}`} className="text-base font-semibold">
                Tus temas, uno por uno
              </h2>
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
                  ? 'Evaluación no disponible'
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
                                ? `${correctCount} ${correctCount === 1 ? 'acierto' : 'aciertos'} · ${incorrectCount} ${incorrectCount === 1 ? 'error' : 'errores'}`
                                : selfReportedCount > 0
                                  ? `${selfReportedCount} autoevaluaciones · falta comprobar con una pregunta`
                                  : pendingCount
                                    ? `${pendingCount} ${pendingCount === 1 ? 'error pendiente' : 'errores pendientes'}`
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
            <section className="border-border bg-card rounded-3xl border p-6">
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
        {!topicId && (
          <aside className="order-first space-y-3 lg:order-none">
            <section
              className="border-primary/20 bg-primary/5 rounded-2xl border p-4"
              aria-labelledby={`real-next-title-${panelId}`}
            >
              <div className="bg-primary/10 text-primary mb-2 flex h-8 w-8 items-center justify-center rounded-xl">
                <Target size={18} />
              </div>
              <span className="text-primary text-xs font-semibold tracking-wider uppercase">
                Tu próximo paso
              </span>
              <h2
                id={`real-next-title-${panelId}`}
                className="mt-2 text-base font-semibold break-words"
              >
                {next
                  ? `Retomá ${next.topic}`
                  : evaluated === 0
                    ? 'Empezá tu primera práctica'
                    : 'Continuá tu práctica'}
              </h2>
              <p className="text-muted-foreground mt-2 text-[13px]!">
                {next
                  ? 'Repasá el concepto y probá otra situación.'
                  : evaluated === 0
                    ? 'Recibí tu nota y descubrí qué reforzar.'
                    : 'Retomá tu práctica o empezá otra tanda.'}
              </p>
              {next ? (
                <button
                  type="button"
                  onClick={reinforce}
                  className={`${actionClass} bg-primary text-primary-foreground hover:bg-primary/90 mt-3 w-full`}
                >
                  Reforzar ahora
                  <ArrowRight size={16} />
                </button>
              ) : onPractice ? (
                <button
                  type="button"
                  onClick={onPractice}
                  className={`${actionClass} bg-primary text-primary-foreground mt-3 w-full`}
                >
                  {evaluated === 0 ? 'Empezar práctica' : 'Ir a la práctica'}{' '}
                  <ArrowRight size={16} />
                </button>
              ) : (
                <Link
                  href={simulation ? materialHref : `${materialHref}?tab=ejercicios`}
                  className={`${actionClass} bg-primary text-primary-foreground mt-3 w-full`}
                >
                  {evaluated === 0 ? 'Empezar práctica' : 'Ir a la práctica'}
                  <ArrowRight size={16} />
                </Link>
              )}
              {pending.length > 0 && (
                <p className="text-muted-foreground mt-2 text-xs!">
                  {pending.length} {pending.length === 1 ? 'error pendiente' : 'errores pendientes'}{' '}
                  en este PDF
                </p>
              )}
            </section>
          </aside>
        )}
      </div>
    </div>
  );
}
