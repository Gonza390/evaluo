'use client';

import type { RefObject } from 'react';
import Link from 'next/link';
import { ArrowRight, GraduationCap, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/useUser';

type Props = {
  materialsCount: number;
  primaryMaterialHref: string | null;
  primaryMaterialReady: boolean;
  onUploadClick: () => void;
  careerName?: string | null;
  careerHref?: string | null;
  heroRef?: RefObject<HTMLElement | null>;
};

export function MaeveStudyHero({
  materialsCount,
  primaryMaterialHref,
  primaryMaterialReady,
  onUploadClick,
  careerName = null,
  careerHref = null,
  heroRef,
}: Props) {
  const { user, getUserName } = useUser();
  const firstName = user ? getUserName().split(' ')[0] : '';
  const personalized =
    Boolean(firstName) && firstName !== 'Estudiante'
      ? `Tu espacio de estudio, ${firstName}`
      : 'Tu espacio de estudio';

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
            ? 'Subí lo que tenés que estudiar y Evaluo te guía para prepararlo.'
            : 'Retomá tu PDF donde lo dejaste o sumá otro material cuando lo necesites.'}
        </p>
        {careerName && careerHref ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-slate-500">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <GraduationCap className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="max-w-[260px] truncate">{careerName}</span>
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <Link
              href={careerHref}
              className="font-semibold text-indigo-700 transition hover:text-indigo-900 hover:underline hover:underline-offset-4"
            >
              Ver plan de materias
            </Link>
          </div>
        ) : null}
        <div className="mt-5 flex flex-col items-center gap-3">
          {materialsCount > 0 && primaryMaterialHref ? (
            <>
              <Button
                asChild
                className="h-12 w-full max-w-xs rounded-2xl px-6 text-[15px] font-semibold sm:w-auto"
              >
                <Link href={primaryMaterialHref}>
                  {primaryMaterialReady ? 'Continuar estudiando' : 'Ver estado del PDF'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <button
                type="button"
                onClick={onUploadClick}
                className="inline-flex min-h-10 items-center gap-2 px-3 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
              >
                <Upload className="h-4 w-4" />
                Subir otro PDF
              </button>
            </>
          ) : (
            <Button
              type="button"
              onClick={onUploadClick}
              className="h-12 w-full max-w-xs rounded-2xl px-6 text-[15px] font-semibold sm:w-auto"
            >
              Subí tu PDF
              <span className="sr-only"> Subir PDF</span>
              <Upload className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
