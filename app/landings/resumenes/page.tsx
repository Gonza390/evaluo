import type { Metadata } from 'next';
import { unstable_cache as nextCache } from 'next/cache';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  HelpCircle,
  Library,
  PlayCircle,
} from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildCollectionPageJsonLd, buildFaqJsonLd } from '@/lib/seo';
import { buildSeoEntitySlug } from '@/lib/seo-intents';
import { toAbsoluteUrl } from '@/lib/site';
import { createPublicClient } from '@/lib/supabase-public';

type SummaryCatalogItem = {
  materiaId: string;
  materiaNombre: string;
  summaryCount: number;
  questionCount: number;
  partial1Count: number;
  partial2Count: number;
  sampleTitles: string[];
};

const loadSummaryCatalog = nextCache(
  async (): Promise<SummaryCatalogItem[]> => {
    const client = createPublicClient();
    const { data: summaries, error } = await client
      .from('resumenes')
      .select('id, title, materia_id, score, created_at')
      .not('materia_id', 'is', null)
      .limit(10000);

    if (error || !summaries?.length) return [];

    const grouped = new Map<
      string,
      { count: number; titles: Array<{ title: string; score: number; createdAt: string }> }
    >();

    for (const row of summaries) {
      const materiaId = String(row.materia_id ?? '');
      const title = String(row.title ?? '').trim();
      if (!materiaId) continue;
      const current = grouped.get(materiaId) ?? { count: 0, titles: [] };
      current.count += 1;
      if (title) {
        current.titles.push({
          title,
          score: Number(row.score ?? 0),
          createdAt: String(row.created_at ?? ''),
        });
      }
      grouped.set(materiaId, current);
    }

    const materiaIds = Array.from(grouped.keys());
    if (!materiaIds.length) return [];

    const [{ data: materias }, { data: questions }] = await Promise.all([
      client.from('materias').select('id, nombre').in('id', materiaIds),
      client
        .from('preguntas_banco_public')
        .select('materia_id, parcial')
        .in('materia_id', materiaIds)
        .limit(10000),
    ]);

    const questionStats = new Map<string, { total: number; partial1: number; partial2: number }>();
    for (const row of questions ?? []) {
      const materiaId = String(row.materia_id ?? '');
      if (!materiaId) continue;
      const current = questionStats.get(materiaId) ?? { total: 0, partial1: 0, partial2: 0 };
      current.total += 1;
      if (Number(row.parcial) === 1) current.partial1 += 1;
      if (Number(row.parcial) === 2) current.partial2 += 1;
      questionStats.set(materiaId, current);
    }

    return (materias ?? [])
      .map((materia) => {
        const summary = grouped.get(String(materia.id));
        const questionsForMateria = questionStats.get(String(materia.id)) ?? {
          total: 0,
          partial1: 0,
          partial2: 0,
        };
        const uniqueTitles = Array.from(
          new Map(
            (summary?.titles ?? [])
              .sort(
                (a, b) =>
                  b.score - a.score ||
                  b.createdAt.localeCompare(a.createdAt) ||
                  a.title.localeCompare(b.title)
              )
              .map((item) => [item.title.toLocaleLowerCase('es-AR'), item.title] as const)
          ).values()
        ).slice(0, 3);

        return {
          materiaId: String(materia.id),
          materiaNombre: String(materia.nombre),
          summaryCount: summary?.count ?? 0,
          questionCount: questionsForMateria.total,
          partial1Count: questionsForMateria.partial1,
          partial2Count: questionsForMateria.partial2,
          sampleTitles: uniqueTitles,
        };
      })
      .filter((item) => item.summaryCount > 0)
      .sort(
        (a, b) =>
          b.summaryCount - a.summaryCount ||
          b.questionCount - a.questionCount ||
          a.materiaNombre.localeCompare(b.materiaNombre, 'es-AR')
      );
  },
  ['summary-catalog-v2'],
  { revalidate: 600, tags: ['materia-bootstrap'] }
);

const FAQ_ITEMS = [
  {
    question: '¿Dónde encuentro resúmenes de Universidad Siglo 21 por materia?',
    answer:
      'En esta página podés entrar directamente a las materias que hoy tienen resúmenes públicos en Evaluo. Cada materia tiene una URL propia con el material disponible y accesos a práctica cuando existen preguntas.',
  },
  {
    question: '¿Los resúmenes están organizados por materia?',
    answer:
      'Sí. Evaluo vincula cada resumen con una materia concreta y mantiene ese contexto para que puedas pasar del material de lectura a preguntas, pregunteros y simuladores de la misma materia.',
  },
  {
    question: '¿Cómo conviene usar un resumen para preparar un parcial?',
    answer:
      'Usalo para ubicar conceptos y ordenar el repaso. Después intentá recuperar las ideas sin mirar y practicá preguntas de la materia para detectar qué temas todavía necesitás reforzar.',
  },
  {
    question: '¿Son materiales oficiales de Universidad Siglo 21?',
    answer:
      'No. Evaluo es una plataforma independiente. Los materiales públicos pueden incluir resúmenes y recursos compartidos por estudiantes y no se presentan como contenido oficial ni como reemplazo de la bibliografía de la universidad.',
  },
  {
    question: '¿Puedo practicar después de leer un resumen?',
    answer:
      'Sí. Cuando una materia tiene preguntas disponibles, desde la misma ruta de estudio podés entrar al preguntero y practicar por parcial.',
  },
];

export const metadata: Metadata = {
  title: 'Resúmenes Siglo 21 por materia para estudiar parciales',
  description:
    'Encontrá resúmenes de Universidad Siglo 21 organizados por materia. Revisá materiales disponibles y seguí con preguntas y pregunteros para preparar tus parciales.',
  keywords: [
    'resúmenes Siglo 21',
    'resumen Universidad Siglo 21',
    'apuntes Siglo 21',
    'resúmenes por materia Siglo 21',
    'resúmenes para parciales Siglo 21',
  ],
  alternates: {
    canonical: '/landings/resumenes',
  },
  openGraph: {
    title: 'Resúmenes Siglo 21 por materia | Evaluo',
    description:
      'Materias con resúmenes públicos disponibles y accesos directos a práctica para preparar parciales.',
    url: '/landings/resumenes',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resúmenes Siglo 21 por materia | Evaluo',
    description: 'Encontrá material por materia y seguí con preguntas y práctica en Evaluo.',
    images: ['/opengraph-image.png'],
  },
};

export default async function ResumenesLanding() {
  const catalog = await loadSummaryCatalog();
  const totalSummaries = catalog.reduce((sum, item) => sum + item.summaryCount, 0);
  const totalQuestions = catalog.reduce((sum, item) => sum + item.questionCount, 0);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Materias con resúmenes disponibles en Evaluo',
    numberOfItems: catalog.length,
    itemListElement: catalog.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: `Resúmenes de ${item.materiaNombre}`,
      url: toAbsoluteUrl(
        `/resumenes/${buildSeoEntitySlug(item.materiaNombre, item.materiaId)}`
      ),
    })),
  };

  return (
    <div className="animate-page-enter w-full overflow-x-clip bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <JsonLd
        data={[
          buildCollectionPageJsonLd({
            name: 'Resúmenes de Universidad Siglo 21 por materia',
            description:
              'Colección de materias con resúmenes públicos y accesos a preguntas de práctica en Evaluo.',
            url: '/landings/resumenes',
          }),
          buildFaqJsonLd(FAQ_ITEMS),
          itemListJsonLd,
        ]}
      />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1080px] px-4 py-14 sm:px-8 sm:py-20">
          <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-indigo-700 uppercase">
            <FileText className="h-4 w-4" />
            Material disponible hoy
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.055em] text-slate-950 sm:text-5xl">
            Resúmenes Siglo 21 por materia
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            Entrá directo a las materias que tienen resúmenes públicos en Evaluo. Revisá el material
            disponible y, cuando haya preguntas, seguí con el preguntero para comprobar cuánto
            entendiste antes del parcial.
          </p>

          {catalog.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700">
                {catalog.length.toLocaleString('es-AR')} materias con resúmenes
              </span>
              <span className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700">
                {totalSummaries.toLocaleString('es-AR')} resúmenes públicos
              </span>
              {totalQuestions > 0 ? (
                <span className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700">
                  {totalQuestions.toLocaleString('es-AR')} preguntas para practicar
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <main>
        <section className="py-12 sm:py-16">
          <div className="mx-auto w-full max-w-[1080px] px-4 sm:px-8">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold tracking-[-0.04em] text-slate-950">
                Materias con resúmenes disponibles
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Esta lista se construye con el catálogo público actual de Evaluo. No mostramos una
                materia acá si no tiene resúmenes visibles.
              </p>
            </div>

            {catalog.length > 0 ? (
              <div className="mt-9 space-y-5">
                {catalog.map((item) => {
                  const slug = buildSeoEntitySlug(item.materiaNombre, item.materiaId);
                  const summaryHref = `/resumenes/${slug}`;
                  const pregunteroHref = `/pregunteros/${slug}`;
                  const studyHref = `/landings/estudiar/${slug}`;

                  return (
                    <article
                      key={item.materiaId}
                      className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.04)] sm:p-7"
                    >
                      <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr] lg:items-start">
                        <div>
                          <p className="text-[11px] font-bold tracking-[0.14em] text-indigo-700 uppercase">
                            Universidad Siglo 21
                          </p>
                          <h3 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-slate-950">
                            {item.materiaNombre}
                          </h3>
                          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-indigo-700" />
                              {item.summaryCount.toLocaleString('es-AR')} resúmenes
                            </span>
                            {item.questionCount > 0 ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5">
                                <HelpCircle className="h-3.5 w-3.5 text-indigo-700" />
                                {item.questionCount.toLocaleString('es-AR')} preguntas
                              </span>
                            ) : null}
                            {item.partial1Count > 0 ? (
                              <span className="rounded-full bg-slate-50 px-3 py-1.5">
                                Parcial 1: {item.partial1Count.toLocaleString('es-AR')}
                              </span>
                            ) : null}
                            {item.partial2Count > 0 ? (
                              <span className="rounded-full bg-slate-50 px-3 py-1.5">
                                Parcial 2: {item.partial2Count.toLocaleString('es-AR')}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                              href={summaryHref}
                              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                            >
                              Ver resúmenes
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                            {item.questionCount > 0 ? (
                              <Link
                                href={pregunteroHref}
                                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
                              >
                                Practicar preguntas
                              </Link>
                            ) : null}
                            <Link
                              href={studyHref}
                              className="inline-flex min-h-11 items-center justify-center px-2 py-2.5 text-sm font-semibold text-indigo-700 hover:underline"
                            >
                              Cómo estudiar {item.materiaNombre}
                            </Link>
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
                          <p className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">
                            Material visible
                          </p>
                          {item.sampleTitles.length > 0 ? (
                            <ul className="mt-4 space-y-3">
                              {item.sampleTitles.map((title) => (
                                <li key={title} className="flex items-start gap-2.5 text-sm leading-6 text-slate-700">
                                  <FileText className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                                  <span>{title}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                              Entrá a la materia para ver el material disponible.
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-8 border-y border-dashed border-slate-300 py-10">
                <p className="text-sm text-slate-600">
                  No hay resúmenes públicos disponibles en este momento.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50/50 py-14 sm:py-16">
          <div className="mx-auto w-full max-w-[1080px] px-4 sm:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
              <div>
                <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
                  Del resumen al parcial
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">
                  Usá el resumen para orientarte, no como último paso.
                </h2>
              </div>
              <div className="divide-y divide-slate-200 border-y border-slate-200">
                {[
                  ['01', 'Ubicá el tema', 'Leé el material para identificar conceptos, definiciones y relaciones que necesitás repasar.'],
                  ['02', 'Cerrá la fuente', 'Intentá reconstruir las ideas principales sin mirar el resumen.'],
                  ['03', 'Practicá preguntas', 'Si la materia tiene preguntero, respondé por parcial para detectar errores concretos.'],
                  ['04', 'Volvé sólo a lo débil', 'Usá los errores para decidir qué parte del material necesitás revisar otra vez.'],
                ].map(([number, title, text]) => (
                  <div key={number} className="grid gap-2 py-5 sm:grid-cols-[48px_150px_1fr] sm:gap-4">
                    <span className="font-mono text-xs font-bold text-indigo-700">{number}</span>
                    <strong className="text-sm text-slate-950">{title}</strong>
                    <span className="text-sm leading-6 text-slate-600">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto grid w-full max-w-[1080px] gap-10 px-4 sm:px-8 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
                Preguntas frecuentes
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">
                Sobre los resúmenes de Siglo 21
              </h2>
            </div>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {FAQ_ITEMS.map((item) => (
                <details key={item.question} className="group py-5">
                  <summary className="cursor-pointer list-none pr-8 text-sm font-bold text-slate-950 marker:hidden">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 py-14">
          <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-5 px-4 sm:px-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-bold text-slate-950">¿No encontrás tu materia?</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Explorá el catálogo completo para ver preguntas, recursos y materiales disponibles.
              </p>
            </div>
            <Link
              href="/explorar"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-800 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              <Library className="h-4 w-4" />
              Explorar materias
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
