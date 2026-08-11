import Link from 'next/link';
import { Footer } from '@/components/footer';
import { PublicHeaderActions } from '@/components/public-header-actions';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/96 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="transition hover:opacity-85">
            <div className="text-[1.05rem] font-black tracking-tight text-slate-900 sm:text-lg">
              Evaluo
            </div>
            <p className="mt-0.5 hidden text-[11px] text-slate-500 sm:block">
              Tu espacio académico
            </p>
          </Link>

          <PublicHeaderActions />
        </div>
      </header>

      <main className="flex-1 bg-[#F5F7FB]">{children}</main>
      <Footer />
    </div>
  );
}
