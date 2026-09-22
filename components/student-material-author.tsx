'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Share2 } from 'lucide-react';
import { MaterialFeedbackPrompt } from '@/components/material-feedback-prompt';

type StudentMaterialAuthorProps = {
  materialId: string;
};

export function StudentMaterialAuthor({ materialId }: StudentMaterialAuthorProps) {
  const [name, setName] = useState<string | null>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [hasOwnerShareControl, setHasOwnerShareControl] = useState(false);
  const [copied, setCopied] = useState(false);

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
        if (active) {
          setName(null);
        }
      });

    return () => {
      active = false;
    };
  }, [materialId]);

  useEffect(() => {
    const resolveTarget = () =>
      document.querySelector<HTMLElement>('.material-study-editorial [role="tablist"]');

    const refreshDomTargets = () => {
      const nextTarget = resolveTarget();
      if (nextTarget) setTarget(nextTarget);
      setHasOwnerShareControl(Boolean(document.querySelector('[data-student-material-share-control]')));
      return Boolean(nextTarget);
    };

    refreshDomTargets();

    const observer = new MutationObserver(() => {
      refreshDomTargets();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const sharePublicPdf = async () => {
    const url = `${window.location.origin}${window.location.pathname}`;

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: document.title || 'Material de estudio | Evaluo',
          text: 'Material de estudio compartido en Evaluo.',
          url,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const publicShareButton = name && target && !hasOwnerShareControl
    ? createPortal(
        <button
          type="button"
          onClick={() => void sharePublicPdf()}
          className="from-brand to-brand-2 fixed right-4 bottom-20 z-40 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-4 text-sm font-bold text-white shadow-[0_14px_34px_rgba(37,99,235,0.26)] transition hover:-translate-y-0.5 md:right-6 md:bottom-6"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
            <Share2 className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? 'Enlace copiado' : 'Compartir este PDF'}
        </button>,
        document.body
      )
    : null;

  return (
    <>
      <MaterialFeedbackPrompt materialId={materialId} />
      {publicShareButton}
    </>
  );
}
