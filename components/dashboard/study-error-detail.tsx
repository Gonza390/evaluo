'use client';

import { EviChatLauncher, EviChatPanel, type EviErrorCheck } from '@/components/study/evi-chat-panel';
import type { EviChatContext } from '@/lib/evi-chat-contract';
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
  FileText,
  Loader2,
  X,
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
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { reviewUiText } from '@/lib/i18n/review-ui-copy';
import type { StudyGlossaryItem } from '@/lib/student-materials/types';
import { buildGroundedErrorContrast } from '@/lib/student-materials/error-contrast';
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

function pageLabel(start: number | null, end: number | null, english = false) {
  return start ? (end && end !== start ? `${english ? 'pp.' : 'págs.'} ${start}–${end}` : `${english ? 'p.' : 'pág.'} ${start}`) : null;
}

/** "A · B · C" o una lista con saltos de línea → un renglón por concepto. */
function answerItems(text: string) {
  const parts = text
    .split(/\s+·\s+|\n+|;\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts : [text.trim()];
}

function comparableText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

/** La explicación guardada a veces repite la respuesta correcta: no la mostramos dos veces. */
function sameMeaning(explanation: string, answer: string) {
  const a = comparableText(explanation);
  const b = comparableText(answer);
  if (!a || !b) return false;
  return (
    a === b ||
    (a.includes(b) && a.length < b.length * 1.25) ||
    (b.includes(a) && b.length < a.length * 1.25)
  );
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
  glossary = [],
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
  glossary?: StudyGlossaryItem[];
  conversation: StudyErrorConversation;
  onConversationChange: (
    update: (current: StudyErrorConversation) => StudyErrorConversation
  ) => void;
}) {
  const locale = useOptionalAppLocale();
  const english = locale === 'en';
  const t = (value: string) => reviewUiText(locale, value);
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
  // El mismo modo guiado se usa desde Progreso y desde Mis errores
  // cuando la dificultad tiene un PDF asociado. Sin PDF mantenemos la
  // pantalla que permite asociarlo; no prometemos comprobación sin fuente.
  const topicReinforcement = Boolean(materialId) && (topicContext || !embedded);
  const originalExplanation = item.explanation?.trim() ?? '';
  const groundedContrast = buildGroundedErrorContrast(
    item.selectedAnswer,
    item.correctAnswer,
    glossary
  );
  const pendingHelp =
    busy === 'why_wrong' || busy === 'simpler' || busy === 'example' ? busy : null;
  const helpNotice = ['why_wrong', 'simpler', 'example', 'review'].includes(noticeAction ?? '');
  const sourceNotice = noticeAction === 'source' || noticeAction === 'associate';
  const inlineNotice = notice ? (
    <p
      role="alert"
      className="border-destructive/40 !text-foreground mt-5 border-l-2 pl-3 !text-cuerpo"
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

  const closeInlineEvi = () => undefined;
  const explanationText =
    groundedContrast ||
    (originalExplanation && !sameMeaning(originalExplanation, item.correctAnswer ?? '')
      ? originalExplanation
      : '');
  const eviContext: EviChatContext = {
    kind: 'error',
    errorId: item.id,
    materialId,
    label: [
      english ? 'Mistake' : 'Error',
      item.topic,
      source?.pageStart ? (english ? 'p. ' : 'pág. ') + source.pageStart : '',
    ]
      .filter(Boolean)
      .join(' · '),
  };
  const eviErrorCheck: EviErrorCheck | undefined =
    materialId && !resolved
      ? {
          generate: async () => {
            if (!reviewed) {
              const marked = await reviewActions.markReviewed(item.id);
              if (!marked.success)
                return {
                  message: t('No pudimos guardar el repaso. Reintentá antes de comprobarlo.'),
                };
              setReviewed(true);
            }
            const generated = await reviewActions.generateCheck(item.id, materialId);
            return generated.success && generated.question
              ? { question: generated.question }
              : { message: generated.message ?? t('No pudimos preparar la pregunta.') };
          },
          submit: (checkId, index) => reviewActions.submitCheck(checkId, index),
          onResolved: (resolvedAt) =>
            onProgress({
              status: 'resolved',
              resolvedAt,
              lastReviewedAt: new Date().toISOString(),
            }),
        }
      : undefined;

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
    if (!embedded || topicReinforcement || resolved || messages.length || automaticHelpStarted.current) return;
    automaticHelpStarted.current = true;
    startAutomaticHelp();
  }, [embedded, topicReinforcement, resolved, messages.length]);

  async function run(name: string, task: () => Promise<void>) {
    if (operation.current) return;
    operation.current = true;
    setBusy(name);
    setNotice('');
    setNoticeAction(name);
    try {
      await task();
    } catch {
      setNotice(t('No pudimos completar la acción. Revisá tu conexión y reintentá.'));
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
            setNotice(t('No pudimos guardar el repaso. Reintentá antes de comprobarlo.'));
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
        setNotice(english ? t('No pudimos generar la ayuda.') : (generated.message ?? 'No pudimos generar la ayuda.'));
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
        setNotice(english ? t('No pudimos abrir el fragmento.') : (loaded.message ?? 'No pudimos abrir el fragmento.'));
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
      // En el recorrido por tema, leer la explicación guardada no genera IA.
      // Registrar el repaso al comprobar, sin omitir la validación del servidor.
      if (topicReinforcement && !reviewed) {
        const marked = await reviewActions.markReviewed(item.id);
        if (!marked.success) {
          setNotice(t('No pudimos guardar el repaso. Reintentá antes de comprobarlo.'));
          return;
        }
        setReviewed(true);
      }
      const generated = await reviewActions.generateCheck(item.id, materialId);
      if (!generated.success || !generated.question) {
        setNotice(english ? t('No pudimos preparar la pregunta.') : (generated.message ?? 'No pudimos preparar la pregunta.'));
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
        setNotice(english ? t('No pudimos guardar la respuesta.') : (checked.message ?? 'No pudimos guardar la respuesta.'));
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
        else setNotice(t('No pudimos guardar el repaso. Reintentá antes de comprobarlo.'));
      });
  }
  return (
    <div className="w-full min-w-0">
      {topicReinforcement && !question ? (
        <div
          className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:items-start lg:gap-10"
          data-topic-reinforcement
        >
          <article className="min-w-0 space-y-6">
            <div data-study-error-tour="error">
              <p className="text-muted-foreground text-chico">
                {resolved
                  ? english
                    ? 'Review completed'
                    : 'Refuerzo completado'
                  : `${item.failureCount} ${english ? (item.failureCount === 1 ? 'difficult attempt' : 'difficult attempts') : item.failureCount === 1 ? 'intento con dificultad' : 'intentos con dificultad'}`}
              </p>
              <h2
                ref={heading}
                tabIndex={-1}
                className="text-foreground text-titulo-sm tracking-titulo mt-2 font-semibold break-words outline-none"
              >
                {item.prompt}
              </h2>
              {item.selectedAnswer ? (
                <p className="text-destructive text-ui mt-2 flex items-start gap-2">
                  <X className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span className="break-words">
                    {english ? 'You answered: ' : 'Respondiste: '}
                    {item.selectedAnswer}
                  </span>
                </p>
              ) : null}
            </div>

            {item.correctAnswer ? (
              <section aria-labelledby={`correct-${item.id}`}>
                <h3
                  id={`correct-${item.id}`}
                  className="text-chico tracking-etiqueta font-semibold text-emerald-700 uppercase"
                >
                  {english ? 'The correct answer' : 'La respuesta correcta'}
                </h3>
                <ul className="mt-3 space-y-2.5">
                  {answerItems(item.correctAnswer).map((line, index) => {
                    const colon = line.indexOf(':');
                    return (
                      <li key={index} className="text-cuerpo text-foreground leading-7 break-words">
                        {colon > 0 && colon < 70 ? (
                          <>
                            <strong className="font-semibold">{line.slice(0, colon + 1)}</strong>
                            {line.slice(colon + 1)}
                          </>
                        ) : (
                          line
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            <div
              ref={response}
              tabIndex={-1}
              className="min-w-0 scroll-mt-24 space-y-4 outline-none"
              data-study-error-tour="understand"
            >
              {explanationText ? (
                <section>
                  <h3 className="text-muted-foreground text-chico tracking-etiqueta font-semibold uppercase">
                    {english ? 'Why' : 'Por qué'}
                  </h3>
                  <p className="text-foreground/80 text-cuerpo mt-2 max-w-[72ch] leading-7 break-words whitespace-pre-line">
                    {explanationText}
                  </p>
                </section>
              ) : null}
              {messages.map((message) => (
                <section key={message.kind}>
                  <h3 className="text-muted-foreground text-chico tracking-etiqueta font-semibold uppercase">
                    {t(
                      message.kind === 'simpler'
                        ? 'Explicación más simple'
                        : message.kind === 'example'
                          ? 'Un ejemplo para entenderlo'
                          : 'Explicación adicional'
                    )}
                  </h3>
                  <p className="text-foreground/80 text-cuerpo mt-2 max-w-[72ch] leading-7 break-words whitespace-pre-line">
                    {message.text}
                  </p>
                </section>
              ))}
              {source ? (
                <div
                  className="text-ui text-foreground/80 flex flex-wrap items-center gap-x-3 gap-y-1"
                  data-study-error-tour="source"
                >
                  <span className="inline-flex items-center gap-2">
                    <FileText className="text-primary size-4" aria-hidden="true" />
                    {pageLabel(source.pageStart, source.pageEnd, english)
                      ? english
                        ? `It is on ${pageLabel(source.pageStart, source.pageEnd, english)} of your notes`
                        : `Está en la ${pageLabel(source.pageStart, source.pageEnd, english)} de tu apunte`
                      : english
                        ? `It is in ${source.materialTitle}`
                        : `Está en ${source.materialTitle}`}
                  </span>
                  {source.materialId ? (
                    <Link
                      href={
                        documentHref
                          ? `${documentHref}${source.pageStart ? `#page=${source.pageStart}` : ''}`
                          : `/materiales/${source.materialId}${source.pageStart ? `?page=${source.pageStart}` : ''}`
                      }
                      className="text-primary inline-flex min-h-10 items-center font-semibold hover:underline"
                    >
                      {english ? 'View in my PDF →' : 'Ver en mi PDF →'}
                    </Link>
                  ) : null}
                </div>
              ) : null}
              {(helpNotice || sourceNotice) && inlineNotice}
            </div>

            {resolved ? (
              <section className="rounded-2xl bg-emerald-50/70 p-5">
                <h3 className="text-cuerpo font-semibold text-emerald-800">
                  {english ? 'This mistake is resolved' : 'Este error quedó resuelto'}
                </h3>
                <p className="text-muted-foreground text-cuerpo mt-2 leading-6">
                  {t(
                    'Haber resuelto esta pregunta no significa dominar todo el tema. Podés continuar estudiando.'
                  )}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {pendingCount > 0 && (
                    <button className={reviewPrimaryButton} onClick={onNext}>
                      {t(topicContext ? 'Reforzar otra dificultad' : 'Seguir con otro error')}{' '}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    className={pendingCount > 0 ? reviewSecondaryButton : reviewPrimaryButton}
                    onClick={onFinish}
                  >
                    {t(topicContext ? 'Volver al tema' : 'Terminar por hoy')}
                  </button>
                </div>
              </section>
            ) : (
              <section className="border-border border-t pt-5" data-study-error-tour="practice">
                {materialId ? (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <button
                      type="button"
                      className={reviewPrimaryButton}
                      disabled={Boolean(busy)}
                      onClick={checkUnderstanding}
                    >
                      {busy === 'check' && <Loader2 className="h-4 w-4 animate-spin" />}
                      {english ? 'Try another question' : 'Probar con otra pregunta'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <span className="text-muted-foreground text-ui">
                      {english
                        ? 'If you get it right, this mistake is resolved.'
                        : 'Si la acertás, este error queda resuelto.'}
                    </span>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-cuerpo">
                    {t(
                      'Necesitás asociar un PDF para comprobar esta dificultad con una nueva pregunta.'
                    )}
                  </p>
                )}
                {noticeAction === 'check' && inlineNotice}
                <EviChatLauncher
                  className="mt-4 lg:hidden"
                  chosen={item.selectedAnswer ?? null}
                  context={eviContext}
                  errorCheck={eviErrorCheck}
                />
              </section>
            )}
          </article>
          {!resolved ? (
            <div
              data-evi-chat-docked
              className="border-border hidden min-w-0 border-l pl-6 lg:sticky lg:top-2 lg:block lg:h-[calc(100dvh-11rem)] lg:min-h-[440px]"
            >
              <EviChatPanel
                inline
                open
                onClose={closeInlineEvi}
                context={eviContext}
                chosen={item.selectedAnswer ?? null}
                errorCheck={eviErrorCheck}
              />
            </div>
          ) : null}
        </div>
      ) : question ? (
        <>
          <h2
            ref={heading}
            tabIndex={-1}
            className="scroll-mt-24 text-titulo-sm font-semibold tracking-titulo outline-none sm:text-titulo"
          >
            {t("Comprobá lo aprendido")}
          </h2>
          <p className="!text-muted-foreground mt-2 !text-cuerpo">
            {t("Mismo concepto, una situación diferente. Respondé sin consultar la explicación.")}
          </p>
          <p className="!text-foreground mt-3 !text-cuerpo">{question.question}</p>
          <fieldset className="mt-6 space-y-3" disabled={Boolean(result) || Boolean(busy)}>
            <legend className="sr-only">{t("Elegí una respuesta")}</legend>
            {question.options.map((option, index) => (
              <label
                key={index}
                className={`flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-3 ${result && !result.correct && answer === index ? 'border-destructive bg-destructive/5' : result?.correctIndex === index ? 'border-emerald-500 bg-emerald-50' : !result && answer === index ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <input
                  type="radio"
                  name={`review-${question.id}`}
                  checked={answer === index}
                  onChange={() => setAnswer(index)}
                  className="accent-primary mt-1 shrink-0"
                />
                <span className="min-w-0 text-cuerpo leading-6 break-words">
                  {option}
                  {result && (result.correctIndex === index || answer === index) && (
                    <span
                      className={`mt-1 block text-chico font-semibold ${result.correctIndex === index ? 'text-primary' : 'text-destructive'}`}
                    >
                      {t(result.correctIndex === index ? 'Respuesta correcta' : 'Tu respuesta incorrecta')}
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
                {t("Volver al repaso")}
              </button>
            </div>
          ) : (
            <div role="status" className="border-border mt-6 border-t pt-6">
              <h3
                ref={resultHeading}
                tabIndex={-1}
                className="flex items-center gap-2 text-titulo-sm font-semibold outline-none"
              >
                {result.correct ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                ) : (
                  <CircleAlert className="text-destructive h-5 w-5" />
                )}
                {t(result.correct ? 'Resolviste el refuerzo' : 'Todavía queda por reforzar')}
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
              <p className="!text-foreground mt-3 !text-cuerpo">{result.feedback}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {result.correct ? (
                  <>
                    {embedded && (
                      <button className={reviewPrimaryButton} onClick={onFinish}>
                        {t(topicContext ? 'Volver al tema' : 'Volver a Progreso')}
                      </button>
                    )}
                    <button
                      className={embedded ? reviewSecondaryButton : reviewPrimaryButton}
                      disabled={pendingCount === 0}
                      onClick={onNext}
                    >
                      {t(topicContext ? 'Reforzar otra dificultad' : 'Seguir con otro error')}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    {!embedded && (
                      <button className={reviewSecondaryButton} onClick={onFinish}>
                        {t("Terminar por hoy")}
                      </button>
                    )}
                  </>
                ) : (
                  <button className={reviewPrimaryButton} onClick={returnToReview}>
                    {t("Volver a la explicación")}
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div data-study-error-tour="error">
            <div className="mb-3 flex flex-wrap gap-2 text-chico">
              <span className="text-muted-foreground py-1 text-chico">
                {t(studyErrorSourceLabels[item.sourceType])}
              </span>
              <span className="text-muted-foreground py-1">
                {resolved ? t('Resuelto después del repaso') : `${item.failureCount} ${english ? (item.failureCount === 1 ? 'difficult attempt' : 'difficult attempts') : (item.failureCount === 1 ? 'intento con dificultad' : 'intentos con dificultad')}`}
              </span>
            </div>
            <h2
              ref={heading}
              tabIndex={-1}
              className={
                embedded
                  ? 'sr-only'
                  : 'scroll-mt-24 text-titulo font-black tracking-titulo break-words outline-none sm:text-destacado'
              }
            >
              {item.topic}
            </h2>
            <p className={`!text-foreground break-words ${embedded ? 'mt-2' : 'mt-4'}`}>
              {item.prompt}
            </p>
            {(item.selectedAnswer || item.correctAnswer) && (
              <details open={embedded || undefined} className="group mt-3">
                <summary className="text-muted-foreground hover:text-foreground focus-visible:outline-ring flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 text-cuerpo focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
                  {t("Ver mi respuesta anterior")}
                  <ChevronDown
                    className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </summary>
                <div className="mt-2 grid gap-4 pb-2 sm:grid-cols-2">
                  {item.selectedAnswer && (
                    <div className="border-destructive/40 border-l-2 pl-4">
                      <p className="!text-destructive !text-chico font-semibold">
                        {t("Respuesta incorrecta")}
                      </p>
                      <p className="!text-foreground mt-2 !text-cuerpo break-words">
                        {item.selectedAnswer}
                      </p>
                    </div>
                  )}
                  {item.correctAnswer && (
                    <div className="border-l-2 border-emerald-500/40 pl-4">
                      <p className="!text-chico font-semibold !text-emerald-700">{t("Respuesta correcta")}</p>
                      <p className="!text-foreground mt-2 !text-cuerpo break-words">
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
              {!resolved ? (
                <EviChatLauncher
                  className="mt-3"
                  chosen={item.selectedAnswer ?? null}
                  context={eviContext}
                  errorCheck={eviErrorCheck}
                />
              ) : null}
            </div>
          </section>
          <section data-study-error-tour="source" className="mt-3">
            {source ? (
              <>
                <button
                  className="text-muted-foreground hover:text-primary focus-visible:outline-ring flex min-h-11 w-full items-start gap-2 py-3 text-left text-chico leading-5 transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 sm:text-cuerpo"
                  disabled={Boolean(busy)}
                  onClick={openSource}
                  aria-expanded={sourceOpen}
                  aria-controls={`source-${item.id}`}
                >
                  <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 text-etiqueta leading-4 break-words">
                    {english ? 'Source:' : 'Fuente:'} {source.sectionTitle ?? source.materialTitle}
                    {pageLabel(source.pageStart, source.pageEnd, english)
                      ? ` · ${pageLabel(source.pageStart, source.pageEnd, english)}`
                      : ''}{' '}
                    <span className="text-primary font-medium">
                      — {t(sourceOpen ? 'Cerrar fragmento' : 'Ver fragmento')}
                    </span>
                  </span>
                  <ChevronDown
                    className={`mt-0.5 h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none ${sourceOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {sourceOpen && (
                  <div id={`source-${item.id}`} className="border-primary/30 mt-2 border-l-2 pl-4">
                    <blockquote className="text-cuerpo leading-7 break-words whitespace-pre-line">
                      {source.excerpt}
                    </blockquote>
                    <p className="!text-muted-foreground mt-3 !text-chico">
                      {source.materialTitle}
                      {pageLabel(source.pageStart, source.pageEnd, english)
                        ? ` · ${pageLabel(source.pageStart, source.pageEnd, english)}`
                        : ''}
                    </p>
                    <Link
                      href={
                        documentHref
                          ? `${documentHref}${source.pageStart ? `#page=${source.pageStart}` : ''}`
                          : `/materiales/${source.materialId}${source.pageStart ? `?page=${source.pageStart}` : ''}`
                      }
                      className="text-primary mt-2 inline-flex min-h-11 items-center text-chico font-semibold underline"
                    >
                      {t("Abrir PDF completo")}
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="border-border mt-5 border-l-2 pl-4">
                <h3 className="text-cuerpo font-semibold">
                  {t("Este error todavía no tiene un PDF asociado")}
                </h3>
                <p className="!text-muted-foreground mt-2 !text-cuerpo">
                  Elegí tus apuntes. Evaluo verificará si contienen información para repasar este
                  concepto.
                </p>
                {materials.length > 0 && !resolved && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <select
                      aria-label={t("PDF para asociar")}
                      value={associateId}
                      onChange={(event) => setAssociateId(event.target.value)}
                      className="border-border bg-background min-h-11 min-w-0 flex-1 rounded-xl border px-3 text-cuerpo"
                    >
                      <option value="">{t("Elegir mi material")}</option>
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
                            setNotice(english ? t('No pudimos asociarlo.') : (associated.message ?? 'No pudimos asociarlo.'));
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
                      {t("Asociar PDF")}
                    </button>
                  </div>
                )}
                <Link
                  href={`/dashboard/materiales?openUpload=1&source=study_error${item.materiaId ? `&materiaId=${item.materiaId}` : ''}`}
                  className="text-primary mt-3 inline-flex min-h-11 items-center text-cuerpo font-semibold underline"
                >
                  {t("Subir mis apuntes")}
                </Link>
              </div>
            )}
            {sourceNotice && inlineNotice}
          </section>
          {(resolved || !materialId || reviewed || noticeAction === 'check') && (
            <section data-study-error-tour="practice" className="border-border mt-3 border-t pt-3">
              {resolved ? (
                <p className="!text-foreground !text-cuerpo">
                  {t("Este error quedó resuelto después de tu repaso.")}
                </p>
              ) : materialId && reviewed ? (
                <>
                  <p className="!text-foreground font-semibold">
                    {t("¿Querés probar con otra situación?")}
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
                <p className="!text-muted-foreground !text-cuerpo">
                  {t("Asociá un PDF para comprobar lo aprendido con una pregunta basada en tu material.")}
                </p>
              ) : null}
              {activityHref && resolved && (
                <Link
                  href={activityHref}
                  className="text-muted-foreground mt-3 inline-flex min-h-11 w-fit items-center py-2 text-chico font-semibold underline"
                >
                  {t("Volver a la actividad original")}
                </Link>
              )}
              {noticeAction === 'check' && inlineNotice}
            </section>
          )}
        </>
      )}
      {(question || (!helpNotice && !sourceNotice && noticeAction !== 'check')) && inlineNotice}
      {!question && resolved && (
        <div className="border-border mt-4 flex flex-wrap gap-2 border-t pt-3">
          <button
            className={reviewSecondaryButton}
            disabled={Boolean(busy) || pendingCount <= (resolved ? 0 : 1)}
            onClick={onNext}
          >
            {t(topicContext ? 'Reforzar otra dificultad' : 'Seguir con otro error')}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button className={reviewSecondaryButton} disabled={Boolean(busy)} onClick={onFinish}>
            {t(topicContext ? 'Volver al tema' : 'Terminar por hoy')}
          </button>
        </div>
      )}
    </div>
  );
}
