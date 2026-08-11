import Link from 'next/link';
import { Home, LogIn } from 'lucide-react';
import { createClientServer } from '@/lib/supabase-server';

export async function PublicHeaderActions() {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <nav className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/explorar"
          className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 sm:h-10 sm:px-4 sm:text-sm"
        >
          Explorar
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-3 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] transition hover:opacity-95 sm:h-10 sm:px-4 sm:text-sm"
        >
          <Home className="h-4 w-4" />
          Ir al dashboard
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-2 sm:gap-3">
      <Link
        href="/explorar"
        className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 sm:h-10 sm:px-4 sm:text-sm"
      >
        Explorar
      </Link>
      <Link
        href="/login"
        className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-3 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] transition hover:opacity-95 sm:h-10 sm:px-4 sm:text-sm"
      >
        <LogIn className="h-4 w-4" />
        Ingresar
      </Link>
    </nav>
  );
}
