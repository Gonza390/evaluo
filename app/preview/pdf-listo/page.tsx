'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpenText,
  BrainCircuit,
  CheckCircle2,
  Map,
  Sparkles,
  SquareLibrary,
  X,
} from 'lucide-react';

const questions = [
  {
    topic: 'Dogmática y teoría del delito',
    question: '¿Cuál describe mejor la función de la teoría del delito?',
    options: [
      'Analizar sistemáticamente los elementos que permiten afirmar que hubo delito',
      'Determinar únicamente la pena aplicable',
      'Clasificar delitos según su gravedad',
      'Explicar la evolución histórica del Código Penal',
    ],
    correct: 0,
  },
  {
    topic: 'Concepciones dogmáticas',
    question: '¿Qué cambia principalmente entre las distintas concepciones dogmáticas?',
    options: [
      'La estructura y ubicación de los elementos del delito',
      'La cantidad de delitos del Código Penal',
      'La competencia territorial de los jueces',
      'La duración de las penas',
    ],
    correct: 0,
  },
  {
    topic: 'Normativismo',
    question: 'En el normativismo, la valoración jurídica cumple un papel…',
    options: [
      'Central para comprender los elementos del delito',
      'Irrelevante frente a la causalidad física',
      'Exclusivo de la etapa de ejecución penal',
      'Limitado a delitos culposos',
    ],
    correct: 0,
  },
  {
    topic: 'Finalismo',
    question: '¿Qué pone especialmente en primer plano el finalismo?',
    options: [
      'La acción orientada a una finalidad',
      'La pena como único objeto de análisis',
      'La responsabilidad civil del autor',
      'La competencia del tribunal',
    ],
    correct: 0,
  },
  {
    topic: 'Funcionalismo',
    question: 'El funcionalismo interpreta las categorías del delito principalmente según…',
    options: [
      'La función que cumplen dentro del sistema jurídico-penal',
      'La cronología de las reformas legislativas',
      'La duración de la investigación penal',
      'El tipo de tribunal que interviene',
    ],
    correct: 0,
  },
  {
    topic: 'Estructura del delito',
    question: '¿Cuál de estas opciones representa una secuencia típica de análisis del delito?',
    options: [
      'Acción, tipicidad, antijuridicidad y culpabilidad',
      'Denuncia, sentencia, apelación y ejecución',
      'Prueba, pena, prescripción y competencia',
      'Autor, víctima, fiscal y juez',
    ],
    correct: 0,
  },
];

const tabs = [
  { label: 'Resumen', icon: BookOpenText, active: true },
  { label: 'Glosario', icon: SquareLibrary },
  { label: 'Tarjetas', icon: Sparkles },
  { label: 'Examen', icon: BrainCircuit },
  { label: 'Mapa mental', icon: Map },
];

type Screen = 'ready' | 'quiz' | 'result' | 'summary';

export default function PdfReadyPreviewPage() {
  const [screen, setScreen] = useState<Screen>('ready');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);

  const score = useMemo(
    () => answers.reduce((total, answer, i) => total + (answer === questions[i].correct ? 1 : 0), 0),
    [answers]
  );

  const weakTopics = useMemo(
    () => questions.filter((q, i) => answers[i] !== undefined && answers[i] !== q.correct).map((q) => q.topic),
    [answers]
  );

  const reset = () => {
    setScreen('ready');
    setIndex(0);
    setSelected(null);
    setAnswers([]);
  };

  const startQuiz = () => {
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setScreen('quiz');
  };

  const next = () => {
    if (selected === null) return;
    const nextAnswers = [...answers, selected];
    setAnswers(nextAnswers);
    setSelected(null);
    if (index === questions.length - 1) {
      setScreen('result');
      return;
    }
    setIndex((current) => current + 1);
  };

  const current = questions[index];
  const firstWeakTopic = weakTopics[0] ?? 'Dogmática y teoría del delito';
  const secondWeakTopic = weakTopics[1] ?? 'Finalismo';

  if (screen === 'summary') {
    return (
      <main className="min-h-screen bg-[#f8fafc] text-slate-950">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setScreen('result')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al resultado
            </button>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-400">Material de estudio</p>
                <h1 className="mt-1 text-xl font-bold tracking-[-0.035em] text-slate-950">
                  Módulo 2 · Lectura 1 Derecho Penal
                </h1>
              </div>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Reiniciar prueba
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <section className="rounded-[20px] border border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
            <div className="flex gap-1.5 overflow-x-auto border-b border-slate-200 px-3 py-3 sm:px-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[14px] border px-3 text-[13px] font-medium ${
                      tab.active
                        ? 'border-blue-200 bg-blue-50 text-blue-600'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-4 sm:p-5">
              <div className="max-w-3xl border-b border-slate-100 pb-5">
                <p className="text-xs font-semibold text-indigo-600">Según tu diagnóstico</p>
                <h2 className="mt-1 text-lg font-bold tracking-[-0.03em] text-slate-950">
                  Empezá por {firstWeakTopic}
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  Fue uno de los temas donde más dificultad tuviste. Ordenamos el resumen para que arranques por ahí.
                </p>
              </div>

              <div className="mt-5 max-w-3xl space-y-6">
                <section>
                  <h2 className="text-[1.05rem] font-bold tracking-[-0.03em] text-slate-950">{firstWeakTopic}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Este enfoque explica cómo se organizan y valoran los elementos del delito dentro de una teoría sistemática. Para el examen, lo importante es entender qué cambia respecto de las concepciones anteriores y cómo se ubican acción, tipicidad, antijuridicidad y culpabilidad.
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    <span className="font-semibold text-slate-800">Prestá atención:</span> compará este enfoque con causalismo, normativismo y finalismo; ahí suelen aparecer las confusiones.
                  </p>
                </section>

                <section className="border-t border-slate-100 pt-5">
                  <h2 className="text-[1.05rem] font-bold tracking-[-0.03em] text-slate-950">{secondWeakTopic}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    La clave es identificar qué elemento pasa a ocupar un lugar central y cómo eso modifica el análisis de la conducta. No hace falta memorizar una definición aislada: conviene poder distinguirlo frente a los otros modelos.
                  </p>
                </section>

                <section className="border-t border-slate-100 pt-5">
                  <h2 className="text-[1.05rem] font-bold tracking-[-0.03em] text-slate-950">Estructura general del delito</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Como marco general, el análisis suele recorrer acción, tipicidad, antijuridicidad y culpabilidad. Las distintas corrientes cambian la forma de interpretar o ubicar algunos de estos elementos.
                  </p>
                </section>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-white text-slate-950">
      <div className="pointer-events-none select-none blur-[5px]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <section className="rounded-[1.35rem] border border-slate-200/80 bg-white px-4 py-6 sm:px-6 sm:py-7">
            <div className="mx-auto max-w-xl text-center">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">Tu espacio</p>
              <h1 className="mt-2 text-[1.65rem] font-bold tracking-[-0.055em] text-slate-950 sm:text-[2rem]">
                Tu espacio de estudio
              </h1>
              <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-5 text-slate-500">
                Tus materiales primero. Seguí donde dejaste o sumá otro PDF cuando lo necesites.
              </p>
            </div>
          </section>
        </div>
      </div>

      <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/25 px-4 py-8">
        <section className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/70 bg-white p-5 shadow-[0_30px_100px_rgba(15,23,42,0.28)] sm:p-6">
          {screen === 'ready' ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-[-0.035em] text-slate-950">Tu PDF está listo</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Encontramos 6 temas principales.</p>
                </div>
                <button type="button" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100" aria-label="Cerrar">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center text-indigo-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">Módulo 2 · Lectura 1 Derecho Penal</p>
                    <p className="mt-0.5 text-xs text-slate-500">Procesamiento completado</p>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-slate-500">100%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-full rounded-full bg-indigo-600" />
                </div>

                <p className="mt-5 text-sm leading-6 text-slate-600">
                  Antes de empezar, respondé unas preguntas rápidas para saber qué ya dominás y qué conviene repasar.
                </p>
                <p className="mt-2 text-xs text-slate-400">6 preguntas · ~4 min</p>

                <div className="mt-6 flex items-center justify-end gap-2">
                  <button type="button" className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-slate-600 hover:bg-slate-100">
                    Abrir PDF
                  </button>
                  <button type="button" onClick={startQuiz} className="inline-flex h-10 items-center justify-center rounded-md bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700">
                    Ver qué tanto sé
                  </button>
                </div>
              </div>
            </>
          ) : null}

          {screen === 'quiz' ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
                  <ArrowLeft className="h-3.5 w-3.5" /> Volver
                </button>
                <span className="text-xs font-medium text-slate-400">{index + 1} de {questions.length}</span>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold text-indigo-600">{current.topic}</p>
                <h2 className="mt-2 text-lg font-bold leading-7 tracking-[-0.03em] text-slate-950">{current.question}</h2>

                <div className="mt-4 space-y-2">
                  {current.options.map((option, optionIndex) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelected(optionIndex)}
                      className={`w-full rounded-xl border px-3.5 py-3 text-left text-sm leading-5 transition ${
                        selected === optionIndex
                          ? 'border-indigo-400 bg-indigo-50 text-slate-950'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    disabled={selected === null}
                    onClick={next}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {index === questions.length - 1 ? 'Ver resultado' : 'Siguiente'}
                  </button>
                </div>
              </div>
            </>
          ) : null}

          {screen === 'result' ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-indigo-600">Diagnóstico listo</p>
                  <h2 className="mt-1 text-xl font-bold tracking-[-0.035em] text-slate-950">Ya sabemos por dónde empezar</h2>
                </div>
                <button type="button" onClick={reset} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100" aria-label="Cerrar">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 border-y border-slate-100 py-4">
                <p className="text-3xl font-bold tracking-[-0.05em] text-slate-950">{score}/{questions.length}</p>
                <p className="mt-1 text-sm text-slate-500">respuestas correctas</p>
              </div>

              <div className="mt-5">
                {weakTopics.length > 0 ? (
                  <>
                    <p className="text-sm font-semibold text-slate-900">Te conviene repasar primero</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{weakTopics.slice(0, 3).join(', ')}.</p>
                    {weakTopics.length > 3 ? (
                      <p className="mt-1 text-xs text-slate-400">Y {weakTopics.length - 3} tema{weakTopics.length - 3 === 1 ? '' : 's'} más.</p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-900">Buen dominio inicial</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">No detectamos un tema claramente débil en estas preguntas.</p>
                  </>
                )}
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setScreen('summary')}
                  className="inline-flex h-10 w-full items-center justify-center rounded-md bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  {weakTopics.length > 0 ? 'Repasar en el resumen' : 'Ir al resumen'}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-md text-xs font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Volver al material
                </button>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}
