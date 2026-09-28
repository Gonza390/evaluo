import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowRight, BookOpen, GraduationCap, HelpCircle, ListChecks, Target } from 'lucide-react';
import {
  buildSeoEntitySlug,
  getSiglo21PregunteroMateria,
  parseSeoEntitySlug,
} from '@/lib/seo-siglo21';

export const revalidate = 600;

type PageProps = {
  params: Promise<{ materia: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { materia: rawSlug } = await params;
  const materiaId = parseSeoEntitySlug(rawSlug);

  if (!materiaId) {
    return { title: 'Preguntero', robots: { index: false, follow: false } };
  }

  const data = await getSiglo21PregunteroMateria(materiaId);
  if (!data) {
    return { title: 'Preguntero', robots: { index: false, follow: false } };
  }

  const canonical = `/pregunteros/${buildSeoEntitySlug(data.materiaNombre, data.materiaId)}`;
  const description =
    data.totalPreguntas > 0
      ? `Practicá con ${data.totalPreguntas.toLocaleString('es-AR')} preguntas de ${data.materiaNombre} de Universidad Siglo 21. Accedé al primer parcial, segundo parcial y simuladores en Evaluo.`
      : `Preguntero de ${data.materiaNombre} para alumnos de Universidad Siglo 21 en Evaluo.`;

  return {
    title: `Preguntero de ${data.materiaNombre} - Universidad Siglo 21`,
    description,
    alternates: { canonical },
    robots: { index: data.totalPreguntas > 0, follow: true },
    openGraph: {
      title: `Preguntero de ${data.materiaNombre} - Universidad Siglo 21 | Evaluo`,
      description,
      url: canonical,
    },
  };
}

export default async function PregunteroMateriaPage({ params }: PageProps) {
  const { materia: rawSlug } = await params;
  const materiaId = parseSeoEntitySlug(rawSlug);
  if (!materiaId) notFound();

  const data = await getSiglo21PregunteroMateria(materiaId);
  if (!data) notFound();

  const expectedSlug = buildSeoEntitySlug(data.materiaNombre, data.materiaId);
  const canonical = `/pregunteros/${expectedSlug}`;
  if (rawSlug !== expectedSlug) permanentRedirect(canonical);

  const contextLabel =
    data.carreraNombres.length === 1
      ? data.carreraNombres[0]
      : data.carreraNombres.length > 1
        ? `Materia presente en ${data.carreraNombres.length} carreras`
        : 'Universidad Siglo 21';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: `Preguntero de ${data.materiaNombre}`,
    description: `Banco de ${data.totalPreguntas} preguntas para practicar ${data.materiaNombre} en Universidad Siglo 21.`,
    educationalUse: 'practice',
    inLanguage: 'es-AR',
    url: `https://evaluo.com.ar${canonical}`,
    provider: {
      '@type': 'Organization',
      name: 'Evaluo',
      url: 'https://evaluo.com.ar',
    },
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <nav aria-label="Breadcrumb" className="px-1 text-xs font-medium text-slate-500">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-[#2563EB]">Inicio</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/pregunteros" className="hover:text-[#2563EB]">Pregunteros Siglo 21</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-slate-700">{data.materiaNombre}</li>
        </ol>
      </nav>

      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.16),transparent_32%),radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-5 py-9 sm:px-8 sm:py-12 lg:px-10">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#C7D2FE] bg-white/85 px-3.5 py-2 text-xs font-semibold text-[#4F5DFF] shadow-sm">
                <ListChecks className="h-4 w-4" />
                Preguntero
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600">
                <GraduationCap className="h-4 w-4" />
                Universidad Siglo 21
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-[-0.05em] text-[#0F1B3D] sm:text-5xl">
              Preguntero de {data.materiaNombre}
            </h1>
            <p className="mt-3 text-sm font-semibold text-[#4F5DFF]">{contextLabel}</p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Practicá con {data.totalPreguntas.toLocaleString('es-AR')} preguntas disponibles de {data.materiaNombre} para Universidad Siglo 21. Elegí el parcial que estás preparando y entrá directo al simulador.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-2xl font-bold text-[#0F1B3D]">{data.totalPreguntas.toLocaleString('es-AR')}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">preguntas</p>
              </div>
              {data.preguntasParcial1 > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-2xl font-bold text-[#0F1B3D]">{data.preguntasParcial1}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">primer parcial</p>
                </div>
              ) : null}
              {data.preguntasParcial2 > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-2xl font-bold text-[#0F1B3D]">{data.preguntasParcial2}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">segundo parcial</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#4F5DFF]">
            <HelpCircle className="h-4 w-4" />
            Preguntas de muestra
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#0F1B3D]">
            Qué tipo de preguntas vas a practicar
          </h2>

          {data.samplePreguntas.length === 0 ? (
            <p className="mt-5 text-sm leading-7 text-slate-500">Todavía no hay preguntas públicas suficientes para mostrar una muestra.</p>
          ) : (
            <ol className="mt-5 space-y-3">
              {data.samplePreguntas.map((question, index) => (
                <li key={question.id} className="rounded-2xl border border-slate-200 bg-[#FAFBFF] p-4">
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EEF4FF] text-xs font-bold text-[#4F5DFF]">{index + 1}</span>
                    <div>
                      <p className="text-sm leading-6 text-slate-800">{question.enunciado}</p>
                      <p className="mt-2 text-xs font-medium text-slate-500">Parcial {question.parcial} · {question.opcionesCount} opciones</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <Target className="h-5 w-5 text-[#4F5DFF]" />
            <h2 className="mt-3 text-xl font-bold text-[#0F1B3D]">Elegí qué rendís</h2>
            <div className="mt-5 space-y-3">
              {data.preguntasParcial1 > 0 ? (
                <Link href={`${canonical}/parcial/1`} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-[#C7D2FE] hover:bg-[#FAFBFF]">
                  <div>
                    <p className="text-sm font-bold text-[#0F1B3D]">Primer parcial</p>
                    <p className="mt-1 text-xs text-slate-500">{data.preguntasParcial1} preguntas</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#4F5DFF]" />
                </Link>
              ) : null}
              {data.preguntasParcial2 > 0 ? (
                <Link href={`${canonical}/parcial/2`} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-[#C7D2FE] hover:bg-[#FAFBFF]">
                  <div>
                    <p className="text-sm font-bold text-[#0F1B3D]">Segundo parcial</p>
                    <p className="mt-1 text-xs text-slate-500">{data.preguntasParcial2} preguntas</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#4F5DFF]" />
                </Link>
              ) : null}
              {data.preguntasIntegrador > 0 ? (
                <Link href={`${canonical}/parcial/integrador`} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-[#C7D2FE] hover:bg-[#FAFBFF]">
                  <div>
                    <p className="text-sm font-bold text-[#0F1B3D]">Integrador</p>
                    <p className="mt-1 text-xs text-slate-500">Combina ambos parciales</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#4F5DFF]" />
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <BookOpen className="h-5 w-5 text-[#4F5DFF]" />
            <h2 className="mt-3 text-xl font-bold text-[#0F1B3D]">Ver materia completa</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">Combiná el preguntero con resúmenes, materiales y otras herramientas disponibles para la materia.</p>
            <Link href={`/explorar/materia/${data.materiaId}`} className="mt-5 inline-flex h-11 items-center justify-center rounded-xl border border-[#2563EB]/20 px-4 text-sm font-semibold text-[#2563EB] transition hover:border-[#2563EB]/40">
              Ir a {data.materiaNombre}
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
