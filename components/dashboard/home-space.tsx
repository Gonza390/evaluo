'use client';

import type { ReactNode } from 'react';
import { usePdfUploadTrigger } from '@/components/dashboard/pdf-first-upload-shell';
import { HomeHero } from '@/components/dashboard/home-hero';
import { HomeAgenda } from '@/components/dashboard/home-agenda';
import { HomeDiscover } from '@/components/dashboard/home-discover';
import type { HomeView } from '@/lib/dashboard-home-model';

/**
 * Home con Agenda (alumno con al menos un PDF listo).
 * Escritorio: columna central (saludo + tarjeta + PDFs) y columna derecha de 360 px (Agenda + Descubrí).
 * Teléfono: saludo, tarjeta, Agenda, Descubrí y PDFs, en ese orden.
 */
export function HomeSpace({
  view,
  today,
  materialId,
  materialTitle,
  children,
}: {
  view: HomeView;
  today: string;
  materialId: string;
  materialTitle: string;
  children: ReactNode;
}) {
  const openUploadPicker = usePdfUploadTrigger();
  return (
    <div
      data-dashboard-home="agenda"
      className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-9"
    >
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">
        <HomeHero view={view} onUploadClick={() => openUploadPicker('dashboard_hero')} />
      </div>
      <aside className="flex min-w-0 flex-col gap-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:gap-12 lg:pt-2" aria-label="Agenda y sugerencias">
        <HomeAgenda agenda={view.agenda} today={today} />
        <div className="border-t border-slate-100 pt-5">
          <HomeDiscover materialId={materialId} materialTitle={materialTitle} />
        </div>
      </aside>
      <div className="min-w-0 lg:col-start-1 lg:row-start-2 [&_button]:shadow-none">{children}</div>
    </div>
  );
}
