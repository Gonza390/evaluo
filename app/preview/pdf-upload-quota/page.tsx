import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  PdfUploadLimitReached,
  PdfUploadQuotaStatus,
  type PdfUploadQuotaView,
} from '@/components/pdf-activation/pdf-upload-quota';

export const metadata: Metadata = {
  title: 'Preview PDF quota',
  robots: { index: false, follow: false },
};

export default function PdfUploadQuotaPreviewPage() {
  if (process.env.VERCEL_ENV !== 'preview') notFound();

  const fullQuota: PdfUploadQuotaView = {
    isPremium: false,
    limit: 2,
    used: 0,
    remaining: 2,
    nextAvailableAt: null,
  };
  const oneLeftQuota: PdfUploadQuotaView = {
    isPremium: false,
    limit: 2,
    used: 1,
    remaining: 1,
    nextAvailableAt: null,
  };
  const exhaustedQuota: PdfUploadQuotaView = {
    isPremium: false,
    limit: 2,
    used: 2,
    remaining: 0,
    nextAvailableAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-10">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-700">Preview interno</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950">
            Estados de carga de PDF
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Así se ve el cupo gratuito antes de la carga y el upsell cuando se agota.
          </p>
        </header>

        <section>
          <p className="mb-3 text-xs font-bold text-slate-500">Estado · 2 disponibles</p>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <PdfUploadQuotaStatus quota={fullQuota} />
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center text-sm font-bold text-slate-700">
              Elegir un PDF
              <span className="mt-1 block text-xs font-normal text-slate-500">Hasta 20 MB</span>
            </div>
          </div>
        </section>

        <section>
          <p className="mb-3 text-xs font-bold text-slate-500">Estado · 1 disponible</p>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <PdfUploadQuotaStatus quota={oneLeftQuota} />
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center text-sm font-bold text-slate-700">
              Elegir un PDF
              <span className="mt-1 block text-xs font-normal text-slate-500">Hasta 20 MB</span>
            </div>
          </div>
        </section>

        <section>
          <p className="mb-3 text-xs font-bold text-slate-500">Estado · cupo agotado</p>
          <PdfUploadLimitReached
            quota={exhaustedQuota}
            returnHref="/explorar/materia/5a10b059-546d-41a1-8ed8-d9fb1dd7581d"
            materiaId="5a10b059-546d-41a1-8ed8-d9fb1dd7581d"
            trackAnalytics={false}
          />
        </section>
      </div>
    </main>
  );
}
