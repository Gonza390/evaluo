import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ChevronRight, GraduationCap, ListChecks, Search, Target } from 'lucide-react';
import { buildSeoEntitySlug, getSiglo21PregunteroHub } from '@/lib/seo-siglo21';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Pregunteros Universidad Siglo 21',
  description:
    'Encontrá pregunteros de Universidad Siglo 21 organizados por materia y parcial. Practicá primer parcial, segundo parcial e integradores con preguntas disponibles en Evaluo.',
  alternates: { canonical: '/pregunteros' },
  openGraph: {
    title: 'Pregunteros Universidad Siglo 21 | Evaluo',
    description:
      'Pregunteros de Universidad Siglo 21 por materia y parcial, con preguntas para practicar y simuladores en Evaluo.',
    url: '/pregunteros',
  },
};

export default async function PregunterosPage() {
  const data = await getSiglo21PregunteroHub();
  const items = data?.items ?? [];
  const totalPreguntas = items.reduce((total, item) => total + item.totalPreguntas, 0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Pregunteros Universidad Siglo 21',
    url: 'https://evaluo.com.ar/pregunteros',
    description:
      'Pregunteros de Universidad Siglo 21 organizados por materia y parcial para practicar en Evaluo.',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.slice(0, 30).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: `Preguntero de ${item.materiaNombre}`,
        url: `https://evaluo.com.ar/pregunteros/${buildSeoEntitySlug(item.materiaNombre, item.materiaId)}`,
      })),
    },
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.16),transparent_32%),radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-5 py-9 sm:px-8 sm:py-12 lg:px-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C7D2FE] bg-white/85 px-3.5 py-2 text-xs font-semibold text-[#4F5DFF] shadow-sm">
              <GraduationCap className="h-4 w-4" />
              Universidad Siglo 21
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-[-0.05em] text-[#0F1B3D] sm:text-5xl">
              Pregunteros de Universidad Siglo 21
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Elegí tu materia y practicá con las preguntas disponibles para primer parcial, segundo
              parcial e integradores. Los bancos se muestran solo cuando Evaluo tiene contenido real
              para esa materia.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-2xl font-bold text-[#0F1B3D]">{items.length}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">materias con preguntas</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-2xl font-bold text-[#0F1B3D]">
                  {totalPreguntas.toLocaleString('es-AR')}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">preguntas disponibles</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#4F5DFF]">
              <ListChecks className="h-4 w-4" />
              Materias para practicar
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#0F1B3D]">
              Empezá por los pregunteros con más contenido
            </h2>
          </div>
          <Link
            href="/explorar"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#2563EB]/20 bg-white px-4 text-sm font-semibold text-[#2563EB] transition hover:border-[#2563EB]/40"
          >
            <Search className="h-4 w-4" />
            Explorar materias
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
            <p className="text-sm text-slate-500">
              Todavía no encontramos pregunteros públicos asociados a Universidad Siglo 21.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {items.map((item) => {
              const href = `/pregunteros/${buildSeoEntitySlug(item.materiaNombre, item.materiaId)}`;
              return (
                <Link
                  key={item.materiaId}
                  href={href}
                  className="group rounded-[22px] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#C7D2FE] hover:shadow-[0_14px_34px_rgba(79,93,255,0.08)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-base font-bold leading-6 text-[#0F1B3D]">
                        {item.materiaNombre}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Universidad Siglo 21
                      </p>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FF] text-[#4F5DFF] transition group-hover:bg-[#4F5DFF] group-hover:text-white">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF4FF] px-3 py-1.5 text-xs font-semibold text-[#2563EB]">
                      <BookOpen className="h-3.5 w-3.5" />
                      {item.totalPreguntas.toLocaleString('es-AR')} preguntas
                    </span>
                    {item.preguntasParcial1 > 0 ? (
                      <span className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">
                        P1 · {item.preguntasParcial1}
                      </span>
                    ) : null}
                    {item.preguntasParcial2 > 0 ? (
                      <span className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">
                        P2 · {item.preguntasParcial2}
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <Target className="h-5 w-5 text-[#4F5DFF]" />
          <h2 className="mt-3 text-lg font-bold text-[#0F1B3D]">Primer y segundo parcial</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Cada parcial tiene una URL independiente cuando existen preguntas suficientes. Así podés
            llegar directo a la instancia que estás preparando.
          </p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <BookOpen className="h-5 w-5 text-[#4F5DFF]" />
          <h2 className="mt-3 text-lg font-bold text-[#0F1B3D]">Contenido basado en el catálogo real</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Evaluo es una plataforma independiente. Los nombres de universidad y materias se usan
            para organizar el material de estudio disponible para los alumnos.
          </p>
        </div>
      </section>
    </div>
  );
}
