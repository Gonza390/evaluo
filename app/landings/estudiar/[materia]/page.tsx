import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { FileText, CheckCircle2, PlayCircle, Sparkles, HelpCircle, Library } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { SeoBreadcrumbs } from '@/components/seo/SeoBreadcrumbs';
import { buildBreadcrumbJsonLd, buildCourseJsonLd, buildFaqJsonLd } from '@/lib/seo';
import { buildSeoEntitySlug, parseSeoEntitySlug } from '@/lib/seo-intents';
import { createPublicClient } from '@/lib/supabase-public';
import { getMateriaSeoContentSignals } from '@/lib/seo-content-signals';

interface PageProps {
  params: Promise<{ materia: string }>;
}

export const revalidate = 600;

export async function generateStaticParams() {
  const client = createPublicClient();
  const { data } = await client.from('materias').select('id, nombre');

  if (!data) return [];

  return data.map((materia) => ({
    materia: buildSeoEntitySlug(materia.nombre, materia.id),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { id: materiaId } = parseSeoEntitySlug(resolvedParams.materia);

  const client = createPublicClient();
  const [{ data: materia }, contentSignals] = await Promise.all([
    client.from('materias').select('id, nombre').eq('id', materiaId).maybeSingle(),
    getMateriaSeoContentSignals(materiaId),
  ]);

  if (!materia) {
    return {
      title: 'Materia no encontrada',
      robots: { index: false, follow: false },
    };
  }

  const canonicalSlug = buildSeoEntitySlug(materia.nombre, materia.id);
  const canonicalHref = `/landings/estudiar/${canonicalSlug}`;
  const description = `Conocé un método para preparar ${materia.nombre}, organizar el repaso y pasar de la teoría a la práctica con los materiales disponibles en Evaluo.`;
  const socialTitle = `Cómo estudiar ${materia.nombre} | Evaluo`;

  return {
    title: `Cómo estudiar ${materia.nombre}: guía práctica`,
    description,
    alternates: {
      canonical: canonicalHref,
    },
    openGraph: {
      title: socialTitle,
      description,
      url: canonicalHref,
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: ['/opengraph-image.png'],
    },
    robots: {
      index: contentSignals.hasAcademicContent,
      follow: true,
    },
  };
}

export default async function EstudiarMateriaLanding({ params }: PageProps) {
  const resolvedParams = await params;
  const { id: materiaId } = parseSeoEntitySlug(resolvedParams.materia);

  const client = createPublicClient();
  const [{ data: materia }, contentSignals] = await Promise.all([
    client.from('materias').select('id, nombre').eq('id', materiaId).maybeSingle(),
    getMateriaSeoContentSignals(materiaId),
  ]);

  if (!materia) {
    notFound();
  }

  const materiaNombre = materia.nombre;
  const materiaSlug = buildSeoEntitySlug(materiaNombre, materia.id);
  const canonicalHref = `/landings/estudiar/${materiaSlug}`;

  if (resolvedParams.materia !== materiaSlug) {
    permanentRedirect(canonicalHref);
  }

  const availableMaterialCount = contentSignals.summaryCount + contentSignals.resourceCount;
  const availableItemsCount = availableMaterialCount + contentSignals.questionCount;
  const hasStudyMaterials = availableMaterialCount > 0;
  const hasSummaries = contentSignals.summaryCount > 0;

  const faqItems = [
    {
      question: `¿Cómo estudiar ${materiaNombre}?`,
      answer: `Para estudiar ${materiaNombre}, empezá por ordenar los conceptos principales, repasá el material disponible y después practicá activamente. Evaluo reúne los recursos publicados para esta materia en un mismo recorrido.`,
    },
    {
      question: `¿Hay preguntas para practicar ${materiaNombre}?`,
      answer: contentSignals.questionCount > 0
        ? `Sí. Actualmente Evaluo tiene ${contentSignals.questionCount.toLocaleString('es-AR')} preguntas disponibles para practicar ${materiaNombre}.`
        : `Todavía no hay preguntas públicas disponibles para ${materiaNombre}. Podés revisar los otros materiales publicados y volver a consultar cuando se agreguen nuevas prácticas.`,
    },
    {
      question: `¿Hay resúmenes o materiales de ${materiaNombre}?`,
      answer: hasStudyMaterials
        ? `Sí. Actualmente hay ${availableMaterialCount.toLocaleString('es-AR')} materiales de estudio disponibles entre resúmenes y otros recursos de ${materiaNombre}.`
        : `Todavía no hay resúmenes o recursos públicos disponibles para ${materiaNombre}. Cuando se publiquen, aparecerán en esta página.`,
    },
    {
      question: `¿Cómo preparar un parcial de ${materiaNombre}?`,
      answer: `Dividí el estudio en bloques: comprensión, repaso y práctica. Cuando haya preguntas disponibles, usalas para detectar errores y reforzar los temas que todavía no dominás.`,
    },
    {
      question: `¿Cuánto material hay disponible de ${materiaNombre}?`,
      answer: availableItemsCount > 0
        ? `Evaluo reúne actualmente ${availableItemsCount.toLocaleString('es-AR')} elementos públicos para ${materiaNombre}, contando preguntas, resúmenes y otros recursos.`
        : `Todavía no hay material académico público disponible para ${materiaNombre}. El catálogo se actualiza a medida que se incorporan nuevos contenidos.`,
    },
  ];

  return (
    <div className="animate-page-enter w-full overflow-x-clip bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: 'Inicio', path: '/' },
            { name: 'Explorar', path: '/explorar' },
            { name: materiaNombre, path: `/explorar/materia/${materiaId}` },
            { name: `Cómo estudiar ${materiaNombre}`, path: canonicalHref },
          ]),
          buildCourseJsonLd({
            name: `Estudiar ${materiaNombre}`,
            description:
              availableItemsCount > 0
                ? `Guía de estudio de ${materiaNombre} con ${availableItemsCount.toLocaleString('es-AR')} elementos académicos disponibles en Evaluo.`
                : `Guía práctica para organizar el estudio de ${materiaNombre} con Evaluo.`,
            url: canonicalHref,
          }),
          buildFaqJsonLd(faqItems),
        ]}
      />

      <div className="mx-auto w-full max-w-[1240px] px-4 pt-5 sm:px-8">
        <SeoBreadcrumbs
          items={[
            { name: 'Inicio', href: '/' },
            { name: 'Explorar', href: '/explorar' },
            { name: materiaNombre, href: `/explorar/materia/${materiaId}` },
            { name: 'Guía de estudio' },
          ]}
        />
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_35%),radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_25%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto w-full max-w-[1240px] px-4 pt-10 pb-16 sm:px-8 sm:pt-16 sm:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50/80 px-3 py-1.5 text-[12px] font-bold text-indigo-700 ring-1 ring-indigo-200/50">
              <FileText className="h-4 w-4 text-indigo-600" />
              Material de estudio
            </span>

            <h1 className="text-foreground mt-4 text-[2rem] leading-[1.04] font-bold tracking-[-0.05em] sm:text-5xl lg:text-[56px]">
              Estudiar {materiaNombre}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:mt-5 sm:text-base sm:leading-8">
              Organizá el repaso de {materiaNombre}, usá el material realmente disponible y prepará
              tu próximo parcial con un recorrido claro.
            </p>

            {availableItemsCount > 0 ? (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {contentSignals.questionCount > 0 ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                    <HelpCircle className="h-4 w-4 text-indigo-600" />
                    {contentSignals.questionCount.toLocaleString('es-AR')} preguntas
                  </span>
                ) : null}
                {availableMaterialCount > 0 ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                    <Library className="h-4 w-4 text-indigo-600" />
                    {availableMaterialCount.toLocaleString('es-AR')} materiales
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href={`/explorar/materia/${materiaId}`}
                className="from-brand to-brand-2 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_16px_32px_rgba(37,99,235,0.26)] sm:h-13 sm:px-8"
              >
                <PlayCircle className="h-5 w-5" />
                Ir a la materia
              </Link>
              {contentSignals.hasQuestions ? (
                <Link
                  href={`/pregunteros/${materiaSlug}`}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 sm:h-13"
                >
                  Practicar preguntas
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* QUÉ ENCONTRÁS */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              Recorrido recomendado
            </span>
            <h2 className="text-foreground mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              ¿Cómo aprovechar {materiaNombre}?
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: FileText,
                title: 'Comprendé la teoría',
                description:
                  availableMaterialCount > 0
                    ? `Revisá los ${availableMaterialCount.toLocaleString('es-AR')} materiales disponibles de ${materiaNombre} y ordená los conceptos antes de practicar.`
                    : `Empezá por ordenar los conceptos principales de ${materiaNombre} y revisá el material cuando esté disponible.`,
              },
              {
                icon: CheckCircle2,
                title: 'Practicá activamente',
                description:
                  contentSignals.questionCount > 0
                    ? `Usá las ${contentSignals.questionCount.toLocaleString('es-AR')} preguntas disponibles de ${materiaNombre} para comprobar qué recordás y qué necesitás reforzar.`
                    : `Cuando se publiquen preguntas de ${materiaNombre}, usalas para comprobar qué recordás y qué necesitás reforzar.`,
              },
              {
                icon: Sparkles,
                title: 'Medí tu preparación',
                description: `Volvé sobre tus errores, repetí los temas difíciles y comprobá tu progreso antes del parcial.`,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-[15px] font-bold tracking-tight text-slate-800">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-xs leading-5 text-slate-600">{item.description}</p>
                </article>
              );
            })}
          </div>

          {(contentSignals.hasQuestions || hasSummaries) && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {contentSignals.hasQuestions ? (
                <Link
                  href={`/pregunteros/${materiaSlug}`}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
                >
                  Ver preguntas de {materiaNombre}
                </Link>
              ) : null}
              {hasSummaries ? (
                <Link
                  href={`/resumenes/${materiaSlug}`}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
                >
                  Ver resúmenes
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* CONSEJOS */}
      <section className="border-y border-slate-100 bg-white py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              Tips para estudiar {materiaNombre}
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {[
              {
                title: 'Empezá por lo básico',
                description:
                  'Identificá los conceptos fundamentales antes de avanzar. Usá los materiales publicados como apoyo, no como reemplazo de tu programa o bibliografía oficial.',
              },
              {
                title: 'Practicá con preguntas',
                description:
                  'Cuando haya preguntas disponibles, respondelas sin mirar la solución y usá los errores para decidir qué temas repasar.',
              },
              {
                title: 'Repetí los temas difíciles',
                description:
                  'No pases de largo los temas que te cuestan. Volvé a tus apuntes y materiales hasta poder explicarlos con tus propias palabras.',
              },
              {
                title: 'Simulá condiciones de examen',
                description:
                  'Reservá un bloque sin interrupciones, limitá el tiempo y comprobá cuánto podés resolver sin consultar material externo.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-[15px] font-bold tracking-tight text-slate-800">
                  {item.title}
                </h3>
                <p className="mt-3 text-xs leading-5 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-100 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              Preguntas frecuentes sobre {materiaNombre}
            </h2>
          </div>

          <div className="mx-auto max-w-2xl space-y-4">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <summary className="cursor-pointer list-none text-[15px] font-bold text-slate-800">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,rgba(99,102,241,0.03)_0%,rgba(37,99,235,0.03)_100%)] p-8 text-center shadow-xl md:p-14">
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              Entrá a {materiaNombre} y empezá a estudiar
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600">
              Consultá el material académico que está realmente disponible para {materiaNombre} y
              seguí desde ahí tu recorrido de estudio.
            </p>
            <div className="mt-8">
              <Link
                href={`/explorar/materia/${materiaId}`}
                className="from-brand to-brand-2 inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-8 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 transition hover:translate-y-[-1px] hover:shadow-indigo-950/60"
              >
                <PlayCircle className="h-4.5 w-4.5" />
                Ir a {materiaNombre}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
