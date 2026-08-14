import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export function AdminAccessState({
  reason,
  message,
}: {
  reason: 'session_error' | 'unauthenticated' | 'forbidden';
  message: string;
}) {
  const title =
    reason === 'unauthenticated'
      ? 'Inicia sesión para entrar al panel'
      : reason === 'forbidden'
        ? 'No tienes acceso a este panel'
        : 'No pudimos validar tu acceso';
  const description =
    reason === 'unauthenticated'
      ? 'El panel de administración solo está disponible para cuentas con permisos internos.'
      : reason === 'forbidden'
        ? 'Tu cuenta funciona bien, pero no tiene permisos de administrador. Vuelve al dashboard para seguir usando la plataforma.'
        : 'Intenta nuevamente en unos minutos. Si el problema sigue, revisa tu sesión o el estado del servidor.';

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12">
      <section className="w-full rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-50 text-amber-600">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
          Acceso restringido
        </p>
        <h1 className="mt-3 text-[2rem] font-bold tracking-[-0.05em] text-slate-950">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {message}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={reason === 'unauthenticated' ? '/login?next=%2Fadministrador' : '/dashboard'}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {reason === 'unauthenticated' ? 'Iniciar sesión' : 'Volver al dashboard'}
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Ir al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
