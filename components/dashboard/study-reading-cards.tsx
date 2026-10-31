'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpenText, ChartNoAxesColumnIncreasing, FileText, Layers3, Network, BookOpen } from 'lucide-react';
import { readReadingProgress } from '@/lib/reading-progress';

type Material = { id: string; title: string; chapterCount: number };
export function StudyReadingCards({ materials, lastOpenedMaterialId }: { materials: Material[]; lastOpenedMaterialId: string | null }) {
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

  const activeMaterial = materials.find((material) => material.id === lastOpenedMaterialId) ?? materials[0] ?? null;
  const tools = [
    { title: 'Resumen', description: 'Repasá lo esencial.', icon: BookOpenText, tab: 'resumen', color: 'text-[#376CAD]', background: 'bg-[#E8F2FF]' },
    { title: 'Flashcards', description: 'Memorizá con tarjetas.', icon: Layers3, tab: 'tarjetas', color: 'text-[#745AB3]', background: 'bg-[#F0EBFC]' },
    { title: 'Glosario', description: 'Entendé los conceptos.', icon: BookOpen, tab: 'glosario', color: 'text-[#41839B]', background: 'bg-[#E2F2F7]' },
    { title: 'Mapa mental', description: 'Conectá las ideas.', icon: Network, tab: 'mapa', color: 'text-[#35816A]', background: 'bg-[#E9F5EE]' },
    { title: 'Progreso', description: 'Revisá tu aprendizaje.', icon: ChartNoAxesColumnIncreasing, tab: 'progreso', color: 'text-[#AD713D]', background: 'bg-[#FFF2E6]' },
  ] as const;

  return (
    <section aria-label="Tus PDFs para estudiar" className="mx-auto w-full max-w-[1240px] px-3 py-4 sm:px-5 lg:px-6">
      <h1 className="mb-4 text-[20px] font-semibold tracking-[-0.035em] sm:text-[22px] lg:text-[24px] text-slate-900">Tus materiales</h1>
      {materials.length ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
          {materials.map((material) => {
            const percent = progress[material.id] ?? 0;
            return (
              <Link key={material.id} href={`/materiales/${material.id}?tab=resumen`}
                className="flex min-h-[112px] min-w-0 flex-col items-center rounded-2xl border border-slate-200/90 bg-white px-3 pt-3 pb-2.5 shadow-[0_3px_14px_rgba(15,23,42,0.025)] transition hover:border-blue-200 hover:shadow-[0_6px_20px_rgba(15,23,42,0.045)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                aria-label={`Estudiar ${material.title}, ${percent}% de avance de lectura`}>
                <FileText aria-hidden="true" className="mb-1.5 h-4 w-4 shrink-0 text-slate-500" />
                <span className="line-clamp-2 min-h-[32px] w-full break-words text-center text-[11px] font-medium leading-4 text-slate-900 sm:text-xs">
                  {material.title}
                </span>
                <span className="mt-auto pt-1.5 text-center text-[10px] text-slate-500">
                  Lectura · <span className={percent === 100 ? 'font-medium text-emerald-600' : 'font-medium text-slate-700'}>{percent}%</span>
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
      <div className="mt-5 border-t border-slate-100 pt-4">
        <h2 className="text-[15px] font-normal tracking-tight text-slate-900">Herramientas de estudio</h2>
        <p className="mt-1 text-xs text-slate-500">
          {activeMaterial ? `Continuá con ${activeMaterial.title}` : 'Subí un PDF desde Mi espacio para empezar.'}
        </p>
        <div className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-3 sm:gap-3 xl:grid xl:grid-cols-5 xl:overflow-visible">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const className = `flex min-h-[142px] xl:min-h-[118px] w-[min(74vw,240px)] min-w-[min(74vw,240px)] snap-start flex-col rounded-2xl border border-transparent p-3.5 text-left transition hover:border-current/15 hover:shadow-[0_4px_16px_rgba(15,23,42,0.035)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:w-[174px] sm:min-w-[174px] xl:w-auto xl:min-w-0 ${tool.background} ${tool.color}`;
            const content = (
              <>
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="mt-auto text-[13px] font-medium">{tool.title}</span>
                <span className="mt-1 text-xs leading-4 opacity-85">{tool.description}</span>
                <span className="mt-1.5 text-xs font-medium">{activeMaterial ? 'Abrir →' : 'Elegí un PDF'}</span>
              </>
            );
            return activeMaterial ? (
              <Link key={tool.tab} href={`/materiales/${activeMaterial.id}?tab=${tool.tab}`} className={className} aria-label={`${tool.title} de ${activeMaterial.title}`}>
                {content}
              </Link>
            ) : (
              <div key={tool.tab} className={className}>{content}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
