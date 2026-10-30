'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { readReadingProgress } from '@/lib/reading-progress';

type Material = { id: string; title: string; chapterCount: number };
export function StudyReadingCards({ materials }: { materials: Material[] }) {
  const [progress, setProgress] = useState<Record<string, number>>({});
  useEffect(() => {
    const refresh = () => setProgress(Object.fromEntries(
      materials.map((material) => [
        material.id,
        readReadingProgress(material.id, material.chapterCount),
      ])
    ));
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
    };
  }, [materials]);

  return (
    <section aria-label="Tus PDFs para estudiar" className="mx-auto w-full max-w-[1240px] px-3 py-4 sm:px-5 lg:px-6">
      <h1 className="mb-4 text-xl font-bold tracking-tight text-slate-900">Estudiar</h1>
      {materials.length ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
          {materials.map((material) => {
            const percent = progress[material.id] ?? 0;
            return (
              <Link key={material.id} href={`/materiales/${material.id}?tab=resumen`}
                className="flex min-h-[135px] min-w-0 flex-col items-center rounded-2xl border border-slate-200 bg-white px-2.5 pt-3 pb-2 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                aria-label={`Estudiar ${material.title}, ${percent}% de avance de lectura`}>
                <FileText aria-hidden="true" className="mb-2 h-5 w-5 shrink-0 text-slate-500" />
                <span className="line-clamp-2 min-h-[34px] w-full break-words text-center text-[11px] font-semibold leading-4 text-slate-900 sm:text-xs">
                  {material.title}
                </span>
                <span className="mt-auto pt-3 text-center text-[10px] text-slate-500">
                  Lectura · <span className={percent === 100 ? 'font-bold text-emerald-600' : 'font-semibold text-slate-700'}>{percent}%</span>
                </span>
                <div role="progressbar" aria-label={`Lectura de ${material.title}`}
                  aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}
                  className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${percent === 100 ? 'bg-emerald-400' : 'bg-blue-500'}`}
                    style={{ width: `${percent}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 p-5 text-center text-sm text-slate-600">
          Todavía no tenés PDFs listos para estudiar. Subí uno desde Mi espacio.
        </div>
      )}
    </section>
  );
}
