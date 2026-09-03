import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BookOpen,
  Building2,
  CheckCircle2,
  Clock3,
  GraduationCap,
  LockKeyhole,
  XCircle,
} from 'lucide-react';
import { getAdminAccessContext } from '@/lib/access-control';
import {
  aprobarEntidadAcademicaPendienteAdministrador,
  aprobarSolicitudUniversidadAdministrador,
  listarCatalogoAcademicoPendienteAdministrador,
  listarSolicitudesUniversidadAdministrador,
  rechazarEntidadAcademicaPendienteAdministrador,
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

  const [universityResult, academicResult] = await Promise.all([
    listarSolicitudesUniversidadAdministrador(),
    listarCatalogoAcademicoPendienteAdministrador(),
  ]);
  const universityPendingCount = universityResult.rows.filter(
    (row) => row.status !== 'added' && row.status !== 'rejected'
  ).length;
  const pendingCount = universityPendingCount + academicResult.rows.length;

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
                  Solicitudes académicas
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Revisá universidades y las carreras o materias privadas que alumnos agregaron al
                  onboarding.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Pendientes de decisión</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{pendingCount}</p>
          </div>
        </div>

        <section className="mt-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-700">
                <LockKeyhole className="h-4 w-4" />
                <p className="text-xs font-bold uppercase tracking-[0.12em]">Catálogo privado</p>
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.035em] text-slate-950">
                Carreras y materias pendientes
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Mientras estén acá sólo las ve el alumno que las creó. Aprobarlas las incorpora al
                catálogo general.
              </p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
              {academicResult.rows.length} pendientes
            </span>
          </div>

          {!academicResult.success ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {academicResult.message ?? 'No pudimos cargar el catálogo pendiente.'}
            </div>
          ) : academicResult.rows.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-7 text-center">
              <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-600" />
              <p className="mt-3 text-sm font-semibold text-slate-900">
                No hay carreras ni materias privadas para revisar
              </p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
              {academicResult.rows.map((row) => {
                const canApprove = row.kind === 'career' || row.parentCareerApproved;
                return (
                  <article
                    key={`${row.kind}-${row.id}`}
                    className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-indigo-700">
                          {row.kind === 'career' ? 'Carrera' : 'Materia'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                          <LockKeyhole className="h-3.5 w-3.5" /> Sólo creador
                        </span>
                        {row.createdAt ? (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <Clock3 className="h-3.5 w-3.5" /> {formatDate(row.createdAt)}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-2 text-base font-bold text-slate-950">{row.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {row.universityName}
                        {row.facultyName ? ` · ${row.facultyName}` : ''}
                        {row.careerName ? ` · ${row.careerName}` : ''}
                      </p>
                      {!canApprove ? (
                        <p className="mt-2 text-xs font-semibold text-amber-700">
                          Aprobá primero la carrera para poder publicar esta materia.
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <form action={aprobarEntidadAcademicaPendienteAdministrador}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="kind" value={row.kind} />
                        <button
                          type="submit"
                          disabled={!canApprove}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Aprobar
                        </button>
                      </form>
                      <form action={rechazarEntidadAcademicaPendienteAdministrador}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="kind" value={row.kind} />
                        <button
                          type="submit"
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                        >
                          <XCircle className="h-4 w-4" /> Rechazar
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10 border-t border-slate-200 pt-7">
          <div>
            <div className="flex items-center gap-2 text-slate-700">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <p className="text-xs font-bold uppercase tracking-[0.12em]">Nuevas universidades</p>
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.035em] text-slate-950">
              Solicitudes de universidad
            </h2>
          </div>

          {!universityResult.success ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {universityResult.message ?? 'No pudimos cargar las solicitudes.'}
            </div>
          ) : universityResult.rows.length === 0 ? (
            <section className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
              <h3 className="mt-3 text-base font-semibold">No hay solicitudes de universidad</h3>
              <p className="mt-1 text-sm text-slate-500">
                Cuando un alumno pida una universidad nueva, va a aparecer acá.
              </p>
            </section>
          ) : (
            <div className="mt-4 space-y-4">
              {universityResult.rows.map((row) => {
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
                            <Clock3 className="h-3.5 w-3.5" /> {formatDate(row.createdAt)}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Universidad
                            </p>
                            <p className="mt-1 flex items-center gap-2 text-base font-semibold text-slate-950">
                              <Building2 className="h-4 w-4 text-indigo-600" /> {row.universityName}
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
                              <GraduationCap className="h-4 w-4 text-indigo-600" /> {row.careerName}
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
                              <CheckCircle2 className="h-4 w-4" /> Aprobar y crear
                            </button>
                          </form>
                          <form action={rechazarSolicitudUniversidadAdministrador}>
                            <input type="hidden" name="requestId" value={row.id} />
                            <button
                              type="submit"
                              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                            >
                              <XCircle className="h-4 w-4" /> Rechazar
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
        </section>

        <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
          <BookOpen className="h-4 w-4" />
          Las entidades pendientes no se publican hasta una aprobación explícita.
        </div>
      </div>
    </main>
  );
}
