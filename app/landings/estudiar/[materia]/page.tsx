import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FileText, CheckCircle2, PlayCircle, Sparkles } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildCourseJsonLd, buildFaqJsonLd } from '@/lib/seo';
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
    return { title: 'Materia no encontrada' };
  }

  return {
    title: `Cómo estudiar ${materia.nombre}: guía práctica`,
    description: `Conocé un método para preparar ${materia.nombre}, organizar el repaso y pasar de la teoría a la práctica con Evaluo.`,
    alternates: {
      canonical: `/landings/estudiar/${resolvedParams.materia}`,
    },
    openGraph: {
      title: `Cómo estudiar ${materia.nombre} | Evaluo`,
      description: `Guía práctica para organizar el estudio de ${materia.nombre} y preparar el próximo parcial.`,
      url: `/landings/estudiar/${resolvedParams.materia}`,
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
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
  const { data: materia } = await client
    .from('materias')
    .select('id, nombre')
    .eq('id', materiaId)
    .maybeSingle();

  if (!materia) {
    redirect('/explorar');
  }

  const materiaNombre = materia.nombre;
  const materiaSlug = resolvedParams.materia;

  const faqItems = [
    {
      question: `¿Cómo estudiar ${materiaNombre}?`,
      answer: `Para estudiar ${materiaNombre} de forma efectiva, empezá por leer los resúmenes de los temas principales, después practicá con pregunteros y finalizá con un simulacro de examen. En Evaluo tenés todo ordenado en un solo lugar.`,
    },
    {
      question: `¿Dónde encontrar parciales resueltos de ${materiaNombre}?`,
      answer: `En Evaluo podés encontrar parciales resueltos y pregunteros específicos de ${materiaNombre}. Explorá el catálogo para encontrar el material de tu universidad y tu cátedra.`,
    },
    {
      question: `¿Qué temas se estudian en ${materiaNombre}?`,
      answer: `Los temas de ${materiaNombre} varían según la universidad y la carrera. Encontrá el contenido específico de tu materia en Evaluo, donde el material está adaptado a tu plan de estudio.`,
    },
    {
      question: `¿Cómo preparar un parcial de ${materiaNombre}?`,
      answer: `La mejor forma de preparar un parcial de ${materiaNombre} es practicar con preguntas reales, revisar tus errores y reforzar los temas débiles. Los simuladores de Evaluo te ayudan a medir tu nivel antes del examen.`,
    },
    {
      question: `¿Hay ejercicios resueltos de ${materiaNombre}?`,
      answer: `Sí, en Evaluo podés encontrar ejercicios y preguntas resueltas de ${materiaNombre}. Cada respuesta incluye una explicación paso a paso para que entiendas el proceso.`,
    },
  ];

  return (
    <div className="animate-page-enter w-full overflow-x-clip bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <JsonLd
        data={[
          buildCourseJsonLd({
            name: `Estudiar ${materiaNombre}`,
            description: `Parciales resueltos, ejercicios y resúmenes de ${materiaNombre}. Material de estudio ordenado con Evaluo.`,
            url: `/landings/estudiar/${materiaSlug}`,
          }),
          buildFaqJsonLd(faqItems),
        ]}
      />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_35%),radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_25%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="mx-auto w-full max-w-[1240px] px-4 pt-10 pb-16 sm:px-8 sm:pt-20 sm:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50/80 px-3 py-1.5 text-[12px] font-bold text-indigo-700 ring-1 ring-indigo-200/50">
              <FileText className="h-4 w-4 text-indigo-600" />
              Material de estudio
            </span>

            <h1 className="text-foreground mt-4 text-[2rem] leading-[1.04] font-bold tracking-[-0.05em] sm:text-5xl lg:text-[56px]">
              Estudiar {materiaNombre}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:mt-5 sm:text-base sm:leading-8">
              Organizá el repaso de {materiaNombre}, practicá lo aprendido y prepará tu próximo
              parcial con un recorrido claro.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href={`/explorar/materia/${materiaId}`}
                className="from-brand to-brand-2 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_16px_32px_rgba(37,99,235,0.26)] sm:h-13 sm:px-8"
              >
                <PlayCircle className="h-5 w-5" />
                Ir a la materia
              </Link>
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
              Todo lo que necesitás
            </span>
            <h2 className="text-foreground mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              ¿Qué encontrás en {materiaNombre}?
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: FileText,
                title: 'Comprendé la teoría',
                description: `Revisá los recursos disponibles de ${materiaNombre} y ordená los conceptos antes de practicar.`,
              },
              {
                icon: CheckCircle2,
                title: 'Practicá activamente',
                description: `Usá las preguntas disponibles de ${materiaNombre} para comprobar qué recordás y qué necesitás reforzar.`,
              },
              {
                icon: Sparkles,
                title: 'Medí tu preparación',
                description: `Completá actividades de práctica y revisá tus errores antes de volver a intentarlo.`,
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
                  'Leé el resumen de cada tema antes de intentar resolver ejercicios. Asegurate de entender los conceptos fundamentales.',
              },
              {
                title: 'Practicá con preguntas',
                description:
                  'Respondé los pregunteros para verificar cuánto retuviste. Si te equivocás, leé la explicación detenidamente.',
              },
              {
                title: 'Repetí los temas difíciles',
                description:
                  'No pases de largo en los temas que te cuestan. Volvé a leer el resumen y practicá más preguntas de ese tema.',
              },
              {
                title: 'Simulá el examen',
                description:
                  'Cuando te sientas preparado, hacé un simulacro completo para medir tu nivel y ganar confianza antes del día del parcial.',
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
              Accedé a resúmenes, pregunteros y simuladores de {materiaNombre}. Todo el material que
              necesitás para aprobar tu parcial.
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
