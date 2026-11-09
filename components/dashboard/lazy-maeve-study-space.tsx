'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type { MaeveStudySpace } from '@/components/dashboard/maeve-study-space';

const loadStudySpace = () =>
  import('@/components/dashboard/maeve-study-space').then((module) => module.MaeveStudySpace);

const block = 'animate-pulse rounded-2xl bg-slate-100/80';

/** Carga de la home anterior / espacio vacío. */
const MaeveStudySpaceLazy = dynamic(loadStudySpace, {
  loading: () => (
    <div className="mx-auto max-w-[760px] space-y-3" aria-busy="true">
      <div className="min-h-[160px] animate-pulse rounded-[1.25rem] border border-slate-200/80 bg-slate-50" />
      <div className="min-h-[180px] animate-pulse rounded-xl border border-slate-200/80 bg-slate-50" />
    </div>
  ),
});

/**
 * Carga de la home con Agenda: misma grilla que `HomeSpace` (saludo + tarjeta a la izquierda,
 * Agenda + Descubrí a la derecha), para que al aparecer el contenido no se reacomode la pantalla.
 */
const HomeAgendaSpaceLazy = dynamic(loadStudySpace, {
  loading: () => (
    <div
      aria-busy="true"
      className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-x-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-x-10"
    >
      <div className="min-w-0 space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-14 shrink-0 animate-pulse rounded-full bg-slate-100/80 lg:size-[72px]" />
          <div className={`${block} h-8 w-2/3 max-w-[360px]`} />
        </div>
        <div className={`${block} h-[180px] max-w-[560px]`} />
        <div className={`${block} h-[120px]`} />
      </div>
      <div className="min-w-0 space-y-5 lg:pt-1">
        <div className={`${block} h-[220px]`} />
        <div className={`${block} h-[290px]`} />
      </div>
    </div>
  ),
});

export function LazyMaeveStudySpace(props: ComponentProps<typeof MaeveStudySpace>) {
  return props.homeView ? <HomeAgendaSpaceLazy {...props} /> : <MaeveStudySpaceLazy {...props} />;
}
