import type { Metadata } from 'next';
import { unstable_cache as nextCache } from 'next/cache';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  FileText,
  HelpCircle,
  Library,
  ListChecks,
  PlayCircle,
  Target,
} from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { SeoBreadcrumbs } from '@/components/seo/SeoBreadcrumbs';
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildLearningResourceJsonLd,
} from '@/lib/seo';
import { buildSeoEntitySlug, parseSeoEntitySlug } from '@/lib/seo-intents';
import { createPublicClient } from '@/lib/supabase-public';
import { getMateriaBootstrap } from '@/lib/data/materia-bootstrap';
import {
  getMateriaSeoContentSignals,
  hasSubstantialStudyLandingContent,
} from '@/lib/seo-content-signals';

interface PageProps {
  params: Promise<{ materia: string }>;
}

type StudyQuestion = {
  id: string;
  enunciado: string;
  parcial: number;
};

type StudyMaterial = {
  id: string;
  title: string;
  detail?: string;
};

type StudyLandingData = {
  materiaFound: boolean;
  materiaId: string;
  materiaNombre: string;
  carreraNombre?: string;
  universidadNombre?: string;
  questionCount: number;
  summaryCount: number;
  resourceCount: number;
  hasQuestions: boolean;
  hasSummaries: boolean;
  partial1Count: number;
  partial2Count: number;
  sampleQuestions: StudyQuestion[];
  summaries: StudyMaterial[];
  resources: StudyMaterial[];
};

export const revalidate = 600;

export function generateStaticParams() {
  return [];
}

function normalizeQuestionRows(
  rows: Array<{ id: string; enunciado: string | null; parcial: number | null }>
): StudyQuestion[] {
  const parsed = rows
    .map((row) => ({
      id: row.id,
      enunciado: String(row.enunciado ?? '').trim(),
      parcial: Number(row.parcial ?? 1),
    }))
    .filter((row) => row.enunciado.length >= 35);

  const clean = parsed.filter((row) => !/\(CORTADA\)|\bCORTADA\b/i.test(row.enunciado));
  const source = clean.length >= 3 ? clean : parsed;
  const seen = new Set<string>();

  return source
    .filter((row) => {
      const key = row.enunciado.toLocaleLowerCase('es-AR');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 4);
}

const loadStudyLandingData = nextCache(
  async (materiaId: string): Promise<StudyLandingData> => {
    const client = createPublicClient();

    const [bootstrap, signals, partial1, partial2, questions, summaries, resources] =
      await Promise.all([
        getMateriaBootstrap({ materiaId }),
        getMateriaSeoContentSignals(materiaId),
        client
          .from('preguntas_banco_public')
          .select('id', { count: 'exact', head: true })
          .eq('materia_id', materiaId)
          .eq('parcial', 1),
        client
          .from('preguntas_banco_public')
          .select('id', { count: 'exact', head: true })
          .eq('materia_id', materiaId)
          .eq('parcial', 2),
        client
          .from('preguntas_banco_public')
          .select('id, enunciado, parcial')
          .eq('materia_id', materiaId)
          .order('creado_at', { ascending: false })
          .limit(14),
        client
          .from('resumenes')
          .select('id, title, author_name, module_id, score, created_at')
          .eq('materia_id', materiaId)
          .order('score', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(6),
        client
          .from('recursos')
          .select('id, nombre, tipo, paginas, etiqueta, creado_at')
          .eq('materia_id', materiaId)
          .order('creado_at', { ascending: false })
          .limit(6),
      ]);

    const summaryMaterials: StudyMaterial[] = (summaries.data ?? [])
      .map((row) => ({
        id: String(row.id),
        title: String(row.title ?? '').trim(),
        detail: [
          row.module_id ? `Módulo ${row.module_id}` : '',
          row.author_name ? String(row.author_name).trim() : '',
        ]
          .filter(Boolean)
          .join(' · '),
      }))
      .filter((row) => row.title);

    const resourceMaterials: StudyMaterial[] = (resources.data ?? [])
      .map((row) => ({
        id: String(row.id),
        title: String(row.nombre ?? '').trim(),
        detail: [
          row.etiqueta ? String(row.etiqueta).trim() : '',
          row.paginas ? `${Number(row.paginas).toLocaleString('es-AR')} páginas` : '',
          row.tipo ? String(row.tipo).replaceAll('-', ' ') : '',
        ]
          .filter(Boolean)
          .join(' · '),
      }))
      .filter((row) => row.title);

    return {
      materiaFound: bootstrap.materiaFound !== false,
      materiaId: bootstrap.materiaId,
      materiaNombre: bootstrap.materiaNombre,
      carreraNombre: bootstrap.carreraNombre,
      universidadNombre: bootstrap.universidadNombre,
      questionCount: signals.questionCount,
      summaryCount: signals.summaryCount,
      resourceCount: signals.resourceCount,
      hasQuestions: signals.hasQuestions,
      hasSummaries: signals.hasSummaries,
      partial1Count: partial1.error ? 0 : (partial1.count ?? 0),
      partial2Count: partial2.error ? 0 : (partial2.count ?? 0),
      sampleQuestions: normalizeQuestionRows(
        (questions.data ?? []) as Array<{
          id: string;
          enunciado: string | null;
          parcial: number | null;
        }>
      ),
      summaries: summaryMaterials,
      resources: resourceMaterials,
    };
  },
  ['study-landing-data-v2'],
  { revalidate: 600, tags: ['materia-bootstrap'] }
);

function buildStudyDescription(data: StudyLandingData) {
  const context = data.universidadNombre ? ` en ${data.universidadNombre}` : '';
  const inventory: string[] = [];

  if (data.questionCount > 0) {
    inventory.push(`${data.questionCount.toLocaleString('es-AR')} preguntas de práctica`);
  }
  if (data.summaryCount > 0) {
    inventory.push(`${data.summaryCount.toLocaleString('es-AR')} resúmenes`);
  }
  if (data.resourceCount > 0) {
    inventory.push(`${data.resourceCount.toLocaleString('es-AR')} recursos`);
  }

  const available =
    inventory.length > 0
      ? `Usá ${inventory.join(', ')} disponibles en Evaluo.`
      : 'Revisá el material académico disponible en Evaluo.';

  return `Cómo estudiar ${data.materiaNombre}${context}: ${available} Prepará tus parciales pasando del repaso a la práctica.`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { id: materiaId } = parseSeoEntitySlug(resolvedParams.materia);
  const [data, signals] = await Promise.all([
    loadStudyLandingData(materiaId),
    getMateriaSeoContentSignals(materiaId),
  ]);

  if (!data.materiaFound) {
    return {
      title: 'Materia no encontrada',
      robots: { index: false, follow: false },
    };
  }

  const canonicalSlug = buildSeoEntitySlug(data.materiaNombre, data.materiaId);
  const canonicalHref = `/landings/estudiar/${canonicalSlug}`;
  const description = buildStudyDescription(data);
  const socialTitle = `Cómo estudiar ${data.materiaNombre} | Evaluo`;

  return {
    title: `Cómo estudiar ${data.materiaNombre}: guía para parciales`,
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
      index: hasSubstantialStudyLandingContent(signals),
      follow: true,
    },
  };
}

export default async function EstudiarMateriaLanding({ params }: PageProps) {
  const resolvedParams = await params;
  const { id: materiaId } = parseSeoEntitySlug(resolvedParams.materia);
  const data = await loadStudyLandingData(materiaId);

  if (!data.materiaFound) {
    notFound();
  }

  const materiaNombre = data.materiaNombre;
  const materiaSlug = buildSeoEntitySlug(materiaNombre, data.materiaId);
  const canonicalHref = `/landings/estudiar/${materiaSlug}`;
  const materiaHref = `/explorar/materia/${materiaSlug}`;
  const pregunteroHref = `/pregunteros/${materiaSlug}`;
  const resumenesHref = `/resumenes/${materiaSlug}`;

  if (resolvedParams.materia !== materiaSlug) {
    permanentRedirect(canonicalHref);
  }

  const materialCount = data.summaryCount + data.resourceCount;
  const hasStudyMaterials = materialCount > 0;

  const faqItems = [
    {
      question: `¿Cómo estudiar ${materiaNombre}?`,
      answer:
        data.questionCount > 0
          ? `Organizá primero el material de ${materiaNombre} y después practicá con las ${data.questionCount.toLocaleString('es-AR')} preguntas que hoy están disponibles en Evaluo. Usá los errores para decidir qué tema volver a repasar.`
          : `Empezá por el material disponible de ${materiaNombre}, intentá recuperar las ideas sin mirar y convertí el repaso en práctica apenas tengas ejercicios o preguntas para comprobarte.`,
    },
    {
      question: `¿Cuántas preguntas hay para practicar ${materiaNombre}?`,
      answer:
        data.questionCount > 0
          ? `Actualmente Evaluo tiene ${data.questionCount.toLocaleString('es-AR')} preguntas públicas de ${materiaNombre}. ${data.partial1Count > 0 ? `El parcial 1 reúne ${data.partial1Count.toLocaleString('es-AR')}.` : ''} ${data.partial2Count > 0 ? `El parcial 2 reúne ${data.partial2Count.toLocaleString('es-AR')}.` : ''}`.trim()
          : `Todavía no hay preguntas públicas disponibles de ${materiaNombre}.`,
    },
    {
      question: `¿Hay resúmenes o material de ${materiaNombre}?`,
      answer: hasStudyMaterials
        ? `Sí. Evaluo tiene hoy ${data.summaryCount.toLocaleString('es-AR')} resúmenes y ${data.resourceCount.toLocaleString('es-AR')} recursos asociados a ${materiaNombre}.`
        : `Todavía no hay resúmenes o recursos públicos disponibles de ${materiaNombre}.`,
    },
    {
      question: `¿Cómo preparar un parcial de ${materiaNombre}?`,
      answer:
        data.questionCount > 0
          ? `Repasá un bloque acotado del material, cerrá la fuente y después respondé preguntas del parcial sin mirar. Corregí cada error y volvé sólo al concepto que necesitás reforzar antes de otra práctica.`
          : `Dividí el estudio en comprensión, recuperación sin mirar y práctica. A medida que aparezcan preguntas públicas de la materia, incorporalas para comprobar qué temas dominás.`,
    },
    {
      question: `¿Evaluo es material oficial de ${data.universidadNombre || 'la universidad'}?`,
      answer:
        'No. Evaluo es una plataforma independiente. Los materiales y preguntas públicas sirven para estudiar y practicar, pero no se presentan como exámenes oficiales ni reemplazan la bibliografía indicada por la universidad.',
    },
  ];

  return (
    <div className="animate-page-enter w-full overflow-x-clip bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: 'Inicio', path: '/' },
            { name: 'Explorar', path: '/explorar' },
            { name: materiaNombre, path: materiaHref },
            { name: `Cómo estudiar ${materiaNombre}`, path: canonicalHref },
          ]),
          buildFaqJsonLd(faqItems),
          buildLearningResourceJsonLd({
            name: materiaNombre,
            universityName: data.universidadNombre,
            careerName: data.carreraNombre,
            preguntaCount: data.questionCount,
            url: canonicalHref,
          }),
        ]}
      />

      <div className="mx-auto w-full max-w-[1080px] px-4 pt-5 sm:px-8">
        <SeoBreadcrumbs
          items={[
            { name: 'Inicio', href: '/' },
            { name: 'Explorar', href: '/explorar' },
            { name: materiaNombre, href: materiaHref },
            { name: 'Guía de estudio' },
          ]}
        />
      </div>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1080px] px-4 py-12 sm:px-8 sm:py-16">
          <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-indigo-700 uppercase">
            <FileText className="h-4 w-4" />
            {data.universidadNombre || 'Guía por materia'}
            {data.carreraNombre ? ` · ${data.carreraNombre}` : ''}
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.055em] text-slate-950 sm:text-5xl">
            Cómo estudiar {materiaNombre} para el parcial
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            Esta guía parte de lo que realmente está disponible hoy para {materiaNombre} en Evaluo:
            material de repaso, preguntas y parciales. La idea es que puedas pasar de leer a
            practicar sin perder el contexto de la materia.
          </p>

          <div className="mt-7 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
            {data.questionCount > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2">
                <HelpCircle className="h-4 w-4 text-indigo-700" />
                {data.questionCount.toLocaleString('es-AR')} preguntas
              </span>
            ) : null}
            {data.partial1Count > 0 ? (
              <span className="rounded-full border border-slate-200 px-3 py-2">
                Parcial 1: {data.partial1Count.toLocaleString('es-AR')}
              </span>
            ) : null}
            {data.partial2Count > 0 ? (
              <span className="rounded-full border border-slate-200 px-3 py-2">
                Parcial 2: {data.partial2Count.toLocaleString('es-AR')}
              </span>
            ) : null}
            {data.summaryCount > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2">
                <BookOpen className="h-4 w-4 text-indigo-700" />
                {data.summaryCount.toLocaleString('es-AR')} resúmenes
              </span>
            ) : null}
            {data.resourceCount > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2">
                <Library className="h-4 w-4 text-indigo-700" />
                {data.resourceCount.toLocaleString('es-AR')} recursos
              </span>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {data.hasQuestions ? (
              <Link
                href={pregunteroHref}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <PlayCircle className="h-4.5 w-4.5" />
                Practicar {materiaNombre}
              </Link>
            ) : null}
            {data.hasSummaries ? (
              <Link
                href={resumenesHref}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
              >
                Ver resúmenes
              </Link>
            ) : null}
            <Link
              href={materiaHref}
              className="inline-flex min-h-12 items-center justify-center px-2 py-3 text-sm font-semibold text-indigo-700 hover:underline"
            >
              Ver espacio de la materia
            </Link>
          </div>
        </div>
      </section>

      <main>
        <section className="py-12 sm:py-16">
          <div className="mx-auto w-full max-w-[1080px] px-4 sm:px-8">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
                Contenido real
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">
                Qué podés estudiar y practicar hoy en {materiaNombre}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                En vez de una guía genérica, esta página usa el inventario público actual de la
                materia para mostrarte por dónde empezar.
              </p>
            </div>

            <div className="mt-9 grid gap-4 md:grid-cols-3">
              <article className="rounded-[22px] border border-slate-200 p-6">
                <ListChecks className="h-5 w-5 text-indigo-700" />
                <h3 className="mt-4 text-lg font-bold text-slate-950">Preguntas de práctica</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {data.questionCount > 0
                    ? `Hay ${data.questionCount.toLocaleString('es-AR')} preguntas públicas para comprobar qué recordás sin mirar el material.`
                    : 'Todavía no hay preguntas públicas disponibles para esta materia.'}
                </p>
                {data.hasQuestions ? (
                  <Link
                    href={pregunteroHref}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:underline"
                  >
                    Ir al preguntero <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </article>

              <article className="rounded-[22px] border border-slate-200 p-6">
                <Target className="h-5 w-5 text-indigo-700" />
                <h3 className="mt-4 text-lg font-bold text-slate-950">Parciales disponibles</h3>
                <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {data.partial1Count > 0 ? (
                    <Link
                      href={`${pregunteroHref}/parcial/1`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 transition hover:border-indigo-300 hover:text-indigo-700"
                    >
                      <span>Parcial 1</span>
                      <strong>{data.partial1Count.toLocaleString('es-AR')} preguntas</strong>
                    </Link>
                  ) : null}
                  {data.partial2Count > 0 ? (
                    <Link
                      href={`${pregunteroHref}/parcial/2`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 transition hover:border-indigo-300 hover:text-indigo-700"
                    >
                      <span>Parcial 2</span>
                      <strong>{data.partial2Count.toLocaleString('es-AR')} preguntas</strong>
                    </Link>
                  ) : null}
                  {data.partial1Count === 0 && data.partial2Count === 0 ? (
                    <p>Todavía no hay parciales públicos con preguntas para esta materia.</p>
                  ) : null}
                </div>
              </article>

              <article className="rounded-[22px] border border-slate-200 p-6">
                <BookOpen className="h-5 w-5 text-indigo-700" />
                <h3 className="mt-4 text-lg font-bold text-slate-950">Material para repasar</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {hasStudyMaterials
                    ? `Hay ${data.summaryCount.toLocaleString('es-AR')} resúmenes y ${data.resourceCount.toLocaleString('es-AR')} recursos asociados a la materia.`
                    : 'Todavía no hay resúmenes o recursos públicos asociados a esta materia.'}
                </p>
                {data.hasSummaries ? (
                  <Link
                    href={resumenesHref}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:underline"
                  >
                    Ver material <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </article>
            </div>
          </div>
        </section>

        {data.summaries.length > 0 || data.resources.length > 0 ? (
          <section className="border-y border-slate-200 bg-slate-50/50 py-12 sm:py-16">
            <div className="mx-auto w-full max-w-[1080px] px-4 sm:px-8">
              <div className="grid gap-9 lg:grid-cols-[0.72fr_1.28fr]">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
                    Material visible
                  </p>
                  <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">
                    Qué material hay de {materiaNombre}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Estos son títulos reales del catálogo público actual. Elegí uno para ubicar el
                    tema y después pasá a la práctica.
                  </p>
                </div>

                <div className="divide-y divide-slate-200 border-y border-slate-200">
                  {data.summaries.map((item) => (
                    <div key={`summary-${item.id}`} className="py-4">
                      <div className="flex items-start gap-3">
                        <BookOpen className="mt-1 h-4 w-4 shrink-0 text-indigo-700" />
                        <div>
                          <p className="text-sm font-bold text-slate-950">{item.title}</p>
                          {item.detail ? (
                            <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                  {data.resources.map((item) => (
                    <div key={`resource-${item.id}`} className="py-4">
                      <div className="flex items-start gap-3">
                        <FileText className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
                        <div>
                          <p className="text-sm font-bold text-slate-950">{item.title}</p>
                          {item.detail ? (
                            <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                  {data.hasSummaries ? (
                    <div className="py-5">
                      <Link
                        href={resumenesHref}
                        className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:underline"
                      >
                        Ver todos los resúmenes de {materiaNombre}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {data.sampleQuestions.length > 0 ? (
          <section className="py-12 sm:py-16">
            <div className="mx-auto w-full max-w-[1080px] px-4 sm:px-8">
              <div className="max-w-3xl">
                <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
                  Práctica
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">
                  Preguntas de muestra de {materiaNombre}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Intentá responder sin mirar apuntes. Estas preguntas forman parte del banco público
                  actual de la materia y sirven para detectar qué necesitás volver a estudiar.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {data.sampleQuestions.map((question) => (
                  <article
                    key={question.id}
                    className="rounded-[20px] border border-slate-200 bg-white p-5"
                  >
                    <p className="text-xs font-bold tracking-[0.12em] text-indigo-700 uppercase">
                      Parcial {question.parcial}
                    </p>
                    <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-800">
                      {question.enunciado}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-7">
                <Link
                  href={pregunteroHref}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Practicar más preguntas
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        <section className="border-y border-slate-200 bg-slate-50/50 py-12 sm:py-16">
          <div className="mx-auto grid w-full max-w-[1080px] gap-9 px-4 sm:px-8 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
                Recorrido recomendado
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">
                Cómo usar lo disponible para preparar {materiaNombre}
              </h2>
            </div>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {[
                [
                  '01',
                  'Ubicá el contenido',
                  hasStudyMaterials
                    ? 'Empezá por uno de los materiales visibles y marcá los conceptos que todavía no podés explicar con tus palabras.'
                    : 'Empezá por el material de cursado que tengas y separá los conceptos que después necesitás poder recuperar sin mirar.',
                ],
                [
                  '02',
                  'Probate sin mirar',
                  data.questionCount > 0
                    ? `Usá las ${data.questionCount.toLocaleString('es-AR')} preguntas disponibles para comprobar qué recordás y qué confundís.`
                    : 'Intentá formular preguntas propias o resolver ejercicios sin tener la respuesta a la vista.',
                ],
                [
                  '03',
                  'Corregí por concepto',
                  'No te quedes sólo con bien o mal: identificá qué concepto explica el error y volvé a ese punto del material.',
                ],
                [
                  '04',
                  'Repetí el parcial',
                  data.partial1Count > 0 || data.partial2Count > 0
                    ? 'Después del repaso, hacé otra práctica del parcial correspondiente y compará si los mismos errores vuelven a aparecer.'
                    : 'Volvé a practicar después de un intervalo y comprobá si podés recuperar el contenido con menos ayuda.',
                ],
              ].map(([number, title, text]) => (
                <div key={number} className="grid gap-2 py-5 sm:grid-cols-[48px_150px_1fr] sm:gap-4">
                  <span className="font-mono text-xs font-bold text-indigo-700">{number}</span>
                  <strong className="text-sm text-slate-950">{title}</strong>
                  <span className="text-sm leading-6 text-slate-600">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="mx-auto grid w-full max-w-[1080px] gap-10 px-4 sm:px-8 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
                Preguntas frecuentes
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">
                Sobre estudiar {materiaNombre}
              </h2>
            </div>

            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {faqItems.map((item) => (
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
              <p className="text-lg font-bold text-slate-950">Seguí con la materia completa</p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Entrá al espacio de {materiaNombre} para combinar materiales, práctica y herramientas
                disponibles en Evaluo.
              </p>
            </div>
            <Link
              href={materiaHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-800 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              Ir a {materiaNombre}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
