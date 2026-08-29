'use client';

import { useEffect, useState } from 'react';
import { UserRound } from 'lucide-react';

type StudentMaterialAuthorProps = {
  materialId: string;
};

export function StudentMaterialAuthor({ materialId }: StudentMaterialAuthorProps) {
  const [name, setName] = useState<string | null>(null);

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

  if (!name) return null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm">
        <UserRound className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
        <span>
          Subido por <span className="font-semibold text-slate-700">{name}</span>
        </span>
      </div>
    </div>
  );
}
