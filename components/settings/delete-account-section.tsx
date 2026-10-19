'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    if (confirmation.trim().toUpperCase() !== 'ELIMINAR' || deleting) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        const message =
          payload.error === 'subscription_provider_error' || payload.error === 'subscription_not_canceled'
            ? 'No pudimos cancelar tu suscripción en Mercado Pago. Tu cuenta no fue eliminada para evitar futuros cobros sin acceso.'
            : payload.error === 'storage_cleanup_failed'
              ? 'No pudimos borrar todos tus archivos. Tu cuenta no fue eliminada; intentá nuevamente.'
              : payload.error === 'rate_limited'
                ? 'Alcanzaste el límite de intentos. Probá nuevamente más tarde.'
                : 'No pudimos eliminar tu cuenta por completo. No hicimos el cierre de sesión; intentá nuevamente o escribinos a privacidad@evaluo.com.ar.';
        setError(message);
        return;
      }

      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
      window.location.assign('/?cuenta=eliminada');
    } catch {
      setError('No pudimos comunicarnos con el servidor. Tu cuenta no fue eliminada.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="border-t border-slate-200 pt-6" aria-labelledby="delete-account-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold tracking-[0.14em] text-rose-700 uppercase">Zona sensible</p>
          <h2 id="delete-account-title" className="mt-2 text-xl font-bold text-slate-950">
            Eliminar cuenta
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Borra tu perfil, progreso, materiales, archivos y demás datos asociados. Si tenés una suscripción activa, primero intentamos cancelarla en Mercado Pago para evitar nuevos cobros.
          </p>
        </div>
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white px-4 text-sm font-bold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Eliminar mi cuenta
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-rose-950">Esta acción es permanente</h3>
              <p className="mt-1 text-sm leading-6 text-rose-900">
                Para confirmar, escribí <strong>ELIMINAR</strong>. Si la cancelación del pago o la limpieza de archivos falla, detenemos el proceso y te avisamos.
              </p>

              <label className="mt-4 block">
                <span className="text-xs font-bold text-rose-950">Confirmación</span>
                <input
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="off"
                  disabled={deleting}
                  placeholder="ELIMINAR"
                  className="mt-2 h-11 w-full max-w-sm rounded-xl border border-rose-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 disabled:opacity-60"
                />
              </label>

              {error ? (
                <p role="alert" className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-rose-800">
                  {error}
                </p>
              ) : null}

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={deleteAccount}
                  disabled={confirmation.trim().toUpperCase() !== 'ELIMINAR' || deleting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-bold text-white transition hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                  {deleting ? 'Eliminando cuenta…' : 'Eliminar definitivamente'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setConfirmation('');
                    setError(null);
                  }}
                  disabled={deleting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-slate-700 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-50"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
