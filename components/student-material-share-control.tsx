'use client';

import { useEffect, useState } from 'react';
import { Check, Link2, Loader2, Share2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateStudentMaterialVisibilityAction } from '@/app/dashboard/materiales/actions';
import { useToast } from '@/components/ui/use-toast';
import { toAbsoluteUrl } from '@/lib/site';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import {
  buildStudentMaterialShareImagePath,
  prepareStudentMaterialShareImage,
  shareStudentMaterial,
} from '@/lib/student-material-share-client';

type MaterialVisibility = 'private' | 'shared';

type Props = {
  materialId: string;
  title: string;
  sharePath: string;
  initialVisibility: MaterialVisibility;
  isOwner?: boolean;
  mobileMenuOnly?: boolean;
};

export function StudentMaterialShareControl({
  materialId,
  title,
  sharePath,
  initialVisibility,
  isOwner = true,
  mobileMenuOnly = false,
}: Props) {
  const router = useRouter();
  const english = useOptionalAppLocale() === 'en';
  const tr = (es:string,en:string) => english ? en : es;
  const { toast } = useToast();
  const [visibility, setVisibility] = useState<MaterialVisibility>(initialVisibility);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareImagePath = buildStudentMaterialShareImagePath({ title });

  useEffect(() => {
    void prepareStudentMaterialShareImage(shareImagePath, title);
  }, [shareImagePath, title]);

  const shareUrl = () => toAbsoluteUrl(sharePath);

  const copyLink = async (url: string) => {
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
    toast({ description: tr('Copiamos el enlace del material.','Material link copied.') });
  };

  const shareCurrentLink = async () => {
    const url = shareUrl();
    const result = await shareStudentMaterial({
      title,
      text: english ? `${title} — study material shared on Evaluo.` : `${title} — material de estudio compartido en Evaluo.`,
      url,
      imagePath: shareImagePath,
    });

    if (result === 'shared' || result === 'aborted') return;
    await copyLink(url);
  };

  const enableSharing = async () => {
    if (!isOwner) return;

    setLoading(true);
    try {
      const result = await updateStudentMaterialVisibilityAction({
        materialId,
        visibility: 'shared',
      });
      if (!result.success) {
        toast({ description: english ? 'We could not enable sharing for this material.' : result.message, variant: 'destructive' });
        return;
      }

      setVisibility('shared');
      setConfirmOpen(false);
      router.refresh();
      await shareCurrentLink();
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (visibility === 'private') {
      if (isOwner) setConfirmOpen(true);
      return;
    }

    void shareCurrentLink();
  };

  useEffect(() => {
    const onMobileShare = (event: Event) => {
      const detail = (event as CustomEvent<{ materialId?: string }>).detail;
      if (detail?.materialId !== materialId) return;
      if (visibility === 'private') {
        if (isOwner) setConfirmOpen(true);
      } else {
        void shareCurrentLink();
      }
    };
    window.addEventListener('evaluo:share-material', onMobileShare);
    return () => window.removeEventListener('evaluo:share-material', onMobileShare);
  // Register the latest visibility state so the mobile menu follows the same privacy flow.
  }, [materialId, visibility, isOwner, sharePath, title]);

  return (
    <div
      data-student-material-share-control
      className={`fixed right-4 bottom-20 z-40 flex items-center gap-2 ${mobileMenuOnly ? 'md:hidden' : 'md:right-6 md:bottom-6'}`}
    >
      {confirmOpen && isOwner ? (
        <div className="absolute right-0 bottom-[calc(100%+12px)] w-[min(360px,calc(100vw-2rem))] rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Link2 className="h-4.5 w-4.5" />
              </div>
              <h3 className="mt-3 text-base font-bold tracking-[-0.03em] text-slate-950">
                {tr("Compartir este PDF","Share this PDF")}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={tr("Cerrar","Close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {tr("Al activar el enlace, cualquier persona con una cuenta de Evaluo podrá abrir y compartir este PDF, junto con su resumen, glosario y material de estudio. Quienes no hayan iniciado sesión deberán ingresar o registrarse primero.","When you enable this link, anyone with an Evaluo account can open and share this PDF and its study resources. People who are not signed in will first need to log in or create an account.")}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={loading}
              className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {tr("Cancelar","Cancel")}
            </button>
            <button
              type="button"
              onClick={() => void enableSharing()}
              disabled={loading}
              className="from-brand to-brand-2 inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(37,99,235,0.20)] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              {tr("Activar y compartir","Enable and share")}
            </button>
          </div>
        </div>
      ) : null}

      {!mobileMenuOnly ? (
      <button
        type="button"
        onClick={handleShare}
        disabled={loading || (!isOwner && visibility !== 'shared')}
        aria-label={
          loading ? tr("Preparando enlace","Preparing link") : copied ? tr("Enlace copiado","Link copied") : tr("Compartir este PDF","Share this PDF")
        }
        title={copied ? tr("Enlace copiado","Link copied") : tr("Compartir este PDF","Share this PDF")}
        className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring hidden md:inline-flex size-11 items-center justify-center rounded-lg transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : copied ? (
          <Check aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Share2 aria-hidden="true" className="h-4 w-4" />
        )}
        <span role="status" className="sr-only">
          {copied ? tr("Enlace copiado","Link copied") : ''}
        </span>
      </button>
      ) : null}
    </div>
  );
}
