import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  CircleAlert,
  FileText,
  Layers3,
  ListChecks,
  Sparkles,
  Target,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Preview · Mis errores',
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<{ estado?: string }>;
};

const errors = [
  {
    topic: 'Finalismo',
    source: 'Flashcards',
    sourceIcon: Layers3,
    failures: 2,
    recency: 'Hoy',
    description: 'Confundiste cómo cambia la noción de acción en la teoría finalista.',
  },
  {
    topic: 'Normativismo',
    source: 'Ejercicio',
    sourceIcon: ListChecks,
    failures: 1,
    recency: 'Ayer',
    description: 'Te costó distinguir la función normativa de la culpabilidad.',
  },
  {
    topic: 'Funcionalismo',
    source: 'Simulador',
    sourceIcon: Target,
    failures: 1,
    recency: 'Hace 3 días',
    description: 'Marcaste una opción incorrecta sobre funcionalismo moderado y sistémico.',
  },
  {
    topic: 'Dogmática penal',
    source: 'Diagnóstico',
    sourceIcon: CircleAlert,
    failures: 1,
    recency: 'Hace 5 días',
    description: 'El diagnóstico detectó una duda sobre la función de la dogmática.',
  },
] as const;

function SourceBadge({
  source,
  Icon,
}: {
  source: string;
  Icon: typeof Layers3;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
      <Icon className="h-3.5 w-3.5" />
      {source}
    </span>
  );
}

function ErrorRow({
  topic,
  source,
  sourceIcon,
  failures,
  recency,
  description,
  hasPdf,
}: (typeof errors)[number] & { hasPdf: boolean }) {
  const Icon = sourceIcon;
  return (
    <article className="border-b border-slate-100 py-5 last:border-b-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold tracking-[-0.02em] text-slate-950">{topic}</h3>
            <SourceBadge source={source} Icon={Icon} />
            {failures > 1 ? (
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                Fallaste {failures} veces
              </span>
            ) : null}
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
          <p className="mt-2 text-xs font-medium text-slate-400">Último error · {recency}</p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm"
          >
            Ver explicación
          </button>
          {hasPdf ? (
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white"
            >
              Ver en mi PDF
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default async function MisErroresPreviewPage({ searchParams }: PageProps) {
  if (process.env.VERCEL_ENV !== 'preview') notFound();

  const params = (await searchParams) ?? {};
  const hasPdf = params.estado === 'con-pdf';

  return (
    <main className="min-h-screen bg-[#F7F8FC] px-4 py-7 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-5 rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700">
                Preview interno
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950 sm:text-4xl">
                Mis errores
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Un solo lugar para lo que todavía necesitás reforzar, sin importar si el error vino de
                flashcards, ejercicios, diagnóstico o simulador.
              </p>
            </div>

            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <Link
                href="/preview/mis-errores?estado=sin-pdf"
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  !hasPdf ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
                }`}
              >
                Sin PDF
              </Link>
              <Link
                href="/preview/mis-errores?estado=con-pdf"
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  hasPdf ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
                }`}
              >
                Con PDF
              </Link>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {!hasPdf ? (
              <section className="overflow-hidden rounded-[26px] border border-amber-200 bg-[linear-gradient(135deg,#FFF9E9_0%,#FFFFFF_68%)] p-5 shadow-[0_18px_46px_rgba(180,83,9,0.06)] sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
                        Conectá tus errores con tus apuntes
                      </p>
                      <h2 className="mt-1.5 text-xl font-bold tracking-[-0.035em] text-slate-950">
                        Reforzá estos temas con el material que entra en tu examen
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        Subí tu PDF de Derecho Penal y Evaluo va a buscar dónde aparecen Finalismo,
                        Normativismo, Funcionalismo y Dogmática para llevarte directo a esas partes.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white"
                  >
                    Subir PDF de Derecho Penal
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </section>
            ) : (
              <section className="overflow-hidden rounded-[26px] border border-emerald-200 bg-[linear-gradient(135deg,#ECFDF5_0%,#FFFFFF_68%)] p-5 shadow-[0_18px_46px_rgba(5,150,105,0.06)] sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                      PDF conectado
                    </p>
                    <h2 className="mt-1.5 text-xl font-bold tracking-[-0.035em] text-slate-950">
                      Encontramos tus errores en “Módulo 2 · Lectura 1 Derecho Penal”
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Evaluo cruzó tus errores con tu PDF y encontró contenido relacionado para los 4 temas.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {['Finalismo', 'Normativismo', 'Funcionalismo', 'Dogmática penal'].map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-700">
                      Derecho Penal
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-slate-950">
                      4 temas para reforzar
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-500">
                      Priorizados por repetición y por qué tan reciente fue el error.
                    </p>
                  </div>
                  <span className="inline-flex w-fit rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">
                    5 errores registrados
                  </span>
                </div>
              </div>

              <div className="px-5 sm:px-6">
                {errors.map((error) => (
                  <ErrorRow key={error.topic} {...error} hasPdf={hasPdf} />
                ))}
              </div>
            </section>

            {hasPdf ? (
              <section className="rounded-[28px] border border-indigo-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                    <BookOpenText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-700">
                      Próximo paso
                    </p>
                    <h2 className="mt-1.5 text-xl font-bold tracking-[-0.035em] text-slate-950">
                      Repasá tus errores dentro de tu propio PDF
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                      Entrá a cada tema con el fragmento de tus apuntes que lo explica y después volvé a practicarlo.
                    </p>
                    <button
                      type="button"
                      className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white"
                    >
                      Repasar mis errores con este PDF
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-5">
            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-950">Tu foco ahora</h2>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-slate-950">4 temas</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Son los conceptos que todavía conviene reforzar antes de volver a medir.
              </p>
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.05)]">
              <h2 className="text-sm font-bold text-slate-950">Cómo se arma “Mis errores”</h2>
              <div className="mt-4 space-y-4">
                {[
                  ['1', 'Te equivocás', 'Flashcards, ejercicio, diagnóstico o simulador.'],
                  ['2', 'Evaluo guarda el tema', 'El origen queda como contexto, no como sección separada.'],
                  ['3', 'Lo conectamos a tu PDF', 'Si existe, buscamos los fragmentos relacionados.'],
                  ['4', 'Volvés a practicar', 'El objetivo es cerrar el error, no acumular historial.'],
                ].map(([n, title, body]) => (
                  <div key={n} className="grid grid-cols-[26px_minmax(0,1fr)] gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-700">
                      {n}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
