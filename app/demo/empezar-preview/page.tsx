import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Eye,
  FileText,
  FileUp,
  Home,
  Settings,
  Target,
  TriangleAlert,
  X,
} from 'lucide-react';

const fakeMaterials = [
  { title: 'Derecho Constitucional', subtitle: 'Listo para estudiar', progress: '72%' },
  { title: 'Teoría General del Proceso', subtitle: 'Último acceso ayer', progress: '46%' },
  { title: 'Derecho Sucesorio', subtitle: 'Procesado', progress: '31%' },
];

export default function EmpezarPreviewPage() {
  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-slate-50 text-slate-950">
      <div className="pointer-events-none select-none blur-[2px]" aria-hidden="true">
        <div className="min-h-[100svh] bg-white">
          <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-7">
            <div className="mx-auto flex max-w-6xl items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600" />
                <div>
                  <p className="font-bold tracking-[-0.03em]">Evaluo</p>
                  <p className="text-[11px] text-slate-400">Tu espacio académico</p>
                </div>
              </div>
              <div className="h-9 w-28 rounded-xl bg-slate-100" />
            </div>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[220px_minmax(0,1fr)] sm:px-6">
            <aside className="hidden border-r border-slate-200 pr-4 md:block">
              <div className="space-y-2">
                {[
                  ['Mi espacio', Home],
                  ['Calendario', CalendarDays],
                  ['Mis errores', TriangleAlert],
                  ['Configuración', Settings],
                ].map(([label, Icon], index) => {
                  const IconComponent = Icon as typeof Home;
                  return (
                    <div
                      key={String(label)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm ${
                        index === 0 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{String(label)}</span>
                    </div>
                  );
                })}
              </div>
            </aside>

            <section>
              <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-6 text-center sm:px-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Tu espacio
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-[-0.055em]">
                  Tu espacio de estudio
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Retomá tu PDF donde lo dejaste o sumá otro material cuando lo necesites.
                </p>
                <div className="mx-auto mt-5 h-11 w-40 rounded-xl bg-indigo-600" />
              </div>

              <div className="mt-5 grid gap-3">
                {fakeMaterials.map((material) => (
                  <div
                    key={material.title}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{material.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{material.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-400">{material.progress}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-slate-950/25 px-3 py-4 backdrop-blur-[6px] sm:px-5 sm:py-6">
        <section className="relative my-auto w-full max-w-[540px] overflow-hidden rounded-[26px] border border-white/80 bg-white shadow-[0_32px_100px_rgba(15,23,42,0.30)]">
          <Link
            href="/"
            aria-label="Cerrar preview"
            className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 sm:right-4 sm:top-4"
          >
            <X className="h-5 w-5" />
          </Link>

          <div className="max-h-[calc(100svh-2rem)] overflow-y-auto px-5 pb-5 pt-7 sm:max-h-[calc(100svh-3rem)] sm:px-8 sm:pb-7 sm:pt-8">
            <header className="pr-8 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
                Empezá con tus apuntes
              </p>
              <h2 className="mx-auto mt-3 max-w-[420px] text-[1.8rem] font-bold leading-[1.06] tracking-[-0.055em] sm:text-[2.15rem]">
                Subí el material que entra en tu examen
              </h2>
              <p className="mx-auto mt-3 max-w-[430px] text-sm leading-6 text-slate-600 sm:text-[15px]">
                Evaluo procesa tu PDF para ayudarte a estudiar, practicar y detectar qué temas necesitás reforzar.
              </p>
            </header>

            <div className="mx-auto mt-6 max-w-[430px] space-y-4 sm:mt-7">
              <div className="flex gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <FileUp className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Procesamos tu PDF</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    Organizamos el contenido para que puedas estudiarlo sin empezar de cero.
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <BookOpen className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Estudiás sobre ese material</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    Resumen, conceptos clave, tarjetas y práctica salen de tus propios apuntes.
                  </p>
                </div>
              </div>

              <div className="flex gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <Target className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Descubrís qué reforzar</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    Evaluo detecta tus errores y te lleva al tema que conviene volver a estudiar.
                  </p>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-6 max-w-[430px]">
              <button
                type="button"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-center text-sm font-semibold text-white shadow-[0_12px_28px_rgba(79,70,229,0.24)]"
              >
                Subir mis apuntes y empezar
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                className="mt-2.5 inline-flex min-h-10 w-full items-center justify-center gap-2 text-center text-sm font-semibold text-indigo-600"
              >
                <Eye className="h-4 w-4" />
                Ver cómo queda un PDF procesado
              </button>

              <button
                type="button"
                className="mt-1 inline-flex min-h-9 w-full items-center justify-center text-center text-xs font-semibold text-slate-400"
              >
                Ahora no
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
