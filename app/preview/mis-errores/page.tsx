import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
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
    pages: string;
    excerpt: string;
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
      'La clave es entender que la finalidad pasa a formar parte de la acción misma: la conducta se interpreta desde el fin que orienta al autor.',
    selectedAnswer: 'La acción se define únicamente por el resultado producido.',
    correctAnswer: 'La acción se entiende como una conducta dirigida conscientemente a un fin.',
    pdfs: [
      {
        name: 'Módulo 2 · Lectura 1 Derecho Penal',
        section: 'Teoría finalista de la acción',
        pages: 'Págs. 18–21',
        excerpt:
          'La acción finalista se caracteriza por estar orientada desde su inicio hacia la consecución de un fin previsto por el autor.',
        relation: 'origin',
      },
      {
        name: 'Resumen parcial 1',
        section: 'Finalismo · concepto de acción',
        pages: 'Pág. 7',
        excerpt: 'El finalismo incorpora la finalidad a la estructura misma de la acción.',
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
      'La culpabilidad deja de ser una relación puramente psicológica y pasa a funcionar como un juicio jurídico de reproche.',
    selectedAnswer: 'La reduce a la intención psicológica del autor.',
    correctAnswer: 'La transforma en un juicio normativo de reproche.',
    pdfs: [
      {
        name: 'Resumen parcial 1',
        section: 'Concepciones normativas de la culpabilidad',
        pages: 'Págs. 11–13',
        excerpt:
          'La culpabilidad deja de ser una relación psicológica y pasa a constituir un juicio normativo de reproche.',
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
      'El funcionalismo reorganiza las categorías del delito según la función que cumplen dentro del sistema jurídico y social.',
    selectedAnswer: 'Mantiene intactas las categorías del causalismo clásico.',
    correctAnswer: 'Reformula categorías según su función jurídico-social.',
    pdfs: [
      {
        name: 'Módulo 2 · Lectura 1 Derecho Penal',
        section: 'Funcionalismo moderado y sistémico',
        pages: 'Págs. 26–30',
        excerpt:
          'El funcionalismo reordena las categorías del delito según la función que cumplen dentro del sistema jurídico y social.',
        relation: 'best',
      },
      {
        name: 'Resumen parcial 1',
        section: 'Escuelas posteriores al finalismo',
        pages: 'Pág. 10',
        excerpt:
          'Roxin y Jakobs desarrollan variantes funcionalistas con fundamentos y objetivos diferentes.',
        relation: 'secondary',
      },
      {
        name: 'Clases profesor · Unidad 2',
        section: 'Roxin y Jakobs',
        pages: 'Págs. 4–6',
        excerpt:
          'El funcionalismo analiza las categorías dogmáticas desde la función que cumplen dentro del orden jurídico.',
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
        pages: 'Págs. 5–8',
        excerpt:
          'La dogmática jurídico-penal ordena e interpreta el material normativo para construir criterios sistemáticos de aplicación.',
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
  if (relation === 'origin') return 'Este error salió de este material';
  if (relation === 'best') return 'Mejor coincidencia en tus apuntes';
  return 'También aparece acá';
}

export default async function MisErroresPreviewPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const hasPdfs = params.estado !== 'sin-pdf';
  const selected = errors.find((item) => item.id === params.tema) ?? errors[0];
  const SelectedIcon = sourceIcons[selected.source];
  const primaryPdf = selected.pdfs[0];
  const secondaryPdfs = selected.pdfs.slice(1);

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
                Derecho Penal · 4 temas que conviene volver a estudiar
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

        <div className="grid min-h-[700px] lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 py-5 lg:border-r lg:border-b-0 lg:pr-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Para estudiar
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
                      active ? 'border-slate-950 bg-white' : 'border-transparent hover:bg-white/70'
                    }`}
                  >
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${active ? 'text-slate-900' : 'text-slate-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`truncate text-sm font-semibold ${active ? 'text-slate-950' : 'text-slate-700'}`}>
                          {item.topic}
                        </p>
                        <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-slate-700' : 'text-slate-300'}`} />
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
                    <p className="text-sm font-medium text-slate-700">Falta tu material</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Subí el PDF que entra en tu examen para saber exactamente dónde estudiar cada error.
                    </p>
                    <button type="button" className="mt-3 text-xs font-semibold text-indigo-600">
                      Subir PDF →
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </aside>

          <section className="py-6 lg:pl-10 lg:py-8">
            <div className="max-w-[780px]">
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

              <div className="mt-6 max-w-2xl">
                <p className="text-sm leading-6 text-slate-500">{selected.question}</p>
                <p className="mt-3 text-[15px] leading-7 text-slate-700">{selected.explanation}</p>
              </div>

              {hasPdfs ? (
                <section className="mt-8 border-t-2 border-slate-950 pt-6">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-indigo-600" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-600">
                      Estudiá este tema en tu PDF
                    </p>
                  </div>

                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {primaryPdf.name}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                    <span>{primaryPdf.section}</span>
                    <span>·</span>
                    <span>{primaryPdf.pages}</span>
                  </div>

                  <p className="mt-2 text-xs font-medium text-slate-400">
                    {relationLabel(primaryPdf.relation)}
                  </p>

                  <blockquote className="mt-6 border-l-2 border-indigo-200 pl-5 text-[15px] leading-7 text-slate-700">
                    “{primaryPdf.excerpt}”
                  </blockquote>

                  <button
                    type="button"
                    className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(79,70,229,0.16)]"
                  >
                    Estudiar este tema en mi PDF
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  {secondaryPdfs.length > 0 ? (
                    <div className="mt-7 border-t border-slate-200 pt-5">
                      <p className="text-xs font-medium text-slate-400">También aparece en</p>
                      <div className="mt-3 space-y-3">
                        {secondaryPdfs.map((pdf) => (
                          <div
                            key={`${pdf.name}-${pdf.section}`}
                            className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-700">{pdf.name}</p>
                              <p className="mt-0.5 text-xs text-slate-400">
                                {pdf.section} · {pdf.pages}
                              </p>
                            </div>
                            <button type="button" className="text-xs font-semibold text-slate-500">
                              Ver también
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : (
                <section className="mt-8 border-t-2 border-slate-950 pt-6">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-indigo-600" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-600">
                      Estudiá este tema en tu material
                    </p>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.035em] text-slate-950">
                    Todavía no tenemos tus apuntes de Derecho Penal
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Subí el PDF que entra en tu examen y Evaluo va a encontrar dentro de ese material dónde se explica {selected.topic.toLowerCase()}.
                  </p>
                  <button
                    type="button"
                    className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white"
                  >
                    Subir PDF y encontrar este tema
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </section>
              )}

              <details className="group mt-9 border-t border-slate-200 pt-6">
                <summary className="cursor-pointer list-none text-sm font-semibold text-slate-500 hover:text-slate-800">
                  <span className="group-open:hidden">Ver qué respondiste</span>
                  <span className="hidden group-open:inline">Ocultar respuesta</span>
                </summary>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="border-l-2 border-rose-200 pl-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-500">
                      Tu respuesta
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{selected.selectedAnswer}</p>
                  </div>
                  <div className="border-l-2 border-emerald-200 pl-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-600">
                      Respuesta correcta
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{selected.correctAnswer}</p>
                  </div>
                </div>
              </details>

              <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Después de estudiarlo</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Comprobá si ya cerraste este error.
                  </p>
                </div>

                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-slate-700"
                >
                  Probarme de nuevo
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
