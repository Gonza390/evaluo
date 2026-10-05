'use client';

import { useState } from 'react';
import { Brain, CheckCircle2, ChevronRight, Circle, RotateCcw } from 'lucide-react';

type Question = {
  prompt: string;
  options: string[];
  correct: number;
  source: 'actual' | 'anterior';
};

type Topic = {
  title: string;
  eyebrow: string;
  paragraphs: string[];
  questions: Question[];
};

const TOPICS: Topic[] = [
  {
    title: 'Fase luminosa',
    eyebrow: 'Tema 1',
    paragraphs: [
      'La fase luminosa ocurre en las membranas de los tilacoides. La clorofila absorbe energía de la luz y esa energía permite excitar electrones.',
      'Durante estas reacciones se generan ATP y NADPH. También se produce la fotólisis del agua, que libera oxígeno al ambiente.',
    ],
    questions: [
      {
        prompt: '¿Dónde ocurre principalmente la fase luminosa?',
        options: ['En el estroma', 'En los tilacoides', 'En el núcleo'],
        correct: 1,
        source: 'actual',
      },
      {
        prompt: '¿Qué productos energéticos genera esta etapa?',
        options: ['ATP y NADPH', 'Glucosa y CO₂', 'RuBP y oxígeno'],
        correct: 0,
        source: 'actual',
      },
    ],
  },
  {
    title: 'Ciclo de Calvin',
    eyebrow: 'Tema 2',
    paragraphs: [
      'El ciclo de Calvin ocurre en el estroma del cloroplasto. Utiliza ATP y NADPH producidos durante la fase luminosa.',
      'La enzima RuBisCO incorpora dióxido de carbono a una molécula orgánica. A partir de varias reacciones se forman compuestos que luego pueden participar en la síntesis de azúcares.',
    ],
    questions: [
      {
        prompt: '¿Qué utiliza el ciclo de Calvin para poder fijar carbono?',
        options: ['ATP y NADPH', 'Solo oxígeno', 'Agua y clorofila'],
        correct: 0,
        source: 'actual',
      },
      {
        prompt: 'Recordando el tema anterior: ¿qué ocurre con el agua durante la fase luminosa?',
        options: ['Se convierte en glucosa', 'Se descompone y libera oxígeno', 'Se almacena en el estroma'],
        correct: 1,
        source: 'anterior',
      },
    ],
  },
  {
    title: 'Factores que afectan la fotosíntesis',
    eyebrow: 'Tema 3',
    paragraphs: [
      'La velocidad de fotosíntesis depende de factores como la intensidad lumínica, la concentración de CO₂, la temperatura y la disponibilidad de agua.',
      'Si uno de esos factores se vuelve limitante, aumentar los demás no necesariamente produce un incremento adicional en la velocidad fotosintética.',
    ],
    questions: [
      {
        prompt: '¿Cuál de estos factores puede limitar la fotosíntesis?',
        options: ['Temperatura', 'Color del suelo únicamente', 'Cantidad de hojas secas'],
        correct: 0,
        source: 'actual',
      },
      {
        prompt: 'Recordando un tema anterior: ¿en qué parte del cloroplasto ocurre el ciclo de Calvin?',
        options: ['Estroma', 'Tilacoide', 'Membrana externa'],
        correct: 0,
        source: 'anterior',
      },
    ],
  },
];

export default function ResumenActivoDemoPage() {
  const [topicIndex, setTopicIndex] = useState(0);
  const [quizOpen, setQuizOpen] = useState(false);
  const [answers, setAnswers] = useState<Array<number | null>>([null, null]);

  const topic = TOPICS[topicIndex];
  const answered = answers.filter((answer) => answer !== null).length;
  const correctCount = answers.filter(
    (answer, index) => answer !== null && answer === topic.questions[index]?.correct
  ).length;
  const finished = answered === topic.questions.length;

  const resetQuiz = () => setAnswers([null, null]);

  const goNext = () => {
    if (topicIndex >= TOPICS.length - 1) {
      setTopicIndex(0);
    } else {
      setTopicIndex((current) => current + 1);
    }
    setQuizOpen(false);
    resetQuiz();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-[#F5F7FB] text-slate-900">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-bold tracking-[0.15em] text-blue-600 uppercase">
              Demo interna
            </p>
            <h1 className="mt-1 text-sm font-semibold text-slate-900">
              Resumen con comprobaciones breves
            </h1>
          </div>
          <div className="hidden items-center gap-2 text-xs font-medium text-slate-500 sm:flex">
            <Brain className="h-4 w-4" />
            No guarda datos reales
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3">
          <p className="px-2 pb-2 text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">
            Temas del resumen
          </p>
          <div className="space-y-1">
            {TOPICS.map((item, index) => {
              const active = index === topicIndex;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => {
                    setTopicIndex(index);
                    setQuizOpen(false);
                    resetQuiz();
                  }}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? 'bg-indigo-50 font-semibold text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {index < topicIndex ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Circle className={`h-4 w-4 ${active ? 'text-indigo-500' : 'text-slate-300'}`} />
                  )}
                  <span className="min-w-0 truncate">{item.title}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-[1.4rem] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-8 sm:py-8">
          <div className="mx-auto max-w-2xl">
            <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-600 uppercase">
              {topic.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">
              {topic.title}
            </h2>

            <div className="mt-6 space-y-4 text-[15px] leading-7 text-slate-650">
              {topic.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            {!quizOpen ? (
              <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">¿Querés comprobar si lo entendiste?</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Son 2 preguntas rápidas y podés seguir estudiando.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setQuizOpen(true)}
                  className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:mt-0"
                >
                  Comprobar lo que aprendí
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.12em] text-indigo-600 uppercase">
                      Comprobación rápida
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-950">
                      2 preguntas · menos de 1 minuto
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setQuizOpen(false);
                      resetQuiz();
                    }}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-700"
                  >
                    Ahora no
                  </button>
                </div>

                <div className="mt-5 space-y-5">
                  {topic.questions.map((question, questionIndex) => {
                    const selected = answers[questionIndex];
                    return (
                      <div key={question.prompt} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-slate-500 uppercase">
                            {question.source === 'actual' ? 'Tema actual' : 'Tema anterior'}
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-semibold leading-6 text-slate-900">
                          {questionIndex + 1}. {question.prompt}
                        </p>
                        <div className="mt-3 grid gap-2">
                          {question.options.map((option, optionIndex) => {
                            const chosen = selected === optionIndex;
                            const correct = selected !== null && optionIndex === question.correct;
                            const wrong = chosen && optionIndex !== question.correct;

                            return (
                              <button
                                key={option}
                                type="button"
                                disabled={selected !== null}
                                onClick={() =>
                                  setAnswers((current) =>
                                    current.map((answer, index) =>
                                      index === questionIndex ? optionIndex : answer
                                    )
                                  )
                                }
                                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                                  correct
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                    : wrong
                                      ? 'border-rose-300 bg-rose-50 text-rose-800'
                                      : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                        {selected !== null ? (
                          <p
                            className={`mt-3 text-xs font-semibold ${
                              selected === question.correct ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {selected === question.correct
                              ? 'Bien. Este concepto está comprendido.'
                              : 'Conviene reforzar este concepto. En el producto real puede pasar a Mis errores.'}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {finished ? (
                  <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {correctCount === 2
                          ? '2/2 · Podés seguir'
                          : correctCount === 1
                            ? '1/2 · Hay algo para reforzar'
                            : '0/2 · Conviene repasar antes de seguir'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        El próximo corte mezcla el tema nuevo con uno que ya viste.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={resetQuiz}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Repetir
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
                      >
                        {topicIndex === TOPICS.length - 1 ? 'Volver al inicio' : 'Seguir al próximo tema'}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
