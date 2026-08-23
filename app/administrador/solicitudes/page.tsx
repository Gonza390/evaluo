import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, CheckCircle2, Clock3, GraduationCap, XCircle } from 'lucide-react';
import { getAdminAccessContext } from '@/lib/access-control';
import {
  aprobarSolicitudUniversidadAdministrador,
  listarSolicitudesUniversidadAdministrador,
  rechazarSolicitudUniversidadAdministrador,
  type UniversityRequestStatus,
} from './actions';

const STATUS_LABELS: Record<UniversityRequestStatus, string> = {
  pending: 'Pendiente',
  reviewing: 'En revisión',
  planned: 'Planificada',
  added: 'Aprobada',
  rejected: 'Rechazada',
};

function statusClass(status: UniversityRequestStatus) {
  if (status === 'added') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'rejected') return 'border-rose-200 bg-rose-50 text-rose-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

export default async function SolicitudesUniversidadAdministradorPage() {
  const access = await getAdminAccessContext();
  if (!access.ok) redirect('/administrador');

  const result = await listarSolicitudesUniversidadAdministrador();
  const pendingCount = result.rows.filter(
    (row) => row.status !== 'added' && row.status !== 'rejected'
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/administrador?panel=biblioteca"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              ← Volver al administrador
            </Link>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Solicitudes de universidades
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Revisá pedidos de alumnos y aprobá universidad + carrera en un solo paso.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Pendientes de decisión</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{pendingCount}</p>
          </div>
        </div>

        {!result.success ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {result.message ?? 'No pudimos cargar las solicitudes.'}
          </div>
        ) : result.rows.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" />
            <h2 className="mt-4 text-lg font-semibold">No hay solicitudes todavía</h2>
            <p className="mt-2 text-sm text-slate-500">
              Cuando un alumno pida una universidad desde Evaluo, va a aparecer acá.
            </p>
          </section>
        ) : (
          <div className="mt-6 space-y-4">
            {result.rows.map((row) => {
              const isOpen = row.status !== 'added' && row.status !== 'rejected';
              return (
                <article
                  key={row.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(row.status)}`}
                        >
                          {STATUS_LABELS[row.status]}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatDate(row.createdAt)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Universidad
                          </p>
                          <p className="mt-1 flex items-center gap-2 text-base font-semibold text-slate-950">
                            <Building2 className="h-4 w-4 text-indigo-600" />
                            {row.universityName}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {[row.city, row.country].filter(Boolean).join(', ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Carrera
                          </p>
                          <p className="mt-1 flex items-center gap-2 text-base font-semibold text-slate-950">
                            <GraduationCap className="h-4 w-4 text-indigo-600" />
                            {row.careerName}
                          </p>
                        </div>
                      </div>

                      {row.note ? (
                        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-medium text-slate-400">Comentario del alumno</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{row.note}</p>
                        </div>
                      ) : null}

                      {row.reviewedAt ? (
                        <p className="mt-3 text-xs text-slate-400">
                          Resuelta el {formatDate(row.reviewedAt)}
                        </p>
                      ) : null}
                    </div>

                    {isOpen ? (
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                        <form action={aprobarSolicitudUniversidadAdministrador}>
                          <input type="hidden" name="requestId" value={row.id} />
                          <button
                            type="submit"
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Aprobar y crear
                          </button>
                        </form>
                        <form action={rechazarSolicitudUniversidadAdministrador}>
                          <input type="hidden" name="requestId" value={row.id} />
                          <button
                            type="submit"
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                          >
                            <XCircle className="h-4 w-4" />
                            Rechazar
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
