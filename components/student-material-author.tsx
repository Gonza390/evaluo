'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BadgeCheck, Check, Copy, Share2, UserRound } from 'lucide-react';

type StudentMaterialAuthorProps = {
  materialId: string;
};

export function StudentMaterialAuthor({ materialId }: StudentMaterialAuthorProps) {
  const [name, setName] = useState<string | null>(null);
  const [featured, setFeatured] = useState(false);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [hasOwnerShareControl, setHasOwnerShareControl] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    void fetch(`/api/student-materials/${materialId}/author`)
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { name?: string | null; featured?: boolean };
      })
      .then((payload) => {
        if (!active) return;
        const nextName = payload?.name?.trim();
        setName(nextName || null);
        setFeatured(Boolean(payload?.featured));
      })
      .catch(() => {
        if (active) {
          setName(null);
          setFeatured(false);
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

  if (!name || !target) return null;

  const authorBadge = createPortal(
    <div
      role="presentation"
      className="ml-auto inline-flex h-8 flex-none shrink-0 items-center gap-1.5 rounded-[13px] border border-slate-200 bg-white px-2.5 text-[11px] text-slate-500 shadow-none sm:h-9 sm:rounded-[14px] sm:px-3 sm:text-xs"
    >
      <UserRound className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
      <span className="whitespace-nowrap">
        Subido por <span className="font-semibold text-slate-700">{name}</span>
      </span>
      {featured ? (
        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 sm:text-[11px]">
          <BadgeCheck className="h-3 w-3" aria-hidden="true" />
          Colaborador destacado
        </span>
      ) : null}
    </div>,
    target
  );

  const publicShareButton = !hasOwnerShareControl
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
      {authorBadge}
      {publicShareButton}
    </>
  );
}
