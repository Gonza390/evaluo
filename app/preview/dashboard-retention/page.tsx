import {
  ArrowRight,
  BrainCircuit,
  Eye,
  FileText,
  Lock,
  Upload,
} from 'lucide-react';

const materials = [
  {
    title: 'Resumen IPC · Primer parcial',
    file: 'resumen-ipc-primer-parcial.pdf',
    subject: 'Introducción al Pensamiento Científico',
    date: '26 sept 2026',
    pages: '42 páginas',
  },
  {
    title: 'Unidad 2 · Método científico',
    file: 'ipc-unidad-2-metodo-cientifico.pdf',
    subject: 'Introducción al Pensamiento Científico',
    date: '22 sept 2026',
    pages: '28 páginas',
  },
  {
    title: 'Sociedad y Estado · Apuntes',
    file: 'sociedad-y-estado-apuntes.pdf',
    subject: 'Sociedad y Estado',
    date: '18 sept 2026',
    pages: '61 páginas',
  },
];

export default function DashboardRetentionPreviewPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="min-w-0 space-y-4 overflow-x-clip">
          <section className="rounded-[1.35rem] border border-slate-200/80 bg-white px-4 py-6 sm:px-6 sm:py-7">
            <div className="mx-auto max-w-xl text-center">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                Tu espacio
              </p>
              <h1 className="mt-2 text-[1.65rem] font-bold tracking-[-0.055em] text-slate-950 sm:text-[2rem]">
                Tu espacio de estudio
              </h1>
              <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-5 text-slate-500">
                Retomá tu PDF donde lo dejaste o sumá otro material cuando lo necesites.
              </p>

              <div className="mt-5 flex flex-col items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-[15px] font-semibold text-white sm:w-auto"
                >
                  Continuar estudiando
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-2 px-3 text-sm font-semibold text-slate-500"
                >
                  <Upload className="h-4 w-4" />
                  Subir otro PDF
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[1.35rem] border border-indigo-100 bg-indigo-50/45 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-700 ring-1 ring-indigo-100">
                  <BrainCircuit className="h-5 w-5" />
                </span>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.13em] text-indigo-600 uppercase">
                    Para repasar
                  </p>
                  <h2 className="mt-1 text-[15px] font-bold tracking-[-0.03em] text-slate-950">
                    Tenés 5 conceptos para reforzar
                  </h2>
                  <p className="mt-1 text-[13px] leading-5 text-slate-500">
                    Los marcaste como difíciles en tus últimas sesiones.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white"
              >
                Repasar ahora
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-slate-200/80 bg-white p-4 shadow-[0_16px_46px_rgba(15,23,42,0.05)] sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
                  Tu estudio
                </p>
                <h2 className="mt-1 text-[1.35rem] font-bold tracking-[-0.045em] text-slate-950">
                  Tus PDFs
                </h2>
                <p className="mt-1 text-[13px] leading-5 text-slate-500">
                  3 materiales disponibles para retomar cuando quieras.
                </p>
              </div>

              <button
                type="button"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
              >
                <Upload className="h-4 w-4" />
                Subí tu PDF
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {materials.map((material) => (
                <article
                  key={material.title}
                  className="flex flex-col gap-3 rounded-[1.25rem] border border-slate-200 bg-[linear-gradient(180deg,#FFFFFF_0%,#FAFBFF_100%)] px-3.5 py-3.5 sm:px-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-semibold tracking-[-0.03em] text-slate-950">
                          {material.title}
                        </h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[12px] font-semibold text-slate-600">
                          <Lock className="h-3.5 w-3.5" />
                          Privado
                        </span>
                      </div>

                      <p className="mt-1.5 text-[13px] break-all text-slate-500">
                        {material.file}
                      </p>

                      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5 text-[12px] font-medium text-slate-500">
                        <span>Universidad de Buenos Aires</span>
                        <span>CBC / UBA XXI</span>
                        <span>{material.subject}</span>
                        <span>{material.date}</span>
                        <span>{material.pages}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white"
                      >
                        <Eye className="h-4 w-4" />
                        Continuar estudiando
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-500"
                      >
                        <FileText className="h-4 w-4" />
                        Compartir
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
