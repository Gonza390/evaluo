'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { TrackedLink } from '@/components/marketing/tracked-link';

const PDF_HREF = '/estudiar-pdf-con-ia?source=seo-uba-xxi-parciales';

const QUESTIONS = [
  {
    topic: 'Reconocer argumentos',
    prompt: '«Si el laboratorio repite la medición, el resultado puede cambiar». ¿Este fragmento constituye, por sí solo, un argumento?',
    options: [
      'Sí, porque menciona dos hechos.',
      'No, porque expresa una condición, pero no ofrece razones para defender una conclusión.',
      'Sí, porque todos los enunciados científicos son argumentos.',
    ],
    correct: 1,
    explanation:
      'Una oración condicional vincula posibilidades, pero no necesariamente intenta justificar una afirmación. Para reconocer un argumento buscá premisas que se ofrezcan como razones a favor de una conclusión.',
    contrast:
      'Contar enunciados o usar vocabulario científico no alcanza para identificar un argumento.',
  },
  {
    topic: 'Premisas y conclusión',
    prompt: '«Conviene practicar sin mirar los apuntes, porque reconocer una definición no garantiza poder explicarla». ¿Cuál es la conclusión?',
    options: [
      'Reconocer una definición no garantiza poder explicarla.',
      'Conviene practicar sin mirar los apuntes.',
      'Una definición nunca se puede explicar.',
    ],
    correct: 1,
    explanation:
      'La conclusión es lo que el argumento busca sostener: conviene practicar sin mirar los apuntes. La segunda parte, introducida por «porque», funciona como premisa.',
    contrast:
      'La premisa explica por qué se sostiene la recomendación; no es la recomendación misma.',
  },
  {
    topic: 'Razonamiento inductivo',
    prompt: 'En tres muestras observadas de un lote, la mayoría de las semillas germinó. Alguien concluye que probablemente suceda algo parecido con otra muestra. ¿Qué tipo de razonamiento utiliza?',
    options: [
      'Una deducción que garantiza la conclusión.',
      'Una enumeración inductiva, cuya conclusión es probable y revisable.',
      'Una contradicción lógica.',
    ],
    correct: 1,
    explanation:
      'La conclusión amplía lo observado a un caso todavía no examinado. Es inductiva: las observaciones pueden apoyarla, pero no garantizarla.',
    contrast:
      'La evidencia disponible no vuelve necesaria la conclusión. Una nueva muestra podría comportarse de otra manera.',
  },
] as const;

export function UbaXxiParcialesPractice() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const answered = Object.keys(answers).length;
  const finished = answered === QUESTIONS.length;
  const correctCount = QUESTIONS.filter((question, index) => answers[index] === question.correct).length;
  const topicsToReview = QUESTIONS.filter(
    (question, index) => finished && answers[index] !== question.correct,
  ).map((question) => question.topic);

  function choose(questionIndex: number, optionIndex: number) {
    if (answers[questionIndex] !== undefined) return;

    const isCorrect = QUESTIONS[questionIndex].correct === optionIndex;
    if (answered === 0) {
      trackMarketingEvent('seo_uba_xxi_practice_started', {
        location: 'seo_uba_xxi_parciales',
        experience: 'ipc_original_questions',
      });
    }
    trackMarketingEvent('seo_uba_xxi_practice_answered', {
      location: 'seo_uba_xxi_parciales',
      question_number: questionIndex + 1,
      is_correct: isCorrect,
    });

    if (answered + 1 === QUESTIONS.length) {
      const finalScore = correctCount + (isCorrect ? 1 : 0);
      trackMarketingEvent('seo_uba_xxi_practice_completed', {
        location: 'seo_uba_xxi_parciales',
        correct_answers: finalScore,
        total_questions: QUESTIONS.length,
      });
    }
    setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }));
  }

  function reset() {
    setAnswers({});
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
            Práctica abierta · sin registro
          </p>
          <p className="mt-1 text-sm text-slate-700">3 ejercicios originales basados en habilidades que aparecen en parciales de IPC.</p>
        </div>
        <span aria-live="polite" className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-blue-900">
          {answered} de {QUESTIONS.length} respondidas
        </span>
      </div>

      {QUESTIONS.map((question, index) => {
        const selected = answers[index];
        const hasAnswered = selected !== undefined;
        const correct = selected === question.correct;
        return (
          <fieldset key={question.topic} className="min-w-0 rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.05)] sm:p-6">
            <legend className="sr-only">Pregunta {index + 1}: {question.topic}</legend>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
              {String(index + 1).padStart(2, '0')} / {QUESTIONS.length} · {question.topic}
            </p>
            <h3 className="mt-3 text-base font-bold leading-7 text-slate-950 sm:text-lg">
              {question.prompt}
            </h3>
            <div className="mt-5 grid gap-2">
              {question.options.map((option, optionIndex) => {
                const isCorrectOption = optionIndex === question.correct;
                const isSelected = optionIndex === selected;
                const answeredStyle = hasAnswered
                  ? isCorrectOption
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : isSelected
                      ? 'border-rose-300 bg-rose-50 text-rose-900'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/60';
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={hasAnswered}
                    aria-pressed={isSelected}
                    onClick={() => choose(index, optionIndex)}
                    className={'flex min-h-12 w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm leading-6 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:px-4 ' + answeredStyle}
                  >
                    <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current/20 bg-white/80 text-xs font-bold">
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {hasAnswered && isCorrectOption ? <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                    {hasAnswered && isSelected && !correct ? <XCircle className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
            {hasAnswered ? (
              <div aria-live="polite" className="mt-4 rounded-xl bg-slate-50 px-4 py-4">
                <p className={'flex items-center gap-2 text-sm font-bold ' + (correct ? 'text-emerald-700' : 'text-rose-700')}>
                  {correct ? '¡Correcto!' : 'Revisá la respuesta'}
                </p>
                {!correct ? (
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    Respuesta correcta: {question.options[question.correct]}
                  </p>
                ) : null}
                <p className="mt-2 text-sm leading-6 text-slate-700">{question.explanation}</p>
                {!correct ? <p className="mt-2 text-sm leading-6 text-slate-600">{question.contrast}</p> : null}
              </div>
            ) : null}
          </fieldset>
        );
      })}

      {finished ? (
        <div aria-live="polite" className="rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Fin de la práctica</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            {correctCount} de {QUESTIONS.length} respuestas correctas
          </p>
          {topicsToReview.length > 0 ? (
            <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4">
              <p className="text-sm font-bold text-slate-900">
                Próximo paso: repasá {topicsToReview.length === 1 ? 'este concepto' : 'estos conceptos'} en tus apuntes
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {topicsToReview.map((topic) => <li key={topic}>{topic}</li>)}
              </ul>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Volvé a la bibliografía de tu cátedra y probá nuevas consignas sobre esos temas.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4">
              <p className="text-sm font-bold text-slate-900">Respondés bien estos tres ejemplos</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                El próximo desafío es resolver preguntas distintas del resto del programa usando
                tus apuntes actuales, sin depender de las respuestas de un examen viejo.
              </p>
            </div>
          )}
          <p className="mt-4 text-sm leading-6 text-slate-700">
            Esta práctica breve es ilustrativa: no equivale a un examen oficial,
            no cubre todo el programa y no permite predecir si vas a aprobar.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <TrackedLink
              href={PDF_HREF}
              eventName="cta_click"
              payload={{
                location: 'seo_uba_xxi_parciales_result',
                cta_name: 'estudiar_con_mi_pdf',
                destination: PDF_HREF,
              }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {topicsToReview.length > 0 ? 'Reforzar con mis apuntes PDF' : 'Seguir practicando con mi PDF'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </TrackedLink>
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Repetir práctica
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
