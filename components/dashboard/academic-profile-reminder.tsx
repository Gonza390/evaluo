'use client';

import { useEffect, useState } from 'react';
import { AcademicProfileSimpleForm } from '@/components/profile-academic-simple';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Recordatorio contextual y posponible: recién aparece cuando el estudiante
 * vuelve a Mi espacio con un PDF listo y falta universidad o carrera.
 */
export function AcademicProfileReminder({
  userId,
  missingUniversity,
}: {
  userId: string;
  missingUniversity: boolean;
}) {
  const [open, setOpen] = useState(false);
  const storageKey = 'evaluo:academic-profile-reminder:' + userId;

  useEffect(() => {
    try {
      const snoozedUntil = Number(localStorage.getItem(storageKey) ?? '0');
      setOpen(!Number.isFinite(snoozedUntil) || Date.now() >= snoozedUntil);
    } catch {
      setOpen(true);
    }
  }, [storageKey]);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(storageKey, String(Date.now() + SNOOZE_MS));
    } catch {
      // El popup es opcional aunque el navegador bloquee el almacenamiento.
    }
  };

  const complete = () => {
    setOpen(false);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // El perfil guardado en servidor evita volver a mostrarlo.
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) dismiss(); }}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto border-none bg-transparent p-0 shadow-none sm:max-w-lg"
        overlayClassName="bg-slate-950/35 backdrop-blur-[2px]"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">
          {missingUniversity ? 'Completar universidad y carrera' : 'Completar carrera'}
        </DialogTitle>
        <AcademicProfileSimpleForm
          nextPath="/dashboard"
          onComplete={complete}
          onLater={dismiss}
          onlyMissingFields
        />
      </DialogContent>
    </Dialog>
  );
}
