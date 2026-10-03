'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, CircleAlert, Loader2, Sparkles } from 'lucide-react';
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

export const reviewPrimaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
export const reviewSecondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
export const studyErrorSourceLabels = {
  simulator: 'Preguntero',
  flashcard: 'Flashcards',
  exercise: 'Práctica',
  diagnostic: 'Diagnóstico',
};
const helpLabels = {
  why_wrong: 'Ayudame a entenderlo',
  simpler: 'Más simple',
  example: 'Dame un ejemplo',
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
}: {
  item: StudyErrorView;
  materials: StudyErrorsPageData['materials'];
  pendingCount: number;
  onProgress: (changes: Partial<StudyErrorView>) => void;
  onAssociate: (materialId: string) => void;
  onNext: () => void;
  onFinish: () => void;
}) {
  const [messages, setMessages] = useState<Array<{ kind: ReviewHelpKind; text: string }>>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [source, setSource] = useState(item.recommendation);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [reviewed, setReviewed] = useState(Boolean(item.lastReviewedAt));
  const [question, setQuestion] = useState<ReviewQuestion | null>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [result, setResult] = useState<ReviewAnswerResult | null>(null);
  const [associateId, setAssociateId] = useState('');
  const operation = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const response = useRef<HTMLDivElement>(null);
  const materialId = source?.materialId ?? item.recommendation?.materialId ?? null;
  const resolved = item.status === 'resolved';
  const activityHref =
    item.sourceType === 'simulator' && item.materiaId
      ? `/simulador/errores/${item.materiaId}?parcial=${item.parcial ?? 1}`
      : materialId
        ? `/materiales/${materialId}?studyError=${item.id}`
        : null;

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [item.id, question?.id]);

  async function run(name: string, task: () => Promise<void>) {
    if (operation.current) return;
    operation.current = true;
    setBusy(name);
    setNotice('');
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
    void run(kind, async () => {
      const generated = await generateReviewHelpAction(item.id, kind, materialId);
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
      requestAnimationFrame(() =>
        response.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      );
    });
  }
  function openSource() {
    if (sourceOpen) {
      setSourceOpen(false);
      return;
    }
    if (!materialId) return;
    void run('source', async () => {
      const loaded = await openReviewSourceAction(item.id, materialId);
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
      const generated = await generateReviewCheckAction(item.id, materialId);
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
      const checked = await submitReviewCheckAction(question.id, answer);
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
    if (messages.length && !resolved)
      void run('review', async () => {
        const marked = await markStudyErrorReviewedAction(item.id);
        if (marked.success) setReviewed(true);
        else setNotice('No pudimos guardar el repaso. Reintentá antes de comprobarlo.');
      });
  }
  return (
    <div className="max-w-3xl min-w-0">
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
                className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border px-4 py-4 ${result && !result.correct && answer === index ? 'border-destructive bg-destructive/5' : result?.correctIndex === index || (!result && answer === index) ? 'border-primary bg-primary/5' : 'border-border'}`}
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
              <h3 className="flex items-center gap-2 text-xl font-bold">
                {result.correct ? (
                  <CheckCircle2 className="text-primary h-5 w-5" />
                ) : (
                  <CircleAlert className="text-destructive h-5 w-5" />
                )}
                {result.correct ? 'Resolviste este error.' : 'Todavía queda por reforzar'}
              </h3>
              <p className="!text-foreground mt-2">
                {result.correct
                  ? pendingCount === 0
                    ? 'No te quedan errores pendientes en este PDF.'
                    : pendingCount === 1
                      ? 'Te queda 1 error pendiente en este PDF.'
                      : `Te quedan ${pendingCount} errores pendientes en este PDF.`
                  : 'El error sigue pendiente. Volvé a la explicación y pedí una versión más simple o un ejemplo.'}
              </p>
              <p className="!text-foreground mt-3 !text-sm">{result.feedback}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {result.correct ? (
                  <>
                    <button
                      className={reviewPrimaryButton}
                      disabled={pendingCount === 0}
                      onClick={onNext}
                    >
                      Seguir con otro error
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button className={reviewSecondaryButton} onClick={onFinish}>
                      Terminar por hoy
                    </button>
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
              <span className="bg-muted rounded-full px-3 py-1">
                {studyErrorSourceLabels[item.sourceType]}
              </span>
              <span className="bg-muted rounded-full px-3 py-1">
                {resolved
                  ? 'Resuelto después del repaso'
                  : `Fallaste ${item.failureCount} ${item.failureCount === 1 ? 'vez' : 'veces'}`}
              </span>
            </div>
            <h2
              ref={heading}
              tabIndex={-1}
              className="scroll-mt-24 text-2xl font-black tracking-tighter break-words outline-none sm:text-3xl"
            >
              {item.topic}
            </h2>
            <p className="!text-foreground mt-4 break-words">{item.prompt}</p>
          </div>
          <section data-study-error-tour="understand" className="border-border mt-7 border-t pt-6">
            <h3 className="flex items-center gap-2 font-bold">
              <Sparkles className="text-primary h-5 w-5" />
              Entendé qué te confundió
            </h3>
            <p className="!text-muted-foreground mt-2 !text-sm">
              {materialId
                ? 'Evaluo te ayuda a entender este concepto con el contenido de tu PDF.'
                : 'Revisá la corrección y conectá el error con tus apuntes para repasarlo con tu fuente.'}
            </p>
            {!messages.length && !resolved && (
              <button
                className="border-border hover:bg-primary/5 focus-visible:outline-ring mt-4 flex min-h-16 w-full items-center gap-3 border-y py-4 text-left transition focus-visible:outline-2 disabled:opacity-50"
                onClick={() => help('why_wrong')}
                disabled={Boolean(busy)}
              >
                {busy === 'why_wrong' ? (
                  <Loader2 className="text-primary h-5 w-5 shrink-0 animate-spin" />
                ) : (
                  <Sparkles className="text-primary h-5 w-5 shrink-0" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="text-primary block text-sm font-semibold">
                    Ayudame a entenderlo
                  </span>
                  <span className="text-muted-foreground mt-1 block text-xs">
                    Recibí una explicación clara, paso a paso{materialId ? ', con tu PDF' : ''}.
                  </span>
                </span>
                <ArrowRight className="text-primary h-4 w-4 shrink-0" />
              </button>
            )}
            {resolved && !messages.length && item.explanation && (
              <p className="!text-foreground mt-4 !text-sm whitespace-pre-line">
                {item.explanation}
              </p>
            )}
            <div
              ref={response}
              aria-live="polite"
              aria-busy={Boolean(busy && ['why_wrong', 'simpler', 'example'].includes(busy))}
            >
              {messages.map((message) => (
                <div key={message.kind} className="border-primary/30 mt-5 border-l-2 pl-4">
                  <p className="!text-primary !text-xs font-semibold">{helpLabels[message.kind]}</p>
                  <p className="!text-foreground mt-2 !text-sm break-words whitespace-pre-line">
                    {message.text}
                  </p>
                </div>
              ))}
              {busy && ['why_wrong', 'simpler', 'example'].includes(busy) && (
                <p
                  role="status"
                  className="!text-muted-foreground mt-4 flex items-center gap-2 !text-sm"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {materialId
                    ? 'Estoy revisando el fragmento de tu PDF…'
                    : 'Estoy preparando la explicación…'}
                </p>
              )}
            </div>
            {messages.length > 0 && !resolved && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(['simpler', 'example'] as const).map((kind) => (
                  <button
                    key={kind}
                    className={reviewSecondaryButton}
                    disabled={Boolean(busy) || messages[messages.length - 1]?.kind === kind}
                    onClick={() => help(kind)}
                  >
                    {helpLabels[kind]}
                  </button>
                ))}
              </div>
            )}
          </section>
          <section data-study-error-tour="source" className="mt-3">
            {source ? (
              <>
                <button
                  className="text-primary flex min-h-11 w-full items-start gap-2 py-3 text-left text-xs font-semibold underline underline-offset-4 disabled:opacity-50"
                  disabled={Boolean(busy)}
                  onClick={openSource}
                  aria-expanded={sourceOpen}
                  aria-controls={`source-${item.id}`}
                >
                  <BookOpen className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 break-words">
                    Fuente: {source.sectionTitle ?? source.materialTitle}
                    {pageLabel(source.pageStart, source.pageEnd)
                      ? ` · ${pageLabel(source.pageStart, source.pageEnd)}`
                      : ''}{' '}
                    — {sourceOpen ? 'Cerrar fragmento' : 'Ver fragmento'}
                  </span>
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
                      href={`/materiales/${source.materialId}${source.pageStart ? `?page=${source.pageStart}` : ''}`}
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
                          const associated = await associateReviewPdfAction(item.id, associateId);
                          if (!associated.success || !associated.source) {
                            setNotice(associated.message ?? 'No pudimos asociarlo.');
                            return;
                          }
                          setSource(associated.source);
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
          </section>
          {(item.selectedAnswer || item.correctAnswer) && (
            <div className="border-border mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2">
              {item.selectedAnswer && (
                <div className="border-destructive/40 border-l-2 pl-4">
                  <p className="!text-destructive !text-xs font-semibold">Respuesta incorrecta</p>
                  <p className="!text-foreground mt-2 !text-sm break-words">
                    {item.selectedAnswer}
                  </p>
                </div>
              )}
              {item.correctAnswer && (
                <div className="border-primary/40 border-l-2 pl-4">
                  <p className="!text-primary !text-xs font-semibold">Respuesta correcta</p>
                  <p className="!text-foreground mt-2 !text-sm break-words">{item.correctAnswer}</p>
                </div>
              )}
            </div>
          )}
          <section data-study-error-tour="practice" className="border-border mt-6 border-t pt-5">
            {resolved ? (
              <p className="!text-foreground !text-sm">
                Este error quedó resuelto después de tu repaso.
              </p>
            ) : materialId && reviewed ? (
              <>
                <p className="!text-foreground font-semibold">
                  ¿Querés comprobar si lo entendiste?
                </p>
                <button
                  className={reviewPrimaryButton + ' mt-3'}
                  disabled={Boolean(busy)}
                  onClick={checkUnderstanding}
                >
                  {busy === 'check' && <Loader2 className="h-4 w-4 animate-spin" />}Responder una
                  pregunta
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <p className="!text-muted-foreground !text-sm">
                {materialId
                  ? 'Pedí una explicación o leé el fragmento. Después podés comprobarlo con una pregunta diferente.'
                  : 'Asociá un PDF para comprobar lo aprendido con una pregunta basada en tu material.'}
              </p>
            )}
            {activityHref && (
              <Link
                href={activityHref}
                className="text-muted-foreground mt-3 block w-fit py-2 text-xs font-semibold underline"
              >
                Volver a la actividad original
              </Link>
            )}
          </section>
        </>
      )}
      {notice && (
        <p
          role="alert"
          className="border-destructive/40 !text-foreground mt-5 border-l-2 pl-3 !text-sm"
        >
          {notice}
        </p>
      )}
      {!question && (
        <div className="border-border mt-7 flex flex-wrap gap-3 border-t pt-5">
          <button
            className={reviewSecondaryButton}
            disabled={Boolean(busy) || pendingCount <= (resolved ? 0 : 1)}
            onClick={onNext}
          >
            Seguir con otro error
            <ArrowRight className="h-4 w-4" />
          </button>
          <button className={reviewSecondaryButton} disabled={Boolean(busy)} onClick={onFinish}>
            Terminar por hoy
          </button>
        </div>
      )}
    </div>
  );
}
