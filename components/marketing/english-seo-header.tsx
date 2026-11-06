import Image from 'next/image';
import Link from 'next/link';
import { LandingLanguageSelector } from '@/components/marketing/landing-language-selector';

/** Shared English public navigation for study guides, blog and SEO landings. */
export function EnglishSeoHeader({ alternateHref }: { alternateHref?: string }) {
  return (
    <header className="relative z-20 flex min-h-18 items-center justify-between gap-2 border-b border-slate-200/80 py-3 sm:min-h-20 sm:gap-4">
      <Link href="/en" aria-label="Evaluo English homepage" className="inline-flex min-w-0 items-center gap-2 text-xl font-black tracking-tight text-slate-950">
        <Image src="/evaluo-logo-icono.svg" alt="" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" />
        <span className="truncate">Evaluo</span>
      </Link>
      <nav aria-label="Study navigation" className="hidden items-center gap-5 text-sm font-semibold text-slate-700 md:flex">
        <Link href="/en/resources" className="hover:text-blue-700">Study guides</Link>
        <Link href="/en/blog" className="hover:text-blue-700">Blog</Link>
      </nav>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <LandingLanguageSelector locale="en" alternateHref={alternateHref} />
        <Link href="/en/login?mode=signup&next=%2Fdashboard%3FopenUpload%3D1" className="hidden min-h-11 items-center rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800 sm:inline-flex">Start studying</Link>
      </div>
    </header>
  );
}
