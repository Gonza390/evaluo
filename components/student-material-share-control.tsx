'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Link2, Loader2, Lock, Share2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateStudentMaterialVisibilityAction } from '@/app/dashboard/materiales/actions';
import { useToast } from '@/components/ui/use-toast';
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
};

export function StudentMaterialShareControl({
  materialId,
  title,
  sharePath,
  initialVisibility,
  isOwner = true,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [visibility, setVisibility] = useState<MaterialVisibility>(initialVisibility);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const shareImagePath = buildStudentMaterialShareImagePath({ title });

  useEffect(() => {
    void prepareStudentMaterialShareImage(shareImagePath, title);
  }, [shareImagePath, title]);

  const shareUrl = () => new URL(sharePath, 'https://evaluo.com.ar').toString();

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
    toast({ description: 'Copiamos el enlace del material.' });
  };

  const shareCurrentLink = async () => {
    const url = shareUrl();
    const result = await shareStudentMaterial({
      title,
      text: `${title} — material de estudio compartido en Evaluo.`,
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
      const result = await updateStudentMaterialVisibilityAction({ materialId, visibility: 'shared' });
      if (!result.success) {
        toast({ description: result.message, variant: 'destructive' });
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

  const disableSharing = async () => {
    if (!isOwner) return;

    setLoading(true);
    try {
      const result = await updateStudentMaterialVisibilityAction({ materialId, visibility: 'private' });
      toast({ description: result.message, variant: result.success ? 'default' : 'destructive' });
      if (!result.success) return;
      setVisibility('private');
      setConfirmOpen(false);
      router.refresh();
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

  return (
    <div data-student-material-share-control className="fixed right-4 bottom-20 z-40 flex items-center gap-2 md:right-6 md:bottom-6">
      {confirmOpen && isOwner ? (
        <div className="absolute right-0 bottom-[calc(100%+12px)] w-[min(360px,calc(100vw-2rem))] rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Link2 className="h-4.5 w-4.5" />
              </div>
              <h3 className="mt-3 text-base font-bold tracking-[-0.03em] text-slate-950">Compartir este PDF</h3>
            </div>
            <button type="button" onClick={() => setConfirmOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Al activar el enlace, cualquier persona podrá abrir y compartir este PDF, junto con su resumen, glosario y material de estudio.
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">Podés volver a hacerlo privado cuando quieras.</p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setConfirmOpen(false)} disabled={loading} className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">Cancelar</button>
            <button type="button" onClick={() => void enableSharing()} disabled={loading} className="from-brand to-brand-2 inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(37,99,235,0.20)] disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              Activar y compartir
            </button>
          </div>
        </div>
      ) : null}

      {isOwner && visibility === 'shared' ? (
        <button type="button" onClick={() => void disableSharing()} disabled={loading} title="Volver a privado" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.10)] transition hover:border-slate-300 hover:text-slate-800 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        </button>
      ) : null}

      <button type="button" onClick={handleShare} disabled={loading || (!isOwner && visibility !== 'shared')} className="from-brand to-brand-2 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-4 text-sm font-bold text-white shadow-[0_14px_34px_rgba(37,99,235,0.26)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : copied ? <Check className="h-4 w-4" /> : canNativeShare ? <Share2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Enlace copiado' : 'Compartir este PDF'}
      </button>
    </div>
  );
}
