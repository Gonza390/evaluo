'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import {
  getMyMaterialFeedbackAction,
  submitMaterialFeedbackAction,
  trackMaterialFeedbackPromptViewedAction,
} from '@/app/dashboard/materiales/feedback';
import { useToast } from '@/components/ui/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';

function getSessionKey(kind: 'dismissed' | 'viewed', materialId: string) {
  return `evaluo:material-feedback:${kind}:${materialId}`;
}

function getVisibleSummaryPanel() {
  const panels = Array.from(
    document.querySelectorAll<HTMLElement>('[role="tabpanel"][data-state="active"]')
  );

  return (
    panels.find((panel) => {
      const labelledBy = panel.getAttribute('aria-labelledby') ?? '';
      if (!labelledBy.includes('trigger-resumen')) return false;

      const style = window.getComputedStyle(panel);
      const rect = panel.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }) ?? null
  );
}

function getNearEndTarget(panel: HTMLElement) {
  const headings = panel.querySelectorAll<HTMLElement>('h3');
  return headings.item(headings.length - 1) || panel.lastElementChild;
}

export function MaterialFeedbackPrompt({ materialId }: { materialId: string }) {
  const { toast } = useToast();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const [eligible, setEligible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedRating, setSavedRating] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (window.sessionStorage.getItem(getSessionKey('dismissed', materialId)) === '1') {
      setDismissed(true);
      return undefined;
    }

    const disconnectIntersectionObserver = () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };

    const attachNearEndObserver = () => {
      disconnectIntersectionObserver();

      const panel = getVisibleSummaryPanel();
      if (!panel) return false;

      const target = getNearEndTarget(panel);
      if (!(target instanceof HTMLElement)) return false;

      const region = panel.closest<HTMLElement>(
        '[role="region"][aria-label="Contenido de estudio"]'
      );
      const root =
        region && region.scrollHeight > region.clientHeight + 24
          ? region
          : null;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (cancelled) return;

          const isNearEnd = entries.some((entry) => entry.isIntersecting);
          setVisible(isNearEnd);

          if (!isNearEnd) return;

          const viewedKey = getSessionKey('viewed', materialId);
          if (window.sessionStorage.getItem(viewedKey) === '1') return;

          window.sessionStorage.setItem(viewedKey, '1');
          void trackMaterialFeedbackPromptViewedAction(materialId);
        },
        {
          root,
          threshold: 0.01,
          rootMargin: '0px 0px 18% 0px',
        }
      );
      observerRef.current.observe(target);
      return true;
    };

    void (async () => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      const currentFeedback = await getMyMaterialFeedbackAction(materialId);
      if (cancelled || !currentFeedback.success || currentFeedback.feedback) return;

      setEligible(true);

      if (!attachNearEndObserver()) {
        mutationObserverRef.current = new MutationObserver(() => {
          if (attachNearEndObserver()) {
            mutationObserverRef.current?.disconnect();
            mutationObserverRef.current = null;
          }
        });
        mutationObserverRef.current.observe(document.body, { childList: true, subtree: true });
      }
    })();

    const handleResize = () => {
      if (!cancelled) {
        attachNearEndObserver();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);
      disconnectIntersectionObserver();
      mutationObserverRef.current?.disconnect();
      mutationObserverRef.current = null;
    };
  }, [materialId]);

  const close = () => {
    window.sessionStorage.setItem(getSessionKey('dismissed', materialId), '1');
    setDismissed(true);
    setVisible(false);
  };

  const save = async (rating: 'up' | 'down') => {
    if (saving) return;

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

  if (!eligible || !visible || dismissed) return null;

  return (
    <div
      role="dialog"
      aria-label="Calificar material"
      className="fixed right-3 bottom-20 left-3 z-50 rounded-[18px] border border-slate-200 bg-white p-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] sm:right-5 sm:bottom-5 sm:left-auto sm:w-[350px]"
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
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ThumbsUp className="h-3.5 w-3.5" />
            )}
            Sí, me ayudó
          </button>
          <button
            type="button"
            onClick={() => void save('down')}
            disabled={saving}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-[13px] border border-slate-200 bg-white text-[12.5px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ThumbsDown className="h-3.5 w-3.5" />
            )}
            No mucho
          </button>
        </div>
      )}
    </div>
  );
}
