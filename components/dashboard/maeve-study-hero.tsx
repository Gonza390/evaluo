'use client';

import type { RefObject } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/useUser';

type Props = {
  materialsCount: number;
  onUploadClick: () => void;
  heroRef?: RefObject<HTMLElement | null>;
};

export function MaeveStudyHero({
  materialsCount,
  onUploadClick,
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
        <div className="mt-5 flex justify-center">
          <Button
            type="button"
            onClick={onUploadClick}
            className="h-12 w-full max-w-xs rounded-2xl px-6 text-[15px] font-semibold sm:w-auto"
          >
            Subí tu PDF
            <span className="sr-only"> Subir PDF</span>
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
