import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpenText,
  CircleAlert,
  FileText,
  Layers3,
  ListChecks,
  Target,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Preview · Mis errores',
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<{ estado?: string }>;
};

type ErrorItem = {
  topic: string;
  source: 'Flashcards' | 'Ejercicio' | 'Simulador' | 'Diagnóstico';
  failures: number;
  recency: string;
  description: string;
  pdfName?: string;
  pdfSection?: string;
  alsoIn?: string;
  exactSource?: boolean;
};

const errors: ErrorItem[] = [
  {
    topic: 'Finalismo',
    source: 'Flashcards',
    failures: 2,
    recency: 'Hoy',
    description: 'Confundiste cómo cambia la noción de acción en la teoría finalista.',
    pdfName: 'Módulo 2 · Lectura 1 Derecho Penal',
    pdfSection: 'Teoría finalista de la acción',
    exactSource: true,
  },
  {
    topic: 'Normativismo',
    source: 'Ejercicio',
    failures: 1,
    recency: 'Ayer',
    description: 'Te costó distinguir la función normativa de la culpabilidad.',
    pdfName: 'Resumen parcial 1',
    pdfSection: 'Concepciones normativas de la culpabilidad',
    exactSource: true,
  },
  {
    topic: 'Funcionalismo',
    source: 'Simulador',
    failures: 1,
    recency: 'Hace 3 días',
    description: 'Marcaste una opción incorrecta sobre funcionalismo moderado y sistémico.',
    pdfName: 'Módulo 2 · Lectura 1 Derecho Penal',
    pdfSection: 'Funcionalismo moderado y sistémico',
    alsoIn: 'Resumen parcial 1',
  },
  {
    topic: 'Dogmática penal',
    source: 'Diagnóstico',
    failures: 1,
    recency: 'Hace 5 días',
    description: 'El diagnóstico detectó una duda sobre la función de la dogmática.',
    pdfName: 'Módulo 1 · Introducción al Derecho Penal',
    pdfSection: 'Dogmática jurídico-penal',
    exactSource: true,
  },
];

const sourceIcon = {
  Flashcards: Layers3,
  Ejercicio: ListChecks,
  Simulador: Target,
  Diagnóstico: CircleAlert,
} as const;

function ErrorRow({ item, hasPdfs }: { item: ErrorItem; hasPdfs: boolean }) {
  const Icon = sourceIcon[item.source];

  return (
    <article className="grid gap-4 border-b border-slate-200 py-6 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="text-lg font-bold tracking-[-0.03em] text-slate-950">{item.topic}</h3>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Icon className="h-3.5 w-3.5" />
            {item.source}
          </span>
          <span className="text-xs font-semibold text-rose-600">
            {item.failures === 1 ? '1 error' : `${item.failures} errores`}
          </span>
          <span className="text-xs text-slate-400">· {item.recency}</span>
        </div>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{item.description}</p>

        {hasPdfs && item.pdfName ? (
          <div className="mt-4 border-l-2 border-indigo-200 pl-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              En tus apuntes
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {item.pdfName}
              {item.exactSource ? (
                <span className="ml-2 text-xs font-medium text-indigo-600">PDF de origen</span>
              ) : (
                <span className="ml-2 text-xs font-medium text-indigo-600">Mejor coincidencia</span>
              )}
            </p>
            <p className="mt-1 text-sm text-slate-500">{item.pdfSection}</p>
            {item.alsoIn ? (
              <p className="mt-1.5 text-xs text-slate-400">También aparece en {item.alsoIn}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-start gap-3 lg:justify-end">
        <button
          type="button"
          className="text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          Ver explicación
        </button>
        {hasPdfs && item.pdfName ? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 transition hover:text-indigo-700"
          >
            Repasar en mis apuntes
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default async function MisErroresPreviewPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const hasPdfs = params.estado !== 'sin-pdf';

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
              Preview interno
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950 sm:text-4xl">
              Mis errores
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Todo lo que todavía necesitás reforzar, sin separar por herramienta.
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/preview/mis-errores?estado=varios-pdfs"
              className={hasPdfs ? 'font-bold text-indigo-600' : 'font-semibold text-slate-400'}
            >
              Con varios PDFs
            </Link>
            <span className="h-4 w-px bg-slate-200" />
            <Link
              href="/preview/mis-errores?estado=sin-pdf"
              className={!hasPdfs ? 'font-bold text-indigo-600' : 'font-semibold text-slate-400'}
            >
              Sin PDF
            </Link>
          </div>
        </div>

        {!hasPdfs ? (
          <section className="mb-9 border-y border-amber-200 bg-amber-50/60 py-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
                  Conectá estos errores con tus apuntes
                </p>
                <h2 className="mt-1.5 text-xl font-bold tracking-[-0.035em] text-slate-950">
                  Subí el material que realmente entra en tu examen
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Evaluo va a buscar estos conceptos dentro de tus PDFs para llevarte directo a la parte
                  que necesitás repasar.
                </p>
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
          <section className="mb-9 flex flex-col gap-4 border-y border-slate-200 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                3 PDFs de Derecho Penal conectados a tus errores
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Evaluo usa el PDF de origen cuando existe y, si el error viene del simulador, elige la mejor coincidencia.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600"
            >
              Ver mis PDFs
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        )}

        <section>
          <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Derecho Penal
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-slate-950">
                4 temas para reforzar
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Priorizados por repetición y por qué tan reciente fue el error.
              </p>
            </div>
            <div className="text-sm text-slate-500">
              5 errores registrados
            </div>
          </div>

          <div>
            {errors.map((item) => (
              <ErrorRow key={item.topic} item={item} hasPdfs={hasPdfs} />
            ))}
          </div>
        </section>

        {hasPdfs ? (
          <section className="mt-10 border-t border-slate-200 pt-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2">
                  <BookOpenText className="h-4 w-4 text-indigo-600" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-600">
                    Próximo paso
                  </p>
                </div>
                <h2 className="mt-2 text-xl font-bold tracking-[-0.035em] text-slate-950">
                  Repasá estos 4 temas en tus propios apuntes
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Evaluo ya eligió el mejor PDF para cada error. No tenés que decidir qué archivo abrir.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white"
              >
                Empezar repaso
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        ) : (
          <section className="mt-10 border-t border-slate-200 pt-7">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Si un tema no aparece en tus PDFs actuales, Evaluo te lo va a marcar.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Ahí recién te pedimos otro material, en vez de hacerte elegir archivos todo el tiempo.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
