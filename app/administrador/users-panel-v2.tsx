'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AdministradorUsuariosStats } from './actions';
import type { AdministradorUsuarioPaginadoRow } from './performance-actions';

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950">
        {value.toLocaleString('es-AR')}
      </p>
    </div>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled?: boolean; children: React.ReactNode }) {
  if (disabled) {
    return (
      <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-300">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
    >
      {children}
    </Link>
  );
}

export function UsersPanelV2({
  stats,
  rows,
  page,
  totalPages,
}: {
  stats: AdministradorUsuariosStats;
  rows: AdministradorUsuarioPaginadoRow[];
  page: number;
  totalPages: number;
}) {
  const previousHref = `/administrador?panel=usuarios&usersPage=${Math.max(1, page - 1)}`;
  const nextHref = `/administrador?panel=usuarios&usersPage=${Math.min(totalPages, page + 1)}`;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-[-0.04em] text-slate-950">Usuarios</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Lista paginada y métricas agregadas. Sólo se consultan los usuarios visibles en esta página.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryTile label="Usuarios totales" value={stats.totalUsers} />
        <SummaryTile label="Activos hoy" value={stats.activeToday} />
        <SummaryTile label="Altas hoy" value={stats.newRegistrationsToday} />
      </div>

      <div className="grid gap-3 md:hidden">
        {rows.map((user) => (
          <article key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{user.email}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {user.role} · {user.plan} · {user.estado}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                {user.intentos} intentos
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-400">Preguntas</p>
                <p className="mt-1 font-semibold text-slate-800">{user.preguntas.toLocaleString('es-AR')}</p>
              </div>
              <div>
                <p className="text-slate-400">Correctas</p>
                <p className="mt-1 font-semibold text-slate-800">{user.correctas.toLocaleString('es-AR')}</p>
              </div>
              <div>
                <p className="text-slate-400">Último ingreso</p>
                <p className="mt-1 font-medium text-slate-700">{formatDateTime(user.last_sign_in_at)}</p>
              </div>
              <div>
                <p className="text-slate-400">Alta</p>
                <p className="mt-1 font-medium text-slate-700">{formatDateTime(user.created_at)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Usuario</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 text-right font-semibold">Intentos</th>
                <th className="px-4 py-3 text-right font-semibold">Preguntas</th>
                <th className="px-4 py-3 text-right font-semibold">Correctas</th>
                <th className="px-4 py-3 font-semibold">Último ingreso</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-900">{user.email}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{user.role}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{user.estado}</td>
                  <td className="px-4 py-3.5 text-slate-600">{user.plan}</td>
                  <td className="px-4 py-3.5 text-right font-medium text-slate-700">{user.intentos}</td>
                  <td className="px-4 py-3.5 text-right text-slate-600">{user.preguntas}</td>
                  <td className="px-4 py-3.5 text-right text-slate-600">{user.correctas}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">
                    {formatDateTime(user.last_sign_in_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No hay usuarios en esta página.
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Página <span className="font-semibold text-slate-800">{page}</span> de{' '}
          <span className="font-semibold text-slate-800">{totalPages}</span>
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <PageLink href={previousHref} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </PageLink>
          <PageLink href={nextHref} disabled={page >= totalPages}>
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </PageLink>
        </div>
      </div>
    </section>
  );
}
