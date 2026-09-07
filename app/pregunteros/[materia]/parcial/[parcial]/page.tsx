import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowRight, Clock3, GraduationCap, HelpCircle, ListChecks, Target } from 'lucide-react';
import {
  buildSeoEntitySlug,
  getSiglo21PregunteroMateria,
  parseSeoEntitySlug,
} from '@/lib/seo-siglo21';

type Parcial = '1' | '2' | 'integrador';

type PageProps = {
  params: Promise<{ materia: string; parcial: string }>;
};

export const revalidate = 600;

function parseParcial(value: string): Parcial | null {
  return value === '1' || value === '2' || value === 'integrador' ? value : null;
}

function parcialLabel(parcial: Parcial) {
  if (parcial === '1') return 'Primer parcial';
  if (parcial === '2') return 'Segundo parcial';
  return 'Integrador';
}

function getParcialCount(
  data: Awaited<ReturnType<typeof getSiglo21PregunteroMateria>>,
  parcial: Parcial
) {
  if (!data) return 0;
  if (parcial === '1') return data.preguntasParcial1;
  if (parcial === '2') return data.preguntasParcial2;
  return data.preguntasIntegrador;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const materiaId = parseSeoEntitySlug(resolved.materia);
  const parcial = parseParcial(resolved.parcial);

  if (!materiaId || !parcial) {
    return { title: 'Preguntero', robots: { index: false, follow: false } };
  }

  const data = await getSiglo21PregunteroMateria(materiaId);
  if (!data) {
    return { title: 'Preguntero', robots: { index: false, follow: false } };
  }

  const count = getParcialCount(data, parcial);
  const canonical = `/pregunteros/${buildSeoEntitySlug(data.materiaNombre, data.materiaId)}/parcial/${parcial}`;
  const label = parcialLabel(parcial);
  const description = count > 0
    ? `Practicá ${label.toLowerCase()} de ${data.materiaNombre} de Universidad Siglo 21 con ${count.toLocaleString('es-AR')} preguntas disponibles en Evaluo.`
    : `${label} de ${data.materiaNombre} para Universidad Siglo 21 en Evaluo.`;

  return {
    title: `Preguntero ${data.materiaNombre} - ${label} - Siglo 21`,
    description,
    alternates: { canonical },
    robots: { index: count > 0, follow: true },
    openGraph: {
      title: `Preguntero ${data.materiaNombre} - ${label} - Siglo 21 | Evaluo`,
      description,
      url: canonical,
    },
  };
}

export default async function PregunteroParcialPage({ params }: PageProps) {
  const resolved = await params;
  const materiaId = parseSeoEntitySlug(resolved.materia);
  const parcial = parseParcial(resolved.parcial);
  if (!materiaId || !parcial) notFound();

  const data = await getSiglo21PregunteroMateria(materiaId);
  if (!data) notFound();

  const expectedSlug = buildSeoEntitySlug(data.materiaNombre, data.materiaId);
  const canonical = `/pregunteros/${expectedSlug}/parcial/${parcial}`;
  if (resolved.materia !== expectedSlug) permanentRedirect(canonical);

  const count = getParcialCount(data, parcial);
  if (count === 0) notFound();

  const label = parcialLabel(parcial);
  const parcialNumero = parcial === '1' ? 1 : parcial === '2' ? 2 : 3;
  const samples = parcial === 'integrador'
    ? data.samplePreguntas
    : data.samplePreguntas.filter((question) => String(question.parcial) === parcial);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: `Preguntero ${data.materiaNombre} - ${label}`,
    description: `${count} preguntas para practicar ${label.toLowerCase()} de ${data.materiaNombre} en Universidad Siglo 21.`,
    educationalUse: 'practice',
    inLanguage: 'es-AR',
    url: `https://evaluo.com.ar${canonical}`,
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
          <li><Link href={`/pregunteros/${expectedSlug}`} className="hover:text-[#2563EB]">{data.materiaNombre}</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-slate-700">{label}</li>
        </ol>
      </nav>

      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.16),transparent_32%),radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-5 py-9 sm:px-8 sm:py-12 lg:px-10">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#C7D2FE] bg-white/85 px-3.5 py-2 text-xs font-semibold text-[#4F5DFF] shadow-sm">
                <ListChecks className="h-4 w-4" />
                Preguntero · {label}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600">
                <GraduationCap className="h-4 w-4" />
                Universidad Siglo 21
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-[-0.05em] text-[#0F1B3D] sm:text-5xl">
              {data.materiaNombre} · {label}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Practicá {label.toLowerCase()} con {count.toLocaleString('es-AR')} preguntas disponibles. Usá el simulador para medir tu preparación y volver sobre los temas que necesitás reforzar.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-2xl font-bold text-[#0F1B3D]">{count.toLocaleString('es-AR')}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">preguntas disponibles</p>
              </div>
              <Link
                href={`/simulador/${data.materiaId}/${parcialNumero}`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-6 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px]"
              >
                <Target className="h-4 w-4" />
                Practicar ahora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#4F5DFF]">
            <HelpCircle className="h-4 w-4" />
            Muestra del banco
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#0F1B3D]">
            Preguntas de {label.toLowerCase()}
          </h2>

          {samples.length === 0 ? (
            <p className="mt-5 text-sm leading-7 text-slate-500">Entrá al simulador para comenzar a practicar las preguntas disponibles.</p>
          ) : (
            <ol className="mt-5 space-y-3">
              {samples.slice(0, 6).map((question, index) => (
                <li key={question.id} className="rounded-2xl border border-slate-200 bg-[#FAFBFF] p-4">
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EEF4FF] text-xs font-bold text-[#4F5DFF]">{index + 1}</span>
                    <div>
                      <p className="text-sm leading-6 text-slate-800">{question.enunciado}</p>
                      <p className="mt-2 text-xs font-medium text-slate-500">{question.opcionesCount} opciones</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <Clock3 className="h-5 w-5 text-[#4F5DFF]" />
            <h2 className="mt-3 text-xl font-bold text-[#0F1B3D]">Practicá en formato simulador</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">Respondé sin mirar las soluciones, controlá el tiempo y revisá los errores al terminar.</p>
            <Link href={`/simulador/${data.materiaId}/${parcialNumero}`} className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-4 text-sm font-semibold text-white">
              Empezar simulador
            </Link>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-[#0F1B3D]">Otros parciales</h2>
            <div className="mt-4 space-y-2">
              {data.preguntasParcial1 > 0 && parcial !== '1' ? <Link href={`/pregunteros/${expectedSlug}/parcial/1`} className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#C7D2FE] hover:text-[#4F5DFF]">Primer parcial · {data.preguntasParcial1} preguntas</Link> : null}
              {data.preguntasParcial2 > 0 && parcial !== '2' ? <Link href={`/pregunteros/${expectedSlug}/parcial/2`} className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#C7D2FE] hover:text-[#4F5DFF]">Segundo parcial · {data.preguntasParcial2} preguntas</Link> : null}
              {data.preguntasIntegrador > 0 && parcial !== 'integrador' ? <Link href={`/pregunteros/${expectedSlug}/parcial/integrador`} className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#C7D2FE] hover:text-[#4F5DFF]">Integrador</Link> : null}
              <Link href={`/pregunteros/${expectedSlug}`} className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-[#2563EB] transition hover:border-[#C7D2FE]">Ver preguntero completo</Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
