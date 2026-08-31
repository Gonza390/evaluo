'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import {
  getMyMaterialFeedbackAction,
  submitMaterialFeedbackAction,
  trackMaterialFeedbackPromptViewedAction,
} from '@/app/dashboard/materiales/feedback';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { useToast } from '@/components/ui/use-toast';

const UUID_AT_END =
  /([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/?$/i;

function getMaterialIdFromPath() {
  if (typeof window === 'undefined') return null;
  return window.location.pathname.match(UUID_AT_END)?.[1] ?? null;
}

function getSessionKey(kind: 'dismissed' | 'viewed', materialId: string) {
  return `evaluo:material-feedback:${kind}:${materialId}`;
}

export function MaterialFeedbackPrompt() {
  const { toast } = useToast();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [materialId, setMaterialId] = useState<string | null>(null);
  const [eligible, setEligible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedRating, setSavedRating] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    const resolvedMaterialId = getMaterialIdFromPath();
    if (!anchor || !resolvedMaterialId) return;

    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    const timer = window.setTimeout(() => {
      void (async () => {
        const activeTabPanel = anchor.closest<HTMLElement>(
          '[role="tabpanel"][data-state="active"]'
        );
        if (!activeTabPanel) return;

        const anchors = Array.from(
          activeTabPanel.querySelectorAll<HTMLElement>('[data-material-feedback-anchor="true"]')
        );
        if (anchors.at(-1) !== anchor) return;

        if (window.sessionStorage.getItem(getSessionKey('dismissed', resolvedMaterialId)) === '1') {
          setDismissed(true);
          return;
        }

        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled || !user) return;

        const currentFeedback = await getMyMaterialFeedbackAction(resolvedMaterialId);
        if (cancelled || !currentFeedback.success || currentFeedback.feedback) return;

        setMaterialId(resolvedMaterialId);
        setEligible(true);

        observer = new IntersectionObserver(
          (entries) => {
            const isNearEnd = entries.some((entry) => entry.isIntersecting);
            setVisible(isNearEnd);

            if (!isNearEnd) return;
            const viewedKey = getSessionKey('viewed', resolvedMaterialId);
            if (window.sessionStorage.getItem(viewedKey) === '1') return;

            window.sessionStorage.setItem(viewedKey, '1');
            void trackMaterialFeedbackPromptViewedAction(resolvedMaterialId);
          },
          {
            threshold: 0.01,
            rootMargin: '0px 0px 18% 0px',
          }
        );
        observer.observe(anchor);
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, []);

  const close = () => {
    if (materialId) {
      window.sessionStorage.setItem(getSessionKey('dismissed', materialId), '1');
    }
    setDismissed(true);
    setVisible(false);
  };

  const save = async (rating: 'up' | 'down') => {
    if (!materialId || saving) return;

    setSaving(true);
    const result = await submitMaterialFeedbackAction({
      materialId,
      rating,
      source: 'contextual_prompt',
    });
    setSaving(false);

    if (!result.success) {
      toast({ description: result.message, variant: 'destructive' });
      return;
    }

    setSavedRating(rating);
    toast({ description: result.message });
    window.setTimeout(close, 900);
  };

  return (
    <>
      <div
        ref={anchorRef}
        data-material-feedback-anchor="true"
        aria-hidden="true"
        className="h-px w-full"
      />

      {eligible && visible && !dismissed ? (
        <div
          role="dialog"
          aria-label="Calificar material"
          className="fixed right-3 bottom-3 left-3 z-40 rounded-[18px] border border-slate-200 bg-white p-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] sm:right-5 sm:bottom-5 sm:left-auto sm:w-[350px]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-slate-950">¿Te ayudó este PDF?</p>
              <p className="mt-1 text-[12px] leading-5 text-slate-500">
                Tu respuesta nos ayuda a mejorar los próximos resúmenes.
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {savedRating ? (
            <div className="mt-3 rounded-[13px] bg-emerald-50 px-3 py-2 text-[12.5px] font-medium text-emerald-700">
              Gracias. Tu opinión quedó guardada.
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void save('up')}
                disabled={saving}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-[13px] border border-emerald-200 bg-emerald-50 text-[12.5px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
                Sí, me ayudó
              </button>
              <button
                type="button"
                onClick={() => void save('down')}
                disabled={saving}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-[13px] border border-slate-200 bg-white text-[12.5px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsDown className="h-3.5 w-3.5" />}
                No mucho
              </button>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
