import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Layers3,
  ListChecks,
  Target,
  CircleAlert,
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
  explanation: string;
  pdfName?: string;
  pdfSection?: string;
  matchType?: 'origin' | 'best';
  alsoIn?: string;
};

const errors: ErrorItem[] = [
  {
    topic: 'Finalismo',
    source: 'Flashcards',
    failures: 2,
    recency: 'hoy',
    description: 'Confundiste cómo cambia la noción de acción en la teoría finalista.',
    explanation:
      'En el finalismo, la acción deja de pensarse como un movimiento causal y pasa a entenderse como una conducta dirigida a un fin.',
    pdfName: 'Módulo 2 · Lectura 1 Derecho Penal',
    pdfSection: 'Teoría finalista de la acción',
    matchType: 'origin',
  },
  {
    topic: 'Normativismo',
    source: 'Ejercicio',
    failures: 1,
    recency: 'ayer',
    description: 'Te costó distinguir la función normativa de la culpabilidad.',
    explanation:
      'El normativismo desplaza el foco desde una concepción puramente psicológica hacia un juicio de reproche jurídico sobre la conducta.',
    pdfName: 'Resumen parcial 1',
    pdfSection: 'Concepciones normativas de la culpabilidad',
    matchType: 'origin',
  },
  {
    topic: 'Funcionalismo',
    source: 'Simulador',
    failures: 1,
    recency: 'hace 3 días',
    description: 'Marcaste una opción incorrecta sobre funcionalismo moderado y sistémico.',
    explanation:
      'Las variantes funcionalistas reorganizan categorías de la teoría del delito según la función que cumple el Derecho penal dentro del sistema social.',
    pdfName: 'Módulo 2 · Lectura 1 Derecho Penal',
    pdfSection: 'Funcionalismo moderado y sistémico',
    matchType: 'best',
    alsoIn: 'Resumen parcial 1',
  },
  {
    topic: 'Dogmática penal',
    source: 'Diagnóstico',
    failures: 1,
    recency: 'hace 5 días',
    description: 'El diagnóstico detectó una duda sobre la función de la dogmática.',
    explanation:
      'La dogmática organiza e interpreta las normas penales para construir criterios consistentes de aplicación.',
    pdfName: 'Módulo 1 · Introducción al Derecho Penal',
    pdfSection: 'Dogmática jurídico-penal',
    matchType: 'origin',
  },
];

const sourceIcons = {
  Flashcards: Layers3,
  Ejercicio: ListChecks,
  Simulador: Target,
  Diagnóstico: CircleAlert,
} as const;

function ErrorItemView({ item, hasPdfs }: { item: ErrorItem; hasPdfs: boolean }) {
  const Icon = sourceIcons[item.source];

  return (
    <article className="py-8 first:pt-5">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-slate-400">
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
          <Icon className="h-3.5 w-3.5" />
          {item.source}
        </span>
        <span>·</span>
        <span>{item.failures === 1 ? '1 error' : `${item.failures} errores`}</span>
        <span>·</span>
        <span>{item.recency}</span>
      </div>

      <h3 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.035em] text-slate-950">
        {item.topic}
      </h3>

      <p className="mt-2 max-w-3xl text-[15px] leading-7 text-slate-600">
        {item.description}
      </p>

      <details className="group mt-4">
        <summary className="cursor-pointer list-none text-sm font-semibold text-slate-500 transition hover:text-slate-900">
          <span className="group-open:hidden">Ver explicación</span>
          <span className="hidden group-open:inline">Ocultar explicación</span>
        </summary>
        <p className="mt-3 max-w-3xl border-l border-slate-300 pl-4 text-sm leading-6 text-slate-600">
          {item.explanation}
        </p>
      </details>

      {hasPdfs && item.pdfName ? (
        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            En tus apuntes
          </p>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="text-sm font-semibold text-slate-900">{item.pdfName}</p>
                <span className="text-[11px] font-medium text-slate-400">
                  {item.matchType === 'origin' ? 'material de origen' : 'mejor coincidencia'}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{item.pdfSection}</p>
              {item.alsoIn ? (
                <p className="mt-1 text-xs text-slate-400">También aparece en {item.alsoIn}</p>
              ) : null}
            </div>

            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              Repasar ahí
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default async function MisErroresPreviewPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const hasPdfs = params.estado !== 'sin-pdf';

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto max-w-[920px] px-5 py-8 sm:px-8 lg:py-12">
        <div className="mb-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Mi espacio
          </Link>

          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.055em] text-slate-950 sm:text-[2.8rem]">
                Mis errores
              </h1>
              <p className="mt-3 max-w-xl text-[15px] leading-7 text-slate-500">
                Lo que todavía necesitás reforzar, sin importar dónde te equivocaste.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <Link
                href="/preview/mis-errores?estado=varios-pdfs"
                className={hasPdfs ? 'font-semibold text-slate-900' : 'font-medium text-slate-400'}
              >
                Con PDFs
              </Link>
              <span className="h-3 w-px bg-slate-200" />
              <Link
                href="/preview/mis-errores?estado=sin-pdf"
                className={!hasPdfs ? 'font-semibold text-slate-900' : 'font-medium text-slate-400'}
              >
                Sin PDF
              </Link>
            </div>
          </div>
        </div>

        <section>
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[12px] font-semibold text-indigo-600">Derecho Penal</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                4 temas para reforzar
              </h2>
            </div>

            <p className="text-sm text-slate-400">5 errores registrados</p>
          </div>

          {!hasPdfs ? (
            <div className="border-b border-slate-200 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <p className="max-w-2xl text-sm leading-6 text-slate-500">
                    No tenés apuntes propios de Derecho Penal. Subí el material que entra en tu examen
                    para conectar estos errores con las partes exactas que necesitás repasar.
                  </p>
                </div>

                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-indigo-600"
                >
                  Subir PDF
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="border-b border-slate-200 py-4">
              <p className="text-sm leading-6 text-slate-500">
                Evaluo está usando <span className="font-medium text-slate-700">3 PDFs tuyos</span> de esta materia.
                Para cada error muestra el material de origen o la mejor coincidencia.
              </p>
            </div>
          )}

          <div className="divide-y divide-slate-200">
            {errors.map((item) => (
              <ErrorItemView key={item.topic} item={item} hasPdfs={hasPdfs} />
            ))}
          </div>
        </section>

        <section className="mt-4 border-t border-slate-300 pt-7">
          {hasPdfs ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                  Empezá por Finalismo
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Es el tema que más repetiste y tiene contexto directo en tus apuntes.
                </p>
              </div>

              <button
                type="button"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white"
              >
                Empezar repaso
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-500">
                Podés seguir revisando tus explicaciones ahora y conectar tus apuntes cuando quieras.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
