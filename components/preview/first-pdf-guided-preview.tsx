'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, FileText, Sparkles } from 'lucide-react';
import { AppShellProviders } from '@/components/app-shell-providers';
import { MaterialStudyWorkspace, type StudyTabId } from '@/components/material-study-workspace';
import { Button } from '@/components/ui/button';
import { trackClientAnalyticsEvent } from '@/lib/analytics-client';
import {
  createFirstPdfDemoTracker,
  FIRST_PDF_DEMO_SOURCE,
  rememberFirstPdfDemoUpload,
} from '@/lib/first-pdf-demo-analytics';
import { PdfTourSpotlight } from './pdf-tour-spotlight';
import { sampleSummary, sampleGlossary, sampleArtifacts } from './first-pdf-sample-study';
import {
  demoQuestions,
  samplePdf,
  transferQuestion,
  comparisonTransferQuestion,
} from './first-pdf-preview-data';

const studySteps: {
  tab: StudyTabId;
  selector: string;
  title: string;
  description: string;
  compactDescription: string;
  nextLabel: string;
}[] = [
  {
    tab: 'resumen',
    selector: '[data-demo-focus="pdf"]',
    title: 'Todo empieza en tu PDF',
    description:
      'Vas a repasar, practicar y resolver un error con este PDF de muestra. Así funciona Evaluo con tu material.',
    nextLabel: 'Ver resumen',
    compactDescription:
      'Este PDF de muestra funciona como tu material: repaso, práctica y errores.',
  },
  {
    tab: 'resumen',
    selector: '[data-demo-focus="study-section"][data-state="active"]',
    title: 'Acá vas a ver todo tu resumen',
    description:
      'El resumen organiza el PDF por temas. Leé las ideas principales y consultá el original cuando lo necesites.',
    nextLabel: 'Ver glosario',
    compactDescription: 'Leé las ideas principales. Desplazate para ver el resumen completo.',
  },
  {
    tab: 'glosario',
    selector: '[data-demo-focus="study-section"][data-state="active"]',
    title: 'Glosario: aclarás los conceptos',
    description:
      'Acá encontrás los términos del PDF y sus definiciones. Consultalos cuando una palabra te frene.',
    nextLabel: 'Probar tarjetas',
    compactDescription: 'Encontrá los términos del PDF y sus definiciones.',
  },
  {
    tab: 'tarjetas',
    selector: '[data-demo-focus="study-section"][data-state="active"]',
    title: 'Tarjetas: intentá recordar',
    description:
      'Pensá una respuesta y tocá la tarjeta para compararla. Después indicá si lo sabías.',
    nextLabel: 'Ver mapa mental',
    compactDescription: 'Tocá la tarjeta para ver la respuesta e indicá si lo sabías.',
  },
  {
    tab: 'mapa',
    selector: '[data-demo-focus="study-section"][data-state="active"]',
    title: 'Mapa mental: conectás las ideas',
    description:
      'Desplazate por el mapa para ver los temas y conceptos del PDF. Esta función Premium está incluida en la muestra.',
    nextLabel: 'Ir a práctica',
    compactDescription: 'Mirá cómo se organizan los temas y conceptos del PDF.',
  },
  {
    tab: 'ejercicios',
    selector: '[data-demo-focus="practice"]',
    title: 'Ahora probá lo que entendiste',
    description:
      'Respondé hasta tres preguntas. Al primer error vamos a Mis errores para repasar ese concepto. Sin nota ni reloj.',
    nextLabel: 'Empezar práctica',
    compactDescription: 'Hasta tres preguntas. Al primer error vamos a repasarlo.',
  },
];

function Answers({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: number | null;
  onSelect: (index: number) => void;
}) {
  const groupName = useId();
  return (
    <fieldset className="mt-5 space-y-3">
      <legend className="sr-only">Elegí una respuesta</legend>
      {options.map((option, index) => (
        <label
          key={option}
          className={`focus-within:ring-ring/50 flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed transition focus-within:ring-2 ${selected === index ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
        >
          <input
            type="radio"
            name={groupName}
            value={index}
            checked={selected === index}
            onChange={() => onSelect(index)}
            className="accent-primary mt-1 shrink-0"
          />
          {option}
        </label>
      ))}
    </fieldset>
  );
}

export function FirstPdfGuidedPreview() {
  return (
    <AppShellProviders>
      <GuidedMaterial />
    </AppShellProviders>
  );
}

function GuidedMaterial() {
  const analytics = useRef<ReturnType<typeof createFirstPdfDemoTracker> | null>(null);
  const practiceEntry = useRef('guided');
  const checkAttempts = useRef(0);
  const [sessionKey, setSessionKey] = useState(0);
  const [screen, setScreen] = useState<'study' | 'errors' | 'check' | 'done'>('study');
  const [step, setStep] = useState<number | null>(0);
  const [tab, setTab] = useState<StudyTabId>('resumen');
  const [viewer, setViewer] = useState(true);
  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [allCorrect, setAllCorrect] = useState(false);
  const [errorIndex, setErrorIndex] = useState(0);
  const [wrongAnswer, setWrongAnswer] = useState<number | null>(null);
  const [illustrative, setIllustrative] = useState(false);
  const [errorStep, setErrorStep] = useState<number | null>(null);
  const [messages, setMessages] = useState<{ prompt: string; answer: string }[]>([]);
  const [fragment, setFragment] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);
  const [resolved, setResolved] = useState(false);
  const getAnalytics = useCallback(() => {
    if (!analytics.current) {
      analytics.current = createFirstPdfDemoTracker({
        runId: crypto.randomUUID(),
        environment: process.env.NODE_ENV,
        emit: (eventName, metadata) => {
          void trackClientAnalyticsEvent({ eventName, metadata }).catch(() => undefined);
        },
      });
    }
    return analytics.current;
  }, []);
  const exit = useCallback(() => {
    getAnalytics().track('demo_material_tour_skipped', { destination: 'free_exploration' });
    practiceEntry.current = 'free_exploration';
    setStep(null);
    setErrorStep(null);
  }, [getAnalytics]);
  const error = demoQuestions[errorIndex]!;
  const question = demoQuestions[questionIndex]!;
  const topic = error.topic;
  const transfer = error.page === 2 ? comparisonTransferQuestion : transferQuestion;

  useEffect(() => {
    const tracker = getAnalytics();
    tracker.track('demo_material_tour_started', {}, 'started');
    if (screen === 'study' && step !== null) {
      tracker.track(
        'demo_material_tour_step_viewed',
        {
          step: step + 1,
          total_steps: studySteps.length,
          target: step === 0 ? 'pdf' : studySteps[step]!.tab,
        },
        `study-step-${step}`
      );
    }
    if (screen === 'errors') {
      tracker.checkpoint(
        'errors_viewed',
        { error_kind: illustrative ? 'illustrative' : 'real' },
        'errors-viewed'
      );
    }
    if (allCorrect)
      tracker.checkpoint('practice_completed', { correct: true }, 'practice-completed');
    if (screen === 'done') {
      tracker.track(
        'demo_material_tour_completed',
        {
          outcome: resolved ? 'concept_checked' : 'practice_completed',
          error_kind: resolved ? (illustrative ? 'illustrative' : 'real') : 'none',
        },
        'completed'
      );
    }
  }, [getAnalytics, sessionKey, screen, step, illustrative, resolved, allCorrect]);

  const openError = useCallback((index: number, answer: number | null, isIllustrative = false) => {
    setErrorIndex(index);
    setWrongAnswer(answer);
    setIllustrative(isIllustrative);
    setMessages([]);
    setCheckFailed(false);
    setResolved(false);
    setFragment(false);
    setFeedback(null);
    setSelected(null);
    setStep(null);
    setErrorStep(0);
    setScreen('errors');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    if (feedback !== 'wrong') return;
    const timer = window.setTimeout(() => openError(questionIndex, selected), 2200);
    return () => window.clearTimeout(timer);
  }, [feedback, openError, questionIndex, selected]);

  function goStep(index: number) {
    const next = studySteps[index]!;
    setStep(index);
    setTab(next.tab);
    setViewer(index === 0);
  }
  function explain(prompt: string, answer: string) {
    if (messages.some((message) => message.prompt === prompt)) return;
    getAnalytics().checkpoint('help_used', {
      help_kind:
        prompt === 'Más simple'
          ? 'simpler'
          : prompt === 'Dame un ejemplo'
            ? 'example'
            : 'explanation',
      error_kind: illustrative ? 'illustrative' : 'real',
    });
    setMessages((current) =>
      current.some((message) => message.prompt === prompt)
        ? current
        : [...current, { prompt, answer }]
    );
  }
  const focusContent = useCallback((selector: string) => {
    const node = Array.from(document.querySelectorAll<HTMLElement>(selector)).find(
      (item) => item.getClientRects().length > 0
    );
    node?.scrollIntoView({ block: 'start', behavior: 'instant' });
    node?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (step !== null || errorStep !== null) return;
    if (screen === 'study' && started) focusContent('[data-demo-focus="practice"] h2');
    else if (screen === 'check' || screen === 'done') focusContent('main h1');
    else if (screen === 'errors' && checkFailed) focusContent('[data-demo-check-feedback]');
    else if (screen === 'errors' && !messages.length) focusContent('main h1');
  }, [
    screen,
    step,
    errorStep,
    started,
    questionIndex,
    allCorrect,
    focusContent,
    messages.length,
    checkFailed,
  ]);
  useEffect(() => {
    if (screen === 'errors' && errorStep === null && messages.length && !checkFailed)
      focusContent('[data-demo-reply]:last-child');
  }, [screen, errorStep, messages.length, focusContent, checkFailed]);
  function nextQuestion() {
    if (questionIndex === demoQuestions.length - 1) setAllCorrect(true);
    else setQuestionIndex((current) => current + 1);
    setSelected(null);
    setFeedback(null);
  }
  function startPractice() {
    getAnalytics().checkpoint(
      'practice_started',
      { entry: practiceEntry.current },
      'practice-started'
    );
    setStarted(true);
    setStep(null);
  }
  function skipToPractice() {
    getAnalytics().track(
      'demo_material_tour_skipped',
      {
        step: (step ?? 0) + 1,
        total_steps: studySteps.length,
        destination: 'practice',
      },
      'repaso-shortcut'
    );
    practiceEntry.current = 'shortcut';
    goStep(5);
  }
  function confirmPracticeAnswer() {
    if (selected === null) return;
    const correct = selected === question.correct;
    const tracker = getAnalytics();
    tracker.checkpoint('practice_answered', { question_number: questionIndex + 1, correct });
    if (!correct)
      tracker.checkpoint(
        'error_encountered',
        {
          question_number: questionIndex + 1,
          error_kind: 'real',
        },
        'error-encountered'
      );
    setFeedback(correct ? 'correct' : 'wrong');
  }
  function startCheck() {
    getAnalytics().checkpoint('check_started', {
      error_kind: illustrative ? 'illustrative' : 'real',
    });
    setErrorStep(null);
    setCheckFailed(false);
    setScreen('check');
    setSelected(null);
  }
  function restart() {
    analytics.current = null;
    practiceEntry.current = 'guided';
    checkAttempts.current = 0;
    setSessionKey((current) => current + 1);
    setScreen('study');
    setStarted(false);
    setQuestionIndex(0);
    setSelected(null);
    setFeedback(null);
    setAllCorrect(false);
    setMessages([]);
    setErrorStep(null);
    setCheckFailed(false);
    setResolved(false);
    goStep(0);
  }

  const practice = (
    <section data-demo-focus="practice" className="mx-auto max-w-3xl py-5 sm:py-8">
      {!started ? (
        <>
          <p className="text-primary text-xs font-semibold">Práctica de ejemplo · 3 preguntas</p>
          <h2 tabIndex={-1} className="mt-3 text-2xl font-semibold outline-none">
            Probá lo que entendiste
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            Aplicá las ideas del PDF a situaciones simples. Sin nota ni reloj.
          </p>
          <Button className="mt-6" onClick={startPractice}>
            Empezar práctica
            <ArrowRight size={16} />
          </Button>
        </>
      ) : allCorrect ? (
        <>
          <Check className="text-primary" />
          <h2 tabIndex={-1} className="mt-3 text-xl font-semibold outline-none">
            Respondiste las tres preguntas
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            Como acertaste todas, no tenemos un error tuyo para repasar. Podés ver un error de
            ejemplo y conocer cómo funciona Mis errores.
          </p>
          <Button className="mt-5" onClick={() => openError(0, 0, true)}>
            Ver un error de ejemplo
          </Button>
          <Button variant="ghost" className="mt-3" onClick={() => setScreen('done')}>
            Terminar recorrido
          </Button>
        </>
      ) : (
        <>
          <p className="text-primary text-xs font-semibold">
            Pregunta {questionIndex + 1} de 3 · PDF de muestra
          </p>
          <h2 tabIndex={-1} className="mt-3 text-xl leading-relaxed font-semibold outline-none">
            {question.question}
          </h2>
          {!feedback ? (
            <>
              <Answers options={question.options} selected={selected} onSelect={setSelected} />
              <Button className="mt-5" disabled={selected === null} onClick={confirmPracticeAnswer}>
                Confirmar respuesta
              </Button>
            </>
          ) : (
            <div role="status" className="border-border mt-5 border-t pt-5">
              <p className="font-semibold">
                {feedback === 'correct'
                  ? 'Bien, aplicaste el concepto.'
                  : 'Este concepto necesita un repaso.'}
              </p>
              <p className="mt-2 text-sm leading-relaxed">
                Respuesta correcta: {question.options[question.correct]}
              </p>
              {feedback === 'correct' ? (
                <Button className="mt-4" onClick={nextQuestion}>
                  {questionIndex === 2 ? 'Terminar práctica' : 'Siguiente pregunta'}
                </Button>
              ) : (
                <>
                  <p className="text-muted-foreground mt-3 text-sm">
                    Este tema quedó en Mis errores del ejemplo. Vamos a repasarlo.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => openError(questionIndex, selected)}
                  >
                    Abrir Mis errores ahora
                  </Button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );

  return (
    <div
      data-first-pdf-preview
      data-demo-guided={step !== null || errorStep !== null ? true : undefined}
      className={`bg-background text-foreground min-h-screen ${step !== null || errorStep !== null ? 'pb-[100dvh]' : ''}`}
    >
      <header className="border-border grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b px-4 py-3 sm:px-8">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <Link href="/dashboard" className="text-primary font-bold tracking-tight">
            Evaluo
          </Link>
          <span className="text-muted-foreground text-xs">PDF de muestra</span>
        </div>
        <Button size="sm" variant="ghost" onClick={restart}>
          Reiniciar
        </Button>
      </header>
      {screen === 'study' ? (
        <MaterialStudyWorkspace
          key={sessionKey}
          backHref="/dashboard"
          fileName="interpretar-una-investigacion.pdf"
          title={samplePdf.title}
          pageCount={2}
          viewerUrl={samplePdf.url}
          materialId="demo-primer-pdf"
          isOwner={false}
          canRegenerate={false}
          isPremium={true}
          visibility="private"
          studySummary={sampleSummary}
          studyGlossary={sampleGlossary}
          pedagogicalArtifacts={sampleArtifacts}
          demo={{
            activeTab: tab,
            onTabChange: (nextTab) => {
              if (nextTab === 'ejercicios' && step !== null && step < 5) {
                skipToPractice();
                return;
              }
              setTab(nextTab);
              if (step !== null)
                setStep(studySteps.findIndex((item, index) => index > 0 && item.tab === nextTab));
            },
            viewerVisible: viewer,
            onViewerChange: (visible) => {
              setViewer(visible);
              if (step !== null) {
                if (!visible && step === 0) goStep(1);
                else if (visible && step !== 0) goStep(0);
              }
            },
            practice,
          }}
        />
      ) : (
        <main className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
          {screen === 'done' ? (
            <section className="py-8">
              <Check className="text-primary h-9 w-9" />
              <h1 tabIndex={-1} className="mt-4 text-3xl font-semibold outline-none">
                {resolved ? 'Resolviste el error de muestra' : 'Terminaste la práctica de muestra'}
              </h1>
              <p className="text-muted-foreground mt-3 max-w-xl">
                {resolved
                  ? 'Acabás de practicar y repasar un concepto con este material.'
                  : 'Acabás de practicar con este material.'}{' '}
                Ahora probalo con lo que tenés que rendir.
              </p>
              <p className="text-muted-foreground mt-3 text-sm">
                Esta muestra no se mezcla con tus errores ni con tu progreso.
              </p>
              <Button asChild className="mt-6 w-full sm:w-auto">
                <Link
                  href={`/dashboard?openUpload=1&source=${FIRST_PDF_DEMO_SOURCE}`}
                  onClick={() => {
                    const tracker = getAnalytics();
                    rememberFirstPdfDemoUpload(tracker.runId);
                    tracker.track('demo_material_tour_upload_clicked', {}, 'upload-clicked');
                  }}
                >
                  Subir mi PDF
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button variant="ghost" className="mt-4" onClick={restart}>
                Volver a probar
              </Button>
            </section>
          ) : (
            <>
              <p className="text-primary text-sm font-semibold">
                Mis errores · Material de ejemplo
              </p>
              <p className="text-muted-foreground mt-2 flex items-start gap-2 text-sm">
                <FileText size={16} className="mt-0.5 shrink-0" />
                <span className="min-w-0">{samplePdf.title} · 2 páginas</span>
              </p>
              {screen === 'check' ? (
                <section className="mt-7">
                  <h1 tabIndex={-1} className="text-2xl font-semibold outline-none">
                    Comprobá lo aprendido
                  </h1>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Mismo concepto, una situación diferente. Respondé sin consultar la explicación.
                  </p>
                  <h2 className="mt-7 text-lg leading-relaxed font-medium">{transfer.question}</h2>
                  <Answers options={transfer.options} selected={selected} onSelect={setSelected} />
                  <Button
                    className="mt-5"
                    disabled={selected === null}
                    onClick={() => {
                      checkAttempts.current += 1;
                      getAnalytics().checkpoint('check_answered', {
                        correct: selected === transfer.correct,
                        attempt: checkAttempts.current,
                        error_kind: illustrative ? 'illustrative' : 'real',
                      });
                      if (selected === transfer.correct) {
                        setResolved(true);
                        setScreen('done');
                      } else {
                        setCheckFailed(true);
                        setScreen('errors');
                        setSelected(null);
                      }
                    }}
                  >
                    Confirmar respuesta
                  </Button>
                  <Button
                    variant="ghost"
                    className="mt-3"
                    onClick={() => {
                      setScreen('errors');
                      setSelected(null);
                    }}
                  >
                    Volver al repaso
                  </Button>
                </section>
              ) : (
                <>
                  <section data-demo-focus="error" className="border-border mt-7 border-b pb-6">
                    <p className="text-muted-foreground text-xs">
                      {illustrative
                        ? 'Error ilustrativo · no fue una respuesta tuya'
                        : 'Práctica · Error 1 de 1'}
                    </p>
                    <h1 tabIndex={-1} className="mt-2 text-2xl font-semibold outline-none">
                      {topic}
                    </h1>
                    <p className="mt-4 leading-relaxed">{error.question}</p>
                    <div className="mt-5 space-y-3 text-sm">
                      <p>
                        <span className="font-semibold">Respuesta incorrecta: </span>
                        {wrongAnswer === null ? 'Sin respuesta' : error.options[wrongAnswer]}
                      </p>
                      <p>
                        <span className="text-primary font-semibold">Respuesta correcta: </span>
                        {error.options[error.correct]}
                      </p>
                    </div>
                  </section>
                  {checkFailed && (
                    <p
                      role="status"
                      data-demo-check-feedback
                      tabIndex={-1}
                      className="border-primary/20 bg-primary/5 mt-5 rounded-xl border p-4 text-sm leading-relaxed font-medium outline-none"
                    >
                      Todavía hay una confusión. Volvé a la explicación o pedí una versión más
                      simple antes de intentarlo de nuevo.
                    </p>
                  )}
                  <section data-demo-focus="help" className="mt-7">
                    <h2 className="text-xl font-semibold">Entendé qué te confundió</h2>
                    <p className="text-muted-foreground mt-2 text-sm">
                      Evaluo te ayuda con el contenido de este PDF.
                    </p>
                    {messages.length === 0 && (
                      <button
                        className="border-border hover:bg-muted/40 mt-5 flex w-full items-center justify-between gap-3 border-y py-5 text-left"
                        onClick={() => {
                          explain('Ayudame a entenderlo', error.explanation);
                          if (errorStep !== null) setErrorStep(2);
                        }}
                      >
                        <span className="flex items-center gap-3">
                          <Sparkles className="text-primary shrink-0" />
                          <span>
                            <span className="block font-semibold">Ayudame a entenderlo</span>
                            <span className="text-muted-foreground mt-1 block text-sm">
                              Una explicación paso a paso, basada en tu PDF
                            </span>
                          </span>
                        </span>
                        <ArrowRight className="text-primary shrink-0" size={20} />
                      </button>
                    )}
                  </section>
                  {messages.length > 0 && (
                    <section
                      data-demo-focus="explanation"
                      className="mt-6"
                      aria-label="Explicación con el PDF"
                    >
                      <div aria-live="polite" className="space-y-6">
                        {messages.map((message) => (
                          <div
                            key={message.prompt}
                            data-demo-reply
                            tabIndex={-1}
                            className="outline-none"
                          >
                            <p className="bg-muted ml-auto w-fit max-w-full rounded-2xl px-4 py-2 text-sm">
                              {message.prompt}
                            </p>
                            <p className="text-primary mt-4 text-xs font-semibold">
                              Evaluo · Explicación de muestra
                            </p>
                            <p className="mt-2 text-sm leading-7">{message.answer}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={messages.some((message) => message.prompt === 'Más simple')}
                          title={
                            messages.some((message) => message.prompt === 'Más simple')
                              ? 'Esta versión ya está en la conversación'
                              : undefined
                          }
                          onClick={() => {
                            setErrorStep(null);
                            setCheckFailed(false);
                            explain('Más simple', error.simple);
                          }}
                        >
                          Más simple
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={messages.some(
                            (message) => message.prompt === 'Dame un ejemplo'
                          )}
                          title={
                            messages.some((message) => message.prompt === 'Dame un ejemplo')
                              ? 'El ejemplo ya está en la conversación'
                              : undefined
                          }
                          onClick={() => {
                            setErrorStep(null);
                            setCheckFailed(false);
                            explain('Dame un ejemplo', error.example);
                          }}
                        >
                          Dame un ejemplo
                        </Button>
                      </div>
                      <button
                        onClick={() => {
                          if (!fragment)
                            getAnalytics().checkpoint('source_opened', {
                              error_kind: illustrative ? 'illustrative' : 'real',
                            });
                          setFragment((value) => !value);
                        }}
                        aria-expanded={fragment}
                        className="text-primary mt-5 block text-left text-sm underline underline-offset-4"
                      >
                        Fuente: {samplePdf.title} · pág. {error.page} —{' '}
                        {fragment ? 'Ocultar fragmento' : 'Ver fragmento'}
                      </button>
                      {fragment && (
                        <blockquote className="border-primary text-muted-foreground mt-3 border-l-2 pl-4 text-sm leading-7">
                          {samplePdf.fragments[error.page - 1]}
                          <a
                            href={`${samplePdf.url}#page=${error.page}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary mt-2 block underline"
                          >
                            Abrir PDF original
                          </a>
                        </blockquote>
                      )}
                      <div className="border-border mt-7 border-t pt-6">
                        <p className="font-semibold">¿Querés comprobar si lo entendiste?</p>
                        <Button className="mt-3" onClick={startCheck}>
                          Responder una pregunta
                          <ArrowRight size={16} />
                        </Button>
                      </div>
                    </section>
                  )}
                </>
              )}
            </>
          )}
        </main>
      )}
      {screen === 'study' && step !== null && (
        <PdfTourSpotlight
          selector={studySteps[step]!.selector}
          title={studySteps[step]!.title}
          description={studySteps[step]!.description}
          compactDescription={studySteps[step]!.compactDescription}
          showCompactDescription={step === 0}
          progress={`Repaso · ${step + 1} de ${studySteps.length}`}
          onExit={exit}
          onBack={step > 0 ? () => goStep(step - 1) : undefined}
          onSkipToPractice={step < 4 ? skipToPractice : undefined}
          nextLabel={studySteps[step]!.nextLabel}
          onNext={() => {
            if (step === 5) {
              startPractice();
            } else goStep(step + 1);
          }}
        />
      )}
      {screen === 'errors' && errorStep !== null && (
        <PdfTourSpotlight
          selector={
            errorStep === 0
              ? '[data-demo-focus="error"]'
              : errorStep === 1
                ? '[data-demo-focus="help"]'
                : '[data-demo-focus="explanation"]'
          }
          title={
            errorStep === 0
              ? illustrative
                ? 'Así se guarda un error'
                : 'Acá recuperás lo que te costó'
              : errorStep === 1
                ? 'No te quedás solo con la corrección'
                : 'La explicación vuelve a tu PDF'
          }
          description={
            errorStep === 0
              ? illustrative
                ? 'Este error es ilustrativo. Con tu PDF vas a encontrar acá los conceptos que necesitás reforzar.'
                : 'Acá quedan el concepto, tu respuesta y la correcta. Podés volver a repasarlo sin buscarlo en todo el PDF.'
              : errorStep === 1
                ? 'Pedí una explicación con tu material. Después podés elegir Más simple o Dame un ejemplo.'
                : 'Leé la explicación y abrí Ver fragmento para consultar la fuente. Después comprobalo con una situación diferente.'
          }
          progress={`Mis errores · ${errorStep + 1} de 3`}
          compactDescription={
            errorStep === 0
              ? 'Revisá el concepto, la respuesta incorrecta y la correcta.'
              : errorStep === 1
                ? 'Entendé el error con una explicación basada en tu PDF.'
                : 'Leé la explicación, consultá la fuente y comprobá lo aprendido.'
          }
          nextLabel={
            errorStep === 1 ? 'Ver explicación' : errorStep === 2 ? 'Comprobarlo' : 'Ver ayuda'
          }
          onExit={exit}
          onNext={() => {
            if (errorStep === 1) explain('Ayudame a entenderlo', error.explanation);
            if (errorStep === 2) {
              startCheck();
            } else setErrorStep(errorStep + 1);
          }}
        />
      )}
    </div>
  );
}
