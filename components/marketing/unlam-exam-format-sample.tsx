'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, FileText } from 'lucide-react';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

const PDF_HREF = '/estudiar-pdf-con-ia?source=ingreso-unlam-2027';

const READING = 'En las carreras universitarias, leer un texto no implica solamente reconocer sus palabras. Para comprender una explicación, los estudiantes necesitan identificar el tema, distinguir las ideas principales de los ejemplos y relacionar las afirmaciones con sus fundamentos. Un resumen puede ayudar a organizar la información, pero pierde utilidad cuando reemplaza la lectura crítica. Por eso, practicar preguntas nuevas sobre un mismo material permite comprobar si una idea fue comprendida y no solo memorizada.';

const OPTIONS = [
  'Contar cronológicamente cómo aparecieron las universidades.',
  'Explicar por qué comprender requiere analizar y recuperar ideas, además de resumir.',
  'Demostrar que realizar resúmenes siempre perjudica el aprendizaje.',
] as const;

const RUBRIC = [
  {
    title: 'Identificaste la idea principal',
    help: 'La comprensión exige reconocer relaciones, fundamentos e ideas; no equivale a memorizar un resumen.',
  },
  {
    title: 'Justificaste con información del texto',
    help: 'Señalaste, por ejemplo, la relación entre lectura crítica, ideas principales y preguntas nuevas.',
  },
  {
    title: 'Distinguiste explicación de opinión',
    help: 'Tu informe describe la propuesta del texto antes de agregar una valoración personal.',
  },
  {
    title: 'Tu respuesta es coherente y tiene tus palabras',
    help: 'La idea se puede seguir de principio a fin y no depende de copiar el fragmento.',
  },
] as const;

export function UnlamExamFormatSample() {
  const [selected, setSelected] = useState<number | null>(null);
  const [justification, setJustification] = useState('');
  const [report, setReport] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [rubricChecks, setRubricChecks] = useState<number[]>([]);

  function select(index: number) {
    if (selected !== null) return;
    const isCorrect = index === 1;
    trackMarketingEvent('seo_unlam_practice_started', {
      location: 'seo_unlam_exam_format_sample',
      subject: 'seminario_modelo',
    });
    trackMarketingEvent('seo_unlam_practice_answered', {
      location: 'seo_unlam_exam_format_sample',
      subject: 'seminario_modelo',
      question_number: 1,
      is_correct: isCorrect,
    });
    setSelected(index);
  }

  function compare() {
    if (!justification.trim() || !report.trim()) return;
    trackMarketingEvent('seo_unlam_practice_completed', {
      location: 'seo_unlam_exam_format_sample',
      subject: 'seminario_modelo',
      correct_answers: selected === 1 ? 1 : 0,
      total_questions: 1,
    });
    setShowGuide(true);
  }

  function toggleRubric(index: number) {
    setRubricChecks((current) =>
      current.includes(index) ? current.filter((number) => number !== index) : [...current, index],
    );
  }

  return (
    <div id="simulacro-seminario-unlam" className="scroll-mt-6 rounded-[24px] border border-blue-200 bg-white p-4 shadow-[0_20px_55px_rgba(15,23,42,0.07)] sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-700">
          Mini práctica inspirada en formatos históricos
        </p>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
          Seminario · sin registro
        </span>
      </div>
      <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
        Probá cómo se trabaja una consigna de lectura y respuesta escrita
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Este fragmento y las consignas fueron creados para esta demostración.
        No provienen del examen de UNLaM ni reproducen preguntas oficiales.
      </p>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-blue-700">
          <FileText className="h-4 w-4" aria-hidden="true" /> Texto de lectura original de Evaluo
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-800 sm:text-[15px]">{READING}</p>
      </div>

      <fieldset className="mt-6 min-w-0">
        <legend className="text-base font-bold leading-7 text-slate-950">
          1. ¿Cuál es la finalidad principal del texto?
        </legend>
        <p className="mt-1 text-xs text-slate-500">Selección de respuesta · corrección automática de esta consigna</p>
        <div className="mt-3 grid gap-2">
          {OPTIONS.map((option, index) => {
            const answered = selected !== null;
            const correct = index === 1;
            const chosenWrong = answered && selected === index && !correct;
            return (
              <button
                type="button"
                key={option}
                onClick={() => select(index)}
                disabled={answered}
                aria-pressed={selected === index}
                className={
                  'flex min-h-12 w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ' +
                  (answered && correct ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : chosenWrong ? 'border-rose-300 bg-rose-50 text-rose-900'
                    : answered ? 'border-slate-200 bg-slate-50 text-slate-500'
                    : 'border-slate-200 bg-white text-slate-800 transition hover:border-blue-300 hover:bg-blue-50')
                }
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current/25 text-xs font-bold">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1">{option}</span>
                {answered && correct ? <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
        {selected !== null ? (
          <p className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-950" aria-live="polite">
            {selected === 1 ? 'Correcto. ' : 'Revisá tu elección. '}
            El propósito es explicar por qué resumir no reemplaza la comprensión ni la práctica con consignas nuevas.
          </p>
        ) : null}
      </fieldset>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <div>
          <label htmlFor="unlam-justify" className="block text-sm font-bold leading-6 text-slate-950">
            2. Justificá tu respuesta usando una idea del fragmento.
          </label>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Ejercicio de argumentación · respuesta redactada con tus palabras.
          </p>
          <textarea
            id="unlam-justify"
            value={justification}
            onChange={(event) => { setJustification(event.target.value); setShowGuide(false); }}
            placeholder="El texto sostiene que... Esto se observa cuando..."
            rows={5}
            className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label htmlFor="unlam-report" className="block text-sm font-bold leading-6 text-slate-950">
            3. Escribí un breve informe descriptivo del fragmento.
          </label>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Mencioná tema, propuesta central y cómo la desarrolla. En el modelo histórico se solicita una producción más extensa.
          </p>
          <textarea
            id="unlam-report"
            value={report}
            onChange={(event) => { setReport(event.target.value); setShowGuide(false); }}
            placeholder="El fragmento aborda... Su idea principal es... Para explicarla..."
            rows={5}
            className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <p className="mt-3 text-xs leading-6 text-slate-500">
        Tus respuestas escritas permanecen en esta pantalla mientras la usás:
        este ejemplo no las envía ni las califica automáticamente.
      </p>
      <button
        type="button"
        disabled={!justification.trim() || !report.trim() || showGuide}
        onClick={compare}
        className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Comparar con los criterios de revisión <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
      </button>

      {showGuide ? (
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-5" aria-live="polite">
          <h4 className="text-lg font-bold text-slate-950">Revisá tu respuesta con estos criterios</h4>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Ejemplo de justificación: el texto plantea que organizar información es útil,
            pero que comprender también requiere distinguir ideas principales, reconocer fundamentos
            y responder nuevas preguntas. Comparalo con lo que escribiste.
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            Lista didáctica inspirada en las habilidades de los modelos históricos.
            No es la rúbrica oficial vigente ni una corrección automática de tu escrito.
          </p>
          <div className="mt-4 space-y-2">
            {RUBRIC.map((criterion, index) => (
              <label key={criterion.title} className="flex cursor-pointer items-start gap-3 rounded-xl border border-blue-100 bg-white p-3">
                <input
                  type="checkbox"
                  checked={rubricChecks.includes(index)}
                  onChange={() => toggleRubric(index)}
                  className="mt-1 h-4 w-4 shrink-0 accent-blue-700"
                />
                <span>
                  <span className="block text-sm font-bold text-slate-900">{criterion.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">{criterion.help}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-sm font-semibold text-blue-800">
            {rubricChecks.length} de {RUBRIC.length} criterios revisados por vos.
          </p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
        <div>
          <p className="font-bold text-slate-950">¿Querés practicar estos conceptos con el manual que estás cursando?</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Seleccioná tu PDF para generar preguntas, repasar conceptos y estudiar por temas en Evaluo.
          </p>
        </div>
        <TrackedLink
          href={PDF_HREF}
          eventName="cta_click"
          payload={{ location: 'seo_unlam_exam_format_sample', cta_name: 'estudiar_manual_pdf', destination: PDF_HREF }}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
        >
          Estudiar con mi PDF <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </TrackedLink>
      </div>
    </div>
  );
}
