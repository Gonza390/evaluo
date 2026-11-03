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
  const otherMaterials = materials.filter((material) => material.id !== activeMaterial?.id);
  const tools = [
    { title: 'Resumen', description: 'Repasá lo esencial.', icon: BookOpenText, tab: 'resumen', color: 'text-[#376CAD]', background: 'bg-[#E8F2FF]' },
    { title: 'Flashcards', description: 'Memorizá con tarjetas.', icon: Layers3, tab: 'tarjetas', color: 'text-[#745AB3]', background: 'bg-[#F0EBFC]' },
    { title: 'Glosario', description: 'Entendé los conceptos.', icon: BookOpen, tab: 'glosario', color: 'text-[#41839B]', background: 'bg-[#E2F2F7]' },
    { title: 'Mapa mental', description: 'Conectá las ideas.', icon: Network, tab: 'mapa', color: 'text-[#35816A]', background: 'bg-[#E9F5EE]' },
    { title: 'Progreso', description: 'Revisá tu aprendizaje.', icon: ChartNoAxesColumnIncreasing, tab: 'progreso', color: 'text-[#AD713D]', background: 'bg-[#FFF2E6]' },
  ] as const;

  const renderMaterial = (material: Material) => {
    const percent = progress[material.id] ?? 0;
    return (
      <Link key={material.id} href={`/materiales/${material.id}?tab=resumen`}
        className="flex min-h-[82px] min-w-0 items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-3 shadow-[0_3px_14px_rgba(15,23,42,0.025)] transition hover:border-blue-200 hover:shadow-[0_6px_20px_rgba(15,23,42,0.045)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        aria-label={`Estudiar ${material.title}, ${percent}% de avance de lectura`}>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF]">
          <FileText aria-hidden="true" className="size-5 text-[#2563EB]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block line-clamp-2 break-words text-[12px] font-medium leading-5 text-slate-900 sm:text-[13px]">{material.title}</span>
          <span className="mt-1 block text-[10px] text-slate-500">
            Lectura · <span className={percent === 100 ? 'font-medium text-emerald-600' : 'font-medium text-slate-700'}>{percent}%</span>
          </span>
          <span role="progressbar" aria-label={`Lectura de ${material.title}`}
            aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}
            className="mt-1.5 block h-1 w-full max-w-[260px] overflow-hidden rounded-full bg-slate-200">
            <span className={`block h-full rounded-full ${percent === 100 ? 'bg-emerald-400' : 'bg-blue-500'}`}
              style={{ width: `${percent}%` }} />
          </span>
        </span>
      </Link>
    );
  };

  return (
    <section data-study-reading-layout aria-label="Tus PDFs para estudiar"
      className="mx-auto w-full max-w-[1240px] px-3 py-4 sm:px-5 lg:px-6">
      <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-7">
        <div className="min-w-0">
          <h1 className="mb-5 text-[20px] font-semibold tracking-[-0.035em] text-slate-900 sm:text-[22px] lg:text-[24px]">Estudiar</h1>
          {activeMaterial ? (
            <div className="space-y-5">
              <div>
                {renderMaterial(activeMaterial)}
              </div>
              {otherMaterials.length > 0 && (
                <div>
                  <h2 className="mb-2 text-[12px] font-medium text-slate-500">Tus archivos</h2>
                  <div className="space-y-2.5">{otherMaterials.map(renderMaterial)}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 p-5 text-[12px] text-slate-600">
              Todavía no tenés PDFs listos para estudiar. Subí uno desde Mi espacio.
            </div>
          )}
        </div>
        <div className="min-w-0 lg:pt-2">
          <h2 className="sr-only">Herramientas de estudio</h2>
          <p className="sr-only">{activeMaterial ? `Herramientas para ${activeMaterial.title}` : 'Subí un PDF desde Mi espacio para empezar.'}</p>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const className = `flex min-h-[126px] w-full min-w-0 flex-col rounded-2xl ${tool.tab === 'progreso' ? 'col-span-2' : ''} border border-transparent p-3.5 text-left transition hover:border-current/15 hover:shadow-[0_4px_16px_rgba(15,23,42,0.035)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${tool.background} ${tool.color}`;
              const content = (
                <>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="mt-auto pt-4 text-[13px] font-medium">{tool.title}</span>
                  <span className="mt-1 text-xs leading-4 opacity-85">{tool.description}</span>
                  <span className="mt-1.5 text-xs font-medium">{activeMaterial ? 'Abrir →' : 'Elegí un PDF'}</span>
                </>
              );
              return activeMaterial ? (
                <Link key={tool.tab} href={`/materiales/${activeMaterial.id}?tab=${tool.tab}`} className={className}
                  aria-label={`${tool.title} de ${activeMaterial.title}`}>
                  {content}
                </Link>
              ) : (
                <div key={tool.tab} className={className}>{content}</div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
