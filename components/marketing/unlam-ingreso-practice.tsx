'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

const UPLOAD_HREF = '/estudiar-pdf-con-ia?source=ingreso-unlam-2027';

const EXERCISES = {
  textos: {
    label: 'Comprensión de textos',
    note: 'Ejercicios ilustrativos de lectura y conectores. No reproducen el examen ni el manual de UNLaM.',
    items: [
      {
        topic: 'Identificar una idea central',
        question: 'Leé: «Organizar la lectura por unidades facilita reconocer los conceptos principales. Sin embargo, para comprobar que los comprendimos necesitamos explicarlos sin mirar el texto». ¿Qué idea resume mejor el fragmento?',
        answers: [
          'Organizar la lectura y recuperar las ideas sin mirar el material son acciones complementarias.',
          'Estudiar con apuntes es innecesario.',
          'Recordar una palabra equivale a comprender el concepto.',
        ],
        correct: 0,
        explanation: 'El texto defiende que organizar la lectura ayuda, pero no sustituye la práctica de explicar conceptos con palabras propias.',
        misconception: 'Las otras opciones exageran o contradicen lo dicho: no se afirma que los apuntes sobren ni que reconocer palabras baste.',
      },
      {
        topic: 'Interpretar conectores',
        question: 'En «Los ejemplos fueron claros; sin embargo, el ejercicio final resultó difícil», ¿qué relación introduce «sin embargo»?',
        answers: ['Causa', 'Contraste', 'Secuencia temporal'],
        correct: 1,
        explanation: '«Sin embargo» introduce una oposición entre dos ideas: ejemplos claros frente a una tarea final difícil.',
        misconception: 'La expresión no presenta una causa ni indica solamente el orden de los hechos.',
      },
    ],
  },
  matematica: {
    label: 'Matemática',
    note: 'Ejercicios originales sobre tipos de problemas presentes en material histórico: dominio y rectas. Justificá tus procedimientos por escrito y verificá el programa de tu carrera.',
    items: [
      {
        topic: 'Dominio de expresiones logarítmicas',
        question: 'Para que log₃(2x − 4) esté definido en los números reales, ¿qué condición debe cumplir x?',
        answers: ['x > 2', 'x ≥ 2', 'x < 2'],
        correct: 0,
        explanation: 'El argumento de un logaritmo real debe ser estrictamente positivo: 2x − 4 > 0. Por eso, x > 2. En x = 2 el argumento es cero y el logaritmo no existe.',
        misconception: 'No alcanza con que el argumento sea mayor o igual a cero: log₃(0) no está definido.',
      },
      {
        topic: 'Justificar perpendicularidad de rectas',
        question: 'Las rectas y = 2x + 1 e y = −(1/2)x + 3, ¿son perpendiculares?',
        answers: [
          'Sí, porque el producto de sus pendientes es −1.',
          'No, porque tienen pendientes diferentes.',
          'No se puede saber sin dibujarlas.',
        ],
        correct: 0,
        explanation: 'Sus pendientes son 2 y −1/2: al multiplicarlas obtenemos −1. Ese es el criterio de perpendicularidad para estas rectas.',
        misconception: 'Las rectas pueden ser perpendiculares aunque sus pendientes sean distintas, y la relación se puede comprobar algebraicamente.',
      },
    ],
  },
  filosofia: {
    label: 'Filosofía y razonamiento',
    note: 'Ejercicios originales de argumentación general; son una demostración, no una reproducción del programa de Filosofía.',
    items: [
      {
        topic: 'Premisa y conclusión',
        question: '«Tenemos que revisar nuestras fuentes porque una afirmación repetida no siempre es correcta». ¿Cuál es la conclusión?',
        answers: [
          'Una afirmación repetida no siempre es correcta.',
          'Tenemos que revisar nuestras fuentes.',
          'Todas las fuentes dicen lo mismo.',
        ],
        correct: 1,
        explanation: 'La conclusión es aquello que se intenta justificar: revisar las fuentes. La razón introducida por «porque» funciona como premisa.',
        misconception: 'La premisa da una razón, pero no es la afirmación principal que se busca sostener.',
      },
      {
        topic: 'Validez de una inferencia',
        question: '«Todos los libros del estante A tienen etiqueta. Este libro está en el estante A. Por lo tanto, tiene etiqueta». Si las premisas son verdaderas, ¿la conclusión se sigue necesariamente?',
        answers: ['Sí, por la estructura del razonamiento.', 'No, porque es solo una probabilidad.', 'No se puede evaluar ningún argumento.'],
        correct: 0,
        explanation: 'La conclusión se desprende de las premisas: todos los A tienen una propiedad y este libro pertenece a A.',
        misconception: 'No se está generalizando desde pocos casos: se aplica una premisa universal a un caso incluido en ella.',
      },
    ],
  },
} as const;

type Area = keyof typeof EXERCISES;
type AnswerState = Record<number, number>;

export function UnlamIngresoPractice() {
  const [area, setArea] = useState<Area>('textos');
  const [answers, setAnswers] = useState<AnswerState>({});
  const exercise = EXERCISES[area];
  const answered = Object.keys(answers).length;
  const complete = answered === exercise.items.length;
  const correctCount = exercise.items.filter((item, index) => answers[index] === item.correct).length;
  const missing = exercise.items.filter((item, index) => complete && answers[index] !== item.correct).map((item) => item.topic);

  function selectArea(next: Area) {
    if (next === area) return;
    setArea(next);
    setAnswers({});
  }

  function choose(questionNumber: number, chosen: number) {
    if (answers[questionNumber] !== undefined) return;
    const item = exercise.items[questionNumber];
    const isCorrect = item.correct === chosen;
    if (answered === 0) {
      trackMarketingEvent('seo_unlam_practice_started', {
        location: 'seo_ingreso_unlam_2027',
        subject: area,
      });
    }
    trackMarketingEvent('seo_unlam_practice_answered', {
      location: 'seo_ingreso_unlam_2027',
      subject: area,
      question_number: questionNumber + 1,
      is_correct: isCorrect,
    });
    if (answered + 1 === exercise.items.length) {
      trackMarketingEvent('seo_unlam_practice_completed', {
        location: 'seo_ingreso_unlam_2027',
        subject: area,
        correct_answers: correctCount + Number(isCorrect),
        total_questions: exercise.items.length,
      });
    }
    setAnswers((current) => ({ ...current, [questionNumber]: chosen }));
  }

  return (
    <div id="practica-ingreso" className="scroll-mt-6 rounded-[28px] border border-blue-100 bg-white p-4 shadow-[0_20px_65px_rgba(15,23,42,0.07)] sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-blue-700">Probá antes de registrarte</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-[28px]">Práctica gratuita para el ingreso</h3>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800" aria-live="polite">
          {answered}/{exercise.items.length} respondidas
        </span>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        Elegí una materia, respondé sin mirar apuntes y recibí una explicación. Son <strong>ejercicios
        originales de muestra</strong>: no son consignas reales de UNLaM, no cubren todo el programa
        ni predicen qué se tomará en el examen.
      </p>
      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Elegir área para practicar">
        {(Object.keys(EXERCISES) as Area[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={area === key}
            onClick={() => selectArea(key)}
            className={
              'min-h-11 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:text-sm ' +
              (area === key
                ? 'border-blue-700 bg-blue-700 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50')
            }
          >
            {EXERCISES[key].label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs leading-6 text-slate-500">{exercise.note}</p>

      <div className="mt-6 space-y-4">
        {exercise.items.map((item, index) => {
          const selected = answers[index];
          const hasAnswered = selected !== undefined;
          const isCorrect = selected === item.correct;
          return (
            <fieldset key={item.topic} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
              <legend className="sr-only">Pregunta {index + 1}: {item.topic}</legend>
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-blue-700">
                Pregunta {index + 1} · {item.topic}
              </p>
              <h4 className="mt-3 text-sm font-bold leading-7 text-slate-950 sm:text-base">{item.question}</h4>
              <div className="mt-4 grid gap-2">
                {item.answers.map((answer, answerIndex) => {
                  const showCorrect = hasAnswered && item.correct === answerIndex;
                  const showWrong = hasAnswered && selected === answerIndex && !isCorrect;
                  return (
                    <button
                      key={answer}
                      type="button"
                      disabled={hasAnswered}
                      aria-pressed={selected === answerIndex}
                      onClick={() => choose(index, answerIndex)}
                      className={
                        'flex min-h-12 w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ' +
                        (showCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                          : showWrong ? 'border-rose-300 bg-rose-50 text-rose-900'
                          : hasAnswered ? 'border-slate-200 bg-white text-slate-500'
                          : 'border-slate-200 bg-white text-slate-700 transition hover:border-blue-300 hover:bg-blue-50')
                      }
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current/25 text-xs font-bold">
                        {String.fromCharCode(65 + answerIndex)}
                      </span>
                      <span className="flex-1">{answer}</span>
                      {showCorrect ? <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                      {showWrong ? <XCircle className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
              {hasAnswered ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4" aria-live="polite">
                  <p className={'text-sm font-bold ' + (isCorrect ? 'text-emerald-700' : 'text-rose-700')}>
                    {isCorrect ? 'Respuesta correcta' : 'Repasemos este concepto'}
                  </p>
                  {!isCorrect ? <p className="mt-2 text-sm font-semibold text-slate-900">La opción correcta es: {item.answers[item.correct]}</p> : null}
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.explanation}</p>
                  {!isCorrect ? <p className="mt-2 text-sm leading-6 text-slate-600">{item.misconception}</p> : null}
                </div>
              ) : null}
            </fieldset>
          );
        })}
      </div>

      {complete ? (
        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-6" aria-live="polite">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">Tu resultado</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            {correctCount} de {exercise.items.length} respuestas correctas
          </p>
          {missing.length > 0 ? (
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Antes de continuar, repasá en tus apuntes: <strong>{missing.join(' y ')}</strong>.
              Probá luego resolver un ejercicio diferente del mismo tema.
            </p>
          ) : (
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Pudiste resolver estos ejemplos. Ahora comprobá qué pasa con consignas nuevas
              sobre las unidades de tu manual actual.
            </p>
          )}
          <p className="mt-2 text-xs leading-6 text-slate-500">
            El resultado es orientativo: no es una calificación de ingreso ni garantiza aprobación.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <TrackedLink
              href={UPLOAD_HREF}
              eventName="cta_click"
              payload={{ location: 'seo_unlam_practice_result', cta_name: 'estudiar_manual_pdf', destination: UPLOAD_HREF }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
            >
              Practicar con mi manual PDF <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </TrackedLink>
            <button type="button" onClick={() => setAnswers({})} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100">
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Volver a intentar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
