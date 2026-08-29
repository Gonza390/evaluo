'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserRound } from 'lucide-react';

type StudentMaterialAuthorProps = {
  materialId: string;
};

export function StudentMaterialAuthor({ materialId }: StudentMaterialAuthorProps) {
  const [name, setName] = useState<string | null>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;

    void fetch(`/api/student-materials/${materialId}/author`)
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { name?: string | null };
      })
      .then((payload) => {
        if (!active) return;
        const nextName = payload?.name?.trim();
        setName(nextName || null);
      })
      .catch(() => {
        if (active) setName(null);
      });

    return () => {
      active = false;
    };
  }, [materialId]);

  useEffect(() => {
    const resolveTarget = () =>
      document.querySelector<HTMLElement>('.material-study-editorial [role="tablist"]');

    const initialTarget = resolveTarget();
    if (initialTarget) {
      setTarget(initialTarget);
      return;
    }

    const observer = new MutationObserver(() => {
      const nextTarget = resolveTarget();
      if (!nextTarget) return;
      setTarget(nextTarget);
      observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!name || !target) return null;

  return createPortal(
    <div
      role="presentation"
      className="ml-auto inline-flex h-8 flex-none shrink-0 items-center gap-1.5 rounded-[13px] border border-slate-200 bg-white px-2.5 text-[11px] text-slate-500 shadow-none sm:h-9 sm:rounded-[14px] sm:px-3 sm:text-xs"
    >
      <UserRound className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
      <span className="whitespace-nowrap">
        Subido por <span className="font-semibold text-slate-700">{name}</span>
      </span>
    </div>,
    target
  );
}
