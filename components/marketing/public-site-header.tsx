import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { TrackedLink } from '@/components/marketing/tracked-link';

export function PublicSiteHeader({
  primaryHref = '/login?mode=signup&next=/dashboard',
  trackingLocation = 'public_header',
}: {
  primaryHref?: string;
  trackingLocation?: string;
}) {
  return (
    <header className="relative z-20 flex min-h-18 items-center justify-between gap-2 border-b border-slate-200/80 py-3 sm:min-h-20 sm:gap-3">
      <Link
        href="/"
        aria-label="Ir al inicio de Evaluo"
        className="group flex min-w-0 items-center gap-2 text-lg font-black tracking-[-0.045em] text-slate-950 sm:gap-2.5 sm:text-2xl"
      >
        <Image
          src="/icon.png"
          alt=""
          width={40}
          height={40}
          priority
          unoptimized
          className="h-8 w-8 shrink-0 object-contain transition-transform group-hover:scale-[1.04] sm:h-9 sm:w-9"
        />
        <span className="truncate">Evaluo</span>
      </Link>

      <nav aria-label="Navegación principal" className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-slate-200/80 bg-white/90 p-1.5 text-[11px] font-bold text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur lg:flex">
        <Link href="/#producto" className="rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          Producto
        </Link>
        <Link href="/#como-funciona" className="rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          Cómo funciona
        </Link>
        <Link href="/explorar" className="rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          Materias
        </Link>
        <Link href="/pregunteros" className="rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          Pregunteros
        </Link>
        <Link href="/pricing" className="rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          Planes
        </Link>
      </nav>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          href="/login?mode=login"
          className="hidden min-h-11 items-center rounded-xl px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:inline-flex"
        >
          Ingresar
        </Link>
        <TrackedLink
          href={primaryHref}
          eventName="cta_click"
          payload={{ location: trackingLocation, cta_name: 'empezar_gratis', destination: primaryHref }}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-indigo-600 px-3 text-[10px] font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:px-4 sm:text-xs"
        >
          Empezar gratis
          <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </TrackedLink>
      </div>
    </header>
  );
}
