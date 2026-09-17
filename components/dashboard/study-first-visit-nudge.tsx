'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

const STORAGE_PREFIX = 'evaluo_study_first_nudge:';

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

type Props = {
  materialsCount: number;
  onUploadClick: () => void;
};

/** One-shot study-first nudge for an empty personal library. */
export function StudyFirstVisitNudge({ materialsCount, onUploadClick }: Props) {
  const { user } = useUser();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !user || materialsCount > 0) {
      setVisible(false);
      return;
    }
    if (window.localStorage.getItem(storageKey(user.id)) === 'done') {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, [materialsCount, user]);

  const dismiss = () => {
    if (user) {
      window.localStorage.setItem(storageKey(user.id), 'done');
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-3.5 py-3 sm:px-4"
    >
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[13.5px] leading-5 text-slate-600">
          Empezá por acá:{' '}
          <button
            type="button"
            onClick={() => {
              dismiss();
              onUploadClick();
            }}
            className="font-semibold text-slate-900 underline-offset-2 hover:underline"
          >
            Subí tu PDF
          </button>{' '}
          y en unos minutos tenés resumen, glosario y ejercicios.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700"
        aria-label="Cerrar"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
