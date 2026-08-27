'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  FileText,
  ListChecks,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { TrackedLink } from '@/components/marketing/tracked-link';

const uploadNextPath = '/dashboard?openUpload=1';
const signupUploadHref = `/login?mode=signup&next=${encodeURIComponent(uploadNextPath)}`;
const loginUploadHref = `/login?mode=login&next=${encodeURIComponent(uploadNextPath)}`;

const previewSteps = [
  { id: 'resumen', label: 'Resumen', icon: FileText },
  { id: 'flashcards', label: 'Flashcards', icon: Brain },
  { id: 'glosario', label: 'Glosario', icon: BookOpen },
  { id: 'ejercicios', label: 'Ejercicios', icon: ListChecks },
  { id: 'subir', label: 'Tu PDF', icon: UploadCloud },
] as const;

type PreviewStepId = (typeof previewSteps)[number]['id'];

function ResumenPreview() {
  return (
    <div className="flex h-full flex-col">
      <div>
        <p className="text-[9px] font-bold tracking-[0.16em] text-indigo-500 uppercase">Resumen generado</p>
        <h3 className="mt-1.5 text-lg font-bold tracking-[-0.025em] text-slate-950">Los temas clave, ordenados para repasar</h3>
        <p className="mt-1.5 max-w-[500px] text-[10px] leading-4 text-slate-500">
          Evaluo organiza el material y separa lo importante antes de practicar.
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/90 bg-white/80">
        {[
          ['01', 'Sistemas de ecuaciones', 'Métodos, interpretación y resolución.'],
          ['02', 'Matrices', 'Tipos, operaciones y producto matricial.'],
          ['03', 'Vectores', 'Combinación y dependencia lineal.'],
        ].map(([number, title, description], index) => (
          <div
            key={title}
            className={`flex items-start gap-3 px-3.5 py-2.5 ${index > 0 ? 'border-t border-slate-100' : ''}`}
          >
            <span className="pt-0.5 text-[9px] font-black text-indigo-500">{number}</span>
            <div>
              <p className="text-[10px] font-bold text-slate-900">{title}</p>
              <p className="mt-0.5 text-[9px] leading-4 text-slate-500">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-3">
        <div className="flex items-start gap-2 rounded-xl bg-indigo-50/80 px-3.5 py-2.5 text-indigo-950">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-indigo-500" />
          <p className="text-[9px] leading-4">
            <strong>Idea clave:</strong> para multiplicar matrices, las columnas de la primera deben coincidir con las filas de la segunda.
          </p>
        </div>
      </div>
    </div>
  );
}

function FlashcardsPreview() {
  return (
    <div className="flex h-full flex-col">
      <div>
        <p className="text-[9px] font-bold tracking-[0.16em] text-indigo-500 uppercase">Flashcards</p>
        <h3 className="mt-1.5 text-lg font-bold tracking-[-0.025em] text-slate-950">Repasá activamente lo que acabás de estudiar</h3>
        <p className="mt-1.5 text-[10px] leading-4 text-slate-500">Tarjetas creadas desde los conceptos del mismo material.</p>
      </div>

      <div className="flex flex-1 items-center justify-center py-3">
        <div className="w-full max-w-[430px] text-center">
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[9px] font-bold text-indigo-600">
            <Brain className="h-3 w-3" />
            Tarjeta 4 de 18
          </div>
          <p className="mt-4 text-[9px] font-bold tracking-[0.16em] text-slate-400 uppercase">Pregunta</p>
          <p className="mx-auto mt-2 max-w-[360px] text-base font-bold leading-6 tracking-tight text-slate-950">
            ¿Cuándo se pueden multiplicar dos matrices?
          </p>
          <div className="mx-auto mt-4 max-w-[390px] border-t border-slate-200 pt-3">
            <p className="text-[9px] font-bold tracking-[0.12em] text-emerald-600 uppercase">Respuesta</p>
            <p className="mt-1.5 text-[10px] leading-4 font-semibold text-slate-700">
              Cuando las columnas de A coinciden con las filas de B.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GlosarioPreview() {
  const terms = [
    ['Matriz identidad', 'Matriz cuadrada con 1 en la diagonal principal y 0 en el resto.'],
    ['Vector columna', 'Matriz de una sola columna con componentes ordenadas.'],
    ['Combinación lineal', 'Suma de vectores multiplicados por escalares.'],
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[9px] font-bold tracking-[0.16em] text-indigo-500 uppercase">Glosario</p>
          <h3 className="mt-1.5 text-lg font-bold tracking-[-0.025em] text-slate-950">Conceptos importantes, listos para consultar</h3>
          <p className="mt-1.5 text-[10px] leading-4 text-slate-500">Definiciones construidas desde el contenido del material.</p>
        </div>
        <span className="hidden shrink-0 text-[9px] font-semibold text-slate-400 sm:block">43 conceptos</span>
      </div>

      <div className="mt-4 divide-y divide-slate-100 border-y border-slate-200/80">
        {terms.map(([term, definition], index) => (
          <div key={term} className="grid grid-cols-[30px_1fr] gap-2.5 py-2.5">
            <span className="text-[9px] font-black text-indigo-500">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <p className="text-[10px] font-bold text-slate-900">{term}</p>
              <p className="mt-0.5 text-[9px] leading-4 text-slate-500">{definition}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EjerciciosPreview() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-bold tracking-[0.16em] text-indigo-500 uppercase">Ejercicios</p>
          <h3 className="mt-1.5 text-lg font-bold tracking-[-0.025em] text-slate-950">Comprobá si realmente entendiste el tema</h3>
          <p className="mt-1.5 text-[10px] leading-4 text-slate-500">Preguntas generadas desde los conceptos del mismo material.</p>
        </div>
        <span className="hidden rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-500 sm:block">Intermedio</span>
      </div>

      <p className="mt-4 max-w-[510px] text-xs leading-5 font-semibold text-slate-900">
        Si A es una matriz 3×2 y B es una matriz 2×4, ¿qué dimensión tiene el producto AB?
      </p>

      <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-0.5">
        {['2×2', '2×4', '3×2', '3×4'].map((option) => {
          const correct = option === '3×4';
          return (
            <div
              key={option}
              className={`flex items-center justify-between border-b px-1 py-2 text-[10px] font-bold ${
                correct ? 'border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-500'
              }`}
            >
              {option}
              {correct ? <Check className="h-3 w-3" /> : null}
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-3">
        <p className="text-[9px] leading-4 text-slate-500">
          <strong className="text-indigo-700">Por qué:</strong> el resultado conserva las filas de A y las columnas de B, por eso queda 3×4.
        </p>
      </div>
    </div>
  );
}

function UploadPreview() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="mx-auto w-full max-w-[460px] text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-[0_12px_30px_rgba(79,70,229,0.24)]">
          <UploadCloud className="h-5 w-5" />
        </span>
        <p className="mt-4 text-[9px] font-bold tracking-[0.16em] text-indigo-500 uppercase">Ahora probalo con el tuyo</p>
        <h3 className="mx-auto mt-1.5 max-w-[390px] text-xl font-bold tracking-[-0.035em] text-slate-950">
          Subí tu archivo y empezá a estudiar
        </h3>
        <p className="mx-auto mt-2 max-w-[390px] text-[10px] leading-4 text-slate-500">
          Convertí tus apuntes en resumen, glosario, flashcards y ejercicios desde un solo lugar.
        </p>

        <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <TrackedLink
            href={signupUploadHref}
            eventName="cta_click"
            payload={{
              location: 'home_study_preview',
              cta_name: 'subir_pdf_registro',
              destination: signupUploadHref,
            }}
            className="from-brand to-brand-2 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-4 text-[11px] font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5"
          >
            Subir mi PDF gratis
            <ArrowRight className="h-3.5 w-3.5" />
          </TrackedLink>
          <TrackedLink
            href={loginUploadHref}
            eventName="cta_click"
            payload={{
              location: 'home_study_preview',
              cta_name: 'subir_pdf_login',
              destination: loginUploadHref,
            }}
            className="inline-flex h-10 items-center justify-center px-3 text-[10px] font-bold text-slate-500 transition hover:text-indigo-700"
          >
            Ya tengo cuenta
          </TrackedLink>
        </div>
      </div>
    </div>
  );
}

const previews: Record<PreviewStepId, () => React.JSX.Element> = {
  resumen: ResumenPreview,
  flashcards: FlashcardsPreview,
  glosario: GlosarioPreview,
  ejercicios: EjerciciosPreview,
  subir: UploadPreview,
};

export function HomeStudyPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const activeStep = previewSteps[activeIndex];
  const ActivePreview = previews[activeStep.id];
  const ActiveIcon = activeStep.icon;
  const rotationDelay = activeStep.id === 'subir' ? 5200 : 3600;

  useEffect(() => {
    if (paused) return;

    const timeout = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % previewSteps.length);
    }, rotationDelay);

    return () => window.clearTimeout(timeout);
  }, [activeIndex, paused, rotationDelay]);

  return (
    <div
      className="animate-surface-reveal relative mx-auto w-full max-w-[620px]"
      style={{ animationDelay: '100ms' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-indigo-200/45 via-blue-100/20 to-transparent blur-3xl" />

      <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_26px_72px_rgba(15,23,42,0.14)]">
        <div className="h-0.5 overflow-hidden bg-indigo-100">
          <div
            key={`progress-${activeStep.id}`}
            className="h-full w-full origin-left bg-indigo-500"
            style={{ animation: `homePreviewProgress ${rotationDelay}ms linear` }}
          />
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-2.5 sm:px-5 sm:py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ActiveIcon className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-[8px] font-semibold tracking-[0.14em] text-slate-400 uppercase">{activeStep.id === 'subir' ? 'Empezá con tu material' : 'Vista de estudio'}</p>
              <p className="mt-0.5 text-[11px] font-bold text-slate-900 sm:text-xs">{activeStep.label}</p>
            </div>
          </div>
          <span className="text-[9px] font-semibold text-slate-400">{activeIndex + 1} / {previewSteps.length}</span>
        </div>

        <div className="bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] px-4 py-3.5 sm:px-6 sm:py-4">
          <div key={activeStep.id} className="min-h-[250px] animate-surface-reveal sm:min-h-[265px]">
            <ActivePreview />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 sm:px-5">
          <p className="text-[9px] font-semibold text-slate-500">
            {activeStep.id === 'subir' ? 'Tu material puede ser el próximo' : 'Un mismo material, distintas formas de estudiarlo'}
          </p>
          <div className="flex items-center gap-1.5" aria-label="Cambiar vista">
            {previewSteps.map(({ id, label }, index) => (
              <button
                key={id}
                type="button"
                aria-label={`Mostrar ${label}`}
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-5 bg-indigo-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes homePreviewProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
