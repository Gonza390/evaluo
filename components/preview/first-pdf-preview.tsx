'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  MessageCircle,
  RotateCcw,
  Upload,
  ChevronLeft,
} from 'lucide-react';
import { FirstPdfPreviewShell, PreviewGuide } from './first-pdf-preview-shell';
import {
  comparisonTransferQuestion,
  demoQuestions,
  samplePdf,
  transferQuestion,
} from './first-pdf-preview-data';

type Step =
  | 'home'
  | 'material'
  | 'practice'
  | 'feedback'
  | 'all-correct'
  | 'review'
  | 'check'
  | 'done'
  | 'upload';
const primary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
const secondary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

export function FirstPdfPreview() {
  const [step, setStep] = useState<Step>('home');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [wrongAnswer, setWrongAnswer] = useState<number | null>(null);
  const [illustrative, setIllustrative] = useState(false);
  const [paused, setPaused] = useState(false);
  const [explained, setExplained] = useState(false);
  const [helpers, setHelpers] = useState<('simple' | 'example')[]>([]);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [retry, setRetry] = useState(false);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [studyTab, setStudyTab] = useState('Resumen');
  const [pdfVisible, setPdfVisible] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [emptyErrors, setEmptyErrors] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const explanationHeading = useRef<HTMLHeadingElement>(null);
  const question = demoQuestions[questionIndex];
  const verification = questionIndex === 0 ? transferQuestion : comparisonTransferQuestion;
  const active = step === 'check' ? verification : question;
  const isDemo = !['home', 'upload'].includes(step);
  const inMaterial = ['material', 'practice', 'feedback', 'all-correct'].includes(step);
  const inErrors = ['review', 'check', 'done'].includes(step) || emptyErrors;

  function openMaterial(tab = 'Resumen') {
    setStarted(true);
    setEmptyErrors(false);
    setStudyTab(tab);
    setStep(tab === 'Práctica' ? 'practice' : 'material');
    setAnswer(null);
  }

  function goHome() {
    setEmptyErrors(false);
    setStep('home');
  }
  function openErrors() {
    if (wrongAnswer === null) {
      setEmptyErrors(true);
      setStep('home');
    } else {
      setEmptyErrors(false);
      setStep(completed ? 'done' : 'review');
    }
  }

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [step, questionIndex, emptyErrors]);

  useEffect(() => {
    if (explained) explanationHeading.current?.focus({ preventScroll: true });
  }, [explained]);

  useEffect(() => {
    if (step !== 'feedback' || paused) return;
    const timer = setTimeout(() => setStep('review'), 5000);
    return () => clearTimeout(timer);
  }, [step, paused]);

  function restart() {
    setStep('home');
    setQuestionIndex(0);
    setAnswer(null);
    setWrongAnswer(null);
    setIllustrative(false);
    setPaused(false);
    setExplained(false);
    setHelpers([]);
    setSourceOpen(false);
    setRetry(false);
    setStarted(false);
    setCompleted(false);
    setStudyTab('Resumen');
    setPdfVisible(false);
    setPdfPage(1);
    setCardFlipped(false);
    setEmptyErrors(false);
  }

  function confirm() {
    if (answer === null) return;
    if (step === 'check') {
      if (answer === verification.correct) {
        setCompleted(true);
        setStep('done');
      } else {
        setRetry(true);
        setStep('review');
      }
      setAnswer(null);
      return;
    }
    if (answer !== question.correct) {
      setWrongAnswer(answer);
      setExplained(false);
      setHelpers([]);
      setSourceOpen(false);
      setRetry(false);
      setIllustrative(false);
      setCompleted(false);
      setPaused(false);
      setStep('feedback');
    } else if (questionIndex === 0) {
      setQuestionIndex(1);
      setAnswer(null);
    } else setStep('all-correct');
  }

  const titles: Record<Step, string> = {
    home: 'Mi espacio',
    material: samplePdf.title,
    practice: samplePdf.title,
    feedback: samplePdf.title,
    'all-correct': samplePdf.title,
    review: 'Mis errores',
    check: 'Mis errores',
    done: 'Mis errores',
    upload: 'Mi espacio · Subir mi PDF',
  };

  return (
    <FirstPdfPreviewShell
      section={inErrors ? 'errors' : inMaterial ? 'material' : 'home'}
      pending={wrongAnswer !== null && !completed}
      onHome={goHome}
      onErrors={openErrors}
      onUpload={() => {
        setEmptyErrors(false);
        setStep('upload');
      }}
    >
      {isDemo && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <button className={secondary} onClick={goHome}>
            <ChevronLeft className="size-4" /> Volver a Mi espacio
          </button>
          <button
            className="text-muted-foreground min-h-11 px-2 text-sm underline"
            onClick={restart}
          >
            Salir del ejemplo
          </button>
        </div>
      )}
      <div key={step} className="animate-in fade-in duration-300 motion-reduce:animate-none">
        <h1
          ref={heading}
          tabIndex={-1}
          className="scroll-mt-24 text-2xl font-black tracking-tight outline-none sm:text-3xl"
        >
          {emptyErrors ? 'Mis errores' : titles[step]}
        </h1>

        {isDemo && (
          <p className="!text-muted-foreground mt-2 !text-sm">
            <FileText className="mr-2 inline size-4" />
            {samplePdf.title}.pdf ·{' '}
            <span className="text-primary font-semibold">Material de ejemplo</span> · 2 páginas
          </p>
        )}
        {inMaterial && (
          <nav
            aria-label="Herramientas de este PDF"
            className="border-border mt-5 flex flex-wrap gap-2 border-b pb-3"
          >
            {['Resumen', 'Práctica', 'Tarjetas', 'Glosario', 'Mapa mental'].map((tab) => (
              <button
                key={tab}
                aria-pressed={step !== 'material' ? tab === 'Práctica' : studyTab === tab}
                className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${(step !== 'material' && tab === 'Práctica') || (step === 'material' && studyTab === tab) ? 'bg-primary/10 text-primary ring-primary/30 ring-1' : 'text-muted-foreground hover:bg-muted'}`}
                onClick={() => openMaterial(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>
        )}

        {emptyErrors && (
          <div className="mt-6 max-w-2xl">
            <p>
              Todavía no hay errores en el ejemplo. Cuando te equivoques practicando, vas a
              encontrarlos acá, organizados por PDF.
            </p>
            <button className={`${primary} mt-5`} onClick={() => openMaterial('Práctica')}>
              Probar una práctica
            </button>
          </div>
        )}

        {step === 'home' && !emptyErrors && (
          <div className="mt-6 space-y-6">
            <section className="border-border bg-background rounded-2xl border px-5 py-8 text-center">
              <h2 className="text-2xl font-bold">Tu espacio de estudio</h2>
              <p className="mx-auto mt-2 max-w-md !text-sm">
                Subí lo que tenés que estudiar y Evaluo te guía para prepararlo.
              </p>
              <button className={`${primary} mt-5`} onClick={() => setStep('upload')}>
                <Upload className="size-4" /> Subir mi PDF
              </button>
            </section>
            {completed ? (
              <PreviewGuide number={5} title="Ya sabés dónde volver para estudiar">
                Acá subís tus apuntes y abrís tus materiales. Mis errores queda en la navegación
                para volver a repasar cuando lo necesites. Ahora probalo con tu PDF.
              </PreviewGuide>
            ) : (
              <PreviewGuide number={1} title="Todo empieza en Mi espacio">
                Acá subís tus PDFs y encontrás lo que estás estudiando. Abrí un material de ejemplo
                y recorré las mismas herramientas que usarías con tus apuntes.
              </PreviewGuide>
            )}
            <section className="border-border border-t pt-6">
              <h2 className="text-lg font-bold">Mis materiales</h2>
              <p className="mt-2 !text-sm">Todavía no subiste tus propios PDFs.</p>
              <div className="mt-5">
                <p className="mb-3 text-sm">
                  {started
                    ? 'Podés seguir explorando con el material de ejemplo.'
                    : '¿Querés ver cómo funciona antes?'}
                </p>
                <button className={secondary} onClick={() => openMaterial()}>
                  <BookOpen className="size-4" /> Probar con un material de ejemplo{' '}
                  <ArrowRight className="size-4" />
                </button>
                <p className="!text-muted-foreground mt-3 !text-xs">
                  Unos 2 minutos · No consume tus PDFs ni explicaciones.
                </p>
              </div>
            </section>
            {started && (
              <div className="border-border bg-background flex flex-wrap items-center justify-between gap-4 border-y p-4">
                <div>
                  <span className="text-primary text-xs font-semibold">MATERIAL DE EJEMPLO</span>
                  <h3 className="mt-1 font-semibold">{samplePdf.title}</h3>
                  <p className="!text-xs">
                    2 páginas · {completed ? 'Repaso completado' : 'Listo para estudiar'}
                  </p>
                </div>
                <button className={secondary} onClick={() => openMaterial()}>
                  Abrir material <ArrowRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'material' && (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
            <div className="border-border bg-background min-w-0 space-y-6 rounded-2xl border p-5">
              <PreviewGuide number={2} title="Estudiá desde las herramientas de tu PDF">
                Resumen te ayuda a ubicar las ideas principales. Después tocá{' '}
                <strong>Práctica</strong> para comprobar qué entendiste. El documento original sigue
                disponible en Mostrar PDF.
              </PreviewGuide>
              {studyTab === 'Resumen' && (
                <>
                  <h2 className="text-xl font-bold">Resumen</h2>
                  <section className="border-primary border-l-2 pl-5">
                    <h2 className="mb-2 text-lg font-bold">La idea principal</h2>
                    <p>{samplePdf.summary}</p>
                  </section>
                  <details className="border-border border-y py-4">
                    <summary className="cursor-pointer font-medium">
                      Leer el material de ejemplo
                    </summary>
                    {samplePdf.fragments.map((fragment, index) => (
                      <section key={fragment} className="mt-5">
                        <h3 className="mb-2 text-sm font-bold">Página {index + 1}</h3>
                        <p>{fragment}</p>
                      </section>
                    ))}
                  </details>
                  <div>
                    <button
                      className={primary}
                      onClick={() => {
                        openMaterial('Práctica');
                      }}
                    >
                      Ir a Práctica <ArrowRight className="size-4" />
                    </button>
                  </div>
                </>
              )}
              {studyTab === 'Tarjetas' && (
                <section className="space-y-5">
                  <h2 className="text-xl font-bold">Tarjetas</h2>
                  <p>Recordá el concepto antes de mirar la respuesta.</p>
                  <div className="border-border border-y py-6">
                    <h3 className="font-bold">¿Una correlación demuestra una causa?</h3>
                    {cardFlipped && (
                      <p className="mt-3">
                        No. Dos variables pueden cambiar juntas porque una tercera variable influye
                        en ambas.
                      </p>
                    )}
                  </div>
                  <button className={secondary} onClick={() => setCardFlipped(!cardFlipped)}>
                    {cardFlipped ? 'Ocultar respuesta' : 'Ver respuesta'}
                  </button>
                  <button className={primary} onClick={() => openMaterial('Práctica')}>
                    Ir a Práctica
                  </button>
                </section>
              )}
              {studyTab === 'Glosario' && (
                <section>
                  <h2 className="mb-4 text-xl font-bold">Glosario</h2>
                  <dl className="space-y-4">
                    <div>
                      <dt className="font-semibold">Correlación</dt>
                      <dd className="text-muted-foreground mt-1 text-sm">
                        Asociación entre variables que cambian juntas.
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Causalidad</dt>
                      <dd className="text-muted-foreground mt-1 text-sm">
                        Relación en la que una variable produce un cambio en otra.
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Asignación al azar</dt>
                      <dd className="text-muted-foreground mt-1 text-sm">
                        Forma de asignar una intervención que ayuda a reducir diferencias previas
                        entre grupos.
                      </dd>
                    </div>
                  </dl>
                  <button className={`${primary} mt-6`} onClick={() => openMaterial('Práctica')}>
                    Ir a Práctica
                  </button>
                </section>
              )}
              {studyTab === 'Mapa mental' && (
                <section className="space-y-5">
                  <h2 className="text-xl font-bold">Mapa mental</h2>
                  <ul className="border-primary space-y-4 border-l-2 pl-5">
                    <li>
                      <strong>Interpretar una investigación</strong>
                      <ul className="mt-3 space-y-3 pl-4">
                        <li>Asociación → dos variables cambian juntas</li>
                        <li>Otras explicaciones → una tercera variable puede influir</li>
                        <li>Comparación → condiciones similares y asignación al azar</li>
                      </ul>
                    </li>
                  </ul>
                  <button className={primary} onClick={() => openMaterial('Práctica')}>
                    Ir a Práctica
                  </button>
                </section>
              )}
            </div>
            <aside className="min-w-0 space-y-3">
              <button
                className={secondary}
                aria-expanded={pdfVisible}
                onClick={() => setPdfVisible(!pdfVisible)}
              >
                <FileText className="size-4" />
                {pdfVisible ? 'Ocultar PDF' : 'Mostrar PDF'}
              </button>
              {pdfVisible ? (
                <section
                  aria-label="PDF original de ejemplo"
                  className="border-border bg-background rounded-xl border"
                >
                  <div className="border-border flex flex-wrap items-center justify-between gap-2 border-b p-3">
                    <button
                      className={secondary}
                      disabled={pdfPage === 1}
                      onClick={() => setPdfPage(1)}
                    >
                      Anterior
                    </button>
                    <span aria-live="polite" className="text-sm">
                      Página {pdfPage} de 2
                    </span>
                    <button
                      className={secondary}
                      disabled={pdfPage === 2}
                      onClick={() => setPdfPage(2)}
                    >
                      Siguiente
                    </button>
                  </div>
                  <div className="max-h-[65vh] overflow-y-auto p-2">
                    <Image
                      src={`/demo/interpretar-una-investigacion-${pdfPage}.png`}
                      alt={`Página ${pdfPage} del PDF de ejemplo: ${pdfPage === 1 ? 'Asociación no significa causa' : 'Comparar con cuidado'}`}
                      width={707}
                      height={1000}
                      unoptimized
                      className="h-auto w-full"
                    />
                  </div>
                </section>
              ) : (
                <div className="border-border bg-background rounded-xl border border-dashed p-5">
                  <FileText className="text-primary mb-3 size-6" />
                  <h2 className="font-semibold">PDF original</h2>
                  <p className="mt-2 !text-sm">
                    Mostralo para contrastar lo que estás estudiando con la fuente.
                  </p>
                </div>
              )}
              <a
                className="text-primary inline-flex min-h-11 items-center text-sm underline"
                href={samplePdf.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir PDF en otra pestaña
              </a>
            </aside>
          </div>
        )}

        {(step === 'practice' || step === 'check') && (
          <div className="border-border bg-background mt-6 max-w-3xl space-y-5 rounded-2xl border p-5">
            <PreviewGuide
              number={step === 'check' ? 5 : 3}
              title={
                step === 'check'
                  ? 'Comprobá el concepto con otra situación'
                  : 'Practicá con preguntas del mismo PDF'
              }
            >
              {step === 'check'
                ? 'Esta pregunta comprueba si podés aplicar lo que repasaste. Si te cuesta, volvés a la explicación.'
                : 'Elegí una respuesta y confirmala. Si te equivocás, Evaluo guarda el concepto y te muestra dónde repasarlo.'}
            </PreviewGuide>
            <h2 className="text-xl font-bold">
              {step === 'check' ? 'Comprobá lo aprendido' : 'Práctica'}
            </h2>
            <p className="!text-muted-foreground !text-sm">
              {step === 'check'
                ? 'Mismo concepto, una situación diferente. Respondé sin consultar la explicación.'
                : `Pregunta ${questionIndex + 1} de 2 · Sin nota ni límite de tiempo${questionIndex === 1 ? ' · La anterior estuvo bien.' : ''}`}
            </p>
            <fieldset>
              <legend className="mb-5 text-xl leading-relaxed font-medium">
                {active.question}
              </legend>
              <div className="space-y-3">
                {active.options.map((option, index) => (
                  <label
                    key={option}
                    className={`focus-within:ring-ring flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-4 focus-within:ring-2 ${answer === index ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                  >
                    <input
                      type="radio"
                      name="demo-answer"
                      value={index}
                      checked={answer === index}
                      onChange={() => setAnswer(index)}
                      className="accent-primary mt-1 size-4 shrink-0"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <button className={primary} disabled={answer === null} onClick={confirm}>
              Confirmar respuesta
            </button>
            {step === 'check' && (
              <div>
                <button
                  className={secondary}
                  onClick={() => {
                    setAnswer(null);
                    setStep('review');
                  }}
                >
                  Volver al repaso
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'feedback' && (
          <div className="border-border bg-background mt-6 max-w-3xl space-y-5 rounded-2xl border p-5">
            <h2 className="text-xl font-bold">Corrección de la práctica</h2>
            <div className="border-destructive border-l-2 pl-4">
              <h2 className="font-bold">Respuesta incorrecta</h2>
              <p>{question.options[wrongAnswer ?? 0]}</p>
            </div>
            <div className="border-primary border-l-2 pl-4">
              <h2 className="font-bold">Respuesta correcta</h2>
              <p>{question.options[question.correct]}</p>
            </div>
            <div role="status" className="bg-primary/5 rounded-xl p-5">
              <p className="!text-foreground">
                Este concepto quedó guardado en Mis errores del ejemplo. Vamos a repasarlo.
              </p>
              <p className="mt-2 !text-sm">
                {paused
                  ? 'Pausaste el paso automático. Avanzá cuando quieras.'
                  : 'En unos segundos abrimos este error, con el mismo PDF.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className={primary} onClick={() => setStep('review')}>
                Ir a Mis errores ahora <ArrowRight className="size-4" />
              </button>
              <button className={secondary} onClick={() => setPaused(!paused)}>
                {paused ? 'Continuar automáticamente' : 'Quedarme a leer la corrección'}
              </button>
            </div>
          </div>
        )}

        {step === 'all-correct' && (
          <div className="mt-6 space-y-5">
            <h2 className="text-xl font-bold">Respondiste bien las dos preguntas</h2>
            <p>
              Ahora podés ver cómo Evaluo te ayuda cuando un concepto te cuesta. Usaremos un error
              preparado para la demostración; no es un error tuyo.
            </p>
            <button
              className={primary}
              onClick={() => {
                setQuestionIndex(0);
                setWrongAnswer(0);
                setIllustrative(true);
                setCompleted(false);
                setExplained(false);
                setHelpers([]);
                setSourceOpen(false);
                setRetry(false);
                setAnswer(null);
                setStep('review');
              }}
            >
              Ver un error de ejemplo <ArrowRight className="size-4" />
            </button>
          </div>
        )}

        {step === 'review' && (
          <div className="mt-6 max-w-3xl space-y-6">
            <PreviewGuide number={4} title="Acá volvés a lo que te costó">
              Este es Mis errores. Encontrás el concepto y su PDF sin buscarlo de nuevo. Tocá{' '}
              <strong>Ayudame a entenderlo</strong> para repasarlo; después vas a poder comprobarlo.
            </PreviewGuide>
            <p className="!text-muted-foreground !text-sm">
              {illustrative ? 'Error ilustrativo' : 'Práctica del ejemplo'} · Correlación y
              causalidad · Error 1 de 1
            </p>
            {retry && (
              <p
                role="status"
                className="border-primary bg-primary/5 !text-foreground border-l-2 p-4"
              >
                Todavía hay una confusión. Revisá la explicación o pedí un ejemplo antes de volver a
                comprobarlo.
              </p>
            )}
            <h2 className="text-xl leading-relaxed font-medium">{question.question}</h2>
            <section className="border-border border-y py-6">
              <h3 className="text-lg font-bold">Entendé qué te confundió</h3>
              <p className="mt-2">Evaluo te ayuda a entender este concepto con el mismo PDF.</p>
              {!explained ? (
                <button
                  className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 focus-visible:outline-ring mt-4 inline-flex min-h-14 items-center gap-3 rounded-xl border px-5 py-3 text-left focus-visible:outline-2"
                  onClick={() => setExplained(true)}
                >
                  <MessageCircle className="size-5 shrink-0" />
                  <span>
                    <span className="block font-semibold">Ayudame a entenderlo</span>
                    <span className="block text-xs">Una explicación paso a paso con este PDF</span>
                  </span>
                </button>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="border-primary border-l-2 pl-4">
                    <h4
                      ref={explanationHeading}
                      tabIndex={-1}
                      className="text-primary text-sm font-bold outline-none"
                    >
                      Evaluo
                    </h4>
                    <p className="mt-2">{question.explanation}</p>
                  </div>
                  {helpers.map((helper) => (
                    <div key={helper} className="border-border border-l-2 pl-4">
                      <h4 className="text-sm font-semibold">
                        {helper === 'simple' ? 'Más simple' : 'Un ejemplo'}
                      </h4>
                      <p className="mt-2">{question[helper]}</p>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2">
                    {(['simple', 'example'] as const).map((helper) => (
                      <button
                        key={helper}
                        className={secondary}
                        disabled={helpers.includes(helper)}
                        onClick={() => setHelpers([...helpers, helper])}
                      >
                        {helper === 'simple' ? 'Más simple' : 'Dame un ejemplo'}
                      </button>
                    ))}
                  </div>
                  <button
                    className="text-primary min-h-11 text-left text-sm underline underline-offset-4"
                    aria-expanded={sourceOpen}
                    aria-controls="demo-fragment"
                    onClick={() => setSourceOpen(!sourceOpen)}
                  >
                    Fuente: {samplePdf.title} · pág. {question.page} —{' '}
                    {sourceOpen ? 'Ocultar fragmento' : 'Ver fragmento'}
                  </button>
                  {sourceOpen && (
                    <blockquote
                      id="demo-fragment"
                      className="border-border bg-muted/40 border-l-2 p-4 text-sm leading-relaxed"
                    >
                      {samplePdf.fragments[question.page - 1]}
                    </blockquote>
                  )}
                  <div className="border-border border-t pt-5">
                    <p className="!text-foreground mb-3 font-medium">
                      ¿Querés comprobar si lo entendiste?
                    </p>
                    <button
                      className={primary}
                      onClick={() => {
                        setAnswer(null);
                        setRetry(false);
                        setStep('check');
                      }}
                    >
                      Responder una pregunta <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              )}
            </section>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-bold">
                  {illustrative ? 'Respuesta incorrecta de ejemplo' : 'Respuesta incorrecta'}
                </h3>
                <p>{question.options[wrongAnswer ?? 0]}</p>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-bold">Respuesta correcta</h3>
                <p>{question.options[question.correct]}</p>
              </div>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="mt-6 space-y-6">
            <CheckCircle2 className="text-primary size-10" />
            <h2 className="text-xl font-bold">Aplicaste bien este concepto</h2>
            <p>
              Respondiste bien una pregunta nueva. Resolviste este error del ejemplo; no quedan
              pendientes en este material.
            </p>
            <section className="border-border border-t pt-6">
              <h2 className="text-xl font-bold">
                Ahora hacelo con lo que realmente tenés que rendir.
              </h2>
              <p className="mt-3 mb-5">Tu PDF → entender → practicar → repasar tus errores.</p>
              <PreviewGuide number={5} title="Volvé a Mi espacio para empezar con tus apuntes">
                Ya recorriste el PDF, Práctica y Mis errores. Estas secciones siguen en la
                navegación para que puedas volver cuando lo necesites.
              </PreviewGuide>
              <button className={primary} onClick={goHome}>
                Volver a Mi espacio <ArrowRight className="size-4" />
              </button>
            </section>
            <button className={secondary} onClick={restart}>
              <RotateCcw className="size-4" /> Volver a probar el ejemplo
            </button>
          </div>
        )}

        {step === 'upload' && (
          <div className="mt-6 space-y-6">
            <p>
              Acá termina el preview. En la plataforma, este paso abre la carga de tu PDF en Mi
              espacio.
            </p>
            <a className={primary} href="/dashboard?openUpload=1">
              <Upload className="size-4" /> Ir a subir mi PDF
            </a>
            <p className="!text-muted-foreground !text-sm">
              Este enlace abre la plataforma real y puede pedirte iniciar sesión. El ejemplo no
              guardó progreso ni consumió cupos.
            </p>
            <div>
              <button className={secondary} onClick={restart}>
                Volver al inicio del preview
              </button>
            </div>
          </div>
        )}
      </div>
      <footer className="border-border text-muted-foreground mt-12 border-t pt-5 text-xs">
        Material y explicaciones preparados · Sin IA en vivo · Progreso solo durante esta visita
      </footer>
    </FirstPdfPreviewShell>
  );
}
