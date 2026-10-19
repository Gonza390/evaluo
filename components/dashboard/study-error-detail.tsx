'use client';

import {
  pdfStudyPrimaryButton as reviewPrimaryButton,
  pdfStudySecondaryButton as reviewSecondaryButton,
} from '@/components/study/pdf-study-styles';

export { reviewPrimaryButton, reviewSecondaryButton };

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Loader2,
} from 'lucide-react';
import { markStudyErrorReviewedAction } from '@/lib/actions/study-errors';
import {
  associateReviewPdfAction,
  generateReviewCheckAction,
  generateReviewHelpAction,
  openReviewSourceAction,
  submitReviewCheckAction,
} from '@/lib/actions/study-error-review';
import type { StudyErrorView, StudyErrorsPageData } from '@/lib/study-errors';
import type {
  ReviewHelpKind,
  ReviewQuestion,
  ReviewAnswerResult,
} from '@/lib/study-error-review-contract';
import {
  scrollToStudyErrorHelp,
  StudyErrorHelpChat,
  type StudyErrorHelpMessage,
} from './study-error-help-chat';

export const studyErrorSourceLabels = {
  simulator: 'Preguntero',
  flashcard: 'Flashcards',
  exercise: 'Práctica',
  diagnostic: 'Diagnóstico',
};

const liveReviewActions = {
  markReviewed: markStudyErrorReviewedAction,
  generateHelp: generateReviewHelpAction,
  generateCheck: generateReviewCheckAction,
  openSource: openReviewSourceAction,
  submitCheck: submitReviewCheckAction,
  associatePdf: associateReviewPdfAction,
};

// La vista local puede suministrar acciones de muestra; la pantalla autenticada usa las reales.
export type StudyErrorReviewActions = typeof liveReviewActions;

export type StudyErrorConversation = {
  messages: StudyErrorHelpMessage[];
  source: StudyErrorView['recommendation'];
  reviewed: boolean;
};

function pageLabel(start: number | null, end: number | null) {
  return start ? (end && end !== start ? `págs. ${start}–${end}` : `pág. ${start}`) : null;
}

export function StudyErrorDetail({
  item,
  materials,
  pendingCount,
  onProgress,
  onAssociate,
  onNext,
  onFinish,
  reviewActions = liveReviewActions,
  conversation,
  onConversationChange,
  documentHref,
  embedded = false,
  topicContext = false,
}: {
  item: StudyErrorView;
  materials: StudyErrorsPageData['materials'];
  pendingCount: number;
  onProgress: (changes: Partial<StudyErrorView>) => void;
  onAssociate: (materialId: string) => void;
  onNext: () => void;
  onFinish: () => void;
  reviewActions?: StudyErrorReviewActions;
  documentHref?: string;
  embedded?: boolean;
  topicContext?: boolean;
  conversation: StudyErrorConversation;
  onConversationChange: (
    update: (current: StudyErrorConversation) => StudyErrorConversation
  ) => void;
}) {
  const { messages, source, reviewed } = conversation;
  function setMessages(update: (current: StudyErrorHelpMessage[]) => StudyErrorHelpMessage[]) {
    onConversationChange((current) => ({ ...current, messages: update(current.messages) }));
  }
  function setSource(value: StudyErrorView['recommendation']) {
    onConversationChange((current) => ({ ...current, source: value }));
  }
  function setReviewed(value: boolean) {
    onConversationChange((current) => ({ ...current, reviewed: value }));
  }
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [noticeAction, setNoticeAction] = useState<string | null>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [question, setQuestion] = useState<ReviewQuestion | null>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [result, setResult] = useState<ReviewAnswerResult | null>(null);
  const [associateId, setAssociateId] = useState('');
  const operation = useRef(false);
  const automaticHelpStarted = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const response = useRef<HTMLDivElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const materialId = source?.materialId ?? item.recommendation?.materialId ?? null;
  const resolved = item.status === 'resolved';
  const savedExplanation = resolved && !messages.length ? item.explanation : null;
  const pendingHelp =
    busy === 'why_wrong' || busy === 'simpler' || busy === 'example' ? busy : null;
  const helpNotice = ['why_wrong', 'simpler', 'example', 'review'].includes(noticeAction ?? '');
  const sourceNotice = noticeAction === 'source' || noticeAction === 'associate';
  const inlineNotice = notice ? (
    <p
      role="alert"
      className="border-destructive/40 !text-foreground mt-5 border-l-2 pl-3 !text-sm"
    >
      {notice}
    </p>
  ) : null;
  const activityHref =
    documentHref ??
    (item.sourceType === 'simulator' && item.materiaId
      ? `/simulador/errores/${item.materiaId}?parcial=${item.parcial ?? 1}`
      : materialId
        ? `/materiales/${materialId}?studyError=${item.id}`
        : null);

  useEffect(() => {
    if (embedded && !question) return;
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [embedded, item.id, question]);

  useEffect(() => {
    if (!result) return;
    resultHeading.current?.focus({ preventScroll: true });
    resultHeading.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [result]);

  const startAutomaticHelp = useEffectEvent(() => help('why_wrong'));
  useEffect(() => {
    if (!embedded || resolved || messages.length || automaticHelpStarted.current) return;
    automaticHelpStarted.current = true;
    startAutomaticHelp();
  }, [embedded, resolved, messages.length]);

  async function run(name: string, task: () => Promise<void>) {
    if (operation.current) return;
    operation.current = true;
    setBusy(name);
    setNotice('');
    setNoticeAction(name);
    try {
      await task();
    } catch {
      setNotice('No pudimos completar la acción. Revisá tu conexión y reintentá.');
    } finally {
      operation.current = false;
      setBusy(null);
    }
  }
  function help(kind: ReviewHelpKind) {
    if (operation.current) return;
    const cached = messages.find((message) => message.kind === kind);
    if (cached) {
      if (reviewed || resolved) {
        setNotice('');
        requestAnimationFrame(() => scrollToHelp(kind));
      } else {
        void run('review', async () => {
          const marked = await reviewActions.markReviewed(item.id);
          if (!marked.success) {
            setNotice('No pudimos guardar el repaso. Reintentá antes de comprobarlo.');
            return;
          }
          setReviewed(true);
          requestAnimationFrame(() => scrollToHelp(kind));
        });
      }
      return;
    }
    void run(kind, async () => {
      const generated = await reviewActions.generateHelp(item.id, kind, materialId);
      if (!generated.success || !generated.text) {
        setNotice(generated.message ?? 'No pudimos generar la ayuda.');
        return;
      }
      setMessages((current) => [
        ...current.filter((message) => message.kind !== kind),
        { kind, text: generated.text! },
      ]);
      if (generated.source) setSource(generated.source);
      setReviewed(true);
    });
  }
  function scrollToHelp(kind: ReviewHelpKind) {
    const container = response.current?.querySelector<HTMLElement>('[data-study-chat-scroll]');
    if (container) scrollToStudyErrorHelp(container, kind);
  }
  function openSource() {
    if (sourceOpen) {
      setSourceOpen(false);
      return;
    }
    if (!materialId) return;
    void run('source', async () => {
      const loaded = await reviewActions.openSource(item.id, materialId);
      if (!loaded.success || !loaded.source) {
        setNotice(loaded.message ?? 'No pudimos abrir el fragmento.');
        return;
      }
      setSource(loaded.source);
      setSourceOpen(true);
      setReviewed(true);
    });
  }
  function checkUnderstanding() {
    if (!materialId) return;
    void run('check', async () => {
      const generated = await reviewActions.generateCheck(item.id, materialId);
      if (!generated.success || !generated.question) {
        setNotice(generated.message ?? 'No pudimos preparar la pregunta.');
        return;
      }
      setQuestion(generated.question);
      setAnswer(null);
      setResult(null);
      setSourceOpen(false);
      requestAnimationFrame(() =>
        heading.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      );
    });
  }
  function confirmAnswer() {
    if (!question || answer === null) return;
    void run('answer', async () => {
      const checked = await reviewActions.submitCheck(question.id, answer);
      if (!checked.success) {
        setNotice(checked.message ?? 'No pudimos guardar la respuesta.');
        return;
      }
      setResult(checked);
      if (checked.correct)
        onProgress({
          status: 'resolved',
          resolvedAt: checked.resolvedAt ?? new Date().toISOString(),
          lastReviewedAt: new Date().toISOString(),
        });
      else {
        setReviewed(false);
        onProgress({ failureCount: item.failureCount + 1, lastReviewedAt: null });
      }
    });
  }
  function returnToReview() {
    setQuestion(null);
    setResult(null);
    setAnswer(null);
    setNotice('');
    requestAnimationFrame(() => {
      response.current?.focus({ preventScroll: true });
      response.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    if (messages.length && !resolved)
      void run('review', async () => {
        const marked = await reviewActions.markReviewed(item.id);
        if (marked.success) setReviewed(true);
        else setNotice('No pudimos guardar el repaso. Reintentá antes de comprobarlo.');
      });
  }
  return (
    <div className="w-full min-w-0">
      {question ? (
        <>
          <h2
            ref={heading}
            tabIndex={-1}
            className="scroll-mt-24 text-xl font-black tracking-tighter outline-none sm:text-2xl"
          >
            Comprobá lo aprendido
          </h2>
          <p className="!text-muted-foreground mt-2 !text-sm">
            Mismo concepto, una situación diferente. Respondé sin consultar la explicación.
          </p>
          <p className="!text-foreground mt-6 !text-lg">{question.question}</p>
          <fieldset className="mt-6 space-y-3" disabled={Boolean(result) || Boolean(busy)}>
            <legend className="sr-only">Elegí una respuesta</legend>
            {question.options.map((option, index) => (
              <label
                key={index}
                className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border px-4 py-4 ${result && !result.correct && answer === index ? 'border-destructive bg-destructive/5' : result?.correctIndex === index ? 'border-emerald-500 bg-emerald-50' : !result && answer === index ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <input
                  type="radio"
                  name={`review-${question.id}`}
                  checked={answer === index}
                  onChange={() => setAnswer(index)}
                  className="accent-primary mt-1 shrink-0"
                />
                <span className="min-w-0 text-sm leading-6 break-words">
                  {option}
                  {result && (result.correctIndex === index || answer === index) && (
                    <span
                      className={`mt-1 block text-xs font-semibold ${result.correctIndex === index ? 'text-primary' : 'text-destructive'}`}
                    >
                      {result.correctIndex === index
                        ? 'Respuesta correcta'
                        : 'Tu respuesta incorrecta'}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </fieldset>
          {!result ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className={reviewPrimaryButton}
                disabled={answer === null || Boolean(busy)}
                onClick={confirmAnswer}
              >
                {busy === 'answer' && <Loader2 className="h-4 w-4 animate-spin" />}Confirmar
                respuesta
              </button>
              <button
                className={reviewSecondaryButton}
                disabled={Boolean(busy)}
                onClick={returnToReview}
              >
                Volver al repaso
              </button>
            </div>
          ) : (
            <div role="status" className="border-border mt-6 border-t pt-6">
              <h3
                ref={resultHeading}
                tabIndex={-1}
                className="flex items-center gap-2 text-xl font-bold outline-none"
              >
                {result.correct ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                ) : (
                  <CircleAlert className="text-destructive h-5 w-5" />
                )}
                {result.correct ? 'Resolviste el refuerzo' : 'Todavía queda por reforzar'}
              </h3>
              <p className="!text-foreground mt-2">
                {result.correct
                  ? pendingCount === 0
                    ? topicContext
                      ? 'No te quedan dificultades pendientes en este tema.'
                      : 'No te quedan errores pendientes en este PDF.'
                    : pendingCount === 1
                      ? topicContext
                        ? 'Te queda 1 dificultad pendiente en este tema.'
                        : 'Te queda 1 error pendiente en este PDF.'
                      : topicContext
                        ? `Te quedan ${pendingCount} dificultades pendientes en este tema.`
                        : `Te quedan ${pendingCount} errores pendientes en este PDF.`
                  : 'El error sigue pendiente. Volvé a la explicación y pedí una versión más simple o un ejemplo.'}
              </p>
              <p className="!text-foreground mt-3 !text-sm">{result.feedback}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {result.correct ? (
                  <>
                    {embedded && (
                      <button className={reviewPrimaryButton} onClick={onFinish}>
                        {topicContext ? 'Volver al tema' : 'Volver a Progreso'}
                      </button>
                    )}
                    <button
                      className={embedded ? reviewSecondaryButton : reviewPrimaryButton}
                      disabled={pendingCount === 0}
                      onClick={onNext}
                    >
                      {topicContext ? 'Reforzar otra dificultad' : 'Seguir con otro error'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    {!embedded && (
                      <button className={reviewSecondaryButton} onClick={onFinish}>
                        Terminar por hoy
                      </button>
                    )}
                  </>
                ) : (
                  <button className={reviewPrimaryButton} onClick={returnToReview}>
                    Volver a la explicación
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div data-study-error-tour="error">
            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              <span className="text-muted-foreground py-1 text-xs">
                {studyErrorSourceLabels[item.sourceType]}
              </span>
              <span className="text-muted-foreground py-1">
                {resolved
                  ? 'Resuelto después del repaso'
                  : `${item.failureCount} ${item.failureCount === 1 ? 'intento con dificultad' : 'intentos con dificultad'}`}
              </span>
            </div>
            <h2
              ref={heading}
              tabIndex={-1}
              className={
                embedded
                  ? 'sr-only'
                  : 'scroll-mt-24 text-2xl font-black tracking-tighter break-words outline-none sm:text-3xl'
              }
            >
              {item.topic}
            </h2>
            <p className={`!text-foreground break-words ${embedded ? 'mt-2' : 'mt-4'}`}>
              {item.prompt}
            </p>
            {(item.selectedAnswer || item.correctAnswer) && (
              <details open={embedded || undefined} className="group mt-3">
                <summary className="text-muted-foreground hover:text-foreground focus-visible:outline-ring flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
                  Ver mi respuesta anterior
                  <ChevronDown
                    className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </summary>
                <div className="mt-2 grid gap-4 pb-2 sm:grid-cols-2">
                  {item.selectedAnswer && (
                    <div className="border-destructive/40 border-l-2 pl-4">
                      <p className="!text-destructive !text-xs font-semibold">
                        Respuesta incorrecta
                      </p>
                      <p className="!text-foreground mt-2 !text-sm break-words">
                        {item.selectedAnswer}
                      </p>
                    </div>
                  )}
                  {item.correctAnswer && (
                    <div className="border-l-2 border-emerald-500/40 pl-4">
                      <p className="!text-xs font-semibold !text-emerald-700">Respuesta correcta</p>
                      <p className="!text-foreground mt-2 !text-sm break-words">
                        {item.correctAnswer}
                      </p>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
          <section
            data-study-error-tour="understand"
            className={`border-border border-t ${embedded ? 'mt-3 pt-3' : 'mt-7 pt-6'}`}
          >
            <div
              ref={response}
              tabIndex={-1}
              className="w-full scroll-mt-24"
              aria-busy={Boolean(busy && ['why_wrong', 'simpler', 'example'].includes(busy))}
            >
              <StudyErrorHelpChat
                compact={embedded}
                messages={messages}
                pendingKind={pendingHelp}
                hasPdf={Boolean(materialId)}
                savedExplanation={savedExplanation}
                onRequest={help}
                busy={Boolean(busy)}
                resolved={resolved}
                topic={item.topic}
                pdfTitle={source?.materialTitle ?? null}
                notice={helpNotice ? notice : undefined}
              />
            </div>
          </section>
          <section data-study-error-tour="source" className="mt-3">
            {source ? (
              <>
                <button
                  className="text-muted-foreground hover:text-primary focus-visible:outline-ring flex min-h-11 w-full items-start gap-2 py-3 text-left text-xs leading-5 transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 sm:text-sm"
                  disabled={Boolean(busy)}
                  onClick={openSource}
                  aria-expanded={sourceOpen}
                  aria-controls={`source-${item.id}`}
                >
                  <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 text-[11px] leading-4 break-words">
                    Fuente: {source.sectionTitle ?? source.materialTitle}
                    {pageLabel(source.pageStart, source.pageEnd)
                      ? ` · ${pageLabel(source.pageStart, source.pageEnd)}`
                      : ''}{' '}
                    <span className="text-primary font-medium">
                      — {sourceOpen ? 'Cerrar fragmento' : 'Ver fragmento'}
                    </span>
                  </span>
                  <ChevronDown
                    className={`mt-0.5 h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none ${sourceOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {sourceOpen && (
                  <div id={`source-${item.id}`} className="border-primary/30 mt-2 border-l-2 pl-4">
                    <blockquote className="text-sm leading-7 break-words whitespace-pre-line">
                      {source.excerpt}
                    </blockquote>
                    <p className="!text-muted-foreground mt-3 !text-xs">
                      {source.materialTitle}
                      {pageLabel(source.pageStart, source.pageEnd)
                        ? ` · ${pageLabel(source.pageStart, source.pageEnd)}`
                        : ''}
                    </p>
                    <Link
                      href={
                        documentHref
                          ? `${documentHref}${source.pageStart ? `#page=${source.pageStart}` : ''}`
                          : `/materiales/${source.materialId}${source.pageStart ? `?page=${source.pageStart}` : ''}`
                      }
                      className="text-primary mt-2 inline-flex min-h-11 items-center text-xs font-semibold underline"
                    >
                      Abrir PDF completo
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="border-border mt-5 border-l-2 pl-4">
                <h3 className="text-sm font-semibold">
                  Este error todavía no tiene un PDF asociado
                </h3>
                <p className="!text-muted-foreground mt-2 !text-sm">
                  Elegí tus apuntes. Evaluo verificará si contienen información para repasar este
                  concepto.
                </p>
                {materials.length > 0 && !resolved && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <select
                      aria-label="PDF para asociar"
                      value={associateId}
                      onChange={(event) => setAssociateId(event.target.value)}
                      className="border-border bg-background min-h-11 min-w-0 flex-1 rounded-xl border px-3 text-sm"
                    >
                      <option value="">Elegir mi PDF</option>
                      {materials.map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.title}
                        </option>
                      ))}
                    </select>
                    <button
                      className={reviewSecondaryButton}
                      disabled={!associateId || Boolean(busy)}
                      onClick={() =>
                        void run('associate', async () => {
                          const associated = await reviewActions.associatePdf(item.id, associateId);
                          if (!associated.success || !associated.source) {
                            setNotice(associated.message ?? 'No pudimos asociarlo.');
                            return;
                          }
                          setSource(associated.source);
                          setMessages(() => []);
                          setReviewed(false);
                          setSourceOpen(false);
                          onAssociate(associateId);
                        })
                      }
                    >
                      Asociar PDF
                    </button>
                  </div>
                )}
                <Link
                  href={`/dashboard/materiales?openUpload=1&source=study_error${item.materiaId ? `&materiaId=${item.materiaId}` : ''}`}
                  className="text-primary mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline"
                >
                  Subir mis apuntes
                </Link>
              </div>
            )}
            {sourceNotice && inlineNotice}
          </section>
          {(resolved || !materialId || reviewed || noticeAction === 'check') && (
            <section data-study-error-tour="practice" className="border-border mt-3 border-t pt-3">
              {resolved ? (
                <p className="!text-foreground !text-sm">
                  Este error quedó resuelto después de tu repaso.
                </p>
              ) : materialId && reviewed ? (
                <>
                  <p className="!text-foreground font-semibold">
                    ¿Querés probar con otra situación?
                  </p>
                  <button
                    className={reviewPrimaryButton + ' mt-3'}
                    disabled={Boolean(busy)}
                    onClick={checkUnderstanding}
                  >
                    {busy === 'check' && <Loader2 className="h-4 w-4 animate-spin" />}Comprobar qué
                    entendí
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              ) : !materialId ? (
                <p className="!text-muted-foreground !text-sm">
                  Asociá un PDF para comprobar lo aprendido con una pregunta basada en tu material.
                </p>
              ) : null}
              {activityHref && resolved && (
                <Link
                  href={activityHref}
                  className="text-muted-foreground mt-3 inline-flex min-h-11 w-fit items-center py-2 text-xs font-semibold underline"
                >
                  Volver a la actividad original
                </Link>
              )}
              {noticeAction === 'check' && inlineNotice}
            </section>
          )}
        </>
      )}
      {(question || (!helpNotice && !sourceNotice && noticeAction !== 'check')) && inlineNotice}
      {!question && resolved && (
        <div className="border-border mt-7 flex flex-wrap gap-3 border-t pt-5">
          <button
            className={reviewSecondaryButton}
            disabled={Boolean(busy) || pendingCount <= (resolved ? 0 : 1)}
            onClick={onNext}
          >
            {topicContext ? 'Reforzar otra dificultad' : 'Seguir con otro error'}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button className={reviewSecondaryButton} disabled={Boolean(busy)} onClick={onFinish}>
            {topicContext ? 'Volver al tema' : 'Terminar por hoy'}
          </button>
        </div>
      )}
    </div>
  );
}
