'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AcademicProfileSimpleForm } from '@/components/profile-academic-simple';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const POPUP_VERSION = 'academic_profile_popup_v1';

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
  const popupIdRef = useRef<string | null>(null);
  const viewedRef = useRef(false);
  const outcomeRef = useRef(false);
  const storageKey = 'evaluo:academic-profile-reminder:' + userId;

  const getPopupMetadata = useCallback(() => {
    if (!popupIdRef.current) {
      popupIdRef.current = window.crypto?.randomUUID?.() ??
        `popup-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    // Identifica la aparición del popup, no universidad ni carrera seleccionadas.
    return {
      popup_id: popupIdRef.current,
      popup_version: POPUP_VERSION,
      missing_university: missingUniversity,
    };
  }, [missingUniversity]);

  useEffect(() => {
    try {
      const snoozedUntil = Number(localStorage.getItem(storageKey) ?? '0');
      setOpen(!Number.isFinite(snoozedUntil) || Date.now() >= snoozedUntil);
    } catch {
      setOpen(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!open || viewedRef.current) return;
    viewedRef.current = true;
    trackMarketingEvent('academic_profile_popup_viewed', getPopupMetadata());
  }, [open, getPopupMetadata]);

  const dismiss = (method: 'later' | 'close') => {
    if (!open) return;
    if (!outcomeRef.current) {
      outcomeRef.current = true;
      trackMarketingEvent('academic_profile_popup_postponed', {
        ...getPopupMetadata(),
        dismiss_method: method,
      });
    }
    setOpen(false);
    try {
      localStorage.setItem(storageKey, String(Date.now() + SNOOZE_MS));
    } catch {
      // El popup es opcional aunque el navegador bloquee el almacenamiento.
    }
  };

  const complete = () => {
    if (!outcomeRef.current) {
      // onComplete solo se ejecuta tras un guardado confirmado por Supabase.
      outcomeRef.current = true;
      trackMarketingEvent('academic_profile_popup_completed', getPopupMetadata());
    }
    setOpen(false);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // El perfil guardado en servidor evita volver a mostrarlo.
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) dismiss('close'); }}>
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
          onLater={() => dismiss('later')}
          onlyMissingFields
        />
      </DialogContent>
    </Dialog>
  );
}
