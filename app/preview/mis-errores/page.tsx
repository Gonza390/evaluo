import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
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
  searchParams?: Promise<{ tema?: string; estado?: string }>;
};

type ErrorItem = {
  id: string;
  topic: string;
  source: 'Flashcards' | 'Ejercicio' | 'Simulador' | 'Diagnóstico';
  failures: number;
  recency: string;
  question: string;
  explanation: string;
  selectedAnswer: string;
  correctAnswer: string;
  pdfs: Array<{
    name: string;
    section: string;
    relation: 'origin' | 'best' | 'secondary';
  }>;
};

const errors: ErrorItem[] = [
  {
    id: 'finalismo',
    topic: 'Finalismo',
    source: 'Flashcards',
    failures: 2,
    recency: 'Hoy',
    question: '¿Qué cambia en la noción de acción a partir del finalismo?',
    explanation:
      'El finalismo entiende la acción como una conducta orientada a un fin. La finalidad deja de ser un dato externo y pasa a integrar la propia estructura de la acción.',
    selectedAnswer: 'La acción se define únicamente por el resultado producido.',
    correctAnswer: 'La acción se entiende como una conducta dirigida conscientemente a un fin.',
    pdfs: [
      {
        name: 'Módulo 2 · Lectura 1 Derecho Penal',
        section: 'Teoría finalista de la acción',
        relation: 'origin',
      },
      {
        name: 'Resumen parcial 1',
        section: 'Finalismo · concepto de acción',
        relation: 'secondary',
      },
    ],
  },
  {
    id: 'normativismo',
    topic: 'Normativismo',
    source: 'Ejercicio',
    failures: 1,
    recency: 'Ayer',
    question: '¿Cómo modifica el normativismo la concepción de la culpabilidad?',
    explanation:
      'La culpabilidad deja de concebirse como una relación puramente psicológica entre el autor y el hecho y pasa a funcionar como un juicio jurídico de reproche.',
    selectedAnswer: 'La reduce a la intención psicológica del autor.',
    correctAnswer: 'La transforma en un juicio normativo de reproche.',
    pdfs: [
      {
        name: 'Resumen parcial 1',
        section: 'Concepciones normativas de la culpabilidad',
        relation: 'origin',
      },
    ],
  },
  {
    id: 'funcionalismo',
    topic: 'Funcionalismo',
    source: 'Simulador',
    failures: 1,
    recency: 'Hace 3 días',
    question: '¿Qué distingue al funcionalismo dentro de la teoría del delito?',
    explanation:
      'El funcionalismo interpreta las categorías del delito según la función que cumplen dentro del sistema jurídico y social, con diferencias relevantes entre sus variantes.',
    selectedAnswer: 'Mantiene intactas las categorías del causalismo clásico.',
    correctAnswer: 'Reformula categorías según su función jurídico-social.',
    pdfs: [
      {
        name: 'Módulo 2 · Lectura 1 Derecho Penal',
        section: 'Funcionalismo moderado y sistémico',
        relation: 'best',
      },
      {
        name: 'Resumen parcial 1',
        section: 'Escuelas posteriores al finalismo',
        relation: 'secondary',
      },
      {
        name: 'Clases profesor · Unidad 2',
        section: 'Roxin y Jakobs',
        relation: 'secondary',
      },
    ],
  },
  {
    id: 'dogmatica',
    topic: 'Dogmática penal',
    source: 'Diagnóstico',
    failures: 1,
    recency: 'Hace 5 días',
    question: '¿Cuál es la función de la dogmática jurídico-penal?',
    explanation:
      'La dogmática busca ordenar, interpretar y sistematizar el Derecho penal para construir criterios consistentes de aplicación.',
    selectedAnswer: 'Reemplazar las normas por criterios doctrinarios.',
    correctAnswer: 'Interpretar y sistematizar las normas penales.',
    pdfs: [
      {
        name: 'Módulo 1 · Introducción al Derecho Penal',
        section: 'Dogmática jurídico-penal',
        relation: 'origin',
      },
    ],
  },
];

const sourceIcons = {
  Flashcards: Layers3,
  Ejercicio: ListChecks,
  Simulador: Target,
  Diagnóstico: CircleAlert,
} as const;

function relationLabel(relation: ErrorItem['pdfs'][number]['relation']) {
  if (relation === 'origin') return 'Material de origen';
  if (relation === 'best') return 'Mejor coincidencia';
  return 'También encontrado';
}

export default async function MisErroresPreviewPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const hasPdfs = params.estado !== 'sin-pdf';
  const selected =
    errors.find((item) => item.id === params.tema) ??
    errors[0];
  const SelectedIcon = sourceIcons[selected.source];

  return (
    <main className="min-h-screen bg-[#FBFBFC] text-slate-950">
      <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="border-b border-slate-200 pb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Mi espacio
          </Link>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.05em] sm:text-[2.6rem]">
                Mis errores
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Derecho Penal · 4 temas para reforzar
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <Link
                href={`/preview/mis-errores?tema=${selected.id}&estado=varios-pdfs`}
                className={hasPdfs ? 'font-semibold text-slate-900' : 'text-slate-400'}
              >
                Con PDFs
              </Link>
              <span className="h-3 w-px bg-slate-200" />
              <Link
                href={`/preview/mis-errores?tema=${selected.id}&estado=sin-pdf`}
                className={!hasPdfs ? 'font-semibold text-slate-900' : 'text-slate-400'}
              >
                Sin PDF
              </Link>
            </div>
          </div>
        </header>

        <div className="grid min-h-[680px] lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 py-5 lg:border-r lg:border-b-0 lg:pr-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Pendientes
              </p>
              <span className="text-xs text-slate-400">5 errores</span>
            </div>

            <nav className="-mx-2">
              {errors.map((item) => {
                const Icon = sourceIcons[item.source];
                const active = item.id === selected.id;
                const href = `/preview/mis-errores?tema=${item.id}&estado=${hasPdfs ? 'varios-pdfs' : 'sin-pdf'}`;

                return (
                  <Link
                    key={item.id}
                    href={href}
                    className={`group flex items-start gap-3 border-l-2 px-3 py-3.5 transition ${
                      active
                        ? 'border-slate-950 bg-white'
                        : 'border-transparent hover:bg-white/70'
                    }`}
                  >
                    <Icon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        active ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p
                          className={`truncate text-sm font-semibold ${
                            active ? 'text-slate-950' : 'text-slate-700'
                          }`}
                        >
                          {item.topic}
                        </p>
                        <ChevronRight
                          className={`h-3.5 w-3.5 shrink-0 ${
                            active ? 'text-slate-700' : 'text-slate-300'
                          }`}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.source} · {item.failures === 1 ? '1 error' : `${item.failures} errores`}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {!hasPdfs ? (
              <div className="mt-7 border-t border-slate-200 pt-5">
                <div className="flex items-start gap-2.5">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Sin apuntes propios
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Subí un PDF para conectar estos errores con tu material.
                    </p>
                    <button
                      type="button"
                      className="mt-3 text-xs font-semibold text-indigo-600"
                    >
                      Subir PDF →
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </aside>

          <section className="py-6 lg:pl-9 lg:py-8">
            <div className="max-w-[760px]">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
                  <SelectedIcon className="h-3.5 w-3.5" />
                  {selected.source}
                </span>
                <span>·</span>
                <span>{selected.failures === 1 ? '1 error' : `${selected.failures} errores`}</span>
                <span>·</span>
                <span>{selected.recency}</span>
              </div>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                {selected.topic}
              </h2>

              <div className="mt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Qué pasó
                </p>
                <p className="mt-2 text-[15px] leading-7 text-slate-700">
                  {selected.question}
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="border-l-2 border-rose-200 pl-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-500">
                      Tu respuesta
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {selected.selectedAnswer}
                    </p>
                  </div>
                  <div className="border-l-2 border-emerald-200 pl-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-600">
                      Respuesta correcta
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {selected.correctAnswer}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-9 border-t border-slate-200 pt-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Explicación
                </p>
                <p className="mt-3 text-[15px] leading-7 text-slate-700">
                  {selected.explanation}
                </p>
              </div>

              {hasPdfs ? (
                <div className="mt-9 border-t border-slate-200 pt-7">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        En tus apuntes
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Evaluo encontró dónde repasar este concepto.
                      </p>
                    </div>
                    <BookOpen className="h-5 w-5 text-slate-300" />
                  </div>

                  <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
                    {selected.pdfs.map((pdf, index) => (
                      <div
                        key={`${pdf.name}-${pdf.section}`}
                        className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {pdf.name}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              {relationLabel(pdf.relation)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{pdf.section}</p>
                        </div>

                        {index === 0 ? (
                          <button
                            type="button"
                            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-indigo-600"
                          >
                            Abrir ahí
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-9 border-t border-slate-200 pt-7">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Tus apuntes
                  </p>
                  <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-xl text-sm leading-6 text-slate-500">
                      Subí un PDF de Derecho Penal y Evaluo va a buscar este concepto dentro del material
                      que realmente entra en tu examen.
                    </p>
                    <button
                      type="button"
                      className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-indigo-600"
                    >
                      Subir PDF
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-9 flex flex-col gap-4 border-t border-slate-200 pt-7 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    ¿Ya lo entendiste?
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Volvé a probarte con una pregunta sobre {selected.topic.toLowerCase()}.
                  </p>
                </div>

                <button
                  type="button"
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white"
                >
                  Practicar de nuevo
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-8 flex items-center gap-2 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Este error sale de “pendientes” cuando lo respondés bien nuevamente.
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
