'use client';
import { useEffect, useState } from 'react';
import { getProgress } from '@/lib/study-plan-progress';
export function StudyPlanWheel({ materialId, title, topicCount }: { materialId: string; title: string; topicCount: number }) {
  const [progress, setProgress] = useState({percent:0,done:0,total:0});
  useEffect(() => {
    const update = () => setProgress(getProgress(materialId,topicCount));
    update();
    window.addEventListener('focus',update);
    window.addEventListener('pageshow',update);
    return () => {window.removeEventListener('focus',update);window.removeEventListener('pageshow',update);};
  },[materialId,topicCount]);
  return <div className="flex items-center gap-3">
    <div className="relative size-[76px] shrink-0">
      <svg viewBox="0 0 80 80" className="size-full" role="img" aria-label={`Avance del PDF: ${progress.percent}%`}>
        <circle cx="40" cy="40" r="32" stroke="#e2e8f0" strokeWidth="7" fill="none" />
        <circle cx="40" cy="40" r="32" stroke="#2563eb" strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray={`${progress.percent * 2.0106} 201.06`} transform="rotate(-90 40 40)" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[16px] font-bold">{progress.percent}%</span>
    </div>
    <div className="min-w-0">
      <p className="truncate text-[13px] font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-[11px] text-slate-500">{progress.done} de {progress.total} actividades completadas</p>
    </div>
  </div>;
}
