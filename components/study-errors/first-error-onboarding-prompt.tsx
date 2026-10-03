'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CircleAlert, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { finishStudyErrorOnboardingAction } from '@/lib/actions/study-errors';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { hasSeenFirstPdfDemoErrors } from '@/lib/first-pdf-demo-analytics';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function FirstStudyErrorOnboardingPrompt({
  errorId,
  location,
  onClose,
}: {
  errorId: string | null;
  location: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    let active = true;
    if (!errorId) {
      setEligibilityChecked(false);
      return;
    }

    if (!hasSeenFirstPdfDemoErrors()) {
      setEligibilityChecked(true);
      return;
    }

    setEligibilityChecked(false);
    void finishStudyErrorOnboardingAction(errorId, 'legacy').then(() => {
      if (active) onCloseRef.current();
    });

    return () => {
      active = false;
    };
  }, [errorId]);

  useEffect(() => {
    if (!errorId || !eligibilityChecked) return;
    trackMarketingEvent('study_error_onboarding_prompted', {
      study_error_id: errorId,
      location,
    });
  }, [eligibilityChecked, errorId, location]);

  if (!errorId || !eligibilityChecked) return null;

  const skip = async () => {
    if (isClosing) return;
    setIsClosing(true);
    await finishStudyErrorOnboardingAction(errorId, 'skipped');
    onClose();
    setIsClosing(false);
  };

  const start = () => {
    trackMarketingEvent('study_error_onboarding_started', {
      study_error_id: errorId,
      location,
    });
    router.push(
      `/dashboard/explicaciones?tour=first-error&error=${encodeURIComponent(errorId)}`
    );
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) void skip();
      }}
    >
      <DialogContent className="w-[min(calc(100vw-1.5rem),480px)] rounded-[24px] border-slate-200 bg-white p-0 shadow-[0_28px_90px_rgba(15,23,42,0.20)]">
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <CircleAlert className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-left text-xl font-bold tracking-[-0.04em] text-slate-950">
                  Guardamos tu primer error
                </DialogTitle>
                <DialogDescription className="mt-2 text-left text-sm leading-6 text-slate-600">
                  Evaluo puede usar este error para mostrarte qué repasar, volver a tus apuntes y
                  comprobar después si ya lo entendiste.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/55 px-4 py-3">
            <p className="text-sm font-semibold text-indigo-950">
              Te mostramos Mis errores usando este error real.
            </p>
            <p className="mt-1 text-xs leading-5 text-indigo-700">
              Es un recorrido corto y aparece una sola vez.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isClosing}
              onClick={() => void skip()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <X className="h-4 w-4" />
              Ahora no
            </button>
            <button
              type="button"
              onClick={start}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Ver cómo funciona Mis errores
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
