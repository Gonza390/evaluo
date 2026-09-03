import Link from 'next/link';
import { Home } from 'lucide-react';
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
          className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 sm:px-4 sm:text-sm"
        >
          Explorar
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-3 text-xs font-semibold text-white transition hover:bg-indigo-700 sm:px-4 sm:text-sm"
        >
          <Home aria-hidden="true" className="h-4 w-4" />
          Ir al dashboard
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-2 sm:gap-3">
      <Link
        href="/login?mode=login"
        className="hidden min-h-11 items-center rounded-xl px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 sm:inline-flex sm:px-4 sm:text-sm"
      >
        Iniciar sesión
      </Link>
      <Link
        href="/login?mode=signup"
        className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-3 text-xs font-semibold text-white transition hover:bg-indigo-700 sm:px-4 sm:text-sm"
      >
        Crear cuenta gratis
      </Link>
    </nav>
  );
}
