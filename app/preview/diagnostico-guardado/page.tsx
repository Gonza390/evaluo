'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Question = {
  id: string;
  parentTopic: string;
  topic: string;
  prompt: string;
  answer: string;
  options: string[];
};

const STORAGE_KEY = 'evaluo-preview-real-pdf-errors-v1';

const questions: Question[] = [
  {
    id: 'model-concept-1',
    parentTopic: 'Dogmática y teoría del delito',
    topic: 'Dogmática',
    prompt: 'Según el PDF, ¿qué describe correctamente “Dogmática”?',
    answer: 'Método lógico, analítico, racional y deductivo utilizado para el estudio del derecho penal positivo vigente.',
    options: [
      'Método lógico, analítico, racional y deductivo utilizado para el estudio del derecho penal positivo vigente.',
      'Herramienta lógica, analítica y didáctica que permite aplicar la ley penal al caso con seguridad jurídica.',
      'Descripción formal del hecho punible, sin valoraciones, sin cuestiones subjetivas, neutro.',
      'Contradicción formal y objetiva del hecho con el derecho.',
    ],
  },
  {
    id: 'fallback-concept-4',
    parentTopic: 'Concepciones dogmáticas',
    topic: 'Concepciones dogmáticas posteriores',
    prompt: '¿Cuál opción explica mejor las concepciones dogmáticas posteriores según el material?',
    answer: 'Clasificación que incluye: Causalismo o positivismo jurídico; Normativismo o teleologismo; Finalismo; Funcionalismo.',
    options: [
      'Categoría que responde a si el hecho prohibido está autorizado por algún precepto legal.',
      'Descripción formal del hecho punible, sin valoraciones, sin cuestiones subjetivas, neutro.',
      'Movimiento corporal meramente voluntario que causa un cambio en el mundo exterior.',
      'Clasificación que incluye: Causalismo o positivismo jurídico; Normativismo o teleologismo; Finalismo; Funcionalismo.',
    ],
  },
  {
    id: 'model-relationship-2',
    parentTopic: 'Normativismo o teleologismo',
    topic: 'Normativismo',
    prompt: '¿Qué relación establece el material entre “Normativismo” y “Causas de justificación supralegales”?',
    answer: 'El normativismo amplía la exclusión de la antijuridicidad mediante causas supralegales.',
    options: [
      'El finalismo traslada el dolo y la culpa desde la culpabilidad hacia el tipo penal.',
      'El funcionalismo moderado rechaza la acción final por criticar el concepto de libre albedrío.',
      'El normativismo amplía la exclusión de la antijuridicidad mediante causas supralegales.',
      'La dogmática es el método utilizado para el estudio del derecho penal positivo.',
    ],
  },
  {
    id: 'model-relationship-5',
    parentTopic: 'Finalismo',
    topic: 'Finalismo',
    prompt: '¿Qué relación establece el material entre “Finalismo” y “Dolo y culpa”?',
    answer: 'El finalismo traslada el dolo y la culpa desde la culpabilidad hacia el tipo penal.',
    options: [
      'La dogmática es el método utilizado para el estudio del derecho penal positivo.',
      'El finalismo traslada el dolo y la culpa desde la culpabilidad hacia el tipo penal.',
      'Funciona como herramienta para aplicar la ley penal al caso.',
      'El normativismo amplía la exclusión de la antijuridicidad mediante causas supralegales.',
    ],
  },
  {
    id: 'model-relationship-6',
    parentTopic: 'Funcionalismo moderado',
    topic: 'Funcionalismo moderado',
    prompt: '¿Qué relación establece el material entre “Funcionalismo moderado” y “Acción final”?',
    answer: 'El funcionalismo moderado rechaza la acción final por criticar el concepto de libre albedrío.',
    options: [
      'Jakobs es el principal exponente de esta corriente dogmática.',
      'El normativismo amplía la exclusión de la antijuridicidad mediante causas supralegales.',
      'El funcionalismo moderado rechaza la acción final por criticar el concepto de libre albedrío.',
      'El finalismo traslada el dolo y la culpa desde la culpabilidad hacia el tipo penal.',
    ],
  },
  {
    id: 'model-concept-3',
    parentTopic: 'Funcionalismo sistémico o radical',
    topic: 'Funcionalismo sistémico o radical',
    prompt: '¿Cuál de estas afirmaciones representa mejor el “Funcionalismo sistémico o radical” según el material?',
    answer: 'Segunda vertiente del funcionalismo que sostiene que las sociedades modernas son de riesgo y contactos anónimos.',
    options: [
      'Riesgo que las sociedades asumen para poder evolucionar y funcionar de modo más eficiente.',
      'Rol más importante en estas sociedades; quien lo incumple defrauda las expectativas sociales.',
      'Segunda vertiente del funcionalismo que sostiene que las sociedades modernas son de riesgo y contactos anónimos.',
      'Fin de la pena orientado a la resocialización del sujeto en el funcionalismo moderado.',
    ],
  },
];

const summaries: Record<string, string> = {
  'Dogmática y teoría del delito':
    'La dogmática penal funciona como método de estudio del derecho penal positivo. La teoría del delito organiza el análisis del caso para aplicar la ley penal con seguridad jurídica.',
  'Concepciones dogmáticas':
    'El material recorre causalismo, normativismo, finalismo y funcionalismo como etapas de evolución de la teoría del delito.',
  'Normativismo o teleologismo':
    'El normativismo incorpora valoraciones a los elementos del delito y amplía la exclusión de antijuridicidad mediante causas de justificación supralegales.',
  Finalismo:
    'El finalismo parte de la acción dirigida a un fin y traslada el dolo y la culpa desde la culpabilidad hacia el tipo penal.',
  'Funcionalismo moderado':
    'El funcionalismo moderado critica aspectos del finalismo y reconstruye categorías del delito desde finalidades político-criminales.',
  'Funcionalismo sistémico o radical':
    'Esta corriente, asociada a Günther Jakobs, analiza el derecho penal desde las expectativas normativas en sociedades complejas y de riesgo.',
};

type SavedState = {
  wrongTopics: string[];
  correct: number;
  total: number;
  savedAt: string;
};

export default function RealPdfSavedErrorsPreview() {
  const [screen, setScreen] = useState<'ready' | 'diagnostic' | 'result' | 'summary' | 'return'>('ready');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<SavedState | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch {}
  }, []);

  const result = useMemo(() => {
    const wrongQuestions = questions.filter((q) => answers[q.id] !== q.answer);
    const wrongTopics = Array.from(new Set(wrongQuestions.map((q) => q.parentTopic)));
    return {
      wrongTopics,
      correct: questions.length - wrongQuestions.length,
      total: questions.length,
    };
  }, [answers]);

  const reset = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSaved(null);
    setAnswers({});
    setIndex(0);
    setScreen('ready');
  };

  const finish = () => {
    const next: SavedState = {
      ...result,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(next);
    setScreen('result');
  };

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen bg-white px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#2563EB]">Vista de prueba · PDF real</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Módulo 2 Lectura 1 · Derecho Penal</p>
          </div>
          <button type="button" onClick={reset} className="text-xs font-semibold text-slate-500 hover:text-slate-800">
            Reiniciar demo
          </button>
        </div>
        {children}
      </div>
    </main>
  );

  if (screen === 'ready') {
    return shell(
      <div className="flex min-h-[66vh] items-center justify-center">
        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center text-indigo-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold tracking-[-0.035em]">Tu PDF está listo</h1>
              <p className="mt-1 text-sm leading-6 text-slate-500">Terminamos de preparar tu material.</p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <FileText className="h-4 w-4 text-indigo-600" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Módulo 2 Lectura 1 Derecho penal</p>
              <p className="mt-0.5 text-xs text-slate-500">3 páginas · procesamiento completado</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">100%</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-full rounded-full bg-indigo-600" />
          </div>

          {saved ? (
            <div className="mt-5 border-t border-slate-200 pt-5">
              <p className="text-sm font-semibold text-slate-900">
                Ya sabemos qué te conviene repasar.
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {saved.wrongTopics.length > 0
                  ? `Tu último diagnóstico marcó dificultad en ${saved.wrongTopics.slice(0, 2).join(' y ')}.`
                  : 'Tu último diagnóstico no dejó temas débiles.'}
              </p>
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-slate-600">
              Antes de empezar, respondé unas preguntas rápidas para saber qué ya dominás y qué conviene repasar.
            </p>
          )}

          <p className="mt-2 text-xs text-slate-400">6 preguntas · ~4 min</p>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setScreen('summary')}>
              Abrir PDF
            </Button>
            {saved ? (
              <Button type="button" onClick={() => setScreen('return')}>
                Continuar estudiando
              </Button>
            ) : (
              <Button type="button" onClick={() => setScreen('diagnostic')}>
                Ver qué tanto sé
              </Button>
            )}
          </div>
        </section>
      </div>
    );
  }

  if (screen === 'diagnostic') {
    const q = questions[index];
    const selected = answers[q.id] ?? '';
    return shell(
      <div className="mx-auto max-w-2xl py-3">
        <button
          type="button"
          onClick={() => setScreen('ready')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </button>
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Diagnóstico</p>
          <span className="text-xs text-slate-400">{index + 1} de {questions.length}</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#2563EB] transition-[width]"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>

        <p className="mt-6 text-xs font-semibold text-[#2563EB]">{q.parentTopic}</p>
        <h1 className="mt-2 text-xl font-bold leading-7 tracking-[-0.035em]">{q.prompt}</h1>
        <div className="mt-5 space-y-2">
          {q.options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setAnswers((current) => ({ ...current, [q.id]: option }))}
              className={`w-full rounded-[14px] border px-4 py-3 text-left text-sm leading-5 transition ${
                selected === option
                  ? 'border-[#2563EB] bg-[#F7FAFF] text-slate-950'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-end border-t border-slate-100 pt-5">
          <Button
            type="button"
            disabled={!selected}
            onClick={() => {
              if (index === questions.length - 1) finish();
              else setIndex((value) => value + 1);
            }}
          >
            {index === questions.length - 1 ? 'Ver resultado' : 'Siguiente'}
          </Button>
        </div>
      </div>
    );
  }

  if (screen === 'result') {
    return shell(
      <div className="mx-auto max-w-2xl py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#2563EB]">Diagnóstico listo</p>
        <h1 className="mt-2 text-[1.75rem] font-bold tracking-[-0.05em]">Ya sabemos por dónde empezar</h1>
        <div className="mt-5 border-y border-slate-200 py-4">
          <p className="text-3xl font-bold tracking-[-0.055em]">{result.correct}/{result.total}</p>
          <p className="mt-1 text-sm text-slate-500">respuestas correctas</p>
        </div>
        <div className="mt-5">
          {result.wrongTopics.length > 0 ? (
            <>
              <p className="text-sm font-semibold">Te conviene repasar primero</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{result.wrongTopics.slice(0, 3).join(', ')}.</p>
              <p className="mt-3 text-xs leading-5 text-slate-400">
                En esta demo esos errores ya quedaron guardados en este navegador.
              </p>
            </>
          ) : (
            <p className="text-sm leading-6 text-slate-600">No detectamos un tema claramente débil en estas seis preguntas.</p>
          )}
        </div>
        <Button type="button" onClick={() => setScreen('summary')} className="mt-6 h-11 w-full rounded-[14px]">
          {result.wrongTopics.length > 0 ? 'Repasar en el resumen' : 'Ir al resumen'}
        </Button>
      </div>
    );
  }

  if (screen === 'return') {
    const topics = saved?.wrongTopics ?? [];
    return shell(
      <div className="mx-auto max-w-3xl py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#2563EB]">Volviste a estudiar</p>
        <h1 className="mt-2 text-[1.8rem] font-bold tracking-[-0.05em]">
          {topics.length > 0 ? `Seguimos con ${topics[0]}` : 'Continuá con el material'}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          {topics.length > 0
            ? 'La última vez este tema te costó. Evaluo lo prioriza antes de hacerte recorrer todo el PDF otra vez.'
            : 'Tu diagnóstico anterior no marcó una debilidad clara.'}
        </p>
        {topics.length > 1 ? (
          <p className="mt-4 text-xs text-slate-500">
            Después: {topics.slice(1, 3).join(' · ')}
          </p>
        ) : null}
        <div className="mt-6 flex gap-2">
          <Button type="button" onClick={() => setScreen('summary')}>Repasar ahora</Button>
          <Button type="button" variant="outline" onClick={() => {
            setAnswers({});
            setIndex(0);
            setScreen('diagnostic');
          }}>
            Volver a probarme
          </Button>
        </div>
      </div>
    );
  }

  const weakTopics = saved?.wrongTopics ?? result.wrongTopics;
  const orderedTopics = [
    ...weakTopics,
    ...Object.keys(summaries).filter((topic) => !weakTopics.includes(topic)),
  ];

  return shell(
    <div className="mx-auto max-w-4xl py-3">
      <button
        type="button"
        onClick={() => setScreen('ready')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver al material
      </button>

      <div className="mt-5 border-b border-slate-200 pb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Resumen</p>
        <h1 className="mt-1 text-[1.65rem] font-bold tracking-[-0.045em]">Módulo 2 Lectura 1 Derecho penal</h1>
      </div>

      {weakTopics.length > 0 ? (
        <section className="border-b border-slate-200 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#2563EB]">Según tu diagnóstico</p>
          <p className="mt-1 text-[1.05rem] font-bold tracking-[-0.03em]">
            Empezá por {weakTopics[0]}
          </p>
          <p className="mt-1 text-[13px] leading-5 text-slate-500">
            Fue uno de los temas donde más dificultad tuviste.
          </p>
        </section>
      ) : null}

      <div className="divide-y divide-slate-200">
        {orderedTopics.map((topic) => (
          <section key={topic} className="py-5">
            <h2 className="text-[1.05rem] font-bold tracking-[-0.03em]">{topic}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{summaries[topic]}</p>
          </section>
        ))}
      </div>

      {saved ? (
        <div className="border-t border-slate-200 pt-5">
          <Button type="button" variant="outline" onClick={() => setScreen('return')}>
            Simular que vuelvo mañana
          </Button>
        </div>
      ) : null}
    </div>
  );
}
