'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  FileText,
  ListChecks,
  Pause,
  Play,
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
        <p className="text-[9px] font-bold tracking-[0.16em] text-indigo-700 uppercase">Resumen generado</p>
        <h3 className="mt-1.5 text-lg font-bold tracking-[-0.025em] text-slate-950">Los temas clave, ordenados para repasar</h3>
        <p className="mt-1.5 max-w-[500px] text-[10px] leading-4 text-slate-600">
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
            <span className="pt-0.5 text-[9px] font-black text-indigo-700">{number}</span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-900">{title}</p>
              <p className="mt-0.5 text-[9px] leading-4 text-slate-600">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-3">
        <div className="flex items-start gap-2 rounded-xl bg-indigo-50/80 px-3.5 py-2.5 text-indigo-950">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-indigo-700" aria-hidden="true" />
          <p className="min-w-0 text-[9px] leading-4">
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
        <p className="text-[9px] font-bold tracking-[0.16em] text-indigo-700 uppercase">Flashcards</p>
        <h3 className="mt-1.5 text-lg font-bold tracking-[-0.025em] text-slate-950">Repasá activamente lo que acabás de estudiar</h3>
        <p className="mt-1.5 text-[10px] leading-4 text-slate-600">Tarjetas creadas desde los conceptos del mismo material.</p>
      </div>

      <div className="flex flex-1 items-center justify-center py-3">
        <div className="w-full max-w-[430px] text-center">
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[9px] font-bold text-indigo-700">
            <Brain className="h-3 w-3" aria-hidden="true" />
            Tarjeta 4 de 18
          </div>
          <p className="mt-4 text-[9px] font-bold tracking-[0.16em] text-slate-600 uppercase">Pregunta</p>
          <p className="mx-auto mt-2 max-w-[360px] text-base font-bold leading-6 tracking-tight text-slate-950">
            ¿Cuándo se pueden multiplicar dos matrices?
          </p>
          <div className="mx-auto mt-4 max-w-[390px] border-t border-slate-200 pt-3">
            <p className="text-[9px] font-bold tracking-[0.12em] text-emerald-700 uppercase">Respuesta</p>
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
        <div className="min-w-0">
          <p className="text-[9px] font-bold tracking-[0.16em] text-indigo-700 uppercase">Glosario</p>
          <h3 className="mt-1.5 text-lg font-bold tracking-[-0.025em] text-slate-950">Conceptos importantes, listos para consultar</h3>
          <p className="mt-1.5 text-[10px] leading-4 text-slate-600">Definiciones construidas desde el contenido del material.</p>
        </div>
        <span className="hidden shrink-0 text-[9px] font-semibold text-slate-600 sm:block">43 conceptos</span>
      </div>

      <div className="mt-4 divide-y divide-slate-100 border-y border-slate-200/80">
        {terms.map(([term, definition], index) => (
          <div key={term} className="grid grid-cols-[30px_minmax(0,1fr)] gap-2.5 py-2.5">
            <span className="text-[9px] font-black text-indigo-700">{String(index + 1).padStart(2, '0')}</span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-900">{term}</p>
              <p className="mt-0.5 text-[9px] leading-4 text-slate-600">{definition}</p>
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
        <div className="min-w-0">
          <p className="text-[9px] font-bold tracking-[0.16em] text-indigo-700 uppercase">Ejercicios</p>
          <h3 className="mt-1.5 text-lg font-bold tracking-[-0.025em] text-slate-950">Comprobá si realmente entendiste el tema</h3>
          <p className="mt-1.5 text-[10px] leading-4 text-slate-600">Preguntas generadas desde los conceptos del mismo material.</p>
        </div>
        <span className="hidden shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-700 sm:block">Intermedio</span>
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
              className={`flex min-w-0 items-center justify-between border-b px-1 py-2 text-[10px] font-bold ${
                correct ? 'border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-600'
              }`}
            >
              {option}
              {correct ? <Check className="h-3 w-3 shrink-0" aria-hidden="true" /> : null}
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-3">
        <p className="text-[9px] leading-4 text-slate-600">
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
          <UploadCloud className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-[9px] font-bold tracking-[0.16em] text-indigo-700 uppercase">Ahora probalo con el tuyo</p>
        <h3 className="mx-auto mt-1.5 max-w-[390px] text-xl font-bold tracking-[-0.035em] text-slate-950">
          Subí tu archivo y empezá a estudiar
        </h3>
        <p className="mx-auto mt-2 max-w-[390px] text-[10px] leading-4 text-slate-600">
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
            className="from-brand to-brand-2 inline-flex h-10 max-w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-4 text-[11px] font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Subir mi PDF gratis
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </TrackedLink>
          <TrackedLink
            href={loginUploadHref}
            eventName="cta_click"
            payload={{
              location: 'home_study_preview',
              cta_name: 'subir_pdf_login',
              destination: loginUploadHref,
            }}
            className="inline-flex h-10 max-w-full items-center justify-center px-3 text-[10px] font-bold text-slate-600 transition hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
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
  const [userPaused, setUserPaused] = useState(true);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const activeStep = previewSteps[activeIndex];
  const ActivePreview = previews[activeStep.id];
  const ActiveIcon = activeStep.icon;
  const rotationDelay = activeStep.id === 'subir' ? 5200 : 3600;
  const paused = userPaused || interactionPaused || reducedMotion;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

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
      role="region"
      aria-roledescription="carrusel"
      aria-label="Vista previa de herramientas de estudio"
      onMouseEnter={() => setInteractionPaused(true)}
      onMouseLeave={() => setInteractionPaused(false)}
      onFocusCapture={() => setInteractionPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setInteractionPaused(false);
        }
      }}
      onPointerDown={() => setInteractionPaused(true)}
    >
      <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-indigo-200/45 via-blue-100/20 to-transparent blur-3xl" />

      <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_26px_72px_rgba(15,23,42,0.14)]">
        <div className="h-0.5 overflow-hidden bg-indigo-100" aria-hidden="true">
          <div
            key={`progress-${activeStep.id}`}
            className="h-full w-full origin-left bg-indigo-600"
            style={reducedMotion ? undefined : { animation: `homePreviewProgress ${rotationDelay}ms linear`, animationPlayState: paused ? 'paused' : 'running' }}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 sm:gap-4 sm:px-5 sm:py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <ActiveIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[8px] font-semibold tracking-[0.14em] text-slate-600 uppercase">{activeStep.id === 'subir' ? 'Empezá con tu material' : 'Vista de estudio'}</p>
              <p className="mt-0.5 truncate text-[11px] font-bold text-slate-900 sm:text-xs" aria-live={paused ? 'polite' : 'off'}>{activeStep.label}</p>
            </div>
          </div>
          <span className="shrink-0 text-[9px] font-semibold text-slate-600">{activeIndex + 1} / {previewSteps.length}</span>
        </div>

        <div className="bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] px-4 py-3.5 sm:px-6 sm:py-4">
          <div key={activeStep.id} className={`min-h-[250px] sm:min-h-[265px] ${reducedMotion ? '' : 'animate-surface-reveal'}`}>
            <ActivePreview />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-3 py-2 sm:gap-4 sm:px-4">
          <p className="min-w-0 pr-1 text-[9px] leading-4 font-semibold text-slate-600">
            {activeStep.id === 'subir' ? 'Tu material puede ser el próximo' : 'Un mismo material, distintas formas de estudiarlo'}
          </p>
          <div className="flex shrink-0 items-center gap-1" aria-label="Controles de la vista previa">
            <button
              type="button"
              onClick={() => setUserPaused((current) => !current)}
              aria-label={userPaused ? 'Reanudar rotación automática' : 'Pausar rotación automática'}
              aria-pressed={userPaused}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {userPaused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
            </button>
            {previewSteps.map(({ id, label }, index) => (
              <button
                key={id}
                type="button"
                aria-label={`Mostrar ${label}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                onClick={() => setActiveIndex(index)}
                className="flex h-9 min-w-9 items-center justify-center rounded-lg transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <span className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-5 bg-indigo-700' : 'w-2 bg-slate-400'}`} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes homePreviewProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>
    </div>
  );
}
