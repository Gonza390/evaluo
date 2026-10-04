import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { requireAdminAccess } from '@/lib/auth';
import WhatsAppShareClient from './whatsapp-share-client';

export default async function WhatsAppMarketingPage() {
  await requireAdminAccess();

  const baseOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://evaluo.com.ar';

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.10),transparent_28%),linear-gradient(180deg,#F8FAFF_0%,#F5F7FB_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          href="/administrador"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al administrador
        </Link>

        <header className="mt-6 mb-7 flex flex-col gap-5 rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.07)] backdrop-blur sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
              <MessageCircle className="h-4 w-4" />
              WhatsApp Growth
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl">
              Generador de mensajes para grupos
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Probá distintos ángulos de marketing sin perder trazabilidad. Cada mensaje genera un link de Evaluo con UTMs para saber qué variante trae usuarios que realmente practican.
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
            <p className="font-semibold">Objetivo</p>
            <p className="mt-1 text-indigo-700">WhatsApp → simulador → registro</p>
          </div>
        </header>

        <WhatsAppShareClient baseOrigin={baseOrigin.replace(/\/$/, '')} />
      </div>
    </main>
  );
}
