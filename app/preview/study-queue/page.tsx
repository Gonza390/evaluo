import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Layers3,
  Sparkles,
  Target,
} from 'lucide-react';

const subjectRows = [
  {
    name: 'Introducción al Pensamiento Científico',
    short: 'IPC',
    pending: '12 conceptos pendientes',
    materials: '4 PDFs',
    state: 'Repaso activo',
  },
  {
    name: 'Derecho Constitucional',
    short: 'Derecho',
    pending: '4 puntos para reforzar',
    materials: '2 PDFs',
    state: 'Práctica iniciada',
  },
  {
    name: 'Economía',
    short: 'Economía',
    pending: 'Todo al día',
    materials: '2 PDFs',
    state: 'Sin pendientes',
  },
];

export default function StudyQueuePreviewPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FB] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-[11px] font-bold tracking-[0.12em] text-[#2563EB] uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              Preview · Mi espacio
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-[2rem]">
              Qué estudiar hoy
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
              Evaluo organiza tus pendientes entre materias y PDFs para que no tengas que decidir por dónde seguir.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm"
          >
            Ver mis materiales
          </button>
        </div>

        <section className="overflow-hidden rounded-[26px] border border-blue-200 bg-[linear-gradient(145deg,#0D2F82_0%,#174BBD_52%,#2563EB_100%)] text-white shadow-[0_22px_55px_rgba(37,99,235,0.16)]">
          <div className="grid gap-6 px-5 py-6 sm:px-7 sm:py-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-[11px] font-bold tracking-[0.12em] uppercase ring-1 ring-white/15">
                  <Target className="h-3.5 w-3.5" />
                  Para hoy
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50">
                  <Clock3 className="h-3.5 w-3.5" />
                  8 min
                </span>
              </div>

              <p className="mt-5 text-sm font-semibold text-blue-100">
                Introducción al Pensamiento Científico
              </p>
              <h2 className="mt-1 max-w-2xl text-[1.75rem] font-bold leading-tight tracking-[-0.045em] sm:text-[2.15rem]">
                Reforzá 5 conceptos que te costaron
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50/90">
                Detectamos 12 conceptos pendientes en 4 PDFs. Para esta sesión seleccionamos los 5 más relevantes para que puedas avanzar sin repasar todo de nuevo.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">
                  4 materiales relacionados
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">
                  Último estudio: ayer
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">
                  12 pendientes totales
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 lg:min-w-[210px]">
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-[#174BBD] shadow-[0_12px_28px_rgba(15,23,42,0.16)]"
              >
                Empezar repaso
                <ArrowRight className="h-4 w-4" />
              </button>
              <span className="text-center text-[11px] font-medium text-blue-100">
                Sesión corta · 5 conceptos
              </span>
            </div>
          </div>

          <details className="border-t border-white/15 bg-white/[0.06]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold sm:px-7">
              <span className="inline-flex items-center gap-2">
                <Layers3 className="h-4 w-4" />
                Ver de dónde salen estos pendientes
              </span>
              <ChevronRight className="h-4 w-4" />
            </summary>
            <div className="grid gap-2 border-t border-white/10 px-5 py-4 text-sm sm:px-7 lg:grid-cols-2">
              {[
                ['Resumen IPC · Primer parcial', '5 pendientes'],
                ['Unidad 2 · Método científico', '3 pendientes'],
                ['Popper y falsacionismo', '2 pendientes'],
                ['Leyes y teorías científicas', '2 pendientes'],
              ].map(([title, count]) => (
                <div
                  key={title}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3.5 py-3 ring-1 ring-white/10"
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-blue-100" />
                    <span className="truncate font-medium">{title}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-blue-100">{count}</span>
                </div>
              ))}
            </div>
          </details>
        </section>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <BrainCircuit className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-bold tracking-[0.11em] text-indigo-600 uppercase">
                    Después
                  </p>
                  <h3 className="mt-1 text-lg font-bold tracking-[-0.035em] text-slate-950">
                    Continuar práctica de Derecho
                  </h3>
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                5 min
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Dejaste una práctica empezada. Te quedan 6 preguntas y hay 4 puntos que conviene volver a mirar.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
                2 PDFs relacionados
              </span>
              <span className="rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
                6 preguntas
              </span>
            </div>

            <button
              type="button"
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800"
            >
              Continuar práctica
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>

          <section className="rounded-[22px] border border-emerald-200 bg-[linear-gradient(145deg,#FFFFFF_0%,#F0FDF4_100%)] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-bold tracking-[0.11em] text-emerald-700 uppercase">
                  Sin urgencias
                </p>
                <h3 className="mt-1 text-lg font-bold tracking-[-0.035em] text-slate-950">
                  Economía está al día
                </h3>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              No detectamos pendientes recientes en tus 2 materiales. No hace falta agregarlos a la sesión de hoy.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <BookOpenCheck className="h-4 w-4" />
              2 PDFs sin pendientes
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-[22px] border border-slate-200 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">
                Vista general
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.04em] text-slate-950">
                Tus materias
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                8 PDFs organizados por materia. Los materiales aparecen solo cuando necesitás bajar al detalle.
              </p>
            </div>
            <span className="rounded-full bg-[#EEF4FF] px-3 py-1.5 text-xs font-bold text-[#2563EB]">
              3 materias · 8 PDFs
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {subjectRows.map((subject) => (
              <div
                key={subject.name}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-950">{subject.name}</h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {subject.materials}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {subject.pending} · {subject.state}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-[#2563EB]"
                >
                  Ver materia
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5 rounded-[18px] border border-blue-100 bg-[#EEF4FF] px-4 py-3.5 text-sm leading-6 text-slate-600">
          <strong className="text-slate-950">La lógica:</strong> Evaluo prioriza una sesión corta para hoy, agrupa pendientes de varios PDFs por materia y evita mostrar una lista interminable de errores o recordatorios separados.
        </div>
      </div>
    </main>
  );
}
