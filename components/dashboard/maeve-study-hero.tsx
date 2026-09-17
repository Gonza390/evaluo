'use client';

import Link from 'next/link';
import type { RefObject } from 'react';
import { Globe, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCareerRoute } from '@/lib/routes';
import { useUser } from '@/hooks/useUser';

type Props = {
  materialsCount: number;
  sharedMaterialsCount: number;
  initialCarreraId?: string;
  onUploadClick: () => void;
  heroRef?: RefObject<HTMLElement | null>;
};

export function MaeveStudyHero({
  materialsCount,
  sharedMaterialsCount,
  initialCarreraId = '',
  onUploadClick,
  heroRef,
}: Props) {
  const { user, getUserName } = useUser();
  const firstName = user ? getUserName().split(' ')[0] : '';
  const personalized =
    Boolean(firstName) && firstName !== 'Estudiante'
      ? `Tu espacio de estudio, ${firstName}`
      : 'Tu espacio de estudio';
  const isContributor = sharedMaterialsCount > 0;

  return (
    <section
      ref={heroRef}
      className="rounded-[1.35rem] border border-slate-200/80 bg-white px-4 py-6 sm:px-6 sm:py-7"
    >
      <div className="mx-auto max-w-xl text-center">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
          Tu espacio
        </p>
        <h1 className="mt-2 text-[1.65rem] font-bold tracking-[-0.055em] text-slate-950 sm:text-[2rem]">
          {personalized}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-5 text-slate-500">
          {materialsCount === 0
            ? 'Subí tu PDF y armá resumen, glosario, tarjetas y práctica desde tu propio material.'
            : 'Tus materiales primero. Seguí donde dejaste o sumá otro PDF cuando lo necesites.'}
        </p>
        {isContributor ? (
          <div className="mx-auto mt-3 flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 sm:inline-flex sm:rounded-full">
            <Globe className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-[12.5px] font-semibold text-emerald-700">
              Colaborador de la comunidad
            </span>
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
              {sharedMaterialsCount} {sharedMaterialsCount === 1 ? 'aporte' : 'aportes'}
            </span>
          </div>
        ) : null}
        <div className="mt-5 flex flex-col items-center gap-3">
          <Button
            type="button"
            onClick={onUploadClick}
            className="h-12 w-full max-w-xs rounded-2xl px-6 text-[15px] font-semibold sm:w-auto"
          >
            Subí tu PDF
            <span className="sr-only"> Subir PDF</span>
            <Upload className="h-4 w-4" />
          </Button>
          <Link
            href={initialCarreraId ? getCareerRoute(initialCarreraId) : '/explorar'}
            className="text-[12.5px] font-medium text-slate-400 underline-offset-2 transition hover:text-slate-600 hover:underline"
          >
            Explorar materias
          </Link>
        </div>
      </div>
    </section>
  );
}
