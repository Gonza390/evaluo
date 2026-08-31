'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ArrowLeft, ArrowRight, FileUp, Sparkles } from 'lucide-react';
import { trackProductAnalyticsEvent } from '@/lib/product-analytics-client';

export type PdfUploadQuotaView = {
  isPremium: boolean;
  limit: number | null;
  used: number;
  remaining: number | null;
  nextAvailableAt: string | null;
};

function formatNextDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
  }).format(date);
}

export function PdfUploadQuotaStatus({ quota }: { quota: PdfUploadQuotaView }) {
  if (quota.isPremium || quota.limit === null || quota.remaining === null) return null;

  return (
    <div className="mb-3 flex flex-col gap-1 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <p className="text-xs font-bold text-indigo-800">
        {quota.remaining === 1
          ? 'Gratis · Te queda 1 de 2 PDFs'
          : `Gratis · ${quota.remaining} de ${quota.limit} PDFs disponibles`}
      </p>
      <p className="text-[11px] leading-4 text-indigo-700/80">
        Cada PDF libera su cupo 15 días después de subirlo.
      </p>
    </div>
  );
}

export function PdfUploadLimitReached({
  quota,
  returnHref,
  materiaId,
  trackAnalytics = true,
}: {
  quota: PdfUploadQuotaView;
  returnHref: string;
  materiaId?: string;
  trackAnalytics?: boolean;
}) {
  const nextDate = formatNextDate(quota.nextAvailableAt);
  const pricingHref = `/pricing?source=pdf_limit${materiaId ? `&materiaId=${encodeURIComponent(materiaId)}` : ''}`;

  useEffect(() => {
    if (!trackAnalytics) return;
    void trackProductAnalyticsEvent('pdf_limit_reached', {
      free_limit: quota.limit ?? 2,
      used: quota.used,
      next_available_at: quota.nextAvailableAt,
      materia_id: materiaId,
    });
  }, [materiaId, quota.limit, quota.nextAvailableAt, quota.used, trackAnalytics]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-indigo-100 bg-[radial-gradient(circle_at_85%_15%,rgba(99,102,241,0.16),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8faff_100%)] px-5 py-6 sm:px-7 sm:py-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <Sparkles className="h-5 w-5" />
        </span>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-700">
          Tu cupo gratuito
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
          Ya usaste tus 2 PDFs gratuitos
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
          {nextDate
            ? `Podés volver a subir gratis el ${nextDate} o pasar a Premium para seguir estudiando sin esperar.`
            : 'Podés esperar a que se renueve tu cupo o pasar a Premium para seguir estudiando sin esperar.'}
        </p>
      </div>

      <div className="px-5 py-5 sm:px-7 sm:py-6">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-700 ring-1 ring-slate-200">
              <FileUp className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-950">Seguí preparando tus materiales</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Premium evita la espera del cupo gratuito y mantiene tus PDFs conectados con el resto de tus herramientas de estudio.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href={pricingHref}
            onClick={() => {
              if (!trackAnalytics) return;
              void trackProductAnalyticsEvent('pdf_limit_upgrade_clicked', {
                free_limit: quota.limit ?? 2,
                used: quota.used,
                materia_id: materiaId,
                destination: pricingHref,
              });
            }}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Continuar con Premium
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={returnHref}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            {materiaId ? 'Volver a mi materia' : 'Volver al dashboard'}
          </Link>
        </div>
      </div>
    </section>
  );
}
