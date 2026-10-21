'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, X } from 'lucide-react';

const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

export function AcademicProfileReminder({
  userId,
  missingUniversity,
}: {
  userId: string;
  missingUniversity: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const storageKey = 'evaluo:academic-profile-reminder:' + userId;

  useEffect(() => {
    try {
      const snoozedUntil = Number(localStorage.getItem(storageKey) ?? '0');
      setVisible(!Number.isFinite(snoozedUntil) || Date.now() >= snoozedUntil);
    } catch {
      setVisible(true);
    }
  }, [storageKey]);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(storageKey, String(Date.now() + SNOOZE_MS));
    } catch {
      // El recordatorio sigue siendo opcional aunque el navegador no guarde preferencias.
    }
  };

  return (
    <aside aria-label="Completar datos académicos"
      className="mx-auto mt-6 flex w-full max-w-6xl flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">
          <GraduationCap className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            {missingUniversity ? '¿Dónde estudiás?' : '¿Qué carrera estudiás?'}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Nos falta {missingUniversity ? 'tu universidad y/o carrera' : 'tu carrera'}.
            Podés contárnoslo en dos pasos simples. No afecta tus materiales.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 pl-12 sm:pl-0">
        <Link
          href="/completar-perfil?next=%2Fdashboard"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700">
          Completar
        </Link>
        <button type="button" onClick={dismiss} aria-label="Recordármelo más adelante"
          className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-600 hover:bg-white hover:text-slate-900">
          Más adelante <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
}
