'use client';

import { Diapositivas, type Diapositiva } from '@/components/dashboard/diapositivas';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

const eyebrow = 'truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500';
const headline = 'mt-0.5 mb-2 text-[13px] font-semibold tracking-[-0.01em] text-slate-950';

function QuizPreview({ materialTitle, en }: { materialTitle: string; en: boolean }) {
  return (
    <>
      <div className={eyebrow}>{en ? 'Practice exam' : 'Simulacro'} · {materialTitle}</div>
      <div className={headline}>{en ? 'Timed, like the real exam' : 'Con reloj, como el examen'}</div>
      <div className="flex flex-col gap-1" aria-hidden="true">
        <span className="h-6 rounded-[7px] border border-slate-200 px-2.5 text-[11px] leading-6 text-slate-500">{en ? 'Option A' : 'Opción A'}</span>
        <span className="h-6 rounded-[7px] border-[1.5px] border-blue-400 bg-blue-50/60 px-2.5 text-[11px] leading-[22px] font-medium text-slate-900">{en ? 'Option B' : 'Opción B'}</span>
      </div>
      <div className="mt-2.5 flex justify-between text-[10px] text-slate-500" aria-hidden="true">
        <span>{en ? 'Question 4 of 20' : 'Pregunta 4 de 20'}</span>
        <span>12:40</span>
      </div>
    </>
  );
}

function ErrorsPreview({ en }: { en: boolean }) {
  return (
    <>
      <div className={eyebrow}>{en ? 'To review' : 'Para reforzar'}</div>
      <div className={headline}>{en ? 'Your weak topics' : 'Tus temas flojos'}</div>
      <div aria-hidden="true">
        {[3, 2, 1].map((count, index) => (
          <div key={count} className={`flex items-center justify-between py-1.5 text-[12px] font-medium ${index < 2 ? 'border-b border-slate-100' : ''}`}>
            <span className="h-2 w-24 rounded-full bg-slate-200" />
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] text-red-700">
              {count} {en ? (count === 1 ? 'mistake' : 'mistakes') : count === 1 ? 'error' : 'errores'}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function MapPreview({ materialTitle, en }: { materialTitle: string; en: boolean }) {
  const node = 'absolute flex h-[22px] items-center rounded-[7px] border border-slate-200 bg-white px-2';
  return (
    <>
      <div className={eyebrow}>{en ? 'Mind map' : 'Mapa mental'}</div>
      <div className={headline}>{en ? 'All your notes at a glance' : 'Todo el apunte en una vista'}</div>
      <div className="relative h-[72px]" aria-hidden="true">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 240 72" preserveAspectRatio="none">
          <path d="M120 36 L40 11 M120 36 L200 11 M120 36 L40 61 M120 36 L200 61" stroke="#c4cde0" strokeWidth="1.5" fill="none" />
        </svg>
        <span className="absolute top-[23px] left-1/2 flex h-[26px] max-w-[60%] -translate-x-1/2 items-center truncate rounded-lg bg-blue-600 px-2.5 text-[11px] font-semibold text-white">
          {materialTitle}
        </span>
        <span className={`${node} top-0 left-0 w-16`}><span className="h-1.5 w-full rounded-full bg-slate-200" /></span>
        <span className={`${node} top-0 right-0 w-16`}><span className="h-1.5 w-full rounded-full bg-slate-200" /></span>
        <span className={`${node} bottom-0 left-0 w-16`}><span className="h-1.5 w-full rounded-full bg-slate-200" /></span>
        <span className={`${node} right-0 bottom-0 w-16`}><span className="h-1.5 w-full rounded-full bg-slate-200" /></span>
      </div>
    </>
  );
}

/** "Descubrí": funciones de Evaluo aplicadas al apunte principal. */
export function HomeDiscover({ materialId, materialTitle, locale = 'es' }: { materialId: string; materialTitle: string; locale?: 'es' | 'en' }) {
  const en = locale === 'en';
  const tryIt = en ? 'Try it' : 'Probarlo';
  const track = (slide: string, href: string) => () =>
    trackMarketingEvent('cta_click', { location: 'dashboard_discover', cta_name: slide, destination: href });
  const slides: Diapositiva[] = [
    {
      id: 'simulacro',
      title: en ? 'Practice exam' : 'Simulacro del parcial',
      description: en ? `Take ${materialTitle} under time pressure, just like the real exam.` : `Rendí ${materialTitle} con tiempo, como si fuera el examen.`,
      preview: <QuizPreview materialTitle={materialTitle} en={en} />,
      cta: { label: tryIt, href: `/materiales/${materialId}?tab=ejercicios`, onClick: track('simulacro', `/materiales/${materialId}?tab=ejercicios`) },
    },
    {
      id: 'errores',
      title: en ? 'Mistake review' : 'Repaso de errores',
      description: en ? 'Practice only the topics you got wrong.' : 'Practicá solo los temas donde te equivocaste.',
      preview: <ErrorsPreview en={en} />,
      cta: { label: tryIt, href: '/dashboard/explicaciones', onClick: track('repaso_errores', '/dashboard/explicaciones') },
    },
    {
      id: 'mapa',
      title: en ? 'Mind map' : 'Mapa mental',
      description: en ? `Every topic in ${materialTitle} in a single view.` : `Todos los temas de ${materialTitle} en una sola vista.`,
      preview: <MapPreview materialTitle={materialTitle} en={en} />,
      cta: { label: tryIt, href: `/materiales/${materialId}?tab=mapa`, onClick: track('mapa_mental', `/materiales/${materialId}?tab=mapa`) },
    },
  ];
  return <Diapositivas titulo={en ? 'Discover' : 'Descubrí'} slides={slides} locale={locale} />;
}
